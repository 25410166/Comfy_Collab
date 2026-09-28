import { Runtime, IRuntime, RuntimeProvider } from '../database/models/Runtime.js';
import { comfyUIService } from './comfyui.service.js';
import { socketService } from './socket.service.js';

export class RuntimeService {
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  async getActiveRuntime(): Promise<IRuntime> {
    let runtime = await Runtime.findOne({ isDefault: true });
    if (!runtime) {
      runtime = await Runtime.create({
        name: 'Google Colab Runtime',
        provider: 'google-colab',
        endpoint: comfyUIService.getEndpoint(),
        status: 'offline',
        isDefault: true
      });
    }
    return runtime;
  }

  async getAllRuntimes(): Promise<IRuntime[]> {
    return Runtime.find().sort({ updatedAt: -1 });
  }

  async connect(idOrEndpoint?: string): Promise<IRuntime> {
    let runtime: IRuntime | null = null;
    if (idOrEndpoint && !idOrEndpoint.startsWith('http')) {
      runtime = await Runtime.findById(idOrEndpoint);
    } else {
      runtime = await this.getActiveRuntime();
      if (idOrEndpoint?.startsWith('http')) {
        runtime.endpoint = idOrEndpoint;
      }
    }

    if (!runtime) throw new Error('Runtime not found');

    comfyUIService.setEndpoint(runtime.endpoint);
    runtime.status = 'connecting';
    await runtime.save();

    // Check health immediately
    const health = await this.checkHealth(runtime._id.toString());
    return health.runtime;
  }

  async disconnect(runtimeId?: string): Promise<IRuntime> {
    const runtime = runtimeId 
      ? await Runtime.findById(runtimeId) 
      : await this.getActiveRuntime();
    if (!runtime) throw new Error('Runtime not found');

    runtime.status = 'offline';
    await runtime.save();
    socketService.emit('runtime.disconnected', { id: runtime._id });
    return runtime;
  }

  async checkHealth(runtimeId?: string): Promise<{ ok: boolean; runtime: IRuntime; error?: string }> {
    const runtime = runtimeId 
      ? await Runtime.findById(runtimeId) 
      : await this.getActiveRuntime();
    if (!runtime) throw new Error('Runtime not found');

    const health = await comfyUIService.checkHealth();
    if (health.ok) {
      runtime.status = 'ready';
      runtime.lastHeartbeatAt = new Date();
      runtime.lastConnectedAt = new Date();

      if (health.system) {
        const sys = health.system.system || {};
        const devices = health.system.devices || [];
        if (devices.length > 0) {
          const gpu0 = devices[0];
          runtime.gpu = {
            name: gpu0.name || 'NVIDIA GPU',
            vram: Math.round((gpu0.total_vram || 0) / (1024 * 1024 * 1024) * 10) / 10,
            freeVram: Math.round((gpu0.free_vram || 0) / (1024 * 1024 * 1024) * 10) / 10
          };
        }
        runtime.comfyVersion = sys.comfyui_version || 'Latest';
        runtime.pythonVersion = sys.python_version || '';
      }
    } else {
      runtime.status = 'offline';
    }

    await runtime.save();
    socketService.emit('runtime.status_update', runtime);
    return { ok: health.ok, runtime, error: health.error };
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(async () => {
      try {
        const runtime = await this.getActiveRuntime();
        if (runtime && runtime.status !== 'offline') {
          await this.checkHealth(runtime._id.toString());
        }
      } catch (e) {}
    }, 15000);
  }
}

export const runtimeService = new RuntimeService();

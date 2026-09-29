import WebSocket from 'ws';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { socketService } from './socket.service.js';
import { Generation } from '../database/models/Generation.js';
import { config } from '../config.js';

export interface ComfyPromptResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, any>;
}

export class ComfyUIService {
  private ws: WebSocket | null = null;
  private clientId: string = crypto.randomUUID();
  private endpoint: string = config.comfy.endpoint;
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pollerTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initWebSocket();
    this.startQueuePoller();
  }

  setEndpoint(url: string) {
    this.endpoint = url.replace(/\/+$/, '');
    this.reconnect();
  }

  getEndpoint() {
    return this.endpoint;
  }

  getClientId() {
    return this.clientId;
  }

  getIsConnected() {
    return this.isConnected;
  }

  async checkHealth(): Promise<{ ok: boolean; system?: any; error?: string }> {
    try {
      const res = await axios.get(`${this.endpoint}/system_stats`, { timeout: 15000 });
      return { ok: true, system: res.data };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  async getLoadedModelsAndNodes(): Promise<{ customNodes: string[]; models: string[] }> {
    try {
      const res = await axios.get(`${this.endpoint}/object_info`, { timeout: 15000 });
      const info = res.data || {};
      const customNodes = Object.keys(info);
      const modelSet = new Set<string>();

      const checkLoaderInputs = (nodeName: string, inputFields: string[]) => {
        const node = info[nodeName];
        if (!node?.input?.required) return;
        for (const field of inputFields) {
          const list = node.input.required[field]?.[0];
          if (Array.isArray(list)) {
            list.forEach((m: any) => {
              if (typeof m === 'string' && m && m !== 'pixel_space') {
                modelSet.add(m);
              }
            });
          }
        }
      };

      checkLoaderInputs('UNETLoader', ['unet_name']);
      checkLoaderInputs('VAELoader', ['vae_name']);
      checkLoaderInputs('CLIPLoader', ['clip_name']);
      checkLoaderInputs('DualCLIPLoader', ['clip_name1', 'clip_name2']);
      checkLoaderInputs('CheckpointLoaderSimple', ['ckpt_name']);
      checkLoaderInputs('LoraLoader', ['lora_name']);
      checkLoaderInputs('ControlNetLoader', ['control_net_name']);

      return {
        customNodes,
        models: Array.from(modelSet)
      };
    } catch (err) {
      console.error('[ComfyUI] Failed to fetch object_info:', err);
      return { customNodes: [], models: [] };
    }
  }

  private startQueuePoller() {
    if (this.pollerTimer) return;
    this.pollerTimer = setInterval(async () => {
      try {
        const pendingGens = await Generation.find({
          status: { $in: ['queued', 'executing'] }
        });
        if (pendingGens.length === 0) return;

        // Fetch queue & history from ComfyUI
        const [queueRes, historyRes] = await Promise.allSettled([
          axios.get(`${this.endpoint}/queue`, { timeout: 8000 }),
          axios.get(`${this.endpoint}/history?max_items=20`, { timeout: 8000 })
        ]);

        const queueRunning = queueRes.status === 'fulfilled' ? queueRes.value.data?.queue_running || [] : [];
        const runningPromptIds = new Set(queueRunning.map((item: any) => item[1]));

        const historyData = historyRes.status === 'fulfilled' ? historyRes.value.data || {} : {};

        for (const gen of pendingGens) {
          // 1. Check if finished in history
          if (historyData[gen.promptId]) {
            await this.handleExecutionCompleted(gen.promptId);
            continue;
          }

          // 2. Check if currently running
          if (runningPromptIds.has(gen.promptId)) {
            if (gen.status !== 'executing') {
              gen.status = 'executing';
              gen.startedAt = gen.startedAt || new Date();
              await gen.save();
              socketService.emit('generation.started', { promptId: gen.promptId });
            }
          }
        }
      } catch (e) {
        // Suppress poller noise
      }
    }, 3000);
  }

  private initWebSocket() {
    if (this.ws) {
      try {
        this.ws.removeAllListeners();
        this.ws.close();
      } catch (e) {}
    }

    const wsUrl = this.endpoint.replace(/^http/, 'ws') + `/ws?clientId=${this.clientId}`;
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.isConnected = true;
        console.log(`[ComfyUI WS] Connected to ${wsUrl}`);
        socketService.emit('runtime.connected', { endpoint: this.endpoint });
      });

      this.ws.on('message', async (data: WebSocket.Data) => {
        try {
          if (typeof data === 'string' || Buffer.isBuffer(data)) {
            const str = data.toString();
            // Check if valid JSON text
            if (str.startsWith('{') && str.endsWith('}')) {
              const msg = JSON.parse(str);
              await this.handleWSMessage(msg);
            }
          }
        } catch (e) {
          // Binary message or preview image frame
        }
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        socketService.emit('runtime.disconnected', { endpoint: this.endpoint });
        this.scheduleReconnect();
      });

      this.ws.on('error', (err) => {
        this.isConnected = false;
        this.scheduleReconnect();
      });
    } catch (err) {
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.initWebSocket();
    }, 5000);
  }

  reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.initWebSocket();
  }

  private async handleWSMessage(msg: { type: string; data: any }) {
    const { type, data } = msg;

    if (type === 'status') {
      socketService.emit('runtime.status', data);
    } else if (type === 'execution_start') {
      const { prompt_id } = data;
      await Generation.findOneAndUpdate(
        { promptId: prompt_id },
        { status: 'executing', startedAt: new Date() }
      );
      socketService.emit('generation.started', { promptId: prompt_id });
    } else if (type === 'progress') {
      const { value, max, prompt_id, node } = data;
      const progressPercent = Math.round((value / max) * 100);
      await Generation.findOneAndUpdate(
        { promptId: prompt_id },
        { progress: progressPercent, currentNode: node }
      );
      socketService.emit('generation.progress', {
        promptId: prompt_id,
        progress: progressPercent,
        node,
        value,
        max
      });
    } else if (type === 'executing') {
      const { node, prompt_id } = data;
      if (node === null) {
        // null node signifies execution completed!
        await this.handleExecutionCompleted(prompt_id);
      } else {
        await Generation.findOneAndUpdate(
          { promptId: prompt_id },
          { currentNode: node }
        );
        socketService.emit('generation.executing_node', { prompt_id, node });
      }
    } else if (type === 'execution_error') {
      const { prompt_id, exception_message, node_type } = data;
      await Generation.findOneAndUpdate(
        { promptId: prompt_id },
        { status: 'failed', error: `${node_type}: ${exception_message}` }
      );
      socketService.emit('generation.failed', {
        promptId: prompt_id,
        error: exception_message,
        node_type
      });
    }
  }

  private async handleExecutionCompleted(promptId: string) {
    try {
      // Query history from ComfyUI
      const historyRes = await axios.get(`${this.endpoint}/history/${promptId}`);
      const historyData = historyRes.data[promptId];
      if (!historyData) return;

      const outputs: Array<{
        filename: string;
        subfolder: string;
        type: string;
        url: string;
        localPath: string;
        mediaType: 'image' | 'video' | 'audio' | 'other';
      }> = [];

      if (historyData.outputs) {
        for (const nodeId of Object.keys(historyData.outputs)) {
          const nodeOutput = historyData.outputs[nodeId];
          const images = nodeOutput.images || [];
          for (const img of images) {
            const filename = img.filename;
            const subfolder = img.subfolder || '';
            const type = img.type || 'output';

            const ext = path.extname(filename).toLowerCase();
            const baseName = path.basename(filename, ext);
            // Ensure unique local filename per prompt/run so subsequent outputs never overwrite previous ones
            const safePromptId = (promptId || 'out').slice(0, 8);
            const uniqueFilename = `${baseName}_${safePromptId}_${Date.now()}${ext}`;
            const localDestPath = path.join(config.paths.outputs, uniqueFilename);
            const downloadUrl = `${this.endpoint}/view?filename=${encodeURIComponent(
              filename
            )}&subfolder=${encodeURIComponent(subfolder)}&type=${type}`;

            try {
              const fileStream = await axios.get(downloadUrl, { responseType: 'stream' });
              const writer = fs.createWriteStream(localDestPath);
              await new Promise<void>((resolve, reject) => {
                fileStream.data.pipe(writer);
                writer.on('finish', () => resolve());
                writer.on('error', reject);
              });

              let mediaType: 'image' | 'video' | 'audio' | 'other' = 'image';
              if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) mediaType = 'video';
              else if (['.mp3', '.wav', '.flac'].includes(ext)) mediaType = 'audio';

              outputs.push({
                filename: uniqueFilename,
                subfolder,
                type,
                url: `/api/generations/file/${uniqueFilename}`,
                localPath: localDestPath,
                mediaType
              });
            } catch (err) {
              console.error(`Failed to download output image ${filename}:`, err);
            }
          }
        }
      }

      const gen = await Generation.findOne({ promptId });
      const startedAt = gen?.startedAt || gen?.createdAt || new Date();
      const executionTimeMs = Date.now() - new Date(startedAt).getTime();

      const updated = await Generation.findOneAndUpdate(
        { promptId },
        {
          status: 'completed',
          progress: 100,
          outputs,
          executionTimeMs,
          completedAt: new Date()
        },
        { new: true }
      );

      socketService.emit('generation.completed', updated);
    } catch (err) {
      console.error('[ComfyUI] Failed to process execution output:', err);
    }
  }

  async queuePrompt(prompt: Record<string, any>, extraData: Record<string, any> = {}): Promise<ComfyPromptResponse> {
    const payload = {
      prompt,
      client_id: this.clientId,
      extra_data: extraData
    };

    const res = await axios.post(`${this.endpoint}/prompt`, payload);
    return res.data;
  }

  async interrupt(): Promise<void> {
    await axios.post(`${this.endpoint}/interrupt`);
  }
}

export const comfyUIService = new ComfyUIService();

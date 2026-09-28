import { Request, Response } from 'express';
import { runtimeService } from '../../services/runtime.service.js';
import { Runtime } from '../../database/models/Runtime.js';

export class RuntimeController {
  async getActiveRuntime(req: Request, res: Response) {
    try {
      const runtime = await runtimeService.getActiveRuntime();
      res.json(runtime);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getAllRuntimes(req: Request, res: Response) {
    try {
      const runtimes = await runtimeService.getAllRuntimes();
      res.json(runtimes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async createRuntime(req: Request, res: Response) {
    try {
      const { name, provider, endpoint, authToken } = req.body;
      const runtime = await Runtime.create({
        name,
        provider: provider || 'google-colab',
        endpoint: endpoint || 'http://127.0.0.1:8188',
        authToken: authToken || '',
        status: 'offline',
        isDefault: false
      });
      res.status(201).json(runtime);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async connect(req: Request, res: Response) {
    try {
      const { endpoint, id } = req.body;
      const runtime = await runtimeService.connect(endpoint || id);
      res.json(runtime);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async disconnect(req: Request, res: Response) {
    try {
      const { id } = req.body;
      const runtime = await runtimeService.disconnect(id);
      res.json(runtime);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async checkHealth(req: Request, res: Response) {
    try {
      const result = await runtimeService.checkHealth(req.params.id ? String(req.params.id) : undefined);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const runtimeController = new RuntimeController();

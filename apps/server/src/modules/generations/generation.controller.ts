import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Generation } from '../../database/models/Generation.js';
import { comfyUIService } from '../../services/comfyui.service.js';
import { config } from '../../config.js';

export class GenerationController {
  async getGenerations(req: Request, res: Response) {
    try {
      const { workflowId, status, page, limit } = req.query;
      const query: any = {};

      if (workflowId) query.workflowId = workflowId;
      if (status && status !== 'all') query.status = status;

      const pageNum = parseInt(String(page || '1'), 10);
      const limitNum = parseInt(String(limit || '20'), 10);
      const skip = (pageNum - 1) * limitNum;

      const total = await Generation.countDocuments(query);
      const generations = await Generation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      res.json({ items: generations, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getGenerationById(req: Request, res: Response) {
    try {
      const gen = await Generation.findById(req.params.id);
      if (!gen) return res.status(404).json({ error: 'Generation not found' });
      res.json(gen);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async serveFile(req: Request, res: Response) {
    try {
      const filename = path.basename(String(req.params.filename));
      const filePath = path.join(config.paths.outputs, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Output file not found' });
      }

      res.sendFile(filePath);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async rerunGeneration(req: Request, res: Response) {
    try {
      const gen = await Generation.findById(req.params.id);
      if (!gen) return res.status(404).json({ error: 'Generation not found' });

      const queueResult = await comfyUIService.queuePrompt(gen.inputs);

      const newGen = await Generation.create({
        workflowId: gen.workflowId,
        workflowName: gen.workflowName,
        runtimeId: gen.runtimeId,
        promptId: queueResult.prompt_id,
        status: 'queued',
        inputs: gen.inputs,
        parameters: gen.parameters,
        outputs: []
      });

      res.json({
        promptId: queueResult.prompt_id,
        generationId: newGen._id,
        status: 'queued'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteGeneration(req: Request, res: Response) {
    try {
      const gen = await Generation.findById(req.params.id);
      if (!gen) return res.status(404).json({ error: 'Generation not found' });

      for (const output of gen.outputs) {
        if (output.localPath && fs.existsSync(output.localPath)) {
          try { fs.unlinkSync(output.localPath); } catch (e) {}
        }
      }

      await Generation.findByIdAndDelete(req.params.id);
      res.json({ message: 'Generation deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const generationController = new GenerationController();

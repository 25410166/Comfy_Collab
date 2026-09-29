import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { Generation } from '../../database/models/Generation.js';
import { comfyUIService } from '../../services/comfyui.service.js';
import { config } from '../../config.js';

function enrichParameters(gen: any) {
  if (!gen) return gen;
  const obj = gen.toObject ? gen.toObject() : { ...gen };
  if (!obj.parameters || !obj.parameters.prompt) {
    const inputs = obj.inputs || {};
    let prompt = '';
    let negativePrompt = '';
    let seed = undefined;
    let steps = undefined;
    let cfg = undefined;
    let model = '';
    let samplerName = '';
    let scheduler = '';
    let width = undefined;
    let height = undefined;

    for (const [, node] of Object.entries(inputs as Record<string, any>)) {
      if (node.class_type === 'UNETLoader' || node.class_type === 'CheckpointLoaderSimple') {
        model = node.inputs?.unet_name || node.inputs?.ckpt_name || model;
      }
      if (node.class_type === 'TextEncodeQwenImage21') {
        prompt = prompt || node.inputs?.prompt || '';
        negativePrompt = negativePrompt || node.inputs?.negative_prompt || '';
      } else if (node.class_type === 'CLIPTextEncode') {
        const t = (node._meta?.title || '').toLowerCase();
        if (t.includes('negative')) {
          negativePrompt = negativePrompt || node.inputs?.text || '';
        } else {
          prompt = prompt || node.inputs?.text || '';
        }
      }
      if (node.class_type === 'KSampler' || node.class_type === 'KSamplerAdvanced') {
        if (seed === undefined) seed = node.inputs?.seed;
        if (steps === undefined) steps = node.inputs?.steps;
        if (cfg === undefined) cfg = node.inputs?.cfg;
        samplerName = node.inputs?.sampler_name || samplerName;
        scheduler = node.inputs?.scheduler || scheduler;
      }
      if (node.class_type === 'EmptyLatentImage') {
        if (width === undefined) width = node.inputs?.width;
        if (height === undefined) height = node.inputs?.height;
      }
    }

    obj.parameters = {
      prompt,
      negativePrompt,
      seed,
      steps,
      cfg,
      model,
      samplerName,
      scheduler,
      width,
      height
    };
  }

  if (!obj.executionTimeMs && obj.startedAt && obj.completedAt) {
    obj.executionTimeMs = Math.max(0, new Date(obj.completedAt).getTime() - new Date(obj.startedAt).getTime());
  }

  return obj;
}

export class GenerationController {

  async getGenerations(req: Request, res: Response) {
    try {
      const { workflowId, status, promptId, page, limit } = req.query;
      const query: any = {};

      if (workflowId) query.workflowId = workflowId;
      if (promptId) query.promptId = promptId;
      if (status && status !== 'all') query.status = status;

      const pageNum = parseInt(String(page || '1'), 10);
      const limitNum = parseInt(String(limit || '20'), 10);
      const skip = (pageNum - 1) * limitNum;

      const total = await Generation.countDocuments(query);
      const generations = await Generation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const enriched = generations.map(enrichParameters);
      res.json({ items: enriched, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getGenerationById(req: Request, res: Response) {
    try {
      const gen = await Generation.findById(req.params.id);
      if (!gen) return res.status(404).json({ error: 'Generation not found' });
      res.json(enrichParameters(gen));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }


  async serveFile(req: Request, res: Response) {
    try {
      const filename = path.basename(String(req.params.filename));
      const candidates = [
        path.join(config.paths.outputs, filename),
        path.resolve(process.cwd(), 'data/outputs', filename),
        path.resolve('data/outputs', filename),
        path.resolve(__dirname, '../../../../data/outputs', filename)
      ];

      for (const p of candidates) {
        if (fs.existsSync(p)) {
          return res.sendFile(p);
        }
      }

      // Check DB record for localPath
      const gen = await Generation.findOne({ 'outputs.filename': filename });
      const recordPath = gen?.outputs?.find((o) => o.filename === filename)?.localPath;
      if (recordPath && fs.existsSync(recordPath)) {
        return res.sendFile(recordPath);
      }

      // Remote fallback: try to stream or download from active ComfyUI endpoint
      try {
        const remoteUrl = `${comfyUIService.getEndpoint()}/view?filename=${encodeURIComponent(filename)}&type=output`;
        const localDest = path.resolve('data/outputs', filename);
        const remoteRes = await axios.get(remoteUrl, { responseType: 'arraybuffer', timeout: 10000 });
        if (remoteRes.data) {
          fs.writeFileSync(localDest, Buffer.from(remoteRes.data));
          return res.sendFile(localDest);
        }
      } catch (remoteErr) {
        // Fallback failed
      }

      res.status(404).json({ error: 'Output file not found' });
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

  async cancelGeneration(req: Request, res: Response) {
    try {
      const gen = await Generation.findById(req.params.id);
      if (!gen) return res.status(404).json({ error: 'Generation not found' });

      try {
        await comfyUIService.interrupt();
      } catch (e) {}

      gen.status = 'cancelled';
      gen.error = 'Cancelled by user';
      await gen.save();

      res.json({ message: 'Generation cancelled', gen });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteGeneration(req: Request, res: Response) {
    try {
      const gen = await Generation.findById(req.params.id);
      if (!gen) return res.status(404).json({ error: 'Generation not found' });

      if (gen.status === 'queued' || gen.status === 'executing') {
        try {
          await comfyUIService.interrupt();
        } catch (e) {}
      }

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

  async clearAllGenerations(req: Request, res: Response) {
    try {
      await comfyUIService.interrupt().catch(() => {});
      await Generation.deleteMany({});
      res.json({ message: 'Cleared all generations' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const generationController = new GenerationController();

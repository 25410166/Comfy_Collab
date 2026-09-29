import { Request, Response } from 'express';
import { PromptPreset } from '../../database/models/PromptPreset.js';
import { optimizerService } from './optimizer.service.js';

export class PromptController {
  async getPrompts(req: Request, res: Response) {
    try {
      const { category, search, page = '1', limit = '24' } = req.query;
      const query: any = {};

      if (category && category !== 'all') {
        query.category = category;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { title: regex },
          { positive: regex },
          { tags: regex }
        ];
      }

      const pageNum = Math.max(1, parseInt(String(page), 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
      const skip = (pageNum - 1) * limitNum;

      const total = await PromptPreset.countDocuments(query);
      const items = await PromptPreset.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      res.json({
        items,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getPromptById(req: Request, res: Response) {
    try {
      const prompt = await PromptPreset.findById(req.params.id);
      if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
      res.json(prompt);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const total = await PromptPreset.countDocuments();
      const modelCount = await PromptPreset.countDocuments({ category: 'model' });
      const outfitCount = await PromptPreset.countDocuments({ category: 'outfit_swap' });
      const faceCount = await PromptPreset.countDocuments({ category: 'face_swap' });

      res.json({
        total,
        model: modelCount,
        outfit_swap: outfitCount,
        face_swap: faceCount
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async optimizePrompt(req: Request, res: Response) {
    try {
      const { prompt, style, targetModel, negativePrompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const result = await optimizerService.optimize({
        prompt,
        style,
        targetModel,
        negativePrompt
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const promptController = new PromptController();


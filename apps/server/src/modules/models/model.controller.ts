import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Model, IModel } from '../../database/models/Model.js';
import { ModelFile } from '../../database/models/ModelFile.js';
import { modelHubService } from '../../services/modelhub.service.js';
import { config } from '../../config.js';

export class ModelController {
  async getModels(req: Request, res: Response) {
    try {
      const { type, search } = req.query;
      const query: any = {};

      if (type && type !== 'all') {
        query.type = type;
      }

      if (search) {
        query.$or = [
          { name: new RegExp(String(search), 'i') },
          { tags: new RegExp(String(search), 'i') },
          { baseModel: new RegExp(String(search), 'i') }
        ];
      }

      const models = await Model.find(query)
        .populate('files')
        .sort({ updatedAt: -1 });

      res.json(models);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getModelById(req: Request, res: Response) {
    try {
      const model = await Model.findById(req.params.id).populate('files');
      if (!model) return res.status(404).json({ error: 'Model not found' });
      res.json(model);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async createModel(req: Request, res: Response) {
    try {
      const { name, source, type, baseModel, description, previewImages, tags } = req.body;
      const model = await Model.create({
        name,
        source: source || 'local',
        type: type || 'checkpoint',
        baseModel: baseModel || 'SDXL',
        description: description || '',
        previewImages: previewImages || [],
        tags: tags || []
      });
      res.status(201).json(model);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteModel(req: Request, res: Response) {
    try {
      const model = await Model.findById(req.params.id);
      if (!model) return res.status(404).json({ error: 'Model not found' });

      // Clean up files record
      await ModelFile.deleteMany({ modelId: model._id });
      await Model.findByIdAndDelete(req.params.id);

      res.json({ message: 'Model deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async searchCivitai(req: Request, res: Response) {
    try {
      const { query, types, limit, page } = req.query;
      const results = await modelHubService.searchCivitai({
        query: query ? String(query) : undefined,
        types: types ? String(types) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 20,
        page: page ? parseInt(String(page), 10) : 1
      });
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async searchHuggingFace(req: Request, res: Response) {
    try {
      const { query, limit } = req.query;
      const results = await modelHubService.searchHuggingFace({
        query: query ? String(query) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 20
      });
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async scanLocalModels(req: Request, res: Response) {
    try {
      const categories = ['checkpoint', 'lora', 'vae', 'controlnet', 'upscaler', 'embedding', 'unet'];
      let totalFound = 0;

      for (const cat of categories) {
        const catDir = path.join(config.paths.models, cat);
        if (!fs.existsSync(catDir)) {
          fs.mkdirSync(catDir, { recursive: true });
          continue;
        }

        const files = fs.readdirSync(catDir);
        for (const file of files) {
          const filePath = path.join(catDir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) continue;

          totalFound++;
          const ext = path.extname(file).replace('.', '') || 'safetensors';

          let existingFile = await ModelFile.findOne({ filename: file });
          if (!existingFile) {
            let model = await Model.findOne({ name: path.parse(file).name });
            if (!model) {
              model = await Model.create({
                name: path.parse(file).name,
                source: 'local',
                type: cat as any,
                previewImages: [],
                tags: [cat]
              });
            }

            existingFile = await ModelFile.create({
              modelId: model._id,
              filename: file,
              size: stat.size,
              format: ext,
              localPath: filePath,
              status: 'ready'
            });

            if (!model.files.includes(existingFile._id)) {
              model.files.push(existingFile._id);
              await model.save();
            }
          }
        }
      }

      res.json({ message: `Scan complete. Found and cataloged models.`, totalFilesScanned: totalFound });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const modelController = new ModelController();

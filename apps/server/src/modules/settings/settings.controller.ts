import { Request, Response } from 'express';
import { Setting } from '../../database/models/Setting.js';
import { config } from '../../config.js';
import { comfyUIService } from '../../services/comfyui.service.js';

export class SettingsController {
  async getSettings(req: Request, res: Response) {
    try {
      const dbSettings = await Setting.find();
      const settingsMap: Record<string, any> = {};
      dbSettings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      res.json({
        paths: config.paths,
        tokens: {
          hf: config.tokens.hf ? '***' + config.tokens.hf.slice(-4) : '',
          civitai: config.tokens.civitai ? '***' + config.tokens.civitai.slice(-4) : ''
        },
        comfy: {
          endpoint: settingsMap['comfy_endpoint'] || config.comfy.endpoint
        },
        drive: {
          configured: !!(config.drive.clientId && config.drive.refreshToken),
          folderId: config.drive.folderId
        },
        custom: settingsMap
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Settings object is required' });
      }

      for (const [key, value] of Object.entries(settings)) {
        await Setting.findOneAndUpdate(
          { key },
          { key, value, updatedAt: new Date() },
          { upsert: true }
        );

        if (key === 'comfy_endpoint' && typeof value === 'string') {
          config.comfy.endpoint = value;
          comfyUIService.setEndpoint(value);
        }
      }

      res.json({ message: 'Settings saved successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const settingsController = new SettingsController();

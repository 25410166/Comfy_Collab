import { Request, Response } from 'express';
import { DownloadJob } from '../../database/models/DownloadJob.js';
import { downloadService } from '../../services/download.service.js';

export class DownloadController {
  async getDownloads(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const query: any = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      const jobs = await DownloadJob.find(query).sort({ createdAt: -1 });
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async createDownload(req: Request, res: Response) {
    try {
      const { source, sourceUrl, modelName, category, filename, destination } = req.body;
      if (!sourceUrl || !filename) {
        return res.status(400).json({ error: 'sourceUrl and filename are required' });
      }

      const job = await downloadService.queueDownload({
        source: source || 'url',
        sourceUrl,
        modelName: modelName || filename,
        category: category || 'checkpoint',
        filename,
        destination: destination || 'local'
      });

      res.status(201).json(job);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async pauseDownload(req: Request, res: Response) {
    try {
      await downloadService.pauseDownload(String(req.params.id));
      res.json({ message: 'Download paused' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async resumeDownload(req: Request, res: Response) {
    try {
      await downloadService.resumeDownload(String(req.params.id));
      res.json({ message: 'Download resumed' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async cancelDownload(req: Request, res: Response) {
    try {
      await downloadService.cancelDownload(String(req.params.id));
      res.json({ message: 'Download cancelled' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async retryDownload(req: Request, res: Response) {
    try {
      await downloadService.retryDownload(String(req.params.id));
      res.json({ message: 'Download retry scheduled' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const downloadController = new DownloadController();

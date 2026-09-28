import { Request, Response } from 'express';
import fs from 'fs';
import { driveService } from '../../services/drive.service.js';
import { WorkflowModel } from '../../database/models/Workflow.js';
import { SyncRecord } from '../../database/models/SyncRecord.js';

export class DriveController {
  async getStatus(req: Request, res: Response) {
    try {
      const status = await driveService.getSyncStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async triggerSync(req: Request, res: Response) {
    try {
      const workflows = await WorkflowModel.find();
      const results = [];

      for (const wf of workflows) {
        try {
          const resSync = await driveService.syncWorkflow(wf._id.toString());
          results.push({ id: wf._id, name: wf.name, ...resSync });
        } catch (e: any) {
          results.push({ id: wf._id, name: wf.name, status: 'error', message: e.message });
        }
      }

      res.json({ message: 'Sync process completed', results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async createBackup(req: Request, res: Response) {
    try {
      const zipPath = await driveService.createBackupZip();
      const stats = fs.statSync(zipPath);
      res.json({
        message: 'Backup created successfully',
        path: zipPath,
        sizeBytes: stats.size
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getSyncRecords(req: Request, res: Response) {
    try {
      const records = await SyncRecord.find().sort({ syncedAt: -1 }).limit(50);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const driveController = new DriveController();

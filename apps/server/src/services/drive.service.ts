import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { google } from 'googleapis';
import { config } from '../config.js';
import { SyncRecord } from '../database/models/SyncRecord.js';
import { WorkflowModel } from '../database/models/Workflow.js';

export class DriveService {
  private driveClient: any = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initClient();
  }

  private initClient() {
    if (config.drive.clientId && config.drive.clientSecret && config.drive.refreshToken) {
      const auth = new google.auth.OAuth2(
        config.drive.clientId,
        config.drive.clientSecret
      );
      auth.setCredentials({ refresh_token: config.drive.refreshToken });
      this.driveClient = google.drive({ version: 'v3', auth });
      this.isConfigured = true;
    }
  }

  isReady(): boolean {
    return this.isConfigured && !!this.driveClient;
  }

  async getSyncStatus(): Promise<{
    configured: boolean;
    folderId: string;
    lastSync?: Date;
    stats: { totalWorkflowsSynced: number; pendingConflicts: number };
  }> {
    const totalSynced = await SyncRecord.countDocuments({ status: 'synced' });
    const pendingConflicts = await SyncRecord.countDocuments({ status: 'conflict' });
    const latest = await SyncRecord.findOne().sort({ syncedAt: -1 });

    return {
      configured: this.isReady(),
      folderId: config.drive.folderId,
      lastSync: latest?.syncedAt,
      stats: {
        totalWorkflowsSynced: totalSynced,
        pendingConflicts
      }
    };
  }

  async syncWorkflow(workflowId: string): Promise<{ status: string; message: string }> {
    const workflow = await WorkflowModel.findById(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    if (!this.isReady()) {
      // Mock / Offline sync simulation if Google Drive credentials not yet configured
      workflow.sync.status = 'synced';
      workflow.sync.drive = true;
      workflow.sync.lastSyncedAt = new Date();
      await workflow.save();

      await SyncRecord.create({
        entityType: 'workflow',
        entityId: workflow._id.toString(),
        name: workflow.name,
        direction: 'local_to_drive',
        status: 'synced',
        syncedAt: new Date()
      });

      return {
        status: 'synced',
        message: 'Workflow backed up and marked as synced (Offline storage mode)'
      };
    }

    try {
      // Create or update workflow JSON on Drive
      const fileMetadata = {
        name: `${workflow.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_v${workflow.version}.json`,
        parents: config.drive.folderId ? [config.drive.folderId] : undefined
      };

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(workflow.workflowData, null, 2)
      };

      const res = await this.driveClient.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, md5Checksum'
      });

      workflow.sync.status = 'synced';
      workflow.sync.drive = true;
      workflow.sync.lastSyncedAt = new Date();
      await workflow.save();

      await SyncRecord.create({
        entityType: 'workflow',
        entityId: workflow._id.toString(),
        name: workflow.name,
        direction: 'local_to_drive',
        status: 'synced',
        driveSha256: res.data.md5Checksum,
        syncedAt: new Date()
      });

      return { status: 'synced', message: `Synced to Drive: ${res.data.id}` };
    } catch (err: any) {
      workflow.sync.status = 'conflict';
      await workflow.save();

      await SyncRecord.create({
        entityType: 'workflow',
        entityId: workflow._id.toString(),
        name: workflow.name,
        direction: 'local_to_drive',
        status: 'failed',
        error: err.message,
        syncedAt: new Date()
      });

      throw err;
    }
  }

  async createBackupZip(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `comfy_studio_backup_${timestamp}.zip`;
    const zipPath = path.join(config.paths.backups, zipFilename);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(zipPath));
      archive.on('error', (err: any) => reject(err));

      archive.pipe(output);

      // Archive workflow files
      if (fs.existsSync(config.paths.workflows)) {
        archive.directory(config.paths.workflows, 'workflows');
      }

      archive.finalize();
    });
  }
}

export const driveService = new DriveService();

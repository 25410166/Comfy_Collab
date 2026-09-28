import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios, { AxiosResponse } from 'axios';
import { DownloadJob, IDownloadJob } from '../database/models/DownloadJob.js';
import { Model } from '../database/models/Model.js';
import { ModelFile } from '../database/models/ModelFile.js';
import { socketService } from './socket.service.js';
import { config } from '../config.js';

interface ActiveDownload {
  jobId: string;
  abortController: AbortController;
  writer: fs.WriteStream | null;
}

export class DownloadService {
  private activeDownloads: Map<string, ActiveDownload> = new Map();

  async queueDownload(params: {
    source: 'huggingface' | 'civitai' | 'url';
    sourceUrl: string;
    modelName: string;
    category: string;
    filename: string;
    destination?: 'local' | 'drive' | 'runtime';
  }): Promise<IDownloadJob> {
    const job = await DownloadJob.create({
      source: params.source,
      sourceUrl: params.sourceUrl,
      modelName: params.modelName,
      category: params.category || 'checkpoint',
      filename: params.filename,
      destination: params.destination || 'local',
      status: 'queued',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 0
    });

    this.processJob(job._id.toString());
    return job;
  }

  async pauseDownload(jobId: string): Promise<void> {
    const active = this.activeDownloads.get(jobId);
    if (active) {
      active.abortController.abort();
      this.activeDownloads.delete(jobId);
    }
    await DownloadJob.findByIdAndUpdate(jobId, { status: 'paused', speed: 0 });
    socketService.emit('download.status', { jobId, status: 'paused' });
  }

  async resumeDownload(jobId: string): Promise<void> {
    await DownloadJob.findByIdAndUpdate(jobId, { status: 'queued', error: null });
    this.processJob(jobId);
  }

  async cancelDownload(jobId: string): Promise<void> {
    const active = this.activeDownloads.get(jobId);
    if (active) {
      active.abortController.abort();
      this.activeDownloads.delete(jobId);
    }

    const job = await DownloadJob.findById(jobId);
    if (job) {
      const tempPath = path.join(config.paths.downloads, `${job._id}-${job.filename}.part`);
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (e) {}
      }
      job.status = 'cancelled';
      job.speed = 0;
      await job.save();
      socketService.emit('download.status', { jobId, status: 'cancelled' });
    }
  }

  async retryDownload(jobId: string): Promise<void> {
    await DownloadJob.findByIdAndUpdate(jobId, {
      status: 'queued',
      downloadedBytes: 0,
      progress: 0,
      error: null
    });
    this.processJob(jobId);
  }

  private async processJob(jobId: string) {
    const job = await DownloadJob.findById(jobId);
    if (!job || job.status === 'downloading') return;

    const abortController = new AbortController();
    const tempFilePath = path.join(config.paths.downloads, `${job._id}-${job.filename}.part`);
    let startByte = 0;

    if (fs.existsSync(tempFilePath)) {
      startByte = fs.statSync(tempFilePath).size;
    }

    job.status = 'downloading';
    job.downloadedBytes = startByte;
    await job.save();

    socketService.emit('download.started', { jobId: job._id });

    try {
      const headers: Record<string, string> = {};
      if (startByte > 0) {
        headers['Range'] = `bytes=${startByte}-`;
      }
      if (job.source === 'civitai' && config.tokens.civitai) {
        headers['Authorization'] = `Bearer ${config.tokens.civitai}`;
      } else if (job.source === 'huggingface' && config.tokens.hf) {
        headers['Authorization'] = `Bearer ${config.tokens.hf}`;
      }

      const response: AxiosResponse = await axios.get(job.sourceUrl, {
        headers,
        responseType: 'stream',
        signal: abortController.signal
      });

      const totalSize = parseInt(String(response.headers['content-length'] || '0'), 10) + startByte;
      job.totalBytes = totalSize;
      await job.save();

      const writer = fs.createWriteStream(tempFilePath, { flags: startByte > 0 ? 'a' : 'w' });
      this.activeDownloads.set(jobId, { jobId, abortController, writer });

      let downloadedSoFar = startByte;
      let lastReportTime = Date.now();
      let bytesSinceLastReport = 0;

      const hash = crypto.createHash('sha256');

      response.data.on('data', async (chunk: Buffer) => {
        downloadedSoFar += chunk.length;
        bytesSinceLastReport += chunk.length;
        hash.update(chunk);

        const now = Date.now();
        if (now - lastReportTime >= 1000) {
          const speed = Math.round((bytesSinceLastReport / (now - lastReportTime)) * 1000);
          const progress = totalSize > 0 ? Math.min(100, Math.round((downloadedSoFar / totalSize) * 100)) : 0;

          bytesSinceLastReport = 0;
          lastReportTime = now;

          await DownloadJob.findByIdAndUpdate(jobId, {
            downloadedBytes: downloadedSoFar,
            progress,
            speed
          });

          socketService.emit('download.progress', {
            jobId,
            progress,
            downloadedBytes: downloadedSoFar,
            totalBytes: totalSize,
            speed
          });
        }
      });

      await new Promise<void>((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', () => resolve());
        writer.on('error', reject);
        response.data.on('error', reject);
      });

      this.activeDownloads.delete(jobId);

      // Verify and finalize file
      const sha256 = hash.digest('hex');
      const targetCategoryDir = path.join(config.paths.models, job.category || 'checkpoint');
      if (!fs.existsSync(targetCategoryDir)) {
        fs.mkdirSync(targetCategoryDir, { recursive: true });
      }

      const targetPath = path.join(targetCategoryDir, job.filename);
      fs.renameSync(tempFilePath, targetPath);

      // Register into Database Model and ModelFile
      let model = await Model.findOne({ name: job.modelName });
      if (!model) {
        model = await Model.create({
          name: job.modelName,
          source: job.source,
          type: job.category as any,
          previewImages: [],
          tags: [job.category]
        });
      }

      const modelFile = await ModelFile.create({
        modelId: model._id,
        filename: job.filename,
        size: downloadedSoFar,
        sha256,
        format: path.extname(job.filename).replace('.', '') || 'safetensors',
        localPath: targetPath,
        status: 'ready'
      });

      model.files.push(modelFile._id);
      await model.save();

      job.status = 'completed';
      job.progress = 100;
      job.speed = 0;
      job.destinationPath = targetPath;
      await job.save();

      socketService.emit('download.completed', {
        jobId,
        modelId: model._id,
        filename: job.filename,
        path: targetPath
      });
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || abortController.signal.aborted) {
        // Paused or cancelled intentionally
        return;
      }
      console.error(`[Download Error] ${job.filename}:`, err.message);
      this.activeDownloads.delete(jobId);
      job.status = 'failed';
      job.error = err.message;
      job.speed = 0;
      await job.save();

      socketService.emit('download.failed', {
        jobId,
        error: err.message
      });
    }
  }
}

export const downloadService = new DownloadService();

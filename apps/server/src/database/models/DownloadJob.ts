import mongoose, { Schema, Document } from 'mongoose';

export type DownloadStatus = 
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface IDownloadJob extends Document {
  source: 'huggingface' | 'civitai' | 'url';
  sourceUrl: string;
  modelId?: mongoose.Types.ObjectId;
  modelName: string;
  category: string;
  filename: string;
  destination: 'local' | 'drive' | 'runtime';
  destinationPath: string;
  status: DownloadStatus;
  progress: number; // 0 - 100
  downloadedBytes: number;
  totalBytes: number;
  speed: number; // bytes/sec
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DownloadJobSchema = new Schema<IDownloadJob>(
  {
    source: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    modelId: { type: Schema.Types.ObjectId, ref: 'Model', default: null },
    modelName: { type: String, default: '' },
    category: { type: String, default: 'checkpoint' },
    filename: { type: String, required: true },
    destination: { type: String, default: 'local' },
    destinationPath: { type: String, default: '' },
    status: { type: String, default: 'queued', index: true },
    progress: { type: Number, default: 0 },
    downloadedBytes: { type: Number, default: 0 },
    totalBytes: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    error: { type: String, default: null }
  },
  { timestamps: true }
);

DownloadJobSchema.index({ status: 1, createdAt: -1 });

export const DownloadJob = mongoose.model<IDownloadJob>('DownloadJob', DownloadJobSchema);

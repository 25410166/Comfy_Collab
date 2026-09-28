import mongoose, { Schema, Document } from 'mongoose';

export interface IModelFile extends Document {
  modelId: mongoose.Types.ObjectId;
  filename: string;
  size: number;
  sha256?: string;
  format: string; // safetensors, ckpt, gguf, pt, bin, etc.
  localPath?: string;
  drivePath?: string;
  runtimePath?: string;
  status: 'pending' | 'downloading' | 'ready' | 'missing' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

const ModelFileSchema = new Schema<IModelFile>(
  {
    modelId: { type: Schema.Types.ObjectId, ref: 'Model', required: true, index: true },
    filename: { type: String, required: true, index: true },
    size: { type: Number, default: 0 },
    sha256: { type: String, default: '', index: true },
    format: { type: String, default: 'safetensors' },
    localPath: { type: String, default: '' },
    drivePath: { type: String, default: '' },
    runtimePath: { type: String, default: '' },
    status: { type: String, default: 'ready', index: true }
  },
  { timestamps: true }
);

export const ModelFile = mongoose.model<IModelFile>('ModelFile', ModelFileSchema);

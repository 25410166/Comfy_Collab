import mongoose, { Schema, Document } from 'mongoose';

export type ModelCategory = 
  | 'checkpoint'
  | 'lora'
  | 'vae'
  | 'controlnet'
  | 'upscaler'
  | 'embedding'
  | 'unet'
  | 'clip'
  | 'other';

export interface IModel extends Document {
  name: string;
  source: 'civitai' | 'huggingface' | 'local' | 'custom';
  sourceId?: string;
  versionId?: string;
  type: ModelCategory;
  baseModel?: string; // SD1.5, SDXL, Pony, Flux.1, etc.
  description?: string;
  previewImages: string[];
  license?: string;
  tags: string[];
  author?: string;
  files: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ModelSchema = new Schema<IModel>(
  {
    name: { type: String, required: true, index: true },
    source: { type: String, required: true, default: 'local', index: true },
    sourceId: { type: String, default: '' },
    versionId: { type: String, default: '' },
    type: { type: String, required: true, default: 'checkpoint', index: true },
    baseModel: { type: String, default: 'Unknown' },
    description: { type: String, default: '' },
    previewImages: [{ type: String }],
    license: { type: String, default: '' },
    tags: [{ type: String, index: true }],
    author: { type: String, default: '' },
    files: [{ type: Schema.Types.ObjectId, ref: 'ModelFile' }]
  },
  { timestamps: true }
);

export const Model = mongoose.model<IModel>('Model', ModelSchema);

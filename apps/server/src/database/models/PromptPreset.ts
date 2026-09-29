import mongoose, { Schema, Document } from 'mongoose';

export type PromptCategory = 'model' | 'outfit_swap' | 'face_swap' | 'all';

export interface IPromptPreset extends Document {
  title: string;
  category: 'model' | 'outfit_swap' | 'face_swap';
  positive: string;
  negative: string;
  imageUrl?: string;
  tags: string[];
  width: number;
  height: number;
  steps: number;
  cfg: number;
  samplerName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PromptPresetSchema = new Schema<IPromptPreset>(
  {
    title: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true, enum: ['model', 'outfit_swap', 'face_swap'] },
    positive: { type: String, required: true },
    negative: { type: String, default: 'ugly, deformed, noisy, blurry, low contrast, bad anatomy, bad hands, missing fingers, extra limbs, plastic skin, watermark' },
    imageUrl: { type: String, default: '' },
    tags: [{ type: String, index: true }],
    width: { type: Number, default: 768 },
    height: { type: Number, default: 768 },
    steps: { type: Number, default: 12 },
    cfg: { type: Number, default: 1.0 },
    samplerName: { type: String, default: 'euler' }
  },
  { timestamps: true }
);

PromptPresetSchema.index({ title: 'text', positive: 'text', tags: 'text' });

export const PromptPreset = mongoose.model<IPromptPreset>('PromptPreset', PromptPresetSchema);

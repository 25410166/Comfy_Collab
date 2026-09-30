import mongoose, { Schema, Document } from 'mongoose';

export interface IGeneration extends Document {
  workflowId?: mongoose.Types.ObjectId;
  workflowName: string;
  runtimeId?: mongoose.Types.ObjectId;
  promptId: string;
  status: 'queued' | 'executing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentNode?: string;
  inputs: Record<string, any>;
  outputs: Array<{
    filename: string;
    subfolder: string;
    type: string; // output, temp
    url: string;
    localPath?: string;
    mediaType: 'image' | 'video' | 'audio' | 'other';
  }>;
  parameters: {
    prompt?: string;
    negativePrompt?: string;
    seed?: number;
    steps?: number;
    cfg?: number;
    samplerName?: string;
    scheduler?: string;
    model?: string;
    loras?: Array<{ name: string; strength: number }>;
    width?: number;
    height?: number;
  };
  executionTimeMs?: number;
  error?: string | null;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GenerationSchema = new Schema<IGeneration>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', default: null, index: true },
    workflowName: { type: String, default: 'Untitled Workflow' },
    runtimeId: { type: Schema.Types.ObjectId, ref: 'Runtime', default: null },
    promptId: { type: String, required: true, index: true },
    status: { type: String, default: 'queued', index: true },
    progress: { type: Number, default: 0 },
    currentNode: { type: String, default: '' },
    inputs: { type: Schema.Types.Mixed, default: {} },
    outputs: [
      {
        filename: { type: String, required: true },
        subfolder: { type: String, default: '' },
        type: { type: String, default: 'output' },
        url: { type: String, required: true },
        localPath: { type: String, default: '' },
        mediaType: { type: String, default: 'image' }
      }
    ],
    parameters: {
      prompt: { type: String, default: '' },
      negativePrompt: { type: String, default: '' },
      seed: { type: Number },
      steps: { type: Number },
      cfg: { type: Number },
      samplerName: { type: String, default: '' },
      scheduler: { type: String, default: '' },
      model: { type: String, default: '' },
      loras: [{ name: { type: String }, strength: { type: Number, default: 1.0 } }],
      width: { type: Number },
      height: { type: Number }
    },
    executionTimeMs: { type: Number, default: 0 },
    error: { type: String, default: null },
    startedAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

GenerationSchema.index({ createdAt: -1 });

export const Generation = mongoose.model<IGeneration>('Generation', GenerationSchema);

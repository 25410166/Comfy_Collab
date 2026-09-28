import mongoose, { Schema, Document } from 'mongoose';

export type RuntimeProvider = 'google-colab' | 'local' | 'remote-gpu';
export type RuntimeStatus = 'ready' | 'busy' | 'offline' | 'error' | 'connecting';

export interface IRuntime extends Document {
  name: string;
  provider: RuntimeProvider;
  status: RuntimeStatus;
  endpoint: string;
  authToken?: string;
  comfyVersion?: string;
  pythonVersion?: string;
  gpu?: {
    name: string;
    vram: number; // in GB or MB
    freeVram?: number;
  };
  customNodesInstalled: string[];
  lastConnectedAt?: Date;
  lastHeartbeatAt?: Date;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RuntimeSchema = new Schema<IRuntime>(
  {
    name: { type: String, required: true, default: 'Google Colab' },
    provider: { type: String, required: true, default: 'google-colab' },
    status: { type: String, default: 'offline', index: true },
    endpoint: { type: String, default: 'http://127.0.0.1:8188' },
    authToken: { type: String, default: '' },
    comfyVersion: { type: String, default: '' },
    pythonVersion: { type: String, default: '' },
    gpu: {
      name: { type: String, default: '' },
      vram: { type: Number, default: 0 },
      freeVram: { type: Number, default: 0 }
    },
    customNodesInstalled: [{ type: String }],
    lastConnectedAt: { type: Date },
    lastHeartbeatAt: { type: Date },
    isDefault: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Runtime = mongoose.model<IRuntime>('Runtime', RuntimeSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowVersion {
  version: number;
  workflowData: any;
  updatedAt: Date;
  comment?: string;
}

export interface ISamplePrompt {
  title: string;
  category?: string;
  positive: string;
  negative: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
}

export interface IWorkflow extends Document {
  name: string;
  description?: string;
  projectId?: mongoose.Types.ObjectId;
  version: number;
  workflowData: any;
  workflowPath: string;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  tags: string[];
  models: Array<{
    name: string;
    type: string; // checkpoint, lora, vae, etc.
    required: boolean;
  }>;
  customNodes: Array<{
    name: string;
    classType: string;
    required: boolean;
  }>;
  samplePrompts?: ISamplePrompt[];
  sync: {
    local: boolean;
    drive: boolean;
    status: 'synced' | 'local_only' | 'drive_only' | 'conflict' | 'pending';
    lastSyncedAt?: Date;
  };
  versions: IWorkflowVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    version: { type: Number, default: 1 },
    workflowData: { type: Schema.Types.Mixed, required: true },
    workflowPath: { type: String, default: '' },
    thumbnailPath: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    tags: [{ type: String, index: true }],
    models: [
      {
        name: { type: String, required: true },
        type: { type: String, default: 'checkpoint' },
        required: { type: Boolean, default: true }
      }
    ],
    customNodes: [
      {
        name: { type: String, required: true },
        classType: { type: String, required: true },
        required: { type: Boolean, default: true }
      }
    ],
    samplePrompts: [
      {
        title: { type: String, default: '' },
        category: { type: String, default: 'Portrait' },
        positive: { type: String, default: '' },
        negative: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        width: { type: Number, default: 768 },
        height: { type: Number, default: 768 },
        steps: { type: Number, default: 12 },
        cfg: { type: Number, default: 1.0 }
      }
    ],
    sync: {
      local: { type: Boolean, default: true },
      drive: { type: Boolean, default: false },
      status: { type: String, default: 'local_only' },
      lastSyncedAt: { type: Date }
    },
    versions: [
      {
        version: { type: Number, required: true },
        workflowData: { type: Schema.Types.Mixed, required: true },
        updatedAt: { type: Date, default: Date.now },
        comment: { type: String, default: '' }
      }
    ]
  },
  { timestamps: true }
);

WorkflowSchema.index({ tags: 1, updatedAt: -1 });

export const WorkflowModel = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);

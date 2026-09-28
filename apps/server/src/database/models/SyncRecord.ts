import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncRecord extends Document {
  entityType: 'workflow' | 'model' | 'output' | 'database';
  entityId: string;
  name: string;
  direction: 'local_to_drive' | 'drive_to_local';
  status: 'synced' | 'conflict' | 'failed' | 'in_progress';
  localSha256?: string;
  driveSha256?: string;
  conflictDetails?: {
    localUpdatedAt: Date;
    driveUpdatedAt: Date;
    localVersion?: number;
    driveVersion?: number;
  };
  syncedAt: Date;
  error?: string;
}

const SyncRecordSchema = new Schema<ISyncRecord>(
  {
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    name: { type: String, required: true },
    direction: { type: String, required: true },
    status: { type: String, default: 'synced' },
    localSha256: { type: String },
    driveSha256: { type: String },
    conflictDetails: { type: Schema.Types.Mixed },
    syncedAt: { type: Date, default: Date.now },
    error: { type: String }
  },
  { timestamps: true }
);

export const SyncRecord = mongoose.model<ISyncRecord>('SyncRecord', SyncRecordSchema);

export interface Workflow {
  _id: string;
  name: string;
  description?: string;
  version: number;
  workflowData: any;
  thumbnailUrl?: string;
  tags: string[];
  models: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  customNodes: Array<{
    name: string;
    classType: string;
    required: boolean;
  }>;
  sync: {
    local: boolean;
    drive: boolean;
    status: 'synced' | 'local_only' | 'drive_only' | 'conflict' | 'pending';
    lastSyncedAt?: string;
  };
  versions: Array<{
    version: number;
    workflowData: any;
    updatedAt: string;
    comment?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ModelItem {
  _id: string;
  name: string;
  source: 'civitai' | 'huggingface' | 'local' | 'custom';
  type: string;
  baseModel?: string;
  description?: string;
  previewImages: string[];
  tags: string[];
  author?: string;
  files: Array<{
    _id: string;
    filename: string;
    size: number;
    format: string;
    localPath?: string;
    status: string;
  }>;
}

export interface DownloadJob {
  _id: string;
  source: string;
  sourceUrl: string;
  modelName: string;
  category: string;
  filename: string;
  destination: string;
  destinationPath?: string;
  status: 'queued' | 'downloading' | 'paused' | 'verifying' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: number;
  error?: string | null;
  createdAt: string;
}

export interface RuntimeInfo {
  _id: string;
  name: string;
  provider: 'google-colab' | 'local' | 'remote-gpu';
  status: 'ready' | 'busy' | 'offline' | 'error' | 'connecting';
  endpoint: string;
  comfyVersion?: string;
  pythonVersion?: string;
  gpu?: {
    name: string;
    vram: number;
    freeVram?: number;
  };
  customNodesInstalled: string[];
  lastConnectedAt?: string;
  lastHeartbeatAt?: string;
}

export interface Generation {
  _id: string;
  workflowId?: string;
  workflowName: string;
  promptId: string;
  status: 'queued' | 'executing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentNode?: string;
  outputs: Array<{
    filename: string;
    subfolder: string;
    type: string;
    url: string;
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
  };
  executionTimeMs?: number;
  error?: string | null;
  createdAt: string;
}

export interface DependencyResult {
  models: {
    installed: Array<{ name: string; type: string; path?: string }>;
    missing: Array<{ name: string; type: string }>;
  };
  customNodes: {
    installed: Array<{ classType: string; name?: string }>;
    missing: Array<{ classType: string; name?: string }>;
  };
}

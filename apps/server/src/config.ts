import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Find workspace root containing data directory
let searchDir = process.cwd();
let foundRoot = searchDir;
for (let i = 0; i < 5; i++) {
  if (fs.existsSync(path.join(searchDir, 'data'))) {
    foundRoot = searchDir;
    break;
  }
  const parent = path.dirname(searchDir);
  if (parent === searchDir) break;
  searchDir = parent;
}
const WORKSPACE_ROOT = foundRoot;

const rootEnvPath = path.join(WORKSPACE_ROOT, '.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const BASE_DATA_DIR = process.env.DATA_DIR 
  ? path.resolve(WORKSPACE_ROOT, process.env.DATA_DIR)
  : path.join(WORKSPACE_ROOT, 'data');

export const config = {
  port: parseInt(process.env.PORT || '2001', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/comfy_studio',
  dataDir: BASE_DATA_DIR,
  paths: {
    workflows: path.join(BASE_DATA_DIR, 'workflows'),
    models: path.join(BASE_DATA_DIR, 'models'),
    outputs: path.join(BASE_DATA_DIR, 'outputs'),
    downloads: path.join(BASE_DATA_DIR, 'downloads'),
    cache: path.join(BASE_DATA_DIR, 'cache'),
    backups: path.join(BASE_DATA_DIR, 'backups'),
    logs: path.join(BASE_DATA_DIR, 'logs'),
    temp: path.join(BASE_DATA_DIR, 'temp')
  },
  drive: {
    clientId: process.env.GDRIVE_CLIENT_ID || '',
    clientSecret: process.env.GDRIVE_CLIENT_SECRET || '',
    refreshToken: process.env.GDRIVE_REFRESH_TOKEN || '',
    folderId: process.env.GDRIVE_FOLDER_ID || ''
  },
  tokens: {
    hf: process.env.HF_TOKEN || '',
    civitai: process.env.CIVITAI_API_KEY || ''
  },
  comfy: {
    endpoint: process.env.COMFYUI_ENDPOINT || 'http://127.0.0.1:8188',
    authToken: process.env.COMFYUI_AUTH_TOKEN || ''
  }
};

// Ensure all data directories exist
Object.values(config.paths).forEach((dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

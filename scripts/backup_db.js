import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/comfy_studio';

async function backup() {
  await mongoose.connect(MONGO_URI);
  console.log('[Backup] Connected to MongoDB');

  const collections = await mongoose.connection.db.listCollections().toArray();
  const dump = {};

  for (const col of collections) {
    const data = await mongoose.connection.db.collection(col.name).find().toArray();
    dump[col.name] = data;
    console.log(`[Backup] Exported ${col.name}: ${data.length} documents`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, '../data/backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const backupFilePath = path.join(backupDir, `mongodb_dump_${timestamp}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(dump, null, 2));

  console.log(`[Backup] Database dumped successfully to: ${backupFilePath}`);
  await mongoose.disconnect();
}

backup().catch(console.error);

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/comfy_studio';
const dumpFile = process.argv[2];

if (!dumpFile) {
  console.error('Usage: node scripts/restore_db.js <path-to-mongodb_dump.json>');
  process.exit(1);
}

async function restore() {
  const filePath = path.resolve(dumpFile);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  await mongoose.connect(MONGO_URI);
  console.log('[Restore] Connected to MongoDB');

  for (const [colName, docs] of Object.entries(dump)) {
    const col = mongoose.connection.db.collection(colName);
    await col.deleteMany({});
    if (Array.isArray(docs) && docs.length > 0) {
      await col.insertMany(docs);
      console.log(`[Restore] Restored ${colName}: ${docs.length} documents`);
    }
  }

  console.log('[Restore] Completed successfully.');
  await mongoose.disconnect();
}

restore().catch(console.error);

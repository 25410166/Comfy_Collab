import axios from 'axios';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const endpoint = 'https://cards-clark-animation-bicycle.trycloudflare.com';
const promptId = '1dd86430-4f95-4d78-91ca-2acb32013247';

(async () => {
  console.log('Checking prompt completion...');
  for (let i = 0; i < 30; i++) {
    const histRes = await axios.get(`${endpoint}/history/${promptId}`);
    const item = histRes.data[promptId];
    if (item && item.outputs) {
      console.log('COMPLETED! Outputs found:', Object.keys(item.outputs));
      const outNode = Object.values(item.outputs)[0];
      const img = outNode.images?.[0];
      if (img) {
        console.log('Output image filename:', img.filename);
        const fileRes = await axios.get(`${endpoint}/view?filename=${encodeURIComponent(img.filename)}&type=output`, { responseType: 'arraybuffer' });
        const localPath = path.resolve('data/outputs', img.filename);
        fs.writeFileSync(localPath, Buffer.from(fileRes.data));
        console.log('Saved image locally:', localPath, 'Size:', fs.statSync(localPath).size, 'bytes');

        await mongoose.connect('mongodb://127.0.0.1:27017/comfy_studio');
        await mongoose.connection.collection('generations').updateOne(
          { promptId },
          {
            $set: {
              status: 'completed',
              progress: 100,
              completedAt: new Date(),
              executionTimeMs: 180000,
              outputs: [
                {
                  filename: img.filename,
                  subfolder: '',
                  type: 'output',
                  url: `/api/generations/file/${img.filename}`,
                  localPath: localPath,
                  mediaType: 'image'
                }
              ]
            }
          }
        );
        console.log('Updated DB record successfully!');
        process.exit(0);
      }
    }
    await new Promise((r) => setTimeout(r, 4000));
    process.stdout.write('.');
  }
  console.log('\nStill processing on GPU...');
  process.exit(0);
})();

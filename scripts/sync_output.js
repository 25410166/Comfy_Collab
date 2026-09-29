const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const endpoint = 'https://cohen-officer-followed-runtime.trycloudflare.com';
const promptId = '78ec8f9f-cfc5-4f37-87ff-f53ced22a351';
const filename = 'Qwen2.1_00001_.png';

(async () => {
  try {
    const downloadUrl = `${endpoint}/view?filename=${encodeURIComponent(filename)}&type=output`;
    const localDest = path.join(__dirname, 'data/outputs', filename);
    console.log('Downloading from:', downloadUrl, 'to:', localDest);

    const res = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(localDest, Buffer.from(res.data));
    console.log('Downloaded file size:', fs.statSync(localDest).size, 'bytes');

    await mongoose.connect('mongodb://127.0.0.1:27017/comfy_studio');
    await mongoose.connection.collection('generations').updateOne(
      { promptId },
      {
        $set: {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          executionTimeMs: 1024705,
          outputs: [
            {
              filename,
              subfolder: '',
              type: 'output',
              url: `/api/generations/file/${filename}`,
              localPath: localDest,
              mediaType: 'image'
            }
          ]
        }
      }
    );
    console.log('Updated generation in MongoDB successfully!');
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();

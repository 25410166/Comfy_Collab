import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/comfy_studio');
    const collection = mongoose.connection.collection('workflows');

    const kreaWf = {
      name: 'LUSTIFY! Krea 2 Turbo (Siêu Tốc 8s - LoRA V4)',
      description: 'Workflow Krea 2 thế hệ mới kết hợp LUSTIFY Turbo và LoRA Krea 2 NSFW V4. Tối ưu cực đại cho ảnh siêu thực, kết cấu da chân thực và ánh sáng nghệ thuật. Render chỉ 8 bước (Euler + Beta).',
      version: 1,
      tags: ['Krea 2', 'LUSTIFY', 'LoRA V4', 'Photorealistic', 'Turbo 8s', 'NSFW'],
      workflowPath: path.resolve('data/workflows/krea2_lustify_turbo.json'),
      workflowData: JSON.parse(fs.readFileSync('data/workflows/krea2_lustify_turbo.json', 'utf-8')),
      thumbnailUrl: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/c9fb379c-79f9-4c12-87ad-d533b37a7b8e/width=450/3147117.jpeg',
      models: [
        { name: 'lustify-v10-krea-turbo-int8_convrot.safetensors', type: 'diffusion_models', required: true },
        { name: 'qwen3vl_4b_fp8_scaled.safetensors', type: 'text_encoders', required: true },
        { name: 'wan_2.1_vae.safetensors', type: 'vae', required: true },
        { name: 'KNP_000003000.safetensors', type: 'loras', required: false }
      ],
      customNodes: [],
      samplePrompts: [
        {
          title: 'Melancholic Succubus (Succubus sầu muộn)',
          category: 'portrait',
          positive: 'A woman is captured as a melancholic succubus with horns and wings, posed against a backdrop of ethereal white cherry blossoms and cool blue atmospheric lighting, very realistic, 8k, cinematic photography',
          negative: 'worst quality, low quality, bad anatomy, deformed, distorted, blurry, cartoon, 3d render',
          width: 1152,
          height: 1536,
          steps: 8,
          cfg: 1.0,
          samplerName: 'euler',
          scheduler: 'beta'
        },
        {
          title: 'Beauty in Engineer Suit (Công thức Krea 2)',
          category: 'portrait',
          positive: 'A young beautiful woman in engineer suit is leaning forward towards the viewer, authentic skin texture, soft dramatic ambient lighting, highly detailed face, very realistic, 8k',
          negative: 'worst quality, low quality, blurry, deformed, bad anatomy',
          width: 1152,
          height: 1536,
          steps: 8,
          cfg: 1.0,
          samplerName: 'euler',
          scheduler: 'beta'
        }
      ],
      sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existing = await collection.findOne({ name: kreaWf.name });
    if (existing) {
      await collection.updateOne({ _id: existing._id }, { $set: kreaWf });
      console.log('Updated existing Krea 2 workflow:', existing._id);
    } else {
      const res = await collection.insertOne(kreaWf);
      console.log('Inserted new Krea 2 workflow:', res.insertedId);
    }

    console.log('Krea 2 Workflow seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Krea 2 workflow:', err);
    process.exit(1);
  }
})();

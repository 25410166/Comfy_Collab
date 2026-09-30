import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/comfy_studio');
    const collection = mongoose.connection.collection('workflows');

    const turboWorkflows = [
      {
        name: 'SDXL Lightning 4-Step (Gen 2 giây!)',
        description: 'ByteDance SDXL Lightning - gen 1 ảnh 1024x1024 chỉ trong 2 giây trên GPU T4. Sử dụng euler sampler, sgm_uniform scheduler, CFG 1.0, 4 bước duy nhất. Chất lượng tương đương SDXL 20 bước.',
        version: 1,
        tags: ['SDXL', 'Lightning', 'Ultra-Fast 2s', '4-Step', 'ByteDance'],
        workflowPath: path.resolve('data/workflows/sdxl_lightning_4step.json'),
        workflowData: JSON.parse(fs.readFileSync('data/workflows/sdxl_lightning_4step.json', 'utf-8')),
        thumbnailUrl: '/static/outputs/sdxl_realvis_master.png',
        models: [
          { name: 'sdxl_lightning_4step.safetensors', type: 'checkpoints', required: true }
        ],
        customNodes: [],
        samplePrompts: [
          {
            title: 'Chân dung Studio Cinematic (Lightning 2s)',
            category: 'portrait',
            positive: 'cinematic portrait of a beautiful woman, soft studio lighting, detailed skin pores, 8k uhd, masterpiece, photorealistic',
            negative: 'ugly, deformed, noisy, blurry, low contrast, cartoon, anime, 3d render, bad hands, mutated fingers',
            width: 1024,
            height: 1024,
            steps: 4,
            cfg: 1.0,
            imageUrl: '/static/outputs/sdxl_realvis_master.png'
          },
          {
            title: 'Thời trang đường phố Tokyo (Lightning 2s)',
            category: 'fashion',
            positive: 'street fashion photography, Japanese model in Shibuya, neon lights, wet asphalt reflections, 50mm lens, cinematic, hyperrealistic, 8k',
            negative: 'blurry, disfigured, cartoon, drawing, watermark, low quality',
            width: 1024,
            height: 1024,
            steps: 4,
            cfg: 1.0,
            imageUrl: '/static/outputs/sdxl_realvis_master.png'
          },
          {
            title: 'Chân dung cận cảnh Macro Eye (Lightning 2s)',
            category: 'portrait',
            positive: 'extreme close-up portrait, sharp iris detail, natural skin pores, eyelashes, dramatic lighting, 105mm macro, photorealistic, 8k uhd',
            negative: 'ugly, deformed eyes, blurred, plastic skin, cartoon, extra limbs, low resolution',
            width: 1024,
            height: 1024,
            steps: 4,
            cfg: 1.0,
            imageUrl: '/static/outputs/sdxl_face_detailer.png'
          }
        ],
        sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'SDXL Turbo 1-Step (Gen 1 giây!)',
        description: 'Stability AI SDXL Turbo - gen 1 ảnh 512x512 chỉ trong 1 giây. Tốc độ nhanh nhất có thể, tối ưu cho việc thử ý tưởng nhanh và lặp prompt liên tục. Dùng euler_ancestral, CFG 1.0, 1 bước duy nhất.',
        version: 1,
        tags: ['SDXL', 'Turbo', 'Instant 1s', '1-Step', 'Stability AI'],
        workflowPath: path.resolve('data/workflows/sdxl_turbo_1step.json'),
        workflowData: JSON.parse(fs.readFileSync('data/workflows/sdxl_turbo_1step.json', 'utf-8')),
        thumbnailUrl: '/static/outputs/sd15_realistic_vision.png',
        models: [
          { name: 'sd_xl_turbo_1.0_fp16.safetensors', type: 'checkpoints', required: true }
        ],
        customNodes: [],
        samplePrompts: [
          {
            title: 'Người mẫu thời trang Turbo (1 giây)',
            category: 'fashion',
            positive: 'cinematic photo of a stunning fashion model, dramatic lighting, professional photography, 8k',
            negative: 'ugly, deformed, blurry, cartoon, drawing, lowres',
            width: 512,
            height: 512,
            steps: 1,
            cfg: 1.0,
            imageUrl: '/static/outputs/sd15_realistic_vision.png'
          },
          {
            title: 'Phong cảnh Cyberpunk (1 giây)',
            category: 'landscape',
            positive: 'futuristic cyberpunk cityscape, neon lights, rain, volumetric fog, cinematic, 8k',
            negative: 'ugly, blurry, lowres, text, watermark',
            width: 512,
            height: 512,
            steps: 1,
            cfg: 1.0,
            imageUrl: '/static/outputs/sd15_realistic_vision.png'
          }
        ],
        sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'SDXL Lightning Batch x4 (Gen 4 ảnh trong 8 giây)',
        description: 'Gen hàng loạt 4 ảnh cùng lúc chỉ trong ~8 giây bằng SDXL Lightning 4-step với batch_size=4. Tối ưu cho việc so sánh nhiều biến thể prompt và chọn ảnh tốt nhất.',
        version: 1,
        tags: ['SDXL', 'Lightning', 'Batch', '4x Images', 'Ultra-Fast'],
        workflowPath: path.resolve('data/workflows/sdxl_lightning_batch4.json'),
        workflowData: JSON.parse(fs.readFileSync('data/workflows/sdxl_lightning_batch4.json', 'utf-8')),
        thumbnailUrl: '/static/outputs/sdxl_upscale_4k.png',
        models: [
          { name: 'sdxl_lightning_4step.safetensors', type: 'checkpoints', required: true }
        ],
        customNodes: [],
        samplePrompts: [
          {
            title: 'Batch 4 chân dung Fashion Studio',
            category: 'fashion',
            positive: 'professional fashion photography, beautiful model, studio lighting, detailed skin, 8k uhd, masterpiece',
            negative: 'ugly, deformed, noisy, blurry, cartoon, anime, 3d render, bad hands',
            width: 1024,
            height: 1024,
            steps: 4,
            cfg: 1.0,
            imageUrl: '/static/outputs/sdxl_upscale_4k.png'
          }
        ],
        sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const wf of turboWorkflows) {
      const existing = await collection.findOne({ name: wf.name });
      if (!existing) {
        await collection.insertOne(wf);
        console.log(`Created: ${wf.name}`);
      } else {
        await collection.updateOne({ _id: existing._id }, { $set: wf });
        console.log(`Updated: ${wf.name}`);
      }
    }

    console.log('Turbo/Lightning workflows seeded!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();

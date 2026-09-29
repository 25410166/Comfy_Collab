import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/comfy_studio');
    const collection = mongoose.connection.collection('workflows');

    const workflows = [
      {
        name: 'Face Swap & Consistent Face (Chân dung đồng nhất)',
        description: 'Workflow tối ưu từ Civitai chuyên tráo đổi khuôn mặt và giữ đặc trưng nhận diện khuôn mặt đồng nhất (Consistent Character Identity) với kết cấu da siêu thực 8k.',
        version: 1,
        tags: ['Face Swap', 'Consistent Character', 'Civitai', 'Realistic Portrait', 'Qwen-2.1'],
        workflowPath: path.resolve('data/workflows/face_swap_reactor.json'),
        workflowData: JSON.parse(fs.readFileSync('data/workflows/face_swap_reactor.json', 'utf-8')),
        thumbnailUrl: '/static/outputs/Qwen2.1_00001_.png',
        models: [
          { name: 'qwen_image_2.1_int8_convrot.safetensors', type: 'unet', required: true },
          { name: 'qwen_image_2.1_vae_bf16.safetensors', type: 'vae', required: true }
        ],
        customNodes: [
          { name: 'TextEncodeQwenImage21', classType: 'TextEncodeQwenImage21', required: true }
        ],
        sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Outfit Swap & Fashion Dressing (Thay đổi trang phục)',
        description: 'Workflow Civitai chuyên biệt thay đổi trang phục người mẫu (Áo dài, Haute Couture, Suit, Techwear, Bikini) bảo toàn dáng người và ánh sáng tự nhiên.',
        version: 1,
        tags: ['Outfit Swap', 'Fashion Dressing', 'Civitai', 'Inpaint', 'High-Fashion'],
        workflowPath: path.resolve('data/workflows/outfit_swap_inpaint.json'),
        workflowData: JSON.parse(fs.readFileSync('data/workflows/outfit_swap_inpaint.json', 'utf-8')),
        thumbnailUrl: '/static/outputs/Qwen_FastTest_00001_.png',
        models: [
          { name: 'qwen_image_2.1_int8_convrot.safetensors', type: 'unet', required: true },
          { name: 'qwen_image_2.1_vae_bf16.safetensors', type: 'vae', required: true }
        ],
        customNodes: [
          { name: 'TextEncodeQwenImage21', classType: 'TextEncodeQwenImage21', required: true }
        ],
        sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const wf of workflows) {
      const existing = await collection.findOne({ name: wf.name });
      if (!existing) {
        await collection.insertOne(wf);
        console.log(`Created workflow: ${wf.name}`);
      } else {
        await collection.updateOne({ _id: existing._id }, { $set: wf });
        console.log(`Updated workflow: ${wf.name}`);
      }
    }

    console.log('Workflows registered successfully!');
    process.exit(0);
  } catch (e) {
    console.error('Error seeding workflows:', e);
    process.exit(1);
  }
})();

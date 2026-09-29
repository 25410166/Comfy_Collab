import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/comfy_studio');
    const collection = mongoose.connection.collection('workflows');

    const newWorkflows = [
      {
        name: 'SDXL Realistic Master (RealVisXL V4.0 - Siêu Tốc 15s)',
        description: 'Workflow SDXL chuyên nghiệp tạo chân dung người mẫu siêu thực 8k, kết cấu da chân thực (skin pores), ánh sáng studio Rembrandt. Render chỉ 15-20 giây trên GPU Colab T4.',
        version: 1,
        tags: ['SDXL', 'RealVisXL', 'Photorealistic', 'Portrait', 'Ultra-Fast 15s'],
        workflowPath: path.resolve('data/workflows/sdxl_realistic_master.json'),
        workflowData: JSON.parse(fs.readFileSync('data/workflows/sdxl_realistic_master.json', 'utf-8')),
        thumbnailUrl: '/static/outputs/sdxl_realvis_master.png',
        models: [
          { name: 'realvisxlV40_v40Bakedvae.safetensors', type: 'checkpoints', required: true }
        ],
        customNodes: [],
        samplePrompts: [
          {
            title: 'Chân dung Muse Parisian (Studio Chiaroscuro)',
            category: 'portrait',
            positive: 'Award-winning RAW cinematic portrait of a stunning elegant woman, authentic skin pores, fine skin texture, soft chiaroscuro studio lighting, 85mm f/1.4 lens, natural gaze, luxury atmosphere, photorealistic, 8k uhd, masterpiece',
            negative: 'ugly, deformed, noisy, blurry, low contrast, cartoon, anime, 3d render, extra limbs, bad hands, mutated fingers, plastic skin, oversaturated, amateur',
            width: 832,
            height: 1216,
            steps: 20,
            cfg: 5.5,
            imageUrl: '/static/outputs/sdxl_realvis_master.png'
          },
          {
            title: 'Thời trang đường phố Tokyo (Cinematic Street)',
            category: 'fashion',
            positive: 'Cinematic candid street portrait of a fashionable Japanese model walking in Shibuya at twilight, wet asphalt reflections, neon lights bokeh, wearing tailored minimal trench coat, 50mm f/1.2 lens, hyperrealistic',
            negative: 'blurry, disfigured, bad anatomy, cartoon, drawing, plastic skin, duplicate, watermark',
            width: 832,
            height: 1216,
            steps: 20,
            cfg: 5.5,
            imageUrl: '/static/outputs/sdxl_realvis_master.png'
          }
        ],
        sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Realistic Vision V6.0 (SD1.5 Cực Nhanh 5s)',
        description: 'Workflow SD 1.5 thế hệ mới tối ưu tốc độ đỉnh cao, tạo chân dung người mẫu sắc nét chỉ trong 5-8 giây. Thích hợp lặp ý tưởng cực nhanh và tiết kiệm tài nguyên GPU.',
        version: 1,
        tags: ['SD1.5', 'Realistic Vision', 'V6.0', 'Ultra-Speed 5s', 'Portrait'],
        workflowPath: path.resolve('data/workflows/realistic_vision_v6.json'),
        workflowData: JSON.parse(fs.readFileSync('data/workflows/realistic_vision_v6.json', 'utf-8')),
        thumbnailUrl: '/static/outputs/sd15_realistic_vision.png',
        models: [
          { name: 'realisticVisionV60B1_v51VAE.safetensors', type: 'checkpoints', required: true }
        ],
        customNodes: [],
        samplePrompts: [
          {
            title: 'Chân dung người mẫu Pháp (Paris Street Candid)',
            category: 'portrait',
            positive: 'RAW street style photography of a beautiful model in Paris, natural candid smile, stylish beige trench coat, soft golden hour sunlight, 50mm f/1.8, bokeh, hyperdetailed skin, authentic look, 8k',
            negative: 'deformed, bad anatomy, disfigured, poorly drawn face, mutation, extra limb, ugly, disgusting, blurred, watermark, bad hands, cartoon, 3d render',
            width: 512,
            height: 768,
            steps: 20,
            cfg: 6.0,
            imageUrl: '/static/outputs/sd15_realistic_vision.png'
          }
        ],
        sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'SDXL Face Detailer & Portrait Consistency (Khuôn mặt sắc nét & LoRA)',
        description: 'Workflow kết hợp RealVisXL và LoRA Add-Detail-XL chuyên trị chi tiết đồng tử mắt, sợi lông mày, viền môi và kết cấu da siêu thực 8k mà không bị nhựa/sáp.',
        version: 1,
        tags: ['SDXL', 'LoRA', 'Face Detail', 'Eye Reflection', 'Consistent Portrait'],
        workflowPath: path.resolve('data/workflows/sdxl_face_detailer.json'),
        workflowData: JSON.parse(fs.readFileSync('data/workflows/sdxl_face_detailer.json', 'utf-8')),
        thumbnailUrl: '/static/outputs/sdxl_face_detailer.png',
        models: [
          { name: 'realvisxlV40_v40Bakedvae.safetensors', type: 'checkpoints', required: true },
          { name: 'add-detail-xl.safetensors', type: 'loras', required: true }
        ],
        customNodes: [],
        samplePrompts: [
          {
            title: 'Chân dung Cận cảnh Macro (Eye & Skin Detail)',
            category: 'portrait',
            positive: 'Extreme close-up beauty portrait of a gorgeous muse, sharp detailed iris, luminous skin with natural pores, individual eyelashes, soft dramatic lighting, 105mm macro lens, ultra photorealistic, 8k uhd, cinematic film still',
            negative: 'ugly, deformed eyes, blurred pupils, plastic skin, cartoon, anime, extra limbs, bad teeth, bad hands, low resolution, artifacts',
            width: 832,
            height: 1216,
            steps: 22,
            cfg: 5.5,
            imageUrl: '/static/outputs/sdxl_face_detailer.png'
          }
        ],
        sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'SDXL + 4x-UltraSharp 4k Upscaler (Nâng cấp ảnh 4k Siêu nét)',
        description: 'Workflow toàn diện tự động sinh ảnh chân dung SDXL và đưa qua model AI 4x-UltraSharp để nhân độ phân giải lên 4k, giữ nguyên độ nét của da và trang phục.',
        version: 1,
        tags: ['SDXL', 'Upscale 4k', '4x-UltraSharp', 'High-Fashion', 'Masterpiece'],
        workflowPath: path.resolve('data/workflows/sdxl_4k_upscale.json'),
        workflowData: JSON.parse(fs.readFileSync('data/workflows/sdxl_4k_upscale.json', 'utf-8')),
        thumbnailUrl: '/static/outputs/sdxl_upscale_4k.png',
        models: [
          { name: 'realvisxlV40_v40Bakedvae.safetensors', type: 'checkpoints', required: true },
          { name: '4x-UltraSharp.pth', type: 'upscale_models', required: true }
        ],
        customNodes: [],
        samplePrompts: [
          {
            title: 'Chân dung Dạ hội 4k UltraSharp (Luxury Gown)',
            category: 'fashion',
            positive: 'Full length editorial fashion photography of a striking high fashion model in luxury designer evening gown, architectural brutalist minimalist hall, dramatic contrast, soft rim light, 50mm lens, medium format camera, 8k raw photo',
            negative: 'ugly, deformed, bad anatomy, bad hands, cartoon, 3d, blurry, plastic skin, lowres, watermark',
            width: 832,
            height: 1216,
            steps: 20,
            cfg: 5.5,
            imageUrl: '/static/outputs/sdxl_upscale_4k.png'
          }
        ],
        sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ControlNet OpenPose (Kiểm soát tư thế người mẫu SD1.5)',
        description: 'Workflow định hình dáng đứng, tư thế chụp ảnh thời trang bằng ControlNet OpenPose kết hợp Realistic Vision V6.0. Giữ chuẩn tỷ lệ cơ thể và tạo dáng theo ảnh mẫu.',
        version: 1,
        tags: ['SD1.5', 'ControlNet', 'OpenPose', 'Fashion Pose', 'Model'],
        workflowPath: path.resolve('data/workflows/controlnet_openpose_sd15.json'),
        workflowData: JSON.parse(fs.readFileSync('data/workflows/controlnet_openpose_sd15.json', 'utf-8')),
        thumbnailUrl: '/static/outputs/controlnet_openpose.png',
        models: [
          { name: 'realisticVisionV60B1_v51VAE.safetensors', type: 'checkpoints', required: true },
          { name: 'control_v11p_sd15_openpose.pth', type: 'controlnet', required: true }
        ],
        customNodes: [],
        samplePrompts: [
          {
            title: 'Tư thế sàn diễn thời trang Haute Couture',
            category: 'fashion',
            positive: 'Full body fashion model in haute couture runway outfit, perfect athletic posture, studio lighting, highly detailed face, realistic skin texture, 8k uhd, masterpiece',
            negative: 'deformed, bad anatomy, bad hands, missing fingers, extra limbs, ugly, blurry, low quality, cartoon, 3d render',
            width: 512,
            height: 768,
            steps: 20,
            cfg: 6.5,
            imageUrl: '/static/outputs/controlnet_openpose.png'
          }
        ],
        sync: { local: true, drive: true, status: 'synced', lastSyncedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const wf of newWorkflows) {
      const existing = await collection.findOne({ name: wf.name });
      if (!existing) {
        await collection.insertOne(wf);
        console.log(`Created new workflow: ${wf.name}`);
      } else {
        await collection.updateOne({ _id: existing._id }, { $set: wf });
        console.log(`Updated workflow: ${wf.name}`);
      }
    }

    console.log('Fast Realistic Workflows registered successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding fast realistic workflows:', err);
    process.exit(1);
  }
})();

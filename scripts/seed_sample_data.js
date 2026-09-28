import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/comfy_studio';

// Standard ComfyUI SD1.5 Text2Image Workflow
const sampleWorkflowData = {
  "3": {
    "inputs": {
      "seed": 42,
      "steps": 20,
      "cfg": 7,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler",
    "_meta": { "title": "KSampler" }
  },
  "4": {
    "inputs": {
      "ckpt_name": "v1-5-pruned-emaonly.safetensors"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": { "title": "Load Checkpoint" }
  },
  "5": {
    "inputs": {
      "width": 512,
      "height": 512,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage",
    "_meta": { "title": "Empty Latent Image" }
  },
  "6": {
    "inputs": {
      "text": "masterpiece, best quality, ultra-detailed anime girl portrait, glowing neon highlights, cyberpunk city background, vibrant colors",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "Positive Prompt" }
  },
  "7": {
    "inputs": {
      "text": "low quality, blurry, distorted, bad anatomy, bad hands, watermark",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "Negative Prompt" }
  },
  "8": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode",
    "_meta": { "title": "VAE Decode" }
  },
  "9": {
    "inputs": {
      "filename_prefix": "ComfyStudio",
      "images": ["8", 0]
    },
    "class_type": "SaveImage",
    "_meta": { "title": "Save Image" }
  }
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for seeding');

  const WorkflowSchema = new mongoose.Schema({}, { strict: false });
  const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);

  const existing = await Workflow.findOne({ name: 'Standard SD1.5 Text2Image' });
  if (!existing) {
    const wf = await Workflow.create({
      name: 'Standard SD1.5 Text2Image',
      description: 'Default text-to-image pipeline with prompt, sampler, and VAE decode',
      version: 1,
      workflowData: sampleWorkflowData,
      tags: ['txt2img', 'sd1.5', 'starter'],
      models: [
        { name: 'v1-5-pruned-emaonly.safetensors', type: 'checkpoint', required: true }
      ],
      customNodes: [],
      sync: {
        local: true,
        drive: false,
        status: 'local_only'
      },
      versions: [
        {
          version: 1,
          workflowData: sampleWorkflowData,
          updatedAt: new Date(),
          comment: 'Initial template'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const workflowDir = path.resolve(__dirname, '../data/workflows');
    if (!fs.existsSync(workflowDir)) fs.mkdirSync(workflowDir, { recursive: true });
    fs.writeFileSync(
      path.join(workflowDir, `${wf._id}.json`),
      JSON.stringify(sampleWorkflowData, null, 2)
    );

    console.log(`Seeded default workflow: ${wf._id}`);
  } else {
    console.log('Default workflow already exists.');
  }

  await mongoose.disconnect();
  console.log('Seeding finished.');
}

seed().catch(console.error);

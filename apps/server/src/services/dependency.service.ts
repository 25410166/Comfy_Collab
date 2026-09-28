import fs from 'fs';
import path from 'path';
import { ModelFile } from '../database/models/ModelFile.js';
import { config } from '../config.js';

// Standard core nodes in ComfyUI
const CORE_NODE_TYPES = new Set([
  'KSampler',
  'KSamplerAdvanced',
  'CheckpointLoaderSimple',
  'CheckpointLoader',
  'VAELoader',
  'VAEDecode',
  'VAEEncode',
  'VAEEncodeForInpaint',
  'CLIPTextEncode',
  'CLIPSetLastLayer',
  'CLIPLoader',
  'DualCLIPLoader',
  'EmptyLatentImage',
  'LatentUpscale',
  'LatentUpscaleBy',
  'SaveImage',
  'PreviewImage',
  'LoadImage',
  'LoadImageMask',
  'ImageScale',
  'ImageScaleBy',
  'ImageInvert',
  'LoraLoader',
  'LoraLoaderModelOnly',
  'ControlNetLoader',
  'ControlNetApply',
  'ControlNetApplyAdvanced',
  'UpscaleModelLoader',
  'ImageUpscaleWithModel',
  'ConditioningCombine',
  'ConditioningAverage',
  'ConditioningConcat',
  'ConditioningSetArea',
  'UNETLoader',
  'ModelMergeSimple'
]);

export interface DependencyResult {
  models: {
    installed: Array<{ name: string; type: string; path?: string }>;
    missing: Array<{ name: string; type: string }>;
  };
  customNodes: {
    installed: Array<{ classType: string; name?: string }>;
    missing: Array<{ classType: string; name?: string }>;
  };
}

export class DependencyService {
  parseWorkflow(workflowData: any): {
    models: Array<{ name: string; type: string }>;
    customNodes: Array<{ classType: string; name: string }>;
  } {
    const modelsFound: Map<string, { name: string; type: string }> = new Map();
    const customNodesFound: Map<string, { classType: string; name: string }> = new Map();

    // ComfyUI workflow JSON formats:
    // Format A (API format): { "1": { "class_type": "...", "inputs": { ... } } }
    // Format B (UI format): { "nodes": [ { "type": "...", "widgets_values": [ ... ] } ] }

    if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
      // UI Format
      for (const node of workflowData.nodes) {
        const type = node.type;
        if (!type) continue;

        if (!CORE_NODE_TYPES.has(type)) {
          customNodesFound.set(type, { classType: type, name: node.title || type });
        }

        const widgets = node.widgets_values || [];
        if (type.includes('CheckpointLoader') && widgets[0]) {
          modelsFound.set(widgets[0], { name: widgets[0], type: 'checkpoint' });
        } else if (type.includes('LoraLoader') && widgets[0]) {
          modelsFound.set(widgets[0], { name: widgets[0], type: 'lora' });
        } else if (type.includes('VAELoader') && widgets[0]) {
          modelsFound.set(widgets[0], { name: widgets[0], type: 'vae' });
        } else if (type.includes('ControlNetLoader') && widgets[0]) {
          modelsFound.set(widgets[0], { name: widgets[0], type: 'controlnet' });
        } else if (type.includes('UpscaleModelLoader') && widgets[0]) {
          modelsFound.set(widgets[0], { name: widgets[0], type: 'upscaler' });
        } else if (type.includes('UNETLoader') && widgets[0]) {
          modelsFound.set(widgets[0], { name: widgets[0], type: 'unet' });
        }
      }
    } else {
      // API Format
      for (const key of Object.keys(workflowData)) {
        const node = workflowData[key];
        const classType = node?.class_type;
        if (!classType) continue;

        if (!CORE_NODE_TYPES.has(classType)) {
          customNodesFound.set(classType, { classType, name: node._meta?.title || classType });
        }

        const inputs = node.inputs || {};
        if (inputs.ckpt_name) {
          modelsFound.set(inputs.ckpt_name, { name: inputs.ckpt_name, type: 'checkpoint' });
        }
        if (inputs.lora_name) {
          modelsFound.set(inputs.lora_name, { name: inputs.lora_name, type: 'lora' });
        }
        if (inputs.vae_name) {
          modelsFound.set(inputs.vae_name, { name: inputs.vae_name, type: 'vae' });
        }
        if (inputs.control_net_name) {
          modelsFound.set(inputs.control_net_name, { name: inputs.control_net_name, type: 'controlnet' });
        }
        if (inputs.model_name && classType.includes('Upscale')) {
          modelsFound.set(inputs.model_name, { name: inputs.model_name, type: 'upscaler' });
        }
        if (inputs.unet_name) {
          modelsFound.set(inputs.unet_name, { name: inputs.unet_name, type: 'unet' });
        }
      }
    }

    return {
      models: Array.from(modelsFound.values()),
      customNodes: Array.from(customNodesFound.values())
    };
  }

  async resolveDependencies(
    workflowData: any,
    installedRuntimeNodes: string[] = []
  ): Promise<DependencyResult> {
    const { models, customNodes } = this.parseWorkflow(workflowData);

    const installedModels: Array<{ name: string; type: string; path?: string }> = [];
    const missingModels: Array<{ name: string; type: string }> = [];

    // Check DB and local files
    for (const m of models) {
      // Check in MongoDB
      const fileRecord = await ModelFile.findOne({
        filename: new RegExp(`^${escapeRegex(m.name)}$`, 'i')
      });

      // Check on disk
      const localDiskPath = path.join(config.paths.models, m.type, m.name);
      const existsOnDisk = fs.existsSync(localDiskPath);

      if (fileRecord || existsOnDisk) {
        installedModels.push({
          name: m.name,
          type: m.type,
          path: existsOnDisk ? localDiskPath : fileRecord?.localPath
        });
      } else {
        missingModels.push({ name: m.name, type: m.type });
      }
    }

    const runtimeNodeSet = new Set(installedRuntimeNodes.map((n) => n.toLowerCase()));
    const installedNodes: Array<{ classType: string; name?: string }> = [];
    const missingNodes: Array<{ classType: string; name?: string }> = [];

    for (const cn of customNodes) {
      if (runtimeNodeSet.has(cn.classType.toLowerCase())) {
        installedNodes.push(cn);
      } else {
        missingNodes.push(cn);
      }
    }

    return {
      models: {
        installed: installedModels,
        missing: missingModels
      },
      customNodes: {
        installed: installedNodes,
        missing: missingNodes
      }
    };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const dependencyService = new DependencyService();

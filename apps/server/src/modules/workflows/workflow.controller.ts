import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { WorkflowModel, IWorkflow } from '../../database/models/Workflow.js';
import { Generation } from '../../database/models/Generation.js';
import { dependencyService } from '../../services/dependency.service.js';
import { comfyUIService } from '../../services/comfyui.service.js';
import { driveService } from '../../services/drive.service.js';
import { runtimeService } from '../../services/runtime.service.js';
import { config } from '../../config.js';

export class WorkflowController {
  async getWorkflows(req: Request, res: Response) {
    try {
      const { search, tag } = req.query;
      const query: any = {};

      if (search) {
        query.$or = [
          { name: new RegExp(String(search), 'i') },
          { description: new RegExp(String(search), 'i') }
        ];
      }

      if (tag) {
        query.tags = tag;
      }

      const workflows = await WorkflowModel.find(query).sort({ updatedAt: -1 });
      res.json(workflows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getWorkflowById(req: Request, res: Response) {
    try {
      const workflow = await WorkflowModel.findById(req.params.id);
      if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
      res.json(workflow);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async createWorkflow(req: Request, res: Response) {
    try {
      const { name, description, tags, workflowData, thumbnailUrl } = req.body;
      if (!name || !workflowData) {
        return res.status(400).json({ error: 'Name and workflowData are required' });
      }

      const parsed = dependencyService.parseWorkflow(workflowData);

      const workflow = await WorkflowModel.create({
        name,
        description: description || '',
        tags: tags || [],
        version: 1,
        workflowData,
        thumbnailUrl: thumbnailUrl || '',
        models: parsed.models.map((m) => ({ name: m.name, type: m.type, required: true })),
        customNodes: parsed.customNodes.map((c) => ({
          name: c.name,
          classType: c.classType,
          required: true
        })),
        versions: [
          {
            version: 1,
            workflowData,
            updatedAt: new Date(),
            comment: 'Initial version'
          }
        ]
      });

      // Save workflow file to disk
      const filePath = path.join(config.paths.workflows, `${workflow._id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(workflowData, null, 2));
      workflow.workflowPath = filePath;
      await workflow.save();

      res.status(201).json(workflow);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateWorkflow(req: Request, res: Response) {
    try {
      const { name, description, tags, workflowData, comment, thumbnailUrl, samplePrompts } = req.body;
      const workflow = await WorkflowModel.findById(req.params.id);
      if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

      if (name) workflow.name = name;
      if (description !== undefined) workflow.description = description;
      if (tags) workflow.tags = tags;
      if (thumbnailUrl !== undefined) workflow.thumbnailUrl = thumbnailUrl;
      if (samplePrompts !== undefined) workflow.samplePrompts = samplePrompts;

      if (workflowData) {
        const nextVersion = workflow.version + 1;
        workflow.version = nextVersion;
        workflow.workflowData = workflowData;

        const parsed = dependencyService.parseWorkflow(workflowData);
        workflow.models = parsed.models.map((m) => ({ name: m.name, type: m.type, required: true }));
        workflow.customNodes = parsed.customNodes.map((c) => ({
          name: c.name,
          classType: c.classType,
          required: true
        }));

        workflow.versions.push({
          version: nextVersion,
          workflowData,
          updatedAt: new Date(),
          comment: comment || `Updated to version ${nextVersion}`
        });

        const filePath = path.join(config.paths.workflows, `${workflow._id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(workflowData, null, 2));
        workflow.workflowPath = filePath;
        workflow.sync.status = 'local_only';
      }

      await workflow.save();
      res.json(workflow);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteWorkflow(req: Request, res: Response) {
    try {
      const workflow = await WorkflowModel.findById(req.params.id);
      if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

      const filePath = path.join(config.paths.workflows, `${workflow._id}.json`);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }

      await WorkflowModel.findByIdAndDelete(req.params.id);
      res.json({ message: 'Workflow deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async checkDependencies(req: Request, res: Response) {
    try {
      const workflow = await WorkflowModel.findById(req.params.id);
      if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

      const runtime = await runtimeService.getActiveRuntime();
      if (runtime.status === 'ready' && (!runtime.modelsAvailable || runtime.modelsAvailable.length === 0)) {
        await runtimeService.checkHealth(runtime._id.toString());
      }
      const deps = await dependencyService.resolveDependencies(
        workflow.workflowData,
        runtime.customNodesInstalled || [],
        runtime.modelsAvailable || []
      );

      res.json(deps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async importWorkflow(req: Request, res: Response) {
    try {
      let workflowData: any;
      let name = 'Imported Workflow';

      if (req.file) {
        const fileContent = fs.readFileSync(req.file.path, 'utf-8');
        workflowData = JSON.parse(fileContent);
        name = path.parse(req.file.originalname).name;
        // Clean up uploaded temp file
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      } else if (req.body.workflowData) {
        workflowData = typeof req.body.workflowData === 'string' 
          ? JSON.parse(req.body.workflowData) 
          : req.body.workflowData;
        if (req.body.name) name = req.body.name;
      } else {
        return res.status(400).json({ error: 'No workflow file or JSON data provided' });
      }

      const parsed = dependencyService.parseWorkflow(workflowData);

      const workflow = await WorkflowModel.create({
        name,
        description: 'Imported from file',
        version: 1,
        workflowData,
        tags: ['imported'],
        models: parsed.models.map((m) => ({ name: m.name, type: m.type, required: true })),
        customNodes: parsed.customNodes.map((c) => ({
          name: c.name,
          classType: c.classType,
          required: true
        })),
        versions: [
          {
            version: 1,
            workflowData,
            updatedAt: new Date(),
            comment: 'Imported'
          }
        ]
      });

      const filePath = path.join(config.paths.workflows, `${workflow._id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(workflowData, null, 2));
      workflow.workflowPath = filePath;
      await workflow.save();

      res.status(201).json(workflow);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async exportWorkflow(req: Request, res: Response) {
    try {
      const workflow = await WorkflowModel.findById(req.params.id);
      if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${workflow.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json"`
      );
      res.send(JSON.stringify(workflow.workflowData, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async syncWorkflow(req: Request, res: Response) {
    try {
      const result = await driveService.syncWorkflow(String(req.params.id));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async runWorkflow(req: Request, res: Response) {
    try {
      const workflow = await WorkflowModel.findById(req.params.id);
      if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

      // Transform workflowData to prompt format if needed
      let promptPayload = JSON.parse(JSON.stringify(workflow.workflowData));
      // If UI format ({ nodes: [...] }), standard prompt queue requires prompt node dictionary
      if (promptPayload.nodes && Array.isArray(promptPayload.nodes)) {
        // UI format node conversion into API dictionary
        const apiFormat: Record<string, any> = {};
        for (const node of promptPayload.nodes) {
          apiFormat[node.id.toString()] = {
            class_type: node.type,
            inputs: node.widgets_values || {}
          };
        }
        promptPayload = apiFormat;
      }

      // Apply dynamic prompt, seed, steps, resolution overrides from req.body
      const { prompt, negativePrompt, seed, steps, width, height, cfg } = req.body || {};
      if (prompt !== undefined || negativePrompt !== undefined || seed !== undefined || steps !== undefined || width !== undefined || height !== undefined || cfg !== undefined) {
        // Detect positive & negative node IDs from KSampler connections if available
        let detectedPosNodeId: string | null = null;
        let detectedNegNodeId: string | null = null;
        for (const [, n] of Object.entries(promptPayload as Record<string, any>)) {
          if (n.class_type === 'KSampler' || n.class_type === 'KSamplerAdvanced') {
            if (Array.isArray(n.inputs?.positive)) detectedPosNodeId = String(n.inputs.positive[0]);
            if (Array.isArray(n.inputs?.negative)) detectedNegNodeId = String(n.inputs.negative[0]);
          }
        }

        for (const [nodeId, node] of Object.entries(promptPayload as Record<string, any>)) {
          const classType = node.class_type;
          const inputs = node.inputs;
          if (!inputs) continue;

          // 1. Text encode nodes (CLIPTextEncode or TextEncodeQwenImage21)
          if (classType === 'TextEncodeQwenImage21') {
            if (prompt !== undefined) inputs.prompt = prompt;
            if (negativePrompt !== undefined) inputs.negative_prompt = negativePrompt;
            if (width !== undefined) inputs.resolution = Math.max(width, height || width);
          } else if (classType === 'CLIPTextEncode') {
            const title = (node._meta?.title || '').toLowerCase();
            if (nodeId === detectedNegNodeId || title.includes('negative')) {
              if (negativePrompt !== undefined) inputs.text = negativePrompt;
            } else if (nodeId === detectedPosNodeId || title.includes('positive') || !title.includes('negative')) {
              if (prompt !== undefined) inputs.text = prompt;
            }
          }

          // 2. KSampler nodes
          if (classType === 'KSampler' || classType === 'KSamplerAdvanced') {
            if (seed !== undefined) inputs.seed = seed;
            if (steps !== undefined) inputs.steps = steps;
            if (cfg !== undefined) inputs.cfg = cfg;
          }

          // 3. Latent image
          if (classType === 'EmptyLatentImage') {
            if (width !== undefined) inputs.width = width;
            if (height !== undefined) inputs.height = height;
          }
        }
      }

      // Ensure SaveImage has unique filename_prefix per run so ComfyUI on Colab/Drive doesn't collide
      const safeWf = (workflow.name || 'Studio').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 10);
      const timeTag = Date.now().toString().slice(-6);
      for (const [, node] of Object.entries(promptPayload as Record<string, any>)) {
        if (node.class_type === 'SaveImage' || node.class_type === 'SaveImageAdvanced') {
          if (node.inputs) {
            node.inputs.filename_prefix = `Comfy_${safeWf}_${timeTag}`;
          }
        }
      }

      // Check runtime health & auto-reconnect
      let runtime = await runtimeService.getActiveRuntime();
      if (runtime.endpoint && runtime.endpoint.startsWith('http')) {
        const cleanEndpoint = runtime.endpoint.replace(/\/+$/, '');
        if (comfyUIService.getEndpoint() !== cleanEndpoint) {
          comfyUIService.setEndpoint(cleanEndpoint);
        }
      }

      if (runtime.status === 'offline') {
        const health = await runtimeService.checkHealth(runtime._id.toString());
        runtime = health.runtime;
      }

      if (runtime.status === 'offline') {
        return res.status(400).json({
          error: 'Runtime is offline. Please check Colab Cloudflare tunnel connection.'
        });
      }

      const queueResult = await comfyUIService.queuePrompt(promptPayload, {
        workflowId: workflow._id.toString()
      });

      // Extract comprehensive parameters for display in Gallery & Inspector
      let extractedPrompt = prompt || '';
      let extractedNegPrompt = negativePrompt || '';
      let extractedSeed = seed;
      let extractedSteps = steps;
      let extractedCfg = cfg;
      let extractedWidth = width;
      let extractedHeight = height;
      let extractedModel = '';
      let extractedSampler = '';
      let extractedScheduler = '';

      for (const [, node] of Object.entries(promptPayload as Record<string, any>)) {
        if (node.class_type === 'UNETLoader' || node.class_type === 'CheckpointLoaderSimple') {
          extractedModel = node.inputs?.unet_name || node.inputs?.ckpt_name || extractedModel;
        }
        if (node.class_type === 'TextEncodeQwenImage21') {
          if (!extractedPrompt) extractedPrompt = node.inputs?.prompt || '';
          if (!extractedNegPrompt) extractedNegPrompt = node.inputs?.negative_prompt || '';
        } else if (node.class_type === 'CLIPTextEncode') {
          const t = (node._meta?.title || '').toLowerCase();
          if (t.includes('negative')) {
            if (!extractedNegPrompt) extractedNegPrompt = node.inputs?.text || '';
          } else {
            if (!extractedPrompt) extractedPrompt = node.inputs?.text || '';
          }
        }
        if (node.class_type === 'KSampler' || node.class_type === 'KSamplerAdvanced') {
          if (extractedSeed === undefined) extractedSeed = node.inputs?.seed;
          if (extractedSteps === undefined) extractedSteps = node.inputs?.steps;
          if (extractedCfg === undefined) extractedCfg = node.inputs?.cfg;
          extractedSampler = node.inputs?.sampler_name || extractedSampler;
          extractedScheduler = node.inputs?.scheduler || extractedScheduler;
        }
        if (node.class_type === 'EmptyLatentImage') {
          if (extractedWidth === undefined) extractedWidth = node.inputs?.width;
          if (extractedHeight === undefined) extractedHeight = node.inputs?.height;
        }
      }

      const generation = await Generation.create({
        workflowId: workflow._id,
        workflowName: workflow.name,
        runtimeId: runtime._id,
        promptId: queueResult.prompt_id,
        status: 'queued',
        inputs: promptPayload,
        parameters: {
          prompt: extractedPrompt,
          negativePrompt: extractedNegPrompt,
          seed: extractedSeed,
          steps: extractedSteps,
          cfg: extractedCfg,
          samplerName: extractedSampler,
          scheduler: extractedScheduler,
          model: extractedModel,
          width: extractedWidth,
          height: extractedHeight
        },
        outputs: []
      });


      res.json({
        promptId: queueResult.prompt_id,
        generationId: generation._id,
        status: 'queued'
      });
    } catch (err: any) {
      console.error('[Run Workflow Error]:', err);
      res.status(500).json({ error: err.response?.data || err.message });
    }
  }
}

export const workflowController = new WorkflowController();

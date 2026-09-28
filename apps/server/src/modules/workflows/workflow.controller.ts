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
      const { name, description, tags, workflowData, comment, thumbnailUrl } = req.body;
      const workflow = await WorkflowModel.findById(req.params.id);
      if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

      if (name) workflow.name = name;
      if (description !== undefined) workflow.description = description;
      if (tags) workflow.tags = tags;
      if (thumbnailUrl !== undefined) workflow.thumbnailUrl = thumbnailUrl;

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
      const deps = await dependencyService.resolveDependencies(
        workflow.workflowData,
        runtime.customNodesInstalled || []
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
      let promptPayload = workflow.workflowData;
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

      // Check runtime health
      const runtime = await runtimeService.getActiveRuntime();
      if (runtime.status === 'offline') {
        return res.status(400).json({
          error: 'Runtime is offline. Please connect to Colab or local ComfyUI first.'
        });
      }

      const queueResult = await comfyUIService.queuePrompt(promptPayload, {
        workflowId: workflow._id.toString()
      });

      const generation = await Generation.create({
        workflowId: workflow._id,
        workflowName: workflow.name,
        runtimeId: runtime._id,
        promptId: queueResult.prompt_id,
        status: 'queued',
        inputs: promptPayload,
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

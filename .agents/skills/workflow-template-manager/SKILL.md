---
name: workflow-template-manager
description: Use this skill when adding, parsing, or modifying ComfyUI workflow JSON templates in the project. Do not use this when debugging ComfyUI execution errors.
---

# Workflow Template Manager

## Use this skill when
- You are adding a new ComfyUI workflow to the project.
- You need to map dynamic inputs (prompt, seed, resolution, model) to specific nodes in a workflow JSON.
- You are updating the workflow database schema or seed scripts.

## Do not use this skill when
- You are fixing ComfyUI runtime errors (use `comfyui-debugging`).
- You are modifying the Colab notebook.

## Process
1. **Directory**: Workflows must be saved as `.json` files in `data/workflows/`.
2. **Format**: The JSON must be in ComfyUI API format.
3. **Mapping Parameters**: 
   - Identify the nodes responsible for Checkpoint (`CheckpointLoaderSimple`), Prompts (`CLIPTextEncode`), Seed (`KSampler`), and Resolution (`EmptyLatentImage`).
   - Create a mapping mechanism (often in the backend controller) that dynamically injects user inputs into a *copy* of the workflow payload before sending it to ComfyUI.
   - Never mutate the original workflow file when generating an image.
4. **Validation**: Validate the workflow JSON format and ensure required nodes (like `SaveImage`) are present before saving or executing.

## Checklist
- [ ] Workflow JSON is saved in `data/workflows/`.
- [ ] Workflow uses API format, not UI format.
- [ ] Dynamic parameters (prompt, seed) are injected into a copy of the payload.
- [ ] Original workflow file remains unmodified during generation.

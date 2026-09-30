---
name: comfyui-debugging
description: Use this skill when diagnosing failures, errors, or timeouts in ComfyUI generation jobs. Do not use this when debugging purely local React frontend issues.
---

# ComfyUI Debugging

## Use this skill when
- A generation job fails or hangs.
- ComfyUI returns a 400 or 500 error.
- You encounter missing custom nodes or models.
- Out Of Memory (OOM) errors occur on Colab.

## Do not use this skill when
- The local website fails to build.
- React components throw rendering errors.

## Process
1. **Analyze API Response**: Read the `node_errors` in the response of the `/prompt` endpoint. It pinpoints the exact node that failed.
2. **Missing Dependencies**: Check if the required checkpoint, LoRA, VAE, or Custom Node is actually installed in the Colab environment.
3. **Format Issues**: Ensure the payload sent to `/prompt` is in API format and inputs match the expected types (e.g., integers vs floats, specific string enums).
4. **OOM (Out Of Memory)**: If Colab runs out of VRAM, check batch sizes, resolution, and whether multiple large models are loaded simultaneously.
5. **Tunnel Death**: If requests timeout completely, the Cloudflare tunnel may have died. Check Colab notebook output.
6. **Root Cause Analysis**: Always find the actual root cause instead of guessing.

## Checklist
- [ ] Check `node_errors` for specific failures.
- [ ] Verify model and custom node existence via `/object_info`.
- [ ] Verify tunnel is alive.
- [ ] Fix the root cause, do not apply blind patches.

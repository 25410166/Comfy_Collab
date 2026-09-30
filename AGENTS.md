# Antigravity Agents Rules for ComfyUI Collab Project

## Architecture Overview
- **Backend & GPU**: ComfyUI runs on Google Colab (GPU Runtime) and is exposed to the internet via a Cloudflare Tunnel.
- **Frontend & Orchestration**: A local web application (React/Vite frontend + Node.js/Express backend).
- **Communication**: The local backend acts as a proxy, sending generation requests to the Colab tunnel URL and streaming WebSocket progress back to the local React frontend.

## Workflow Conventions
- Workflows are saved as `.json` files in `data/workflows/`.
- They must be saved in **API Format** (dictionary of nodes), NOT UI Format.
- During generation, the original workflow JSON is never modified. Instead, the backend injects user parameters (prompt, seed) into a copy of the payload before sending it to ComfyUI.

## Core Principles
1. **Scoped Modifications**: Apply the principle of "small, scoped changes". Do not rewrite entire files or systems if only a small fix is needed.
2. **Verify Before Done**: Never declare a generation task or bug fix complete without running a real test. Send a sample workflow to the Colab endpoint and verify an image is actually produced.
3. **Security**: Do not hardcode tunnel URLs or API keys. Always use `.env` configuration.

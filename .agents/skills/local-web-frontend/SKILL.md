---
name: local-web-frontend
description: Use this skill when building or modifying the local web frontend (React/Vite) that interfaces with the generation backend. Do not use this when modifying Colab scripts.
---

# Local Web Frontend

## Use this skill when
- You are updating React components, state, or styling for the local dashboard.
- You are implementing WebSocket clients to display generation progress.
- You are handling job queues, image galleries, or application settings on the frontend.

## Do not use this skill when
- You are writing backend API routes in Express.
- You are modifying ComfyUI configuration.

## Process
1. **API & Proxy**: The frontend should route ComfyUI requests through the local backend to avoid CORS issues when talking to the Colab tunnel.
2. **WebSockets**: Listen to socket events (`progress`, `status`, etc.) emitted by the local backend to update progress bars and node execution status in real-time.
3. **Disconnections**: Handle tunnel or backend disconnections gracefully. Show clear error states and provide retry/reconnect buttons.
4. **State Management**: Manage the queue of jobs efficiently. Differentiate between `queued`, `executing`, `completed`, and `failed` states.

## Checklist
- [ ] CORS is bypassed via local backend proxy.
- [ ] WebSocket connection displays real-time progress.
- [ ] Network errors and tunnel timeouts show clear, user-friendly messages.
- [ ] Job history and outputs are displayed correctly.

---
name: comfyui-api-integration
description: Use this skill when interacting with the ComfyUI API (e.g., sending prompts, fetching history, handling WebSocket connections, or querying nodes). Do not use this when modifying the local database or frontend code exclusively.
---

# ComfyUI API Integration

## Use this skill when
- You need to interact with a running ComfyUI instance programmatically.
- You are sending generation jobs via `/prompt`.
- You are checking job status or history.
- You are connecting to the ComfyUI WebSocket for progress updates.

## Do not use this skill when
- You are only updating local database schemas.
- You are modifying frontend UI components that do not directly communicate with ComfyUI.

## Process
1. **Ensure API Format**: When sending a workflow payload to `/prompt`, ensure it is in the "API Format" (a dictionary of nodes), not the "UI Format" (a list of nodes with links).
2. **Client ID**: Always pass a `client_id` when calling `/prompt` so you can filter WebSocket messages intended for your session.
3. **Endpoints**:
   - `POST /prompt`: Queue a new generation (payload requires `prompt` and `client_id`).
   - `GET /history/{prompt_id}`: Fetch completed generation outputs.
   - `GET /view?filename=...&subfolder=...&type=...`: Retrieve image/video files.
   - `POST /upload/image`: Upload an image to ComfyUI's input directory.
   - `GET /object_info`: Retrieve available nodes, models, and custom nodes.
   - `GET /queue`: Check currently running and pending jobs.
   - `POST /interrupt`: Stop the current generation.
   - `WebSocket /ws?clientId={client_id}`: Listen for `status`, `progress`, `execution_start`, `executing`, and `execution_error` events.

## Checklist
- [ ] Workflow JSON sent to `/prompt` is validated as API format.
- [ ] `client_id` is generated and used consistently across `/prompt` and WebSocket.
- [ ] Output nodes (e.g., `SaveImage`) have unique prefixes to prevent file overwrites on the server/Drive.
- [ ] WebSocket connection handles reconnects gracefully.

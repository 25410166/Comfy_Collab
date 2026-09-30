---
name: colab-comfyui-runtime
description: Use this skill when managing, configuring, or debugging the ComfyUI Google Colab notebook environment. Do not use this when modifying the local web frontend.
---

# Colab ComfyUI Runtime

## Use this skill when
- You are updating the `ComfyStudio.ipynb` Colab notebook.
- You need to configure Cloudflare tunnels or Ngrok for Colab.
- You are managing model downloads, Google Drive mounting, or Colab GPU resources.

## Do not use this skill when
- You are configuring local Express server logic (unless it directly relates to parsing Colab URLs).
- You are working on local frontend UI.

## Process
1. **Startup Config**: ComfyUI on Colab must be started with `--listen 127.0.0.1` and `--port 8188` (or similar) to bind correctly for the tunnel. If accessed directly via browser/CORS, ensure `--cors-header "*"` is used if needed.
2. **Tunnel**: The tunnel (e.g., cloudflared) exposes the local Colab port to the internet. This URL changes every session.
3. **Dynamic URL**: The local website must provide an easy way (e.g., a settings page) for the user to input or update the current tunnel URL.
4. **Storage**: Mount Google Drive and set the output and models directory to a persistent path in Drive so users don't lose data and models across sessions.
5. **Session Management**: Colab instances can go idle or die. Implement health checks in the local backend to detect tunnel death or timeouts.

## Checklist
- [ ] Colab notebook mounts Google Drive securely.
- [ ] Models and outputs are saved to persistent Drive folders.
- [ ] Cloudflare tunnel URL is clearly printed in the Colab output for the user to copy.
- [ ] Local website allows easy updating of the base URL.

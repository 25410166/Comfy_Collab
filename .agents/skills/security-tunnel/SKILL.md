---
name: security-tunnel
description: Use this skill when dealing with authentication, API keys, or public tunnel URLs.
---

# Security & Tunnels

## Use this skill when
- Configuring Cloudflare, Ngrok, or other tunneling services.
- Passing authentication tokens to ComfyUI.
- Storing secrets or API keys.

## Do not use this skill when
- Styling frontend UI.

## Process
1. **No Hardcoding**: Never hardcode API keys, passwords, or tunnel URLs in the source code or Colab notebook cells.
2. **Environment Variables**: Use `.env` files and environment variables for all secrets.
3. **Tunnel Security**: If exposing ComfyUI publicly via a tunnel, ensure it is protected by authentication if required, or treat the URL as ephemeral and secure.
4. **Git**: Ensure `.env` or any file containing secrets is in `.gitignore` and never committed.

## Checklist
- [ ] No hardcoded secrets in codebase.
- [ ] Environment variables used for configuration.
- [ ] `.gitignore` covers `.env` files.

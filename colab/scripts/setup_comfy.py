#!/usr/bin/env python3
"""
ComfyUI Studio - Colab Setup & Runtime Script
Mounts Drive, restores custom nodes from manifest, symlinks persistent models, and prepares runtime.
"""

import os
import sys
import json
import subprocess
import shutil

DRIVE_BASE = "/content/drive/MyDrive/ComfyStudio"
COMFY_DIR = "/content/ComfyUI"
MANIFEST_FILE = os.path.join(DRIVE_BASE, "runtime-manifest.json")
LOCAL_MANIFEST = "/content/runtime-manifest.json"

def run_cmd(cmd, cwd=None):
    print(f">> {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"Warning: Command '{cmd}' returned exit code {res.returncode}")
    return res.returncode

def setup_environment():
    print("=== Step 1: Checking GPU ===")
    run_cmd("nvidia-smi")

    print("\n=== Step 2: Setting up ComfyUI ===")
    if not os.path.exists(COMFY_DIR):
        run_cmd(f"git clone https://github.com/comfyanonymous/ComfyUI.git {COMFY_DIR}")
        run_cmd("pip install -q torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu124")
        run_cmd(f"pip install -q -r {COMFY_DIR}/requirements.txt")
    else:
        print("ComfyUI already cloned.")

    print("\n=== Step 3: Symlinking Model Directories with Google Drive ===")
    manifest_path = MANIFEST_FILE if os.path.exists(MANIFEST_FILE) else LOCAL_MANIFEST
    manifest = {}
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            try:
                manifest = json.load(f)
            except Exception as e:
                print(f"Failed to parse manifest: {e}")

    model_mappings = [
        ("checkpoints", f"{DRIVE_BASE}/models/checkpoints"),
        ("diffusion_models", f"{DRIVE_BASE}/models/diffusion_models"),
        ("text_encoders", f"{DRIVE_BASE}/models/text_encoders"),
        ("clip", f"{DRIVE_BASE}/models/text_encoders"),
        ("loras", f"{DRIVE_BASE}/models/loras"),
        ("vae", f"{DRIVE_BASE}/models/vae"),
        ("controlnet", f"{DRIVE_BASE}/models/controlnet"),
        ("upscale_models", f"{DRIVE_BASE}/models/upscale_models"),
    ]

    for model_type, drive_dir in model_mappings:
        os.makedirs(drive_dir, exist_ok=True)
        comfy_model_dir = os.path.join(COMFY_DIR, "models", model_type)
        os.makedirs(comfy_model_dir, exist_ok=True)
        print(f"Linked/Configured model folder: {model_type} -> {drive_dir}")

    # Write extra_model_paths.yaml for ComfyUI
    extra_yaml = f"""
colab_drive:
    base_path: {DRIVE_BASE}/models
    checkpoints: checkpoints/
    diffusion_models: diffusion_models/
    unet: diffusion_models/
    text_encoders: text_encoders/
    clip: text_encoders/
    loras: loras/
    vae: vae/
    controlnet: controlnet/
    upscale_models: upscale_models/

colab_drive_legacy:
    base_path: {DRIVE_BASE}/models
    checkpoints: checkpoint/
    loras: lora/
    upscale_models: upscaler/
"""
    with open(os.path.join(COMFY_DIR, "extra_model_paths.yaml"), "w") as f:
        f.write(extra_yaml.strip())
    print("Created extra_model_paths.yaml for Drive persistence.")

    print("\n=== Step 4: Installing Custom Nodes ===")
    custom_nodes_dir = os.path.join(COMFY_DIR, "custom_nodes")
    os.makedirs(custom_nodes_dir, exist_ok=True)

    custom_nodes = manifest.get("customNodes", [
        {"name": "ComfyUI-Manager", "repository": "https://github.com/ltdrdata/ComfyUI-Manager.git"}
    ])

    for node in custom_nodes:
        name = node.get("name")
        repo = node.get("repository")
        dest = os.path.join(custom_nodes_dir, name)
        if not os.path.exists(dest) and repo:
            print(f"Cloning {name}...")
            run_cmd(f"git clone {repo} {dest}")
            req_file = os.path.join(dest, "requirements.txt")
            if os.path.exists(req_file):
                run_cmd(f"pip install -q -r {req_file}")

    print("\n=== Setup Complete! ===")

if __name__ == "__main__":
    setup_environment()

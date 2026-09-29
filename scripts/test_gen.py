import urllib.request
import urllib.parse
import json
import time
import os
import uuid

COMFY_URL = "https://news-hydraulic-drugs-pants.trycloudflare.com"
CLIENT_ID = str(uuid.uuid4())

prompt_workflow = {
    "1": {
        "class_type": "UNETLoader",
        "inputs": {
            "unet_name": "qwen_image_2.1_int8_convrot.safetensors",
            "weight_dtype": "default"
        }
    },
    "2": {
        "class_type": "CLIPLoader",
        "inputs": {
            "clip_name": "qwen3vl_8b_int8_convrot.safetensors",
            "type": "qwen_image",
            "device": "default"
        }
    },
    "3": {
        "class_type": "VAELoader",
        "inputs": {
            "vae_name": "qwen_image_2.1_vae_bf16.safetensors"
        }
    },
    "4": {
        "class_type": "TextEncodeQwenImage21",
        "inputs": {
            "clip": ["2", 0],
            "prompt": "Cinematic portrait of a cyberpunk female warrior with neon blue hair, wearing futuristic tactical armor, glowing cybernetic eye, Tokyo neon street reflections, atmospheric rain, highly detailed, photorealistic 8k, Unreal Engine 5 render",
            "negative_prompt": "ugly, distorted, blurry, low quality, bad anatomy, watermark",
            "resolution": 1024
        }
    },
    "5": {
        "class_type": "EmptyLatentImage",
        "inputs": {
            "width": 1024,
            "height": 1024,
            "batch_size": 1
        }
    },
    "6": {
        "class_type": "KSampler",
        "inputs": {
            "model": ["1", 0],
            "positive": ["4", 0],
            "negative": ["4", 1],
            "latent_image": ["5", 0],
            "seed": 42891234,
            "steps": 25,
            "cfg": 1.0,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1.0
        }
    },
    "7": {
        "class_type": "VAEDecode",
        "inputs": {
            "samples": ["6", 0],
            "vae": ["3", 0]
        }
    },
    "8": {
        "class_type": "SaveImage",
        "inputs": {
            "filename_prefix": "Qwen2.1_Cyberpunk",
            "images": ["7", 0]
        }
    }
}

def queue_prompt():
    print(f"Connecting to ComfyUI at {COMFY_URL}...")
    p = {"prompt": prompt_workflow, "client_id": CLIENT_ID}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(
        f"{COMFY_URL}/prompt",
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            print("Prompt queued successfully!")
            prompt_id = res.get("prompt_id")
            print("Prompt ID:", prompt_id)
            return prompt_id
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8')
        print("HTTP Error:", e.code, err)
        return None

def poll_history(prompt_id):
    print("Waiting for generation to complete on GPU...")
    start_time = time.time()
    while True:
        req = urllib.request.Request(
            f"{COMFY_URL}/history/{prompt_id}",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                history = json.loads(resp.read().decode('utf-8'))
                if prompt_id in history:
                    print("\nGeneration finished on Colab GPU!")
                    outputs = history[prompt_id].get("outputs", {})
                    images = []
                    for node_id, node_output in outputs.items():
                        if "images" in node_output:
                            for img in node_output["images"]:
                                images.append(img)
                    return images
        except Exception as e:
            print("Polling status...", e)

        elapsed = int(time.time() - start_time)
        print(f"Generating... ({elapsed}s elapsed)", end="\r")
        time.sleep(4)

def download_image(img_info, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    filename = img_info["filename"]
    subfolder = img_info.get("subfolder", "")
    img_type = img_info.get("type", "output")
    
    query = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": img_type})
    img_url = f"{COMFY_URL}/view?{query}"
    out_path = os.path.join(output_dir, filename)
    
    print(f"Downloading generated image: {img_url} -> {out_path}")
    req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp, open(out_path, "wb") as f:
        f.write(resp.read())
    print(f"Saved image to: {out_path} ({os.path.getsize(out_path)} bytes)")
    return out_path

if __name__ == "__main__":
    prompt_id = queue_prompt()
    if prompt_id:
        images = poll_history(prompt_id)
        print("Outputs:", images)
        if images:
            output_dir = os.path.abspath("data/outputs")
            for img in images:
                download_image(img, output_dir)

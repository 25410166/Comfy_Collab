import urllib.request
import urllib.parse
import json
import time
import os
import uuid
import websocket

COMFY_URL = "https://news-hydraulic-drugs-pants.trycloudflare.com"
CLIENT_ID = "tester_" + str(uuid.uuid4())[:8]

# Optimized workflow: 768x768, 12 steps for much faster generation on T4
fast_prompt = {
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
            "prompt": "A cute fluffy red panda wearing a tiny wizard hat in an enchanted forest, soft magical glow, highly detailed, photorealistic",
            "negative_prompt": "ugly, blurry, distorted, low quality",
            "resolution": 768
        }
    },
    "5": {
        "class_type": "EmptyLatentImage",
        "inputs": {
            "width": 768,
            "height": 768,
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
            "seed": 999123,
            "steps": 12,
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
            "filename_prefix": "Qwen_FastTest",
            "images": ["7", 0]
        }
    }
}

def run():
    print(f"Connecting to WS at {COMFY_URL}...")
    ws = websocket.WebSocket()
    ws_url = COMFY_URL.replace("https://", "wss://").replace("http://", "ws://") + f"/ws?clientId={CLIENT_ID}"
    ws.connect(ws_url, timeout=30)
    print("WebSocket connected!")

    # Queue prompt
    data = json.dumps({"prompt": fast_prompt, "client_id": CLIENT_ID}).encode('utf-8')
    req = urllib.request.Request(
        f"{COMFY_URL}/prompt",
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        prompt_id = res.get("prompt_id")
        print(f"Queued fast prompt! ID: {prompt_id}")

    # Listen to WebSocket messages
    images = []
    while True:
        try:
            msg = ws.recv()
            if isinstance(msg, str):
                msg_data = json.loads(msg)
                mtype = msg_data.get("type")
                data = msg_data.get("data", {})
                
                if mtype == "executing":
                    node = data.get("node")
                    if node is None and data.get("prompt_id") == prompt_id:
                        print("\nExecution complete!")
                        break
                    else:
                        print(f"\n[Executing Node {node}]", end="", flush=True)
                elif mtype == "progress":
                    val = data.get("value")
                    max_val = data.get("max")
                    print(f" -> Step {val}/{max_val} ({int(val/max_val*100)}%)", end="", flush=True)
                elif mtype == "execution_error":
                    print(f"\nExecution error: {data}")
                    break
        except Exception as e:
            print("WS loop err:", e)
            break

    # Get history and download
    history_req = urllib.request.Request(f"{COMFY_URL}/history/{prompt_id}", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(history_req, timeout=15) as resp:
        history = json.loads(resp.read().decode('utf-8'))
        outputs = history.get(prompt_id, {}).get("outputs", {})
        for node_id, node_output in outputs.items():
            if "images" in node_output:
                for img in node_output["images"]:
                    fn = img["filename"]
                    sub = img.get("subfolder", "")
                    img_type = img.get("type", "output")
                    q = urllib.parse.urlencode({"filename": fn, "subfolder": sub, "type": img_type})
                    img_url = f"{COMFY_URL}/view?{q}"
                    os.makedirs("data/outputs", exist_ok=True)
                    out_file = os.path.join("data/outputs", fn)
                    print(f"\nDownloading: {img_url} -> {out_file}")
                    req_dl = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req_dl) as r, open(out_file, "wb") as f:
                        f.write(r.read())
                    print(f"Saved: {out_file} ({os.path.getsize(out_file)} bytes)")

if __name__ == "__main__":
    run()

import json
import os

cells = []

# Cell 1: Markdown
cell1_markdown = """# 🎨 ComfyUI Studio - Google Colab Runtime

Notebook này cấu hình môi trường Google Colab thành GPU Runtime hiệu năng cao cho **ComfyUI Studio**:
- 💾 **Lưu trữ bền vững trên Google Drive** (`MyDrive/ComfyStudio/models`): tải một lần, lần sau mở lên dùng ngay, không mất thời gian tải lại.
- ⚡ **Tự động kiểm tra & bỏ qua (Skip)** nếu file model đã tồn tại trên Drive.
- 🖼️ **Tải sẵn bộ Model Qwen-Image-2.1** (INT8 Diffusion, INT8 Text Encoder Qwen3-VL 8B, BF16 VAE) có thanh tiến trình hiển thị % chi tiết.
- 🎛️ **Giao diện UI Dropdown tương tác**: Dễ dàng tải thêm Model, LoRA, VAE, ControlNet... vào đúng thư mục lưu trữ.
- 🌐 **Mở cổng Cloudflare Tunnel** kết nối trực tiếp đến ComfyUI Studio.
"""

cells.append({
    "cell_type": "markdown",
    "metadata": {},
    "source": [line + "\n" for line in cell1_markdown.split("\n")]
})

# Cell 2: Step 1: Mount Google Drive & Khởi tạo Thư mục Models
cell2_code = """#@title 1. Kết nối Google Drive & Khởi tạo Thư mục Models
import os
import shutil
from google.colab import drive

# 1. Mount Google Drive
print("🚀 Đang kết nối Google Drive...")
drive.mount('/content/drive')

DRIVE_BASE = "/content/drive/MyDrive/ComfyStudio"
DRIVE_MODELS = os.path.join(DRIVE_BASE, "models")
DRIVE_OUTPUTS = os.path.join(DRIVE_BASE, "outputs")
os.makedirs(DRIVE_OUTPUTS, exist_ok=True)

# Các danh mục model chuẩn của ComfyUI
MODEL_CATEGORIES = [
    "checkpoints",
    "diffusion_models",
    "text_encoders",
    "clip",
    "loras",
    "vae",
    "controlnet",
    "upscale_models",
    "embeddings"
]

print(f"📁 Thư mục lưu ảnh tự động trên Google Drive: {DRIVE_OUTPUTS}")
print("📁 Khởi tạo cấu trúc thư mục lưu trữ models trên Google Drive...")
for cat in MODEL_CATEGORIES:
    path = os.path.join(DRIVE_MODELS, cat)
    os.makedirs(path, exist_ok=True)

# Tạo alias tương thích ngược (checkpoint <-> checkpoints, lora <-> loras, upscaler <-> upscale_models)
legacy_aliases = [
    ("checkpoint", "checkpoints"),
    ("lora", "loras"),
    ("upscaler", "upscale_models")
]
for old_name, new_name in legacy_aliases:
    old_p = os.path.join(DRIVE_MODELS, old_name)
    new_p = os.path.join(DRIVE_MODELS, new_name)
    if not os.path.exists(old_p) and os.path.exists(new_p):
        try:
            os.symlink(new_p, old_p)
        except Exception:
            pass

# Kiểm tra dung lượng Google Drive
try:
    total, used, free = shutil.disk_usage(DRIVE_BASE)
    print(f"✅ Google Drive đã kết nối thành công tại: {DRIVE_BASE}")
    print(f"📊 Dung lượng Drive: Đã dùng {used // (2**30)} GB / Tổng {total // (2**30)} GB (Còn trống {free // (2**30)} GB)")
except Exception as e:
    print(f"✅ Google Drive đã kết nối: {DRIVE_BASE}")
"""

cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + "\n" for line in cell2_code.strip().split("\n")]
})

# Cell 3: Step 2: Cài đặt ComfyUI & Cấu hình đường dẫn Models
cell3_code = """#@title 2. Cài đặt ComfyUI & Cấu hình đường dẫn Models
import os
import subprocess
import time

COMFY_DIR = "/content/ComfyUI"

# 1. Clone ComfyUI với depth=1 để tối ưu tốc độ
if not os.path.exists(COMFY_DIR):
    print("🚀 Đang clone ComfyUI (phiên bản mới nhất)...")
    !git clone --depth=1 https://github.com/comfyanonymous/ComfyUI.git /content/ComfyUI
else:
    print("ℹ️ ComfyUI đã có sẵn tại /content/ComfyUI.")

%cd /content/ComfyUI

# 2. Cài đặt PyTorch, requirements và các công cụ download
print("📦 Đang cài đặt PyTorch và thư viện phụ trợ...")
!pip install -q torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu124
!pip install -q -r requirements.txt
!pip install -q huggingface_hub tqdm requests ipywidgets

# 3. Tạo cấu hình extra_model_paths.yaml để ComfyUI tự nhận diện toàn bộ models trong Google Drive
extra_paths_config = \"\"\"
colab_drive:
    base_path: /content/drive/MyDrive/ComfyStudio/models
    checkpoints: checkpoints/
    diffusion_models: diffusion_models/
    unet: diffusion_models/
    text_encoders: text_encoders/
    clip: text_encoders/
    loras: loras/
    vae: vae/
    controlnet: controlnet/
    upscale_models: upscale_models/
    embeddings: embeddings/

colab_drive_legacy:
    base_path: /content/drive/MyDrive/ComfyStudio/models
    checkpoints: checkpoint/
    loras: lora/
    upscale_models: upscaler/
\"\"\"
with open('/content/ComfyUI/extra_model_paths.yaml', 'w') as f:
    f.write(extra_paths_config.strip())

# 4. Khởi tạo sẵn tất cả thư mục models bên trong ComfyUI
subdirs = [
    "checkpoints", "diffusion_models", "text_encoders", "clip",
    "loras", "vae", "controlnet", "upscale_models", "embeddings"
]
for s in subdirs:
    os.makedirs(f"/content/ComfyUI/models/{s}", exist_ok=True)

# 5. Cài đặt ComfyUI-Manager
if not os.path.exists("/content/ComfyUI/custom_nodes/ComfyUI-Manager"):
    print("🔌 Đang cài đặt ComfyUI-Manager...")
    !git clone --depth=1 https://github.com/ltdrdata/ComfyUI-Manager.git /content/ComfyUI/custom_nodes/ComfyUI-Manager
else:
    print("ℹ️ ComfyUI-Manager đã sẵn sàng.")

print("\\n✅ Cài đặt ComfyUI & cấu hình liên kết Google Drive thành công!")
"""

cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + "\n" for line in cell3_code.strip().split("\n")]
})

# Cell 3A: Step 3: Tải Bộ Model Siêu Tốc: SDXL Lightning/Turbo + Realistic + VAE + LoRA + ControlNet + Upscaler
cell_realistic_code = """#@title 3. Tải Bộ Model Siêu Tốc (Lightning 2s, Turbo 1s, Realistic 5-20s)
#@markdown Tải trọn bộ model chuyên nghiệp cho tạo ảnh siêu nhanh và chất lượng cao:
#@markdown - ⚡⚡ **SDXL Lightning 4-Step** (ByteDance): `checkpoints/sdxl_lightning_4step.safetensors` (~6.5 GB) - **Gen 1 ảnh chỉ 2 giây!**
#@markdown - ⚡⚡ **SDXL Turbo** (Stability AI): `checkpoints/sd_xl_turbo_1.0_fp16.safetensors` (~3.3 GB) - **Gen 1 ảnh chỉ 1 giây!** (512x512)
#@markdown - ⚡ **RealVisXL V4.0 (SDXL)**: `checkpoints/realvisxlV40_v40Bakedvae.safetensors` (~6.6 GB) - Chất lượng cao nhất 15-20s.
#@markdown - ⚡ **Realistic Vision V6.0 (SD1.5)**: `checkpoints/realisticVisionV60B1_v51VAE.safetensors` (~2.1 GB) - 5-8s.
#@markdown - 🎛️ **SDXL VAE Fix** + **4x-UltraSharp** + **LoRA Add-Detail-XL** + **ControlNet OpenPose**
#@markdown
#@markdown *Chỉ tải 1 lần vào Google Drive. Các lần sau tự bỏ qua.*

import os
import sys
import inspect
from huggingface_hub import hf_hub_download

DRIVE_DIR = "/content/drive/MyDrive/ComfyStudio/models"
COMFY_DIR = "/content/ComfyUI/models"
has_drive = os.path.exists(DRIVE_DIR)
TARGET_BASE = DRIVE_DIR if has_drive else COMFY_DIR

FAST_REALISTIC_MODELS = [
    {
        "desc": "1. SDXL Lightning 4-Step (ByteDance) - Gen 2 giây!",
        "repo_id": "ByteDance/SDXL-Lightning",
        "category": "checkpoints",
        "rel_path": "sdxl_lightning_4step.safetensors",
        "basename": "sdxl_lightning_4step.safetensors",
        "min_size_mb": 5000
    },
    {
        "desc": "2. SDXL Turbo FP16 (Stability AI) - Gen 1 giây!",
        "repo_id": "stabilityai/sdxl-turbo",
        "category": "checkpoints",
        "rel_path": "sd_xl_turbo_1.0_fp16.safetensors",
        "basename": "sd_xl_turbo_1.0_fp16.safetensors",
        "min_size_mb": 3000
    },
    {
        "desc": "3. SDXL Realistic Checkpoint: RealVisXL V4.0 (Render 15-20s)",
        "repo_id": "SG161222/RealVisXL_V4.0",
        "category": "checkpoints",
        "rel_path": "RealVisXL_V4.0.safetensors",
        "basename": "realvisxlV40_v40Bakedvae.safetensors",
        "min_size_mb": 5000
    },
    {
        "desc": "4. SD1.5 Checkpoint: Realistic Vision V5.1/V6.0 (Render 5s)",
        "repo_id": "SG161222/Realistic_Vision_V5.1_noVAE",
        "category": "checkpoints",
        "rel_path": "Realistic_Vision_V5.1_fp16-no-ema.safetensors",
        "basename": "realisticVisionV60B1_v51VAE.safetensors",
        "min_size_mb": 1800
    },
    {
        "desc": "5. SDXL VAE (Khử mờ & cân chỉnh màu)",
        "repo_id": "stabilityai/sdxl-vae",
        "category": "vae",
        "rel_path": "sdxl_vae.safetensors",
        "basename": "sdxl_vae.safetensors",
        "min_size_mb": 200
    },
    {
        "desc": "6. AI Upscaler 4x-UltraSharp (Nâng nét ảnh 4k)",
        "repo_id": "lokcx/4x-Ultrasharp",
        "category": "upscale_models",
        "rel_path": "4x-UltraSharp.pth",
        "basename": "4x-UltraSharp.pth",
        "min_size_mb": 50
    },
    {
        "desc": "7. LoRA Add-Detail-XL (Tăng chi tiết da, mắt, tóc)",
        "repo_id": "OedoSoldier/detail-tweaker-lora",
        "category": "loras",
        "rel_path": "add-detail-xl.safetensors",
        "basename": "add-detail-xl.safetensors",
        "min_size_mb": 30
    },
    {
        "desc": "8. ControlNet OpenPose (Kiểm soát dáng người mẫu)",
        "repo_id": "lllyasviel/ControlNet-v1-1",
        "category": "controlnet",
        "rel_path": "control_v11p_sd15_openpose.pth",
        "basename": "control_v11p_sd15_openpose.pth",
        "min_size_mb": 1000
    }
]

print(f"🎯 Vị trí lưu trữ: {TARGET_BASE} (Google Drive bền vững)")

for item in FAST_REALISTIC_MODELS:
    desc = item["desc"]
    repo_id = item["repo_id"]
    category = item["category"]
    rel_path = item["rel_path"]
    basename = item["basename"]
    min_bytes = item["min_size_mb"] * 1024 * 1024

    drive_file = os.path.join(DRIVE_DIR, category, basename) if has_drive else None
    comfy_file = os.path.join(COMFY_DIR, category, basename)

    # 1. Kiểm tra nếu đã có trên Google Drive
    if drive_file and os.path.exists(drive_file) and os.path.getsize(drive_file) >= min_bytes:
        size_gb = os.path.getsize(drive_file) / (1024 ** 3)
        print(f"⏭️  [ĐÃ CÓ TRÊN DRIVE] {desc} ({size_gb:.2f} GB) -> BỎ QUA TẢI LẠI.")
        if not os.path.exists(comfy_file):
            try:
                os.makedirs(os.path.dirname(comfy_file), exist_ok=True)
                os.symlink(drive_file, comfy_file)
                print(f"    🔗 Đã liên kết symlink sang ComfyUI: {comfy_file}")
            except Exception:
                pass
        continue

    # 2. Kiểm tra nếu đã có trên local ComfyUI
    if os.path.exists(comfy_file) and os.path.getsize(comfy_file) >= min_bytes:
        size_gb = os.path.getsize(comfy_file) / (1024 ** 3)
        print(f"⏭️  [ĐÃ CÓ TRÊN COMFYUI] {desc} ({size_gb:.2f} GB) -> BỎ QUA TẢI LẠI.")
        continue

    # 3. Tải từ HuggingFace
    print(f"\\n⬇️  Đang tải {desc}...")
    print(f"   Repo: {repo_id}/{rel_path} -> {category}/{basename}")

    dest_dir = os.path.join(TARGET_BASE, category)
    os.makedirs(dest_dir, exist_ok=True)

    try:
        download_kwargs = {
            "repo_id": repo_id,
            "filename": rel_path,
            "local_dir": dest_dir
        }
        sig = inspect.signature(hf_hub_download).parameters
        if "local_dir_use_symlinks" in sig:
            download_kwargs["local_dir_use_symlinks"] = False

        downloaded_path = hf_hub_download(**download_kwargs)
        final_target = os.path.join(dest_dir, basename)
        if downloaded_path != final_target and os.path.exists(downloaded_path):
            if os.path.exists(final_target):
                os.remove(final_target)
            os.rename(downloaded_path, final_target)

        print(f"✅ Đã tải xong: {desc}")

        if has_drive and os.path.exists(drive_file) and not os.path.exists(comfy_file):
            try:
                os.makedirs(os.path.dirname(comfy_file), exist_ok=True)
                os.symlink(drive_file, comfy_file)
                print(f"   🔗 Đã liên kết symlink sang ComfyUI: {comfy_file}")
            except Exception:
                pass
    except Exception as e:
        print(f"⚠️ Không tải được {basename}: {e}")

print("\\n🎉 Hoàn thành kiểm tra & tải bộ Model Siêu Tốc (SDXL, SD1.5, VAE, LoRA, Upscaler)!")
"""

cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + "\n" for line in cell_realistic_code.strip().split("\n")]
})

# Cell 4: Step 3B: Tải bộ Model Qwen-Image-2.1 (Tùy chọn - Dành cho ai muốn dùng Qwen)
cell4_code = """#@title 3B. Tải bộ Model Qwen-Image-2.1 (Tùy chọn - Dành cho ai muốn dùng Qwen)
#@markdown Tải bộ 3 model Qwen-Image-2.1 phục vụ workflow Text-to-Image (Lưu ý: Model nặng 30GB, gen ~20p):
#@markdown - 1. **Diffusion Model (INT8)**: `diffusion_models/qwen_image_2.1_int8_convrot.safetensors` (~12.3 GB)
#@markdown - 2. **Text Encoder Qwen3-VL 8B (INT8)**: `text_encoders/qwen3vl_8b_int8_convrot.safetensors` (~8.8 GB)
#@markdown - 3. **VAE (BF16)**: `vae/qwen_image_2.1_vae_bf16.safetensors` (~254 MB)
#@markdown
#@markdown *Tiến trình hiển thị % dung lượng tải thực tế. Nếu file đã có trên Drive sẽ tự động bỏ qua.*

import os
import sys
import inspect
from huggingface_hub import hf_hub_download

DRIVE_DIR = "/content/drive/MyDrive/ComfyStudio/models"
COMFY_DIR = "/content/ComfyUI/models"
has_drive = os.path.exists(DRIVE_DIR)

# Danh sách 3 model cần tải theo cấu trúc chuẩn ComfyUI
QWEN_MODELS = [
    {
        "desc": "1. Diffusion Model (INT8)",
        "repo_id": "Comfy-Org/Qwen-Image-2.1",
        "category": "diffusion_models",
        "rel_path": "diffusion_models/qwen_image_2.1_int8_convrot.safetensors",
        "basename": "qwen_image_2.1_int8_convrot.safetensors",
        "min_size_mb": 5000 # tối thiểu ~5GB
    },
    {
        "desc": "2. Text Encoder Qwen3-VL 8B (INT8)",
        "repo_id": "Comfy-Org/Qwen-Image-2.1",
        "category": "text_encoders",
        "rel_path": "text_encoders/qwen3vl_8b_int8_convrot.safetensors",
        "basename": "qwen3vl_8b_int8_convrot.safetensors",
        "min_size_mb": 4000 # tối thiểu ~4GB
    },
    {
        "desc": "3. VAE (BF16)",
        "repo_id": "Comfy-Org/Qwen-Image-2.1",
        "category": "vae",
        "rel_path": "vae/qwen_image_2.1_vae_bf16.safetensors",
        "basename": "qwen_image_2.1_vae_bf16.safetensors",
        "min_size_mb": 100 # tối thiểu ~100MB
    }
]

# Thư mục gốc lưu trữ: ưu tiên Google Drive để lần sau không phải tải lại
TARGET_BASE = DRIVE_DIR if has_drive else COMFY_DIR
print(f"🎯 Vị trí lưu trữ mục tiêu: {TARGET_BASE}")
if has_drive:
    print("💡 Đã phát hiện Google Drive. Model sẽ được lưu vào Drive để dùng vĩnh viễn!")
else:
    print("⚠️ Chưa mount Google Drive! Model sẽ được lưu tạm thời trên Colab.")

for item in QWEN_MODELS:
    desc = item["desc"]
    repo_id = item["repo_id"]
    category = item["category"]
    rel_path = item["rel_path"]
    basename = item["basename"]
    min_bytes = item["min_size_mb"] * 1024 * 1024

    drive_file = os.path.join(DRIVE_DIR, category, basename) if has_drive else None
    comfy_file = os.path.join(COMFY_DIR, category, basename)

    # 1. Kiểm tra nếu đã có trên Google Drive
    if drive_file and os.path.exists(drive_file) and os.path.getsize(drive_file) >= min_bytes:
        size_gb = os.path.getsize(drive_file) / (1024 ** 3)
        print(f"⏭️  [ĐÃ CÓ TRÊN DRIVE] {desc} ({size_gb:.2f} GB) -> BỎ QUA TẢI LẠI.")
        # Đảm bảo ComfyUI có symlink đến file trong Drive
        if not os.path.exists(comfy_file):
            try:
                os.makedirs(os.path.dirname(comfy_file), exist_ok=True)
                os.symlink(drive_file, comfy_file)
                print(f"    🔗 Đã liên kết symlink sang ComfyUI: {comfy_file}")
            except Exception:
                pass
        continue

    # 2. Kiểm tra nếu đã có trên local ComfyUI
    if os.path.exists(comfy_file) and os.path.getsize(comfy_file) >= min_bytes:
        size_gb = os.path.getsize(comfy_file) / (1024 ** 3)
        print(f"⏭️  [ĐÃ CÓ TRÊN COMFYUI] {desc} ({size_gb:.2f} GB) -> BỎ QUA TẢI LẠI.")
        continue

    # 3. Tải model với tiến trình % (tqdm/huggingface_hub)
    print(f"\\n⬇️  Đang tải {desc}: {basename}...")
    print(f"   Repo: {repo_id} | Thư mục đích: {category}/")

    # Xác định tham số tương thích cho hf_hub_download
    download_kwargs = {
        "repo_id": repo_id,
        "filename": rel_path,
        "local_dir": TARGET_BASE
    }
    sig = inspect.signature(hf_hub_download).parameters
    if "local_dir_use_symlinks" in sig:
        download_kwargs["local_dir_use_symlinks"] = False

    # Thực hiện tải (có hiển thị % tiến trình, dung lượng và tốc độ MB/s qua tqdm)
    downloaded_path = hf_hub_download(**download_kwargs)
    print(f"✅ Đã tải xong: {desc}")

    # Nếu tải vào Drive, tạo symlink sang ComfyUI để ComfyUI thấy ngay lập tức
    if has_drive and os.path.exists(drive_file) and not os.path.exists(comfy_file):
        try:
            os.makedirs(os.path.dirname(comfy_file), exist_ok=True)
            os.symlink(drive_file, comfy_file)
            print(f"   🔗 Đã liên kết symlink sang ComfyUI: {comfy_file}")
        except Exception:
            pass

print(\"\\n🎉 Hoàn thành kiểm tra & tải trọn bộ model Qwen-Image-2.1!\")
"""

cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + "\n" for line in cell4_code.strip().split("\n")]
})

# Cell 5: Step 4: Giao diện UI Dropdown để tải thêm Model, LoRA, VAE...
cell5_code = """#@title 4. Giao diện Tải Models / LoRA / VAE theo yêu cầu (Interactive Dropdown UI)
#@markdown Chọn loại model từ dropdown, chọn mẫu có sẵn hoặc dán link HuggingFace/Civitai/Direct URL để tải vào đúng thư mục ComfyUI & Google Drive.

import os
import re
import sys
import time
import inspect
import requests
import shutil
from urllib.parse import urlparse
from tqdm.auto import tqdm
import ipywidgets as widgets
from IPython.display import display, clear_output
from huggingface_hub import hf_hub_download

# Form parameters (hỗ trợ chế độ Form của Google Colab)
quick_preset = "-- Tự nhập link hoặc HuggingFace Repo --" #@param ["-- Tự nhập link hoặc HuggingFace Repo --", "[Qwen 2.1] Trọn bộ 3 Model (Diffusion INT8 + Qwen3-VL 8B + VAE)", "[Qwen 2.1] Diffusion Model INT8", "[Qwen 2.1] Text Encoder Qwen3-VL 8B INT8", "[Qwen 2.1] VAE (BF16)", "[Flux.1] FLUX.1-schnell (fp8 diffusion model)", "[SDXL] SDXL Base 1.0 (safetensors)", "[SDXL] Juggernaut XL v9", "[Upscaler] 4x-UltraSharp", "[Upscaler] 4x_NMKD-Superscale-SP_178000_G"]
model_category = "diffusion_models" #@param ["checkpoints", "diffusion_models", "text_encoders", "loras", "vae", "controlnet", "upscale_models", "embeddings"]
source_url_or_repo = "" #@param {type:"string"}
file_path_in_repo = "" #@param {type:"string"}
save_to_drive = True #@param {type:"boolean"}
huggingface_token = "" #@param {type:"string"}

DRIVE_DIR = "/content/drive/MyDrive/ComfyStudio/models"
COMFY_DIR = "/content/ComfyUI/models"
has_drive = os.path.exists(DRIVE_DIR)

# 1. Định nghĩa danh mục chuẩn & Preset phổ biến
CATEGORIES = [
    ("checkpoints (Base Models: SD1.5, SDXL, Illustrious)", "checkpoints"),
    ("diffusion_models (UNET / Qwen / Flux / SD3)", "diffusion_models"),
    ("loras (LoRA / LyCORIS)", "loras"),
    ("text_encoders (CLIP / T5 / Qwen3-VL)", "text_encoders"),
    ("vae (VAE Models)", "vae"),
    ("controlnet (ControlNet / T2I-Adapter)", "controlnet"),
    ("upscale_models (Upscalers / ESRGAN)", "upscale_models"),
    ("embeddings (Textual Inversion)", "embeddings")
]

PRESETS = {
    "-- Tự nhập link hoặc HuggingFace Repo --": {
        "category": "diffusion_models", "source": "", "filename": ""
    },
    "[Qwen 2.1] Trọn bộ 3 Model (Diffusion INT8 + Qwen3-VL 8B + VAE)": {
        "special": "qwen_bundle"
    },
    "[Qwen 2.1] Diffusion Model INT8": {
        "category": "diffusion_models",
        "source": "Comfy-Org/Qwen-Image-2.1",
        "filename": "diffusion_models/qwen_image_2.1_int8_convrot.safetensors"
    },
    "[Qwen 2.1] Text Encoder Qwen3-VL 8B INT8": {
        "category": "text_encoders",
        "source": "Comfy-Org/Qwen-Image-2.1",
        "filename": "text_encoders/qwen3vl_8b_int8_convrot.safetensors"
    },
    "[Qwen 2.1] VAE (BF16)": {
        "category": "vae",
        "source": "Comfy-Org/Qwen-Image-2.1",
        "filename": "vae/qwen_image_2.1_vae_bf16.safetensors"
    },
    "[Flux.1] FLUX.1-schnell (fp8 diffusion model)": {
        "category": "diffusion_models",
        "source": "black-forest-labs/FLUX.1-schnell",
        "filename": "flux1-schnell.safetensors"
    },
    "[SDXL] SDXL Base 1.0 (safetensors)": {
        "category": "checkpoints",
        "source": "stabilityai/stable-diffusion-xl-base-1.0",
        "filename": "sd_xl_base_1.0.safetensors"
    },
    "[SDXL] Juggernaut XL v9": {
        "category": "checkpoints",
        "source": "RunDiffusion/Juggernaut-XL-v9",
        "filename": "Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors"
    },
    "[Upscaler] 4x-UltraSharp": {
        "category": "upscale_models",
        "source": "https://huggingface.co/lokcx/4x-Ultrasharp/resolve/main/4x-UltraSharp.pth",
        "filename": "4x-UltraSharp.pth"
    },
    "[Upscaler] 4x_NMKD-Superscale-SP_178000_G": {
        "category": "upscale_models",
        "source": "https://huggingface.co/uwg/upscaler/resolve/main/ESRGAN/4x_NMKD-Superscale-SP_178000_G.pth",
        "filename": "4x_NMKD-Superscale-SP_178000_G.pth"
    }
}

# 2. Xây dựng giao diện tương tác (ipywidgets)
style = {'description_width': '160px'}
layout = widgets.Layout(width='620px')

w_preset = widgets.Dropdown(
    options=list(PRESETS.keys()),
    value=quick_preset if quick_preset in PRESETS else list(PRESETS.keys())[0],
    description='Mẫu có sẵn (Preset):',
    style=style, layout=layout
)

w_category = widgets.Dropdown(
    options=CATEGORIES,
    value=model_category,
    description='Loại Model (Folder):',
    style=style, layout=layout
)

w_source = widgets.Text(
    value=source_url_or_repo,
    placeholder='Ví dụ: Comfy-Org/Qwen-Image-2.1 hoặc https://.../model.safetensors',
    description='URL / HF Repo:',
    style=style, layout=layout
)

w_filename = widgets.Text(
    value=file_path_in_repo,
    placeholder='Ví dụ: model.safetensors (nếu để trống tự trích xuất từ URL)',
    description='File / Đường dẫn:',
    style=style, layout=layout
)

w_token = widgets.Password(
    value=huggingface_token,
    placeholder='hf_... (chỉ cần khi tải model giới hạn như FLUX.1-dev)',
    description='HF Token (tùy chọn):',
    style=style, layout=layout
)

w_save_drive = widgets.Checkbox(
    value=save_to_drive and has_drive,
    description='Lưu vào Google Drive (Persistent - lần sau không cần tải lại)',
    disabled=not has_drive,
    style=style
)

btn_download = widgets.Button(
    description='⬇️ Tải xuống Model',
    button_style='primary',
    icon='download',
    layout=widgets.Layout(width='220px', height='38px', margin='10px 0 0 160px')
)

w_progress = widgets.FloatProgress(
    value=0, min=0, max=100,
    description='Tiến trình:',
    bar_style='info',
    style=style,
    layout=widgets.Layout(width='620px', display='none')
)

w_status = widgets.HTML(value='')
w_output = widgets.Output()

def on_preset_change(change):
    preset_name = change['new']
    info = PRESETS.get(preset_name, {})
    if "special" in info and info["special"] == "qwen_bundle":
        w_source.value = "Comfy-Org/Qwen-Image-2.1 (Trọn bộ 3 model)"
        w_filename.value = "Tải toàn bộ: Diffusion + Text Encoder + VAE"
        w_category.value = "diffusion_models"
    elif "category" in info:
        w_category.value = info["category"]
        w_source.value = info["source"]
        w_filename.value = info["filename"]

w_preset.observe(on_preset_change, names='value')

# Hàm tải trực tiếp qua HTTP Streaming kèm thanh % tiến trình
def download_stream_url(url, dest_path, progress_widget, status_widget, desc="Model"):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    temp_path = dest_path + ".tmp"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    try:
        response = requests.get(url, stream=True, allow_redirects=True, headers=headers)
        response.raise_for_status()
        total_size = int(response.headers.get('content-length', 0))

        progress_widget.layout.display = 'block'
        progress_widget.value = 0

        downloaded = 0
        chunk_size = 1024 * 1024 * 2 # 2MB mỗi chunk
        start_time = time.time()

        with open(temp_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        pct = (downloaded / total_size) * 100
                        progress_widget.value = pct
                        elapsed = time.time() - start_time
                        speed_mb = (downloaded / (1024 * 1024)) / (elapsed if elapsed > 0 else 1)
                        status_widget.value = f"<b>Đang tải:</b> {pct:.1f}% ({downloaded/(1024**3):.2f} GB / {total_size/(1024**3):.2f} GB) - Tốc độ: <b>{speed_mb:.1f} MB/s</b>"

        os.replace(temp_path, dest_path)
        progress_widget.value = 100
        status_widget.value = f"<span style='color:green;'><b>✅ Tải thành công:</b> {os.path.basename(dest_path)} ({downloaded/(1024**3):.2f} GB)</span>"
        return dest_path
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise e

# Xử lý sự kiện nhấn nút Tải
def on_btn_download_clicked(b):
    with w_output:
        clear_output()
        preset_name = w_preset.value
        info = PRESETS.get(preset_name, {})

        if info.get("special") == "qwen_bundle":
            w_status.value = "<b>Đang chọn trọn bộ Qwen-Image-2.1. Vui lòng chạy ô Code '3. Tải bộ Model Qwen-Image-2.1' ở trên!</b>"
            print("💡 Hãy chạy ô Code số 3 phía trên để tự động tải và kiểm tra toàn bộ 3 model Qwen-Image-2.1.")
            return

        source = w_source.value.strip()
        filename = w_filename.value.strip()
        category = w_category.value
        save_drive = w_save_drive.value
        token = w_token.value.strip() or None

        if not source:
            w_status.value = "<span style='color:red;'>⚠️ Vui lòng nhập URL hoặc HuggingFace Repo!</span>"
            return

        if not filename:
            if "http://" in source or "https://" in source:
                filename = os.path.basename(urlparse(source).path)
            else:
                w_status.value = "<span style='color:red;'>⚠️ Vui lòng chỉ định tên file trong repo!</span>"
                return

        basename = os.path.basename(filename)
        dest_base = DRIVE_DIR if (save_drive and has_drive) else COMFY_DIR
        dest_category_dir = os.path.join(dest_base, category)
        final_file = os.path.join(dest_category_dir, basename)
        comfy_file = os.path.join(COMFY_DIR, category, basename)

        # Kiểm tra nếu file đã có trên Drive hoặc ComfyUI
        if os.path.exists(final_file) and os.path.getsize(final_file) > 1024 * 1024:
            size_gb = os.path.getsize(final_file) / (1024 ** 3)
            w_status.value = f"<span style='color:#097969;'><b>⏭️ File đã tồn tại:</b> {basename} ({size_gb:.2f} GB) tại {category}/. Bỏ qua không tải lại!</span>"
            if not os.path.exists(comfy_file):
                try:
                    os.symlink(final_file, comfy_file)
                except Exception:
                    pass
            return

        w_progress.layout.display = 'block'
        w_progress.value = 0
        w_status.value = f"<b>🚀 Bắt đầu tải {basename}...</b>"
        btn_download.disabled = True

        try:
            # Tải qua Direct HTTP URL
            if source.startswith("http://") or source.startswith("https://"):
                download_stream_url(source, final_file, w_progress, w_status, desc=basename)

            # Tải qua HuggingFace Hub
            else:
                w_status.value = f"<b>Đang tải từ HuggingFace Hub ({source})... Theo dõi tiến trình bên dưới:</b>"
                download_kwargs = {
                    "repo_id": source,
                    "filename": filename,
                    "local_dir": dest_base,
                    "token": token
                }
                sig = inspect.signature(hf_hub_download).parameters
                if "local_dir_use_symlinks" in sig:
                    download_kwargs["local_dir_use_symlinks"] = False

                downloaded = hf_hub_download(**download_kwargs)
                if os.path.exists(downloaded) and downloaded != final_file:
                    os.makedirs(dest_category_dir, exist_ok=True)
                    if not os.path.exists(final_file):
                        shutil.move(downloaded, final_file)

                w_progress.value = 100
                size_gb = os.path.getsize(final_file) / (1024 ** 3) if os.path.exists(final_file) else 0
                w_status.value = f"<span style='color:green;'><b>✅ Đã tải xong:</b> {basename} ({size_gb:.2f} GB) vào <code>{category}/</code></span>"

            # Tạo symlink sang ComfyUI nếu tải vào Google Drive
            if save_drive and has_drive and os.path.exists(final_file) and not os.path.exists(comfy_file):
                try:
                    os.makedirs(os.path.dirname(comfy_file), exist_ok=True)
                    os.symlink(final_file, comfy_file)
                    print(f"🔗 Đã tạo symlink sang ComfyUI: {comfy_file}")
                except Exception:
                    pass

            print(f"🎉 Hoàn thành! File '{basename}' đã sẵn sàng trong ComfyUI ({category}).")

        except Exception as e:
            w_status.value = f"<span style='color:red;'><b>❌ Lỗi khi tải:</b> {str(e)}</span>"
            print(f"Lỗi: {e}")
        finally:
            btn_download.disabled = False

btn_download.on_click(on_btn_download_clicked)

# Render giao diện
ui = widgets.VBox([
    widgets.HTML("<h3>🎛️ Bảng điều khiển Tải Model ComfyUI</h3><p style='color:gray;'>Chọn danh mục, preset hoặc nhập link để lưu thẳng vào Google Drive và ComfyUI.</p>"),
    w_preset,
    w_category,
    w_source,
    w_filename,
    w_token,
    w_save_drive,
    btn_download,
    w_progress,
    w_status,
    w_output
])
display(ui)
"""

cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + "\n" for line in cell5_code.strip().split("\n")]
})

# Cell 6: Step 5: Khởi chạy ComfyUI & Mở Cloudflare Tunnel
cell6_code = """#@title 5. Khởi chạy ComfyUI & Mở Cloudflare Tunnel
#@markdown Khởi chạy ComfyUI dưới nền và tạo đường dẫn Cloudflare Tunnel để kết nối với ComfyUI Studio.

import subprocess
import time
import re
import os

# 1. Cài đặt cloudflared nếu chưa có
if not os.path.exists("/usr/local/bin/cloudflared") and not os.path.exists("/usr/bin/cloudflared"):
    print("🌐 Đang cài đặt Cloudflared...")
    !wget -q -nc https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    !dpkg -i cloudflared-linux-amd64.deb > /dev/null 2>&1
    !rm -f cloudflared-linux-amd64.deb

# 2. Khởi chạy ComfyUI dưới nền và lưu toàn bộ output trực tiếp vào Google Drive
print("🚀 Đang khởi chạy ComfyUI backend (Output tự động lưu vào Google Drive)...")
log_file = open("/content/comfyui.log", "w")
comfy_proc = subprocess.Popen(
    [
        "python", "/content/ComfyUI/main.py",
        "--listen", "127.0.0.1",
        "--port", "8188",
        "--preview-method", "auto",
        "--output-directory", "/content/drive/MyDrive/ComfyStudio/outputs"
    ],
    stdout=log_file,
    stderr=subprocess.STDOUT
)

time.sleep(5)

# 3. Tạo Cloudflare Tunnel
print("🔗 Đang thiết lập Cloudflare Tunnel...")
tunnel_proc = subprocess.Popen(
    ['cloudflared', 'tunnel', '--url', 'http://127.0.0.1:8188'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

for line in tunnel_proc.stderr:
    match = re.search(r'https://[a-zA-Z0-9-]+\\.trycloudflare\\.com', line)
    if match:
        url = match.group(0)
        print("\\n=======================================================")
        print(f"🎉 COMFYUI STUDIO ENDPOINT: {url}")
        print("👉 Sao chép URL trên và dán vào ComfyUI Studio -> Settings / Runtime")
        print("=======================================================\\n")
        break
"""

cells.append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + "\n" for line in cell6_code.strip().split("\n")]
})

notebook = {
    "cells": cells,
    "metadata": {
        "accelerator": "GPU",
        "colab": {
            "gpuType": "T4",
            "provenance": []
        },
        "language_info": {
            "name": "python"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 2
}

output_path = "colab/ComfyStudio.ipynb"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=1, ensure_ascii=False)

print(f"Notebook written successfully to {output_path} with {len(cells)} cells.")

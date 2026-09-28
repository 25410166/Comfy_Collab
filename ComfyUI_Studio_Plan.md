# ComfyUI Studio --- Product & Technical Plan

> **Document type:** Product / Architecture / Development Plan\
> **Project:** Local ComfyUI Studio\
> **Primary goal:** Quản lý ComfyUI workflow, model và runtime Google
> Colab từ một website chạy local.\
> **Database:** MongoDB Local\
> **Runtime:** Google Colab + ComfyUI\
> **Storage:** Local filesystem + Google Drive\
> **Model sources:** Hugging Face + Civitai\
> **Status:** Planning / Architecture

------------------------------------------------------------------------

## 1. Project Overview

### 1.1. Ý tưởng

Xây dựng một **local web tool** đóng vai trò là lớp quản lý phía trên
ComfyUI.

Người dùng không cần trực tiếp quản lý từng notebook, workflow, model và
file bằng tay. Website sẽ cung cấp một nơi duy nhất để:

-   Quản lý workflow ComfyUI.
-   Lưu workflow lâu dài trên local và Google Drive.
-   Quản lý model, LoRA, VAE, ControlNet, Upscaler và các thành phần
    liên quan.
-   Tìm kiếm và tải model từ Hugging Face và Civitai.
-   Kết nối tới ComfyUI đang chạy trên Google Colab.
-   Kiểm tra dependency của workflow.
-   Chạy workflow.
-   Theo dõi generation.
-   Quản lý output.
-   Khôi phục lại trạng thái làm việc sau khi đóng trình duyệt hoặc
    restart máy.

### 1.2. Vai trò của từng thành phần

``` text
                    LOCAL COMPUTER
                         │
                         ▼
              ┌──────────────────────┐
              │   ComfyUI Studio     │
              │                      │
              │ React + Vite         │
              │ Node.js + Express    │
              │ MongoDB Local        │
              └──────────┬───────────┘
                         │
             ┌───────────┼────────────┐
             │           │            │
             ▼           ▼            ▼
       Local Files   Google Drive   Colab Runtime
                                      │
                                      ▼
                                  ComfyUI
                                      │
                                      ▼
                                    GPU
```

### 1.3. Nguyên tắc kiến trúc

1.  **ComfyUI vẫn là inference engine chính.**
2.  Website không cố xây lại toàn bộ ComfyUI.
3.  Workflow là dữ liệu độc lập với Colab runtime.
4.  MongoDB chỉ lưu metadata và trạng thái, không lưu model/ảnh lớn.
5.  File lớn nằm trên filesystem hoặc Google Drive.
6.  Colab runtime được xem là tài nguyên tạm thời.
7.  Workflow và model library phải có khả năng restore.
8.  Website phải hoạt động được ngay cả khi Colab đang offline.
9.  Không phụ thuộc vào một Colab session duy nhất.
10. Có thể mở rộng từ Colab sang GPU server khác trong tương lai.

------------------------------------------------------------------------

# 2. Technology Stack

## 2.1. Frontend

-   React
-   Vite
-   TypeScript
-   TailwindCSS
-   React Router
-   TanStack Query
-   Zustand hoặc tương đương cho state cục bộ

Frontend chịu trách nhiệm:

-   UI
-   Workflow library
-   Model Hub
-   Download Manager
-   Runtime status
-   Output gallery
-   Settings
-   API calls tới local backend

## 2.2. Backend

-   Node.js
-   Express
-   TypeScript
-   Mongoose

Backend chịu trách nhiệm:

-   REST API
-   MongoDB
-   File management
-   Google Drive integration
-   Workflow management
-   Model metadata
-   Download queue
-   Runtime management
-   ComfyUI API communication
-   WebSocket communication
-   Logging

## 2.3. Database

**MongoDB Local**

MongoDB chạy trực tiếp trên máy người dùng.

Ví dụ:

``` text
mongodb://127.0.0.1:27017/comfy_studio
```

MongoDB chỉ lưu:

-   Workflow metadata
-   Model metadata
-   Runtime metadata
-   Download jobs
-   Generation history
-   Project metadata
-   Settings
-   Sync status
-   Custom node metadata
-   File references

Không lưu trực tiếp:

-   `.safetensors`
-   `.ckpt`
-   `.gguf`
-   ảnh lớn
-   video
-   model binary

Các file lớn được lưu bằng filesystem hoặc Google Drive.

## 2.4. Runtime

Google Colab:

-   Python
-   ComfyUI
-   GPU
-   Custom Nodes
-   Runtime model cache

## 2.5. External Services

-   Google Drive
-   Hugging Face
-   Civitai
-   Google Colab

------------------------------------------------------------------------

# 3. Storage Architecture

Hệ thống sử dụng 3 tầng storage.

``` text
                STORAGE SYSTEM
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    MongoDB        Local FS     Google Drive
    Metadata       Working      Persistent
```

## 3.1. MongoDB Local

MongoDB là database chính cho metadata.

Ví dụ:

``` text
comfy_studio
├── workflows
├── models
├── model_files
├── custom_nodes
├── runtimes
├── downloads
├── generations
├── projects
├── sync_records
└── settings
```

## 3.2. Local Filesystem

Đề xuất cấu trúc:

``` text
ComfyStudio/
├── app/
├── data/
│   ├── mongodb/
│   ├── config/
│   └── logs/
│
├── workflows/
├── models/
├── outputs/
├── cache/
├── downloads/
├── backups/
└── temp/
```

## 3.3. Google Drive

Đề xuất:

``` text
MyDrive/
└── ComfyStudio/
    ├── workflows/
    │   ├── project-a/
    │   └── project-b/
    │
    ├── models/
    │   ├── checkpoints/
    │   ├── diffusion_models/
    │   ├── loras/
    │   ├── vae/
    │   ├── controlnet/
    │   ├── upscale_models/
    │   └── embeddings/
    │
    ├── custom_nodes/
    ├── outputs/
    ├── projects/
    └── backups/
```

Google Drive là **persistent storage**, còn Colab runtime là **temporary
compute environment**.

------------------------------------------------------------------------

# 4. Data Persistence Strategy

## 4.1. Workflow

Workflow nên có:

``` text
Local
  ↓
MongoDB metadata
  +
Local workflow.json
  ↓
Google Drive backup/sync
```

Workflow không phụ thuộc vào Colab.

Nếu Colab bị reset:

``` text
Colab reset
    ↓
Workflow vẫn còn
    ↓
Model metadata vẫn còn
    ↓
Custom node manifest vẫn còn
    ↓
Tạo runtime mới
    ↓
Restore
```

## 4.2. Model

Model có 3 trạng thái storage:

### Local

Dùng khi:

-   Model được sử dụng thường xuyên.
-   Máy có đủ dung lượng.
-   Không muốn phụ thuộc Drive.

### Google Drive

Dùng làm persistent model library.

### Colab Runtime

Dùng làm runtime cache.

``` text
Google Drive
     │
     │ download/copy
     ▼
Colab Runtime
     │
     ▼
GPU
```

Không coi Colab runtime là nơi lưu trữ lâu dài.

------------------------------------------------------------------------

# 5. MongoDB Data Model

## 5.1. Workflow

Collection:

``` text
workflows
```

Schema đề xuất:

``` json
{
  "_id": "ObjectId",
  "name": "Anime Character",
  "description": "Anime character generation workflow",
  "projectId": "ObjectId",
  "version": 1,
  "workflowPath": "workflows/anime-character/workflow.json",
  "thumbnailPath": "workflows/anime-character/thumbnail.png",
  "tags": [
    "anime",
    "character"
  ],
  "models": [
    {
      "modelId": "ObjectId",
      "required": true
    }
  ],
  "customNodes": [],
  "sync": {
    "local": true,
    "drive": true,
    "status": "synced"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## 5.2. Model

Collection:

``` text
models
```

Schema:

``` json
{
  "_id": "ObjectId",
  "name": "Example Model",
  "source": "civitai",
  "sourceId": "123456",
  "versionId": "789012",
  "type": "checkpoint",
  "baseModel": "SDXL",
  "description": "",
  "previewImages": [],
  "license": "",
  "tags": [],
  "files": [],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## 5.3. Model File

Collection:

``` text
model_files
```

Schema:

``` json
{
  "_id": "ObjectId",
  "modelId": "ObjectId",
  "filename": "model.safetensors",
  "size": 123456789,
  "sha256": "",
  "format": "safetensors",
  "localPath": "",
  "drivePath": "",
  "runtimePath": "",
  "status": "ready"
}
```

Tách `models` và `model_files` để một model có thể có nhiều
version/file.

## 5.4. Download Job

Collection:

``` text
downloads
```

Schema:

``` json
{
  "_id": "ObjectId",
  "source": "huggingface",
  "sourceUrl": "",
  "modelId": "ObjectId",
  "filename": "model.safetensors",
  "destination": "drive",
  "status": "downloading",
  "progress": 42.5,
  "downloadedBytes": 123456,
  "totalBytes": 456789,
  "speed": 0,
  "error": null,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## 5.5. Runtime

Collection:

``` text
runtimes
```

Schema:

``` json
{
  "_id": "ObjectId",
  "name": "Google Colab",
  "provider": "google-colab",
  "status": "ready",
  "endpoint": "",
  "comfyVersion": "",
  "pythonVersion": "",
  "gpu": {
    "name": "",
    "vram": 0
  },
  "lastConnectedAt": "Date",
  "lastHeartbeatAt": "Date"
}
```

## 5.6. Generation

Collection:

``` text
generations
```

Schema:

``` json
{
  "_id": "ObjectId",
  "workflowId": "ObjectId",
  "runtimeId": "ObjectId",
  "promptId": "",
  "status": "completed",
  "inputs": {},
  "outputs": [],
  "startedAt": "Date",
  "completedAt": "Date"
}
```

## 5.7. Sync Record

Collection:

``` text
sync_records
```

Dùng để theo dõi:

-   Local → Drive
-   Drive → Local
-   File conflict
-   Last synced version
-   Hash
-   Timestamp

------------------------------------------------------------------------

# 6. Main Application Pages

## 6.1. Dashboard

Hiển thị:

-   Colab status
-   GPU
-   VRAM
-   ComfyUI status
-   Recent workflows
-   Recent generations
-   Model storage
-   Drive storage
-   Download status

Ví dụ:

``` text
┌──────────────────────────────────────────────┐
│ ComfyUI Studio                 ● Colab Ready │
├──────────────┬───────────────────────────────┤
│ Dashboard    │                               │
│ Workflows    │      Dashboard               │
│ Models       │                               │
│ Downloads    │  GPU: RTX XXXX               │
│ Outputs      │  VRAM: XX GB                 │
│ Runtime      │  ComfyUI: Ready              │
│ Settings     │                               │
└──────────────┴───────────────────────────────┘
```

## 6.2. Workflows

Chức năng:

-   List
-   Search
-   Filter
-   Tags
-   Import
-   Export
-   Duplicate
-   Rename
-   Delete
-   Version
-   Sync
-   Open in ComfyUI
-   Run

## 6.3. Workflow Detail

Hiển thị:

-   Thumbnail
-   Description
-   Tags
-   Workflow JSON
-   Required models
-   Required custom nodes
-   Version
-   Last modified
-   Sync status

Có các action:

``` text
Open
Run
Duplicate
Export
Sync
Delete
```

## 6.4. Model Hub

Hai nguồn chính:

``` text
Hugging Face
Civitai
```

Filter:

-   Checkpoint
-   LoRA
-   VAE
-   ControlNet
-   Upscaler
-   Embedding
-   UNet / Diffusion Model
-   Other

Thông tin:

-   Preview
-   Model name
-   Author
-   Version
-   Base model
-   Size
-   File format
-   License
-   Download status

## 6.5. Downloads

Download queue:

``` text
┌────────────────────────────────────────────┐
│ model.safetensors                         │
│ ███████████████░░░░ 72%                   │
│ 3.2 GB / 4.4 GB     24 MB/s               │
│ Destination: Google Drive                 │
│                         Pause   Cancel     │
└────────────────────────────────────────────┘
```

## 6.6. Outputs

Gallery:

-   Images
-   Videos
-   Generation time
-   Workflow
-   Prompt
-   Seed
-   Model
-   Metadata

Actions:

-   Open
-   Reveal in folder
-   Delete
-   Copy
-   Re-run
-   Open workflow

## 6.7. Runtime

Hiển thị:

``` text
Provider: Google Colab

Status: READY

GPU
RTX XXXX
XX GB VRAM

ComfyUI
Version: X.X.X

Connection
● Connected

Actions:
[ Open Colab ]
[ Connect ]
[ Disconnect ]
[ Restart ComfyUI ]
```

## 6.8. Settings

Nhóm:

### Storage

-   Local root
-   Workflow directory
-   Model directory
-   Output directory
-   Cache directory

### Google Drive

-   Root folder
-   Sync mode
-   Auto sync

### Runtime

-   Colab notebook
-   Endpoint
-   Authentication
-   Heartbeat interval

### Providers

-   Hugging Face token
-   Civitai token

Credentials phải được lưu an toàn và không đưa vào workflow hoặc Git.

------------------------------------------------------------------------

# 7. Workflow Dependency System

Đây là chức năng quan trọng.

Khi import workflow:

``` text
Workflow JSON
      │
      ▼
Parse Nodes
      │
      ├── Models
      │
      └── Custom Nodes
      │
      ▼
Dependency Resolver
      │
      ├── Installed
      ├── Missing
      └── Unknown
```

Ví dụ:

``` text
Workflow: Anime XL

Models
✓ checkpoint.safetensors
✓ vae.safetensors
✗ character_lora.safetensors

Custom Nodes
✓ NodePack-A
✗ NodePack-B
```

Website cung cấp:

``` text
[Install Missing Models]
[Install Missing Custom Nodes]
```

Không tự động cài dependency không rõ nguồn nếu không có metadata đáng
tin cậy.

------------------------------------------------------------------------

# 8. Colab Runtime Architecture

## 8.1. Notebook

Notebook cần thực hiện:

``` text
START
  │
  ▼
Mount Google Drive
  │
  ▼
Check Python
  │
  ▼
Check ComfyUI
  │
  ├── Missing → Install
  │
  ▼
Restore Custom Nodes
  │
  ▼
Configure Model Paths
  │
  ▼
Start ComfyUI
  │
  ▼
Health Check
  │
  ▼
Expose Connection
  │
  ▼
READY
```

## 8.2. Runtime Restore

Khi runtime mới:

``` text
New Colab Runtime
       │
       ▼
Mount Drive
       │
       ▼
Read Runtime Manifest
       │
       ├── ComfyUI version
       ├── Custom nodes
       └── Model paths
       │
       ▼
Restore
       │
       ▼
Start ComfyUI
```

## 8.3. Runtime Manifest

Lưu trên Drive:

``` json
{
  "comfyVersion": "",
  "pythonVersion": "",
  "customNodes": [],
  "modelPaths": [],
  "createdAt": "",
  "updatedAt": ""
}
```

------------------------------------------------------------------------

# 9. ComfyUI Integration

Website sử dụng ComfyUI như backend inference engine.

Các nhóm API cần hỗ trợ:

``` text
Connection
    ↓
Health Check

Workflow
    ↓
Queue Prompt

Generation
    ↓
WebSocket Progress

Output
    ↓
History / Files
```

## 9.1. Open Workflow

Website:

``` text
Select Workflow
      ↓
Check Runtime
      ↓
Check Dependencies
      ↓
Open ComfyUI
```

## 9.2. Run Workflow

``` text
Select Workflow
      ↓
Validate
      ↓
Resolve Models
      ↓
Send Prompt
      ↓
Receive Prompt ID
      ↓
WebSocket Progress
      ↓
Generation Complete
      ↓
Save Output
      ↓
Create Generation Record
```

## 9.3. Không xây Node Editor ở MVP

ComfyUI đã có node editor.

MVP chỉ cần:

``` text
Studio
  ↓
Workflow Management
  ↓
ComfyUI
  ↓
Node Editing
```

Sau này nếu cần mới xây một UI generation riêng.

------------------------------------------------------------------------

# 10. Model Download System

## 10.1. Sources

### Hugging Face

Cần hỗ trợ:

-   Search
-   Repository
-   Files
-   Version/revision
-   Download
-   Metadata

### Civitai

Cần hỗ trợ:

-   Search
-   Model
-   Version
-   File
-   Preview
-   Download

## 10.2. Download Pipeline

``` text
Search
  ↓
Select Model
  ↓
Select Version
  ↓
Select File
  ↓
Select Destination
  ↓
Create Download Job
  ↓
Download
  ↓
Verify
  ↓
Register
  ↓
Ready
```

## 10.3. Destination

``` text
LOCAL
DRIVE
RUNTIME
```

## 10.4. Duplicate Detection

Ưu tiên:

1.  SHA256
2.  File size
3.  Filename
4.  Source ID + version ID

Nếu file đã tồn tại:

``` text
Model already exists

[Use Existing]
[Download Again]
[Cancel]
```

## 10.5. Failed Download

Trạng thái:

``` text
queued
downloading
paused
verifying
completed
failed
cancelled
```

Có retry.

------------------------------------------------------------------------

# 11. Google Drive Sync

## 11.1. Sync Modes

### Manual

Người dùng bấm:

``` text
Sync
```

### Auto

Workflow thay đổi → tự sync.

### Startup

Mở app → kiểm tra thay đổi.

## 11.2. Conflict

Không ghi đè mù.

Ví dụ:

``` text
Workflow conflict

Local:
Version 5
Updated 15:42

Drive:
Version 6
Updated 15:48

[Keep Local]
[Use Drive]
[Create Copy]
```

## 11.3. File Identity

Mỗi file nên có:

``` text
fileId
path
size
sha256
version
updatedAt
```

------------------------------------------------------------------------

# 12. Backup & Recovery

## 12.1. MongoDB Backup

Backup metadata định kỳ:

``` text
backups/
├── mongodb/
│   ├── 2026-01-01/
│   └── 2026-01-02/
```

Có thể dùng MongoDB native dump/restore.

## 12.2. Workflow Backup

Mỗi workflow có version:

``` text
workflow/
├── v1/
├── v2/
├── v3/
└── current/
```

## 12.3. Recovery

Nếu local database bị mất:

``` text
Install Application
       ↓
Restore MongoDB
       ↓
Read Drive
       ↓
Rebuild File Index
       ↓
Validate Models
       ↓
Ready
```

------------------------------------------------------------------------

# 13. Security

Vì ứng dụng chạy local nhưng có kết nối Internet và Colab, cần có
security cơ bản.

## 13.1. API

Local backend:

``` text
127.0.0.1
```

Không expose Express server ra Internet nếu không cần.

## 13.2. Colab Endpoint

Endpoint cần có authentication/token.

Không coi URL tunnel là credential duy nhất.

## 13.3. Credentials

Không lưu:

-   Hugging Face token
-   Civitai token
-   Google credential

trong:

``` text
workflow JSON
Git repository
MongoDB public export
Drive workflow metadata
```

## 13.4. Download URL

Không cho backend tải arbitrary URL không kiểm soát.

Có allowlist:

``` text
huggingface.co
civitai.com
```

Các nguồn khác cần explicit confirmation.

------------------------------------------------------------------------

# 14. Project Structure

Đề xuất monorepo:

``` text
comfy-studio/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── layouts/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── api/
│   │   │   └── types/
│   │   └── package.json
│   │
│   └── server/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── workflows/
│       │   │   ├── models/
│       │   │   ├── downloads/
│       │   │   ├── runtime/
│       │   │   ├── drive/
│       │   │   ├── comfyui/
│       │   │   └── generations/
│       │   │
│       │   ├── database/
│       │   ├── middleware/
│       │   ├── services/
│       │   ├── utils/
│       │   └── server.ts
│       └── package.json
│
├── colab/
│   ├── ComfyStudio.ipynb
│   ├── scripts/
│   └── runtime-manifest.json
│
├── data/
│   ├── workflows/
│   ├── models/
│   ├── outputs/
│   ├── downloads/
│   ├── cache/
│   ├── backups/
│   └── logs/
│
├── docs/
│
├── scripts/
│
├── .env.example
├── package.json
└── README.md
```

------------------------------------------------------------------------

# 15. REST API Design

## Workflows

``` text
GET    /api/workflows
GET    /api/workflows/:id
POST   /api/workflows
PUT    /api/workflows/:id
DELETE /api/workflows/:id

POST   /api/workflows/import
POST   /api/workflows/:id/export
POST   /api/workflows/:id/sync
POST   /api/workflows/:id/run
```

## Models

``` text
GET    /api/models
GET    /api/models/:id
POST   /api/models
DELETE /api/models/:id

GET    /api/models/search/huggingface
GET    /api/models/search/civitai
POST   /api/models/:id/download
```

## Downloads

``` text
GET    /api/downloads
GET    /api/downloads/:id

POST   /api/downloads/:id/pause
POST   /api/downloads/:id/resume
POST   /api/downloads/:id/cancel
POST   /api/downloads/:id/retry
```

## Runtime

``` text
GET    /api/runtime
POST   /api/runtime/connect
POST   /api/runtime/disconnect
POST   /api/runtime/health
POST   /api/runtime/restart
```

## Generations

``` text
GET    /api/generations
GET    /api/generations/:id
POST   /api/generations/:id/rerun
DELETE /api/generations/:id
```

------------------------------------------------------------------------

# 16. WebSocket Events

Backend cần relay các event từ ComfyUI về frontend.

Ví dụ:

``` text
runtime.status
runtime.connected
runtime.disconnected

download.started
download.progress
download.completed
download.failed

generation.queued
generation.started
generation.progress
generation.completed
generation.failed
```

Frontend chỉ cần subscribe:

``` text
WebSocket
    ↓
Event Dispatcher
    ↓
React Store
    ↓
UI
```

------------------------------------------------------------------------

# 17. MVP Scope

MVP chỉ triển khai:

### Core

-   [ ] React frontend
-   [ ] Node.js backend
-   [ ] MongoDB Local
-   [ ] Local filesystem
-   [ ] Settings

### Workflow

-   [ ] Import JSON
-   [ ] Workflow library
-   [ ] Metadata
-   [ ] Thumbnail
-   [ ] Search
-   [ ] Tags
-   [ ] Export
-   [ ] Versioning

### Drive

-   [ ] Connect Google Drive
-   [ ] Create ComfyStudio folder
-   [ ] Sync workflow
-   [ ] Backup workflow

### Colab

-   [ ] Notebook
-   [ ] Mount Drive
-   [ ] Start ComfyUI
-   [ ] Health check
-   [ ] Connect endpoint
-   [ ] Open ComfyUI

### ComfyUI

-   [ ] Workflow validation
-   [ ] Queue prompt
-   [ ] WebSocket progress
-   [ ] Output retrieval

------------------------------------------------------------------------

# 18. Phase 2

Sau khi MVP ổn định:

-   [ ] Hugging Face search
-   [ ] Civitai search
-   [ ] Model detail
-   [ ] Download queue
-   [ ] Model library
-   [ ] Model dependency checker
-   [ ] Custom node dependency checker
-   [ ] Runtime cache

------------------------------------------------------------------------

# 19. Phase 3

Generation Studio:

-   [ ] Prompt panel
-   [ ] Seed
-   [ ] Resolution
-   [ ] Steps
-   [ ] CFG
-   [ ] Sampler
-   [ ] LoRA selector
-   [ ] Model selector
-   [ ] Queue
-   [ ] Batch generation
-   [ ] Output gallery

Chỉ hỗ trợ các workflow phổ biến trước. Không cố tạo UI generic cho mọi
node của ComfyUI.

------------------------------------------------------------------------

# 20. Phase 4

Advanced:

-   [ ] Multiple runtimes
-   [ ] Local ComfyUI
-   [ ] Remote GPU
-   [ ] RunPod / other providers
-   [ ] Runtime profiles
-   [ ] Model auto-sync
-   [ ] Workflow templates
-   [ ] Project system
-   [ ] Advanced backup
-   [ ] Usage analytics

Kiến trúc runtime nên được abstraction ngay từ đầu:

``` text
RuntimeProvider
├── GoogleColabProvider
├── LocalComfyProvider
└── RemoteGPUProvider
```

Nhờ vậy Colab không trở thành dependency cố định của toàn bộ hệ thống.

------------------------------------------------------------------------

# 21. Development Roadmap

## Phase 0 --- Architecture

-   [ ] Repository setup
-   [ ] Environment setup
-   [ ] MongoDB Local
-   [ ] Base UI
-   [ ] API architecture
-   [ ] File storage architecture

## Phase 1 --- Workflow Manager

-   [ ] Workflow CRUD
-   [ ] Import/export
-   [ ] Metadata
-   [ ] Versioning
-   [ ] Thumbnail
-   [ ] Search/filter

**Deliverable:** Có thể quản lý toàn bộ workflow mà chưa cần Colab.

## Phase 2 --- Google Drive

-   [ ] OAuth
-   [ ] Folder initialization
-   [ ] Upload
-   [ ] Download
-   [ ] Sync
-   [ ] Conflict detection
-   [ ] Backup

**Deliverable:** Workflow không bị mất khi restart máy.

## Phase 3 --- Colab

-   [ ] Notebook
-   [ ] Runtime setup
-   [ ] ComfyUI startup
-   [ ] Endpoint
-   [ ] Authentication
-   [ ] Health check
-   [ ] Reconnect

**Deliverable:** Studio có thể kết nối ComfyUI trên Colab.

## Phase 4 --- ComfyUI

-   [ ] Queue
-   [ ] WebSocket
-   [ ] Generation
-   [ ] History
-   [ ] Output

**Deliverable:** Có thể chạy workflow từ Studio.

## Phase 5 --- Model Hub

-   [ ] Hugging Face
-   [ ] Civitai
-   [ ] Search
-   [ ] Model metadata
-   [ ] Download queue
-   [ ] Model registration

**Deliverable:** Model có thể được tìm và tải từ Studio.

## Phase 6 --- Dependency System

-   [ ] Parse workflow
-   [ ] Detect models
-   [ ] Detect custom nodes
-   [ ] Missing dependency UI
-   [ ] Install/resolve dependency

## Phase 7 --- Polish

-   [ ] Error handling
-   [ ] Recovery
-   [ ] Backup
-   [ ] Logs
-   [ ] Performance
-   [ ] UI polish

------------------------------------------------------------------------

# 22. Important Design Decisions

## Decision 1 --- MongoDB Local

MongoDB là database chính.

Không dùng MongoDB để lưu binary lớn.

``` text
MongoDB = metadata
Filesystem = local files
Drive = persistent files
```

## Decision 2 --- Drive không phải GPU storage

Drive là persistent storage.

Runtime local/Colab là compute cache.

## Decision 3 --- Workflow không phụ thuộc runtime

Workflow phải mở được kể cả khi Colab offline.

## Decision 4 --- ComfyUI là engine

Không rewrite ComfyUI.

Studio quản lý và điều khiển ComfyUI.

## Decision 5 --- Colab là một Runtime Provider

Không hard-code toàn bộ hệ thống vào Colab.

``` text
Studio
   ↓
Runtime Provider
   ├── Colab
   ├── Local
   └── Remote
```

## Decision 6 --- Model Hub độc lập

Model Hub không chỉ là downloader.

Nó là database/catalog của toàn bộ model library.

## Decision 7 --- Dependency-first

Workflow trước khi chạy phải kiểm tra:

``` text
Workflow
  ↓
Models
  ↓
Custom Nodes
  ↓
Runtime
  ↓
Run
```

------------------------------------------------------------------------

# 23. Error Handling

Các lỗi cần xử lý ngay từ MVP:

### MongoDB

``` text
Database unavailable
Connection lost
Invalid schema
```

### Google Drive

``` text
Authentication failed
Permission denied
File missing
Quota exceeded
Network error
Conflict
```

### Colab

``` text
Runtime offline
Runtime reset
Endpoint unavailable
Authentication failed
ComfyUI not started
```

### ComfyUI

``` text
Invalid workflow
Missing node
Missing model
Execution error
Out of memory
Timeout
```

### Download

``` text
Network error
File unavailable
Permission denied
Disk full
Drive unavailable
Checksum mismatch
```

Mỗi lỗi cần có:

``` text
Human-readable message
Technical log
Retry action
Recovery suggestion
```

------------------------------------------------------------------------

# 24. Performance Strategy

## Frontend

-   Pagination
-   Virtualized lists nếu model library lớn
-   Lazy loading preview
-   Debounced search
-   TanStack Query caching

## Backend

-   Download queue worker
-   Async file operations
-   Streaming download
-   WebSocket events
-   MongoDB indexes

## MongoDB Indexes

Ví dụ:

``` text
workflows:
  projectId
  tags
  updatedAt

models:
  source
  sourceId
  type
  tags

downloads:
  status
  createdAt

generations:
  workflowId
  createdAt
```

## Model Library

Không scan toàn bộ ổ đĩa mỗi lần mở app.

Thay vào đó:

``` text
Filesystem
     ↓
Indexer
     ↓
MongoDB metadata
```

Chỉ rescan khi:

-   User yêu cầu.
-   File watcher phát hiện thay đổi.
-   Startup verification cần thiết.

------------------------------------------------------------------------

# 25. User Flow

## Flow A --- First Install

``` text
Install Studio
      ↓
Install/Start MongoDB
      ↓
Choose Local Storage
      ↓
Connect Google Drive
      ↓
Open Colab Setup
      ↓
Install ComfyUI
      ↓
Connect Runtime
      ↓
READY
```

## Flow B --- Next Time

``` text
Open Studio
      ↓
Load MongoDB
      ↓
Load Workflow Library
      ↓
Check Drive Sync
      ↓
Check Runtime
      ↓
READY
```

Nếu Colab offline:

``` text
Studio
  ↓
Offline Runtime
  ↓
Workflows still available
  ↓
Connect Colab when needed
```

## Flow C --- Download Model

``` text
Model Hub
   ↓
Search Civitai/Hugging Face
   ↓
Select model
   ↓
Select version/file
   ↓
Download
   ↓
Drive
   ↓
Register in MongoDB
   ↓
Ready
```

## Flow D --- Run Workflow

``` text
Select Workflow
       ↓
Validate
       ↓
Check Runtime
       ↓
Check Models
       ↓
Check Custom Nodes
       ↓
Queue
       ↓
ComfyUI
       ↓
GPU
       ↓
Output
       ↓
Save
       ↓
Generation History
```

------------------------------------------------------------------------

# 26. Future Desktop Application

Sau khi web version ổn định, có thể đóng gói thành desktop app bằng:

-   Electron
-   Tauri

Khi đó:

``` text
ComfyUI Studio
├── Frontend
├── Node Backend
├── MongoDB Local
├── File Manager
└── Runtime Manager
```

Trải nghiệm sẽ giống một ứng dụng AI workstation thay vì website thông
thường.

Tuy nhiên desktop packaging không nên làm trong MVP.

------------------------------------------------------------------------

# 27. Final Architecture

Kiến trúc cuối cùng:

``` text
                         COMFYUI STUDIO
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        Workflow           Model Hub          Runtime
        Manager                                Manager
             │                 │                 │
             ▼                 ▼                 ▼
        MongoDB Local      HF / Civitai      Colab
             │                                   │
             │                                   ▼
             │                               ComfyUI
             │                                   │
             │                                   ▼
             │                                  GPU
             │
             ├──────────────────────┐
             │                      │
             ▼                      ▼
       Local Files             Google Drive
                                  │
                                  ▼
                           Persistent Storage
```

### Core principle

``` text
MongoDB
    = WHAT

Filesystem
    = WHERE

Google Drive
    = PERSISTENCE

Colab
    = COMPUTE

ComfyUI
    = INFERENCE

Studio
    = MANAGEMENT
```

------------------------------------------------------------------------

# 28. MVP Definition of Done

MVP được xem là hoàn thành khi người dùng có thể thực hiện toàn bộ flow
sau:

``` text
1. Mở ComfyUI Studio
          ↓
2. Thấy workflow đã lưu từ lần trước
          ↓
3. Mở workflow
          ↓
4. Studio kiểm tra dependency
          ↓
5. Kết nối Google Colab
          ↓
6. ComfyUI được khởi động
          ↓
7. Workflow được gửi tới ComfyUI
          ↓
8. Theo dõi progress
          ↓
9. Nhận output
          ↓
10. Lưu output
          ↓
11. Lưu generation history
          ↓
12. Sync workflow lên Google Drive
          ↓
13. Đóng Studio
          ↓
14. Mở lại lần sau
          ↓
15. Workflow và metadata vẫn còn
```

Sau khi flow này hoạt động ổn định, mới mở rộng sang Model Hub, Civitai,
Hugging Face, dependency automation và generation studio.

------------------------------------------------------------------------

# 29. Recommended Implementation Order

Thứ tự code khuyến nghị:

``` text
01. Project Scaffold
        ↓
02. MongoDB Local
        ↓
03. File Storage
        ↓
04. Workflow CRUD
        ↓
05. Workflow Import/Export
        ↓
06. Workflow Versioning
        ↓
07. Google Drive
        ↓
08. Drive Sync
        ↓
09. Colab Notebook
        ↓
10. Runtime Manager
        ↓
11. ComfyUI API
        ↓
12. WebSocket
        ↓
13. Generation
        ↓
14. Output Manager
        ↓
15. Hugging Face
        ↓
16. Civitai
        ↓
17. Download Manager
        ↓
18. Model Library
        ↓
19. Dependency Resolver
        ↓
20. Backup/Recovery
        ↓
21. Polish
```

Không nên bắt đầu bằng Model Hub hoặc Node Editor. **Workflow +
persistence + runtime connection** phải ổn định trước, vì đây là nền
móng của toàn bộ hệ thống.

------------------------------------------------------------------------

# 30. Project Goal

ComfyUI Studio hướng tới trở thành một **local AI generation
workstation**:

``` text
Find Model
     ↓
Download Model
     ↓
Store Model
     ↓
Create/Import Workflow
     ↓
Validate Dependencies
     ↓
Connect GPU
     ↓
Run ComfyUI
     ↓
Generate
     ↓
Store Output
     ↓
Keep Everything Persistent
```

Mục tiêu cuối cùng không phải thay thế ComfyUI mà là tạo ra một lớp
**Project + Workflow + Model + Runtime Management** giúp ComfyUI trở
thành một hệ thống dễ quản lý và có khả năng khôi phục lâu dài.

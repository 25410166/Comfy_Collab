# 🎨 ComfyUI Studio

Local workstation management layer for **ComfyUI** workflows, models, and **Google Colab / Remote GPU** runtimes with automated Google Drive persistence and MongoDB metadata.

---

## 🌟 Architecture Overview

```text
                     LOCAL WORKSTATION
                            │
                            ▼
                 ┌──────────────────────┐
                 │   ComfyUI Studio     │
                 │                      │
                 │ React 18 + Vite      │
                 │ Node.js + Express    │
                 │ MongoDB Local        │
                 └──────────┬───────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        Local Files    Google Drive   GPU Runtime
        (Metadata/      (Persistent   (Colab/Remote/
         Cache)          Storage)      Local Comfy)
```

- **Inference Engine**: ComfyUI runs on Google Colab or local GPU.
- **Workflow & Metadata**: Preserved in local MongoDB + JSON backups on Google Drive.
- **Model Hub**: Direct search & download from Civitai and Hugging Face to local filesystem or Google Drive.
- **Dependency Resolver**: Automatically detects required checkpoints, LoRAs, VAEs, ControlNets, and custom nodes.
- **Real-Time Live Updates**: WebSocket & Socket.IO telemetry for execution progress and download queues.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/comfy_studio`)

### 2. Install & Seed
```bash
# Install all dependencies across workspaces (server + web)
npm install

# Seed starter SD1.5 Text2Image workflow into MongoDB
node scripts/seed_sample_data.js
```

### 3. Run Development Servers
```bash
# Runs both backend server (:5000) and frontend Vite dev (:5173) concurrently
npm run dev
```

### 4. Or Build & Run Production Workstation
```bash
# Build both frontend and backend
npm run build

# Start workstation (serves UI + API on http://localhost:5000)
npm start
```

---

## ☁️ Google Colab GPU Setup

1. Open `colab/ComfyStudio.ipynb` in [Google Colab](https://colab.research.google.com).
2. **Cell 1**: Mount Google Drive (`MyDrive/ComfyStudio/models`).
3. **Cell 2**: Clones ComfyUI, configures dependencies, links models to Google Drive.
4. **Cell 3**: Starts ComfyUI and exposes via Cloudflare Tunnel (`https://xxxx.trycloudflare.com`).
5. Copy the generated Tunnel URL into **ComfyUI Studio -> Runtime** and click **Connect**.

---

## 📁 Project Structure

```text
Comfy_Collab/
├── apps/
│   ├── server/             # Express, MongoDB (Mongoose), Socket.IO, ComfyUI Client
│   │   ├── src/
│   │   │   ├── database/   # Schemas: Workflow, Model, ModelFile, Runtime, Generation
│   │   │   ├── services/   # ComfyUI WS/HTTP, Dependency Resolver, ModelHub, DriveSync
│   │   │   ├── modules/    # REST API controllers & routes
│   │   │   └── server.ts   # Entry point
│   └── web/                # React 18, Vite, TailwindCSS, TanStack Query, Lucide
│       ├── src/
│       │   ├── layouts/    # Workstation layout & live status bar
│       │   ├── pages/      # Dashboard, Workflows, ModelHub, Downloads, Outputs, Runtime, Drive
│       │   └── hooks/      # useSocket for live events
├── colab/
│   ├── ComfyStudio.ipynb   # Colab notebook with Cloudflare Tunnel & Drive symlinks
│   ├── scripts/            # setup_comfy.py automation
│   └── runtime-manifest.json
├── data/                   # Workflows, Models, Outputs, Downloads, Backups, Cache
├── scripts/                # Database backup, restore, and seed scripts
└── .env                    # Environment configurations
```

---

## 💾 Backup & Restore

```bash
# Backup all MongoDB collections to JSON
node scripts/backup_db.js

# Restore database from a backup JSON file
node scripts/restore_db.js data/backups/mongodb_dump_<timestamp>.json
```

---

## 📄 License
MIT

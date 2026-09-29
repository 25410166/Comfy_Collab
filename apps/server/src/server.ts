import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { connectDatabase } from './database/index.js';
import { socketService } from './services/socket.service.js';

// ComfyStudio Server Runtime v1.0.1
import { workflowRoutes } from './modules/workflows/routes.js';
import { modelRoutes } from './modules/models/routes.js';
import { downloadRoutes } from './modules/downloads/routes.js';
import { runtimeRoutes } from './modules/runtime/routes.js';
import { generationRoutes } from './modules/generations/routes.js';
import { driveRoutes } from './modules/drive/routes.js';
import { settingsRoutes } from './modules/settings/routes.js';
import { promptRoutes } from './modules/prompts/routes.js';

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/static/outputs', express.static(config.paths.outputs));
app.use('/static/workflows', express.static(config.paths.workflows));

// Initialize Socket.IO
socketService.init(server);

// API Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/runtime', runtimeRoutes);
app.use('/api/generations', generationRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/prompts', promptRoutes);

// Health route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build if present
import fs from 'fs';
import path from 'path';
const webDistPath = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/static')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// Central Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Internal Server Error]:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

// Connect to MongoDB and start listening
async function bootstrap() {
  try {
    await connectDatabase();
    server.listen(config.port, '0.0.0.0', () => {
      console.log(`===============================================`);

      console.log(`🚀 ComfyUI Studio Server running on port ${config.port}`);
      console.log(`📡 API endpoint: http://localhost:${config.port}/api`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();

import { Router } from 'express';
import { downloadController } from './download.controller.js';

const router = Router();

router.get('/', (req, res) => downloadController.getDownloads(req, res));
router.post('/', (req, res) => downloadController.createDownload(req, res));
router.post('/:id/pause', (req, res) => downloadController.pauseDownload(req, res));
router.post('/:id/resume', (req, res) => downloadController.resumeDownload(req, res));
router.post('/:id/cancel', (req, res) => downloadController.cancelDownload(req, res));
router.post('/:id/retry', (req, res) => downloadController.retryDownload(req, res));

export const downloadRoutes = router;

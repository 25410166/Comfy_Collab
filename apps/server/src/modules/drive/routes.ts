import { Router } from 'express';
import { driveController } from './drive.controller.js';

const router = Router();

router.get('/status', (req, res) => driveController.getStatus(req, res));
router.get('/records', (req, res) => driveController.getSyncRecords(req, res));
router.post('/sync', (req, res) => driveController.triggerSync(req, res));
router.post('/backup', (req, res) => driveController.createBackup(req, res));

export const driveRoutes = router;

import { Router } from 'express';
import { settingsController } from './settings.controller.js';

const router = Router();

router.get('/', (req, res) => settingsController.getSettings(req, res));
router.post('/', (req, res) => settingsController.updateSettings(req, res));

export const settingsRoutes = router;

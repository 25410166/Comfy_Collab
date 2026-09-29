import { Router } from 'express';
import { promptController } from './prompt.controller.js';

const router = Router();

router.get('/', (req, res) => promptController.getPrompts(req, res));
router.get('/stats', (req, res) => promptController.getStats(req, res));
router.post('/optimize', (req, res) => promptController.optimizePrompt(req, res));
router.get('/:id', (req, res) => promptController.getPromptById(req, res));

export const promptRoutes = router;


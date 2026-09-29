import { Router } from 'express';
import { generationController } from './generation.controller.js';

const router = Router();

router.get('/', (req, res) => generationController.getGenerations(req, res));
router.get('/file/:filename', (req, res) => generationController.serveFile(req, res));
router.get('/:id', (req, res) => generationController.getGenerationById(req, res));
router.post('/:id/rerun', (req, res) => generationController.rerunGeneration(req, res));
router.post('/:id/cancel', (req, res) => generationController.cancelGeneration(req, res));
router.delete('/clear/all', (req, res) => generationController.clearAllGenerations(req, res));
router.delete('/:id', (req, res) => generationController.deleteGeneration(req, res));

export const generationRoutes = router;

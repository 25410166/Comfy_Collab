import { Router } from 'express';
import { modelController } from './model.controller.js';

const router = Router();

router.get('/', (req, res) => modelController.getModels(req, res));
router.post('/', (req, res) => modelController.createModel(req, res));
router.post('/scan', (req, res) => modelController.scanLocalModels(req, res));
router.get('/search/civitai', (req, res) => modelController.searchCivitai(req, res));
router.get('/search/huggingface', (req, res) => modelController.searchHuggingFace(req, res));
router.get('/:id', (req, res) => modelController.getModelById(req, res));
router.delete('/:id', (req, res) => modelController.deleteModel(req, res));

export const modelRoutes = router;

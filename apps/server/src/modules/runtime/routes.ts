import { Router } from 'express';
import { runtimeController } from './runtime.controller.js';

const router = Router();

router.get('/', (req, res) => runtimeController.getActiveRuntime(req, res));
router.get('/all', (req, res) => runtimeController.getAllRuntimes(req, res));
router.post('/', (req, res) => runtimeController.createRuntime(req, res));
router.post('/connect', (req, res) => runtimeController.connect(req, res));
router.post('/disconnect', (req, res) => runtimeController.disconnect(req, res));
router.get('/health', (req, res) => runtimeController.checkHealth(req, res));

export const runtimeRoutes = router;

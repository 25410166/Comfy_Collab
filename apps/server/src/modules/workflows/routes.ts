import { Router } from 'express';
import multer from 'multer';
import { workflowController } from './workflow.controller.js';
import { config } from '../../config.js';

const upload = multer({ dest: config.paths.temp });
const router = Router();

router.get('/', (req, res) => workflowController.getWorkflows(req, res));
router.post('/', (req, res) => workflowController.createWorkflow(req, res));
router.get('/:id', (req, res) => workflowController.getWorkflowById(req, res));
router.put('/:id', (req, res) => workflowController.updateWorkflow(req, res));
router.delete('/:id', (req, res) => workflowController.deleteWorkflow(req, res));

router.post('/import', upload.single('file'), (req, res) => workflowController.importWorkflow(req, res));
router.get('/:id/export', (req, res) => workflowController.exportWorkflow(req, res));
router.post('/:id/sync', (req, res) => workflowController.syncWorkflow(req, res));
router.post('/:id/run', (req, res) => workflowController.runWorkflow(req, res));
router.get('/:id/dependencies', (req, res) => workflowController.checkDependencies(req, res));

export const workflowRoutes = router;

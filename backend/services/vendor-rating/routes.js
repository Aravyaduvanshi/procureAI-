import express from 'express';
import { evaluateSupplier, batchEvaluateSuppliers, getScoringConfig } from './controller.js';

const router = express.Router();

router.get('/config', getScoringConfig);
router.post('/evaluate', evaluateSupplier);
router.post('/batch-evaluate', batchEvaluateSuppliers);

export default router;

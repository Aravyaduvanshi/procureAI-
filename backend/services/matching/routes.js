import express from 'express';
import { runMatching, getMatchingRunById, getMatchingRunsByRequirement, getMatchingExclusions } from './controller.js';
import { authenticate } from '../../shared/authMiddleware.js';

const router = express.Router();

router.post('/run', authenticate, runMatching);
router.get('/:id', authenticate, getMatchingRunById);
router.get('/requirement/:requirementId', authenticate, getMatchingRunsByRequirement);
router.get('/:id/exclusions', authenticate, getMatchingExclusions);

export default router;

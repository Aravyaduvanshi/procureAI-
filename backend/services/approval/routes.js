import express from 'express';
import { recordApprovalDecision, listApprovals, getApprovalById, checkAuthorizationGate } from './controller.js';
import { authenticate } from '../../shared/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, recordApprovalDecision);
router.get('/', authenticate, listApprovals);
router.get('/check-gate', authenticate, checkAuthorizationGate);
router.get('/:id', authenticate, getApprovalById);

export default router;

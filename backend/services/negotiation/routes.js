import express from 'express';
import {
  createNegotiationSession,
  listNegotiationSessions,
  getNegotiationSessionById,
  generateStrategyAndDraft,
  approveStrategy,
  approveMessageDraft,
  recordCounteroffer,
  completeNegotiation
} from './controller.js';
import { authenticate } from '../../shared/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, createNegotiationSession);
router.get('/', authenticate, listNegotiationSessions);
router.get('/:id', authenticate, getNegotiationSessionById);
router.post('/:id/generate-strategy', authenticate, generateStrategyAndDraft);
router.post('/:id/approve-strategy', authenticate, approveStrategy);
router.post('/:id/approve-draft', authenticate, approveMessageDraft);
router.post('/:id/counteroffer', authenticate, recordCounteroffer);
router.post('/:id/complete', authenticate, completeNegotiation);

export default router;

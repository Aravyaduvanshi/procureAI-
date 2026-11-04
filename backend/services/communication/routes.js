import express from 'express';
import { previewMessageDraft, sendMessage, listNegotiationMessages } from './controller.js';
import { authenticate } from '../../shared/authMiddleware.js';

const router = express.Router();

router.get('/preview/:negotiationId', authenticate, previewMessageDraft);
router.post('/send/:negotiationId', authenticate, sendMessage);
router.get('/history/:negotiationId', authenticate, listNegotiationMessages);

export default router;

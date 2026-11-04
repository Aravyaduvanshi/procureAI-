import express from 'express';
import multer from 'multer';
import { uploadRequirement, createRequirement, listRequirements, getRequirementById, confirmRequirement, getRequirementStatus } from './controller.js';
import { authenticate } from '../../shared/authMiddleware.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/upload', authenticate, upload.single('document'), uploadRequirement);
router.post('/create', authenticate, createRequirement);
router.get('/', authenticate, listRequirements);
router.get('/:id', authenticate, getRequirementById);
router.put('/:id/confirm', authenticate, confirmRequirement);
router.get('/:id/status', authenticate, getRequirementStatus);

export default router;

import express from 'express';
import { listSuppliers, getSupplierById, getSupplierEvidence, getCatalogueSchema, validateCatalogue } from './controller.js';
import { authenticate } from '../../shared/authMiddleware.js';

const router = express.Router();

router.get('/schema', getCatalogueSchema);
router.post('/validate', validateCatalogue);
router.get('/', listSuppliers);
router.get('/:id', (req, res, next) => {
  // Optional auth to reveal full contact details
  authenticate(req, res, () => {
    getSupplierById(req, res, next);
  });
});
router.get('/:id/evidence', getSupplierEvidence);

export default router;

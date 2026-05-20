import express from 'express';
import {
  createPrescription,
  getPrescriptionById,
  downloadPrescriptionPDF,
} from '../controllers/prescrController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all prescription actions

// Only doctor role can generate a new prescription
router.post('/create', authorize('doctor'), createPrescription);

router.get('/:id', getPrescriptionById);
router.get('/download/:id', downloadPrescriptionPDF);

export default router;

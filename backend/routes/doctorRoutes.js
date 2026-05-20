import express from 'express';
import {
  getDoctors,
  getDoctorById,
  approveDoctor,
  getPendingDoctors,
  updateAvailability,
} from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getDoctors);
router.post('/availability', protect, authorize('doctor'), updateAvailability);
router.get('/:id', getDoctorById);

// Admin-Only Routes
router.get('/admin/pending', protect, authorize('admin'), getPendingDoctors);
router.put('/approve/:id', protect, authorize('admin'), approveDoctor);

export default router;

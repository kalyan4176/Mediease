import express from 'express';
import { addReview, getDoctorReviews } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add', protect, authorize('patient'), addReview);
router.get('/doctor/:id', getDoctorReviews);

export default router;

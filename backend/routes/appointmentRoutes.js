import express from 'express';
import {
  bookAppointment,
  getAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} from '../controllers/appointController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all appointments routes

router.post('/book', bookAppointment);
router.get('/', getAppointments);
router.put('/update/:id', updateAppointmentStatus);
router.delete('/cancel/:id', cancelAppointment);

export default router;

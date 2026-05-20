import express from 'express';
import {
  registerPatient,
  registerDoctor,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerPatient);
router.post('/register-doctor', registerDoctor);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

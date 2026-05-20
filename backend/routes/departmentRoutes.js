import express from 'express';
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getDepartments)
  .post(protect, authorize('admin'), createDepartment);

router.route('/:id')
  .delete(protect, authorize('admin'), deleteDepartment);

export default router;

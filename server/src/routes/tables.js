import express from 'express';
import { body } from 'express-validator';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
} from '../controllers/tableController.js';

const router = express.Router();

router.get('/', getAllTables);

router.get('/:id', getTableById);

router.post(
  '/',
  protect,
  restrictTo(['admin']),
  [
    body('tableNumber').isInt({ min: 1 }).withMessage('Table number must be a positive integer'),
    body('capacity').isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),
  ],
  createTable
);

router.put(
  '/:id',
  protect,
  restrictTo(['admin']),
  [
    body('capacity').optional().isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),
    body('status').optional().isIn(['available', 'maintenance']).withMessage('Invalid status'),
  ],
  updateTable
);

router.delete('/:id', protect, restrictTo(['admin']), deleteTable);

export default router;

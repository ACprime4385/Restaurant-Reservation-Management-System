import express from 'express';
import { query, body } from 'express-validator';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getAvailableTables,
  createReservation,
  getMyReservations,
  cancelMyReservation,
  getAllReservations,
  updateReservation,
} from '../controllers/reservationController.js';

const router = express.Router();

router.get(
  '/available',
  [
    query('date').isISO8601().withMessage('Invalid date format'),
    query('timeSlot').notEmpty().withMessage('Time slot is required'),
    query('numberOfGuests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1'),
  ],
  getAvailableTables
);

router.post(
  '/',
  protect,
  restrictTo(['customer']),
  [
    body('tableId').notEmpty().withMessage('Table ID is required'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('timeSlot').notEmpty().withMessage('Time slot is required'),
    body('numberOfGuests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1'),
  ],
  createReservation
);

router.get('/', protect, restrictTo(['admin']), getAllReservations);

router.get('/my', protect, getMyReservations);

router.put(
  '/:id',
  protect,
  restrictTo(['admin']),
  [body('status').optional().isIn(['confirmed', 'cancelled']).withMessage('Invalid status')],
  updateReservation
);

router.delete('/:id', protect, cancelMyReservation);

export default router;

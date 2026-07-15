import { validationResult } from 'express-validator';
import Reservation from '../models/Reservation.js';
import { findAvailableTables, createReservationAtomic, cancelReservation } from '../services/bookingService.js';

export const getAvailableTables = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, timeSlot, numberOfGuests } = req.query;
    const tables = await findAvailableTables(new Date(date), timeSlot, Number(numberOfGuests));

    res.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

export const createReservation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tableId, date, timeSlot, numberOfGuests, notes } = req.body;

    const reservation = await createReservationAtomic(
      req.user._id,
      tableId,
      new Date(date),
      timeSlot,
      numberOfGuests,
      notes || ''
    );

    res.status(201).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ customer: req.user._id }).sort({ date: 1 });

    res.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelMyReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservation.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this reservation' });
    }

    const cancelled = await cancelReservation(req.params.id);

    res.json({
      success: true,
      data: cancelled,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReservations = async (req, res, next) => {
  try {
    const { date } = req.query;
    const filter = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const reservations = await Reservation.find(filter).sort({ date: 1 });

    res.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReservation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

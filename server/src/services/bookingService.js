import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';
import mongoose from 'mongoose';

export const findAvailableTables = async (date, timeSlot, numberOfGuests) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedTables = await Reservation.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    timeSlot,
    status: 'confirmed',
  }).select('table').lean();

  const bookedTableIds = bookedTables.map(r => r.table._id.toString());

  const availableTables = await Table.find({
    _id: { $nin: bookedTableIds },
    capacity: { $gte: numberOfGuests },
    status: 'available',
  }).sort({ capacity: 1 });

  return availableTables;
};

export const createReservationAtomic = async (customerId, tableId, date, timeSlot, numberOfGuests, notes) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const table = await Table.findById(tableId).session(session);
    if (!table) {
      throw new Error('Table not found');
    }

    if (table.capacity < numberOfGuests) {
      throw new Error(`Table capacity (${table.capacity}) is less than number of guests (${numberOfGuests})`);
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Reservation.findOne({
      table: tableId,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: 'confirmed',
    }).session(session);

    if (existing) {
      throw new Error('This table is already booked for this time slot');
    }

    const reservation = new Reservation({
      customer: customerId,
      table: tableId,
      date,
      timeSlot,
      numberOfGuests,
      notes,
      status: 'confirmed',
    });

    await reservation.save({ session });
    await session.commitTransaction();

    return reservation;
  } catch (error) {
    await session.abortTransaction();

    // Handle different types of booking conflicts
    if (
      error.code === 11000 ||
      error.errorLabels?.includes('TransientTransactionError') ||
      error.message?.includes('WriteConflict')
    ) {
      throw new Error('This table is already booked for this time slot');
    }

    throw error;
  } finally {
    session.endSession();
  }
};

export const cancelReservation = async (reservationId) => {
  const reservation = await Reservation.findByIdAndUpdate(
    reservationId,
    { status: 'cancelled' },
    { new: true }
  );

  if (!reservation) {
    throw new Error('Reservation not found');
  }

  return reservation;
};

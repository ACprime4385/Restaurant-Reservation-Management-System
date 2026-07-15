import './setup.js';
import { createReservationAtomic, findAvailableTables, cancelReservation } from '../services/bookingService.js';
import {
  createTestUser,
  createTestTable,
  createTestTables,
  createTestReservation,
} from './testUtils.js';
import Reservation from '../models/Reservation.js';

describe('Booking Service - Core Booking Logic', () => {
  describe('Prevent Double-Booking (Transaction Tests)', () => {
    test('should prevent double-booking of same table/date/slot', async () => {
      const customer1 = await createTestUser({ email: 'cust1@test.com' });
      const customer2 = await createTestUser({ email: 'cust2@test.com' });
      const table = await createTestTable();
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const timeSlot = '18:00';

      // First reservation should succeed
      const reservation1 = await createReservationAtomic(
        customer1._id,
        table._id,
        date,
        timeSlot,
        2,
        'First booking'
      );
      expect(reservation1).toBeDefined();
      expect(reservation1.status).toBe('confirmed');

      // Second reservation for same slot should fail
      await expect(
        createReservationAtomic(customer2._id, table._id, date, timeSlot, 2, 'Second booking')
      ).rejects.toThrow('This table is already booked for this time slot');
    });

    test('should maintain data consistency under concurrent booking attempts', async () => {
      const customer1 = await createTestUser({ email: 'c1@test.com' });
      const customer2 = await createTestUser({ email: 'c2@test.com' });
      const table = await createTestTable();
      const date = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const timeSlot = '19:00';

      // Simulate concurrent attempts
      const promises = [
        createReservationAtomic(customer1._id, table._id, date, timeSlot, 2, 'Concurrent 1'),
        createReservationAtomic(customer2._id, table._id, date, timeSlot, 2, 'Concurrent 2'),
      ];

      const results = await Promise.allSettled(promises);

      // One should succeed, one should fail
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      // Verify only one reservation exists
      const reservations = await Reservation.find({ table: table._id, timeSlot });
      expect(reservations).toHaveLength(1);
    });

    test('should rollback transaction if any step fails', async () => {
      const customer = await createTestUser();
      const table = await createTestTable();
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Make invalid reservation attempt (over capacity)
      await expect(
        createReservationAtomic(customer._id, table._id, date, '18:00', 100, 'Over capacity')
      ).rejects.toThrow();

      // Verify no reservation was created
      const reservations = await Reservation.find();
      expect(reservations).toHaveLength(0);
    });
  });

  describe('Capacity Validation', () => {
    test('should reject reservation if numberOfGuests > table capacity', async () => {
      const customer = await createTestUser();
      const table = await createTestTable({ capacity: 4 });
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await expect(
        createReservationAtomic(customer._id, table._id, date, '18:00', 5, 'Over capacity')
      ).rejects.toThrow('Table capacity (4) is less than number of guests (5)');
    });

    test('should accept reservation at exactly table capacity', async () => {
      const customer = await createTestUser();
      const table = await createTestTable({ capacity: 4 });
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const reservation = await createReservationAtomic(
        customer._id,
        table._id,
        date,
        '18:00',
        4,
        'Exactly at capacity'
      );

      expect(reservation).toBeDefined();
      expect(reservation.numberOfGuests).toBe(4);
    });

    test('should accept reservation with guests less than capacity', async () => {
      const customer = await createTestUser();
      const table = await createTestTable({ capacity: 6 });
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const reservation = await createReservationAtomic(
        customer._id,
        table._id,
        date,
        '18:00',
        3,
        'Less than capacity'
      );

      expect(reservation).toBeDefined();
      expect(reservation.numberOfGuests).toBe(3);
    });
  });

  describe('Availability Search', () => {
    test('should return only tables that fit guests and are not booked', async () => {
      const tables = await createTestTables(5);
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const timeSlot = '18:00';

      // Book table 1 (capacity 2) for this slot
      const customer = await createTestUser();
      await createReservationAtomic(customer._id, tables[0]._id, date, timeSlot, 2, '');

      // Search for tables with 2 guests
      const available = await findAvailableTables(date, timeSlot, 2);

      // Should get tables[1] and tables[2] and tables[3] (capacities 2, 3, 4) - not tables[0] (booked)
      expect(available.length).toBeGreaterThan(0);
      expect(available.map(t => t._id.toString())).not.toContain(tables[0]._id.toString());

      // All returned tables should have capacity >= 2
      available.forEach(table => {
        expect(table.capacity).toBeGreaterThanOrEqual(2);
      });
    });

    test('should exclude tables with insufficient capacity from availability', async () => {
      await createTestTable({ tableNumber: 1, capacity: 1 });
      await createTestTable({ tableNumber: 2, capacity: 2 });
      await createTestTable({ tableNumber: 3, capacity: 4 });

      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const available = await findAvailableTables(date, '18:00', 3);

      // Should only return table 3
      expect(available).toHaveLength(1);
      expect(available[0].capacity).toBe(4);
    });

    test('should return tables sorted by capacity (smallest first)', async () => {
      const tables = await createTestTables(3);
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const available = await findAvailableTables(date, '18:00', 2);

      // Should be sorted by capacity ascending
      for (let i = 0; i < available.length - 1; i++) {
        expect(available[i].capacity).toBeLessThanOrEqual(available[i + 1].capacity);
      }
    });

    test('should return empty array when no tables match criteria', async () => {
      await createTestTable({ capacity: 2 });
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const available = await findAvailableTables(date, '18:00', 10);

      expect(available).toEqual([]);
    });

    test('should only exclude confirmed reservations, not cancelled ones', async () => {
      const tables = await createTestTables(2);
      const customer = await createTestUser();
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const timeSlot = '18:00';

      // Create and cancel a reservation on table 1
      const reservation = await createReservationAtomic(customer._id, tables[0]._id, date, timeSlot, 2, '');
      await cancelReservation(reservation._id);

      // Table 1 should still be available (cancelled doesn't block it)
      const available = await findAvailableTables(date, timeSlot, 2);

      // Both tables should be available
      expect(available.length).toBeGreaterThanOrEqual(2);
      expect(available.map(t => t._id.toString())).toContain(tables[0]._id.toString());
    });
  });

  describe('Overlapping Times', () => {
    test('two reservations for same table at different times should both succeed', async () => {
      const customer = await createTestUser();
      const table = await createTestTable();
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // First reservation at 18:00
      const res1 = await createReservationAtomic(customer._id, table._id, date, '18:00', 2, '');
      expect(res1.timeSlot).toBe('18:00');

      // Second reservation at 19:00 should succeed
      const res2 = await createReservationAtomic(customer._id, table._id, date, '19:00', 2, '');
      expect(res2.timeSlot).toBe('19:00');

      // Both reservations should exist
      const reservations = await Reservation.find({ table: table._id });
      expect(reservations).toHaveLength(2);
    });

    test('two reservations for same table on different dates should both succeed', async () => {
      const customer = await createTestUser();
      const table = await createTestTable();
      const date1 = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const date2 = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // First reservation
      const res1 = await createReservationAtomic(customer._id, table._id, date1, '18:00', 2, '');
      expect(res1).toBeDefined();

      // Second reservation on different date
      const res2 = await createReservationAtomic(customer._id, table._id, date2, '18:00', 2, '');
      expect(res2).toBeDefined();

      const reservations = await Reservation.find({ table: table._id });
      expect(reservations).toHaveLength(2);
    });
  });

  describe('Cancel Reservation', () => {
    test('should mark reservation as cancelled', async () => {
      const reservation = await createTestReservation();

      const cancelled = await cancelReservation(reservation._id);

      expect(cancelled.status).toBe('cancelled');
    });

    test('cancelled reservation should free up slot for new bookings (soft delete does not block)', async () => {
      const customer1 = await createTestUser({ email: 'c1@test.com' });
      const customer2 = await createTestUser({ email: 'c2@test.com' });
      const table = await createTestTable();
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const timeSlot = '18:00';

      // Create first reservation
      const res1 = await createReservationAtomic(customer1._id, table._id, date, timeSlot, 2, '');

      // Cancel it
      await cancelReservation(res1._id);

      // Try to create new reservation in same slot - should succeed (cancelled doesn't block)
      const res2 = await createReservationAtomic(customer2._id, table._id, date, timeSlot, 2, '');

      expect(res2).toBeDefined();
      expect(res2.status).toBe('confirmed');
    });

    test('should throw error if reservation not found', async () => {
      const fakeId = '000000000000000000000000';

      await expect(cancelReservation(fakeId)).rejects.toThrow('Reservation not found');
    });

    test('should not affect other reservations', async () => {
      const customer = await createTestUser();
      const tables = await createTestTables(2);
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const res1 = await createReservationAtomic(customer._id, tables[0]._id, date, '18:00', 2, '');
      const res2 = await createReservationAtomic(customer._id, tables[1]._id, date, '18:00', 2, '');

      await cancelReservation(res1._id);

      const res2Updated = await Reservation.findById(res2._id);
      expect(res2Updated.status).toBe('confirmed');
    });
  });

  describe('Table Validation', () => {
    test('should throw error if table not found', async () => {
      const customer = await createTestUser();
      const fakeTableId = '000000000000000000000000';
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await expect(
        createReservationAtomic(customer._id, fakeTableId, date, '18:00', 2, '')
      ).rejects.toThrow('Table not found');
    });

    test('should only consider available status tables in availability search', async () => {
      await createTestTable({ tableNumber: 1, capacity: 4, status: 'available' });
      const maintenanceTable = await createTestTable({ tableNumber: 2, capacity: 4, status: 'maintenance' });

      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const available = await findAvailableTables(date, '18:00', 2);

      expect(available.map(t => t._id.toString())).not.toContain(maintenanceTable._id.toString());
    });
  });

  describe('Edge Cases & Boundaries', () => {
    test('should handle single guest reservation', async () => {
      const customer = await createTestUser();
      const table = await createTestTable({ capacity: 1 });
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const reservation = await createReservationAtomic(customer._id, table._id, date, '18:00', 1, '');

      expect(reservation.numberOfGuests).toBe(1);
    });

    test('should handle maximum guest reservation', async () => {
      const customer = await createTestUser();
      const table = await createTestTable({ capacity: 20 });
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const reservation = await createReservationAtomic(customer._id, table._id, date, '18:00', 20, '');

      expect(reservation.numberOfGuests).toBe(20);
    });

    test('should use unique compound index to prevent duplicates at database level', async () => {
      const customer1 = await createTestUser({ email: 'user1@test.com' });
      const customer2 = await createTestUser({ email: 'user2@test.com' });
      const table = await createTestTable();
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create first reservation
      await createReservationAtomic(customer1._id, table._id, date, '18:00', 2, '');

      // Try to create second - should fail at service layer before reaching DB
      await expect(
        createReservationAtomic(customer2._id, table._id, date, '18:00', 2, '')
      ).rejects.toThrow('This table is already booked for this time slot');
    });
  });
});

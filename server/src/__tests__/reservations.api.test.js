import './setup.js';
import request from 'supertest';
import express from 'express';
import reservationRoutes from '../routes/reservations.js';
import authRoutes from '../routes/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import {
  createTestUser,
  createTestAdmin,
  createTestTables,
  generateToken,
} from './testUtils.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use(errorHandler);

describe('Reservations API Endpoints', () => {
  let customer;
  let admin;
  let tables;
  let customerToken;
  let adminToken;

  beforeEach(async () => {
    customer = await createTestUser({ email: `cust-${Date.now()}@test.com` });
    admin = await createTestAdmin({ email: `admin-${Date.now()}@test.com` });
    tables = await createTestTables(5);
    customerToken = generateToken(customer._id);
    adminToken = generateToken(admin._id);
  });

  describe('GET /api/reservations/available', () => {
    test('should return available tables for given date, time, and guest count', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .get('/api/reservations/available')
        .query({
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(table => {
        expect(table.capacity).toBeGreaterThanOrEqual(2);
      });
    });

    test('should return 400 if date is invalid', async () => {
      const response = await request(app)
        .get('/api/reservations/available')
        .query({
          date: 'invalid-date',
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if numberOfGuests is invalid', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .get('/api/reservations/available')
        .query({
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if timeSlot is missing', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .get('/api/reservations/available')
        .query({
          date: date.toISOString(),
          numberOfGuests: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should exclude booked tables from availability', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const timeSlot = '18:00';

      // Create a reservation
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot,
          numberOfGuests: 2,
        });

      // Check availability
      const response = await request(app)
        .get('/api/reservations/available')
        .query({
          date: date.toISOString(),
          timeSlot,
          numberOfGuests: 2,
        });

      // Table 0 should not be in available list
      const availableIds = response.body.data.map(t => t._id);
      expect(availableIds).not.toContain(tables[0]._id.toString());
    });

    test('should return tables sorted by capacity', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .get('/api/reservations/available')
        .query({
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      const data = response.body.data;
      for (let i = 0; i < data.length - 1; i++) {
        expect(data[i].capacity).toBeLessThanOrEqual(data[i + 1].capacity);
      }
    });
  });

  describe('POST /api/reservations', () => {
    test('should create reservation with valid data', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
          notes: 'Window seat preferred',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');
      expect(response.body.data.numberOfGuests).toBe(2);
      expect(response.body.data.notes).toBe('Window seat preferred');
    });

    test('should return 401 if not authenticated', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/reservations')
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      expect(response.status).toBe(401);
    });

    test('should return 403 if user is not a customer', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permission');
    });

    test('should return 400 if tableId is missing', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if date is invalid', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: 'invalid-date',
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if numberOfGuests is invalid', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 409 when attempting duplicate booking', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // First booking
      const res1 = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      expect(res1.status).toBe(201);

      // Create second customer for duplicate attempt
      const customer2 = await createTestUser({ email: 'cust2@test.com' });
      const customer2Token = generateToken(customer2._id);

      // Second booking same table/time/slot
      const res2 = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      expect(res2.status).toBe(409);
      expect(res2.body.error).toContain('already booked');
    });

    test('should allow reservations at different times for same table', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const res1 = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '19:00',
          numberOfGuests: 2,
        });

      expect(res2.status).toBe(201);
    });
  });

  describe('GET /api/reservations/my', () => {
    test('should return authenticated user reservations', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create reservation
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      const response = await request(app)
        .get('/api/reservations/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].customer._id).toBe(customer._id.toString());
    });

    test('should return empty array if no reservations', async () => {
      const response = await request(app)
        .get('/api/reservations/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });

    test('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/reservations/my');

      expect(response.status).toBe(401);
    });

    test('should only return reservations for logged-in user', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const customer2 = await createTestUser({ email: 'other@test.com' });
      const customer2Token = generateToken(customer2._id);

      // Customer 1 creates reservation
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      // Customer 2 creates reservation
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          tableId: tables[1]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      // Customer 1 views their reservations
      const response = await request(app)
        .get('/api/reservations/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.body.count).toBe(1);
      expect(response.body.data[0].customer._id).toBe(customer._id.toString());
    });

    test('should sort reservations by date', async () => {
      const date1 = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const date2 = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // Create reservations
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date2.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[1]._id.toString(),
          date: date1.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      const response = await request(app)
        .get('/api/reservations/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.body.data[0].date < response.body.data[1].date).toBe(true);
    });
  });

  describe('DELETE /api/reservations/:id', () => {
    test('should cancel own reservation', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      const reservationId = createRes.body.data._id;

      const response = await request(app)
        .delete(`/api/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });

    test('should return 404 if reservation not found', async () => {
      const fakeId = '000000000000000000000000';
      const response = await request(app)
        .delete(`/api/reservations/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    test('should return 403 if cancelling others reservation', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const customer2 = await createTestUser({ email: 'other2@test.com' });
      const customer2Token = generateToken(customer2._id);

      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      const reservationId = createRes.body.data._id;

      const response = await request(app)
        .delete(`/api/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });

    test('should return 401 if not authenticated', async () => {
      const fakeId = '000000000000000000000000';
      const response = await request(app).delete(`/api/reservations/${fakeId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reservations (admin)', () => {
    test('should return all reservations for admin', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create reservations from multiple customers
      const customer2 = await createTestUser({ email: 'cust2@test.com' });
      const customer2Token = generateToken(customer2._id);

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          tableId: tables[1]._id.toString(),
          date: date.toISOString(),
          timeSlot: '19:00',
          numberOfGuests: 3,
        });

      const response = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    test('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permission');
    });

    test('should filter by date if provided', async () => {
      const date1 = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const date2 = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date1.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[1]._id.toString(),
          date: date2.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      const response = await request(app)
        .get('/api/reservations')
        .query({ date: date1.toISOString() })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
    });
  });

  describe('PUT /api/reservations/:id (admin)', () => {
    test('should update reservation status', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      const reservationId = createRes.body.data._id;

      const response = await request(app)
        .put(`/api/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('cancelled');
    });

    test('should update reservation notes', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      const reservationId = createRes.body.data._id;

      const response = await request(app)
        .put(`/api/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Customer requested window seat' });

      expect(response.status).toBe(200);
      expect(response.body.data.notes).toBe('Customer requested window seat');
    });

    test('should return 403 if not admin', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      const reservationId = createRes.body.data._id;

      const response = await request(app)
        .put(`/api/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'cancelled' });

      expect(response.status).toBe(403);
    });

    test('should return 400 if invalid status', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableId: tables[0]._id.toString(),
          date: date.toISOString(),
          timeSlot: '18:00',
          numberOfGuests: 2,
        });

      const reservationId = createRes.body.data._id;

      const response = await request(app)
        .put(`/api/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
    });
  });
});

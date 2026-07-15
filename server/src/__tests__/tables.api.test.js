import './setup.js';
import request from 'supertest';
import express from 'express';
import tableRoutes from '../routes/tables.js';
import authRoutes from '../routes/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import {
  createTestUser,
  createTestAdmin,
  createTestTable,
  createTestTables,
  generateToken,
} from './testUtils.js';
import Table from '../models/Table.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use(errorHandler);

describe('Tables API Endpoints', () => {
  let customer;
  let admin;
  let customerToken;
  let adminToken;

  beforeEach(async () => {
    customer = await createTestUser({ email: `cust-${Date.now()}@test.com` });
    admin = await createTestAdmin({ email: `admin-${Date.now()}@test.com` });
    customerToken = generateToken(customer._id);
    adminToken = generateToken(admin._id);
  });

  describe('GET /api/tables', () => {
    test('should return all tables', async () => {
      await createTestTables(3);

      const response = await request(app).get('/api/tables');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should return empty array if no tables', async () => {
      const response = await request(app).get('/api/tables');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });

    test('should return tables sorted by tableNumber', async () => {
      await createTestTable({ tableNumber: 3, capacity: 4 });
      await createTestTable({ tableNumber: 1, capacity: 2 });
      await createTestTable({ tableNumber: 2, capacity: 4 });

      const response = await request(app).get('/api/tables');

      expect(response.body.data[0].tableNumber).toBe(1);
      expect(response.body.data[1].tableNumber).toBe(2);
      expect(response.body.data[2].tableNumber).toBe(3);
    });

    test('should include table details', async () => {
      await createTestTable({ tableNumber: 5, capacity: 6, status: 'available' });

      const response = await request(app).get('/api/tables');

      const table = response.body.data[0];
      expect(table.tableNumber).toBeDefined();
      expect(table.capacity).toBeDefined();
      expect(table.status).toBeDefined();
      expect(table._id).toBeDefined();
    });

    test('should not require authentication', async () => {
      await createTestTables(2);

      const response = await request(app).get('/api/tables');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/tables/:id', () => {
    test('should return table by id', async () => {
      const table = await createTestTable({ tableNumber: 10, capacity: 4 });

      const response = await request(app).get(`/api/tables/${table._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tableNumber).toBe(10);
      expect(response.body.data.capacity).toBe(4);
    });

    test('should return 404 if table not found', async () => {
      const fakeId = '000000000000000000000000';

      const response = await request(app).get(`/api/tables/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    test('should not require authentication', async () => {
      const table = await createTestTable();

      const response = await request(app).get(`/api/tables/${table._id}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/tables (admin)', () => {
    test('should create table with valid data', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber: 20,
          capacity: 8,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tableNumber).toBe(20);
      expect(response.body.data.capacity).toBe(8);
      expect(response.body.data.status).toBe('available');
    });

    test('should return 400 if tableNumber is missing', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          capacity: 4,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if capacity is missing', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber: 15,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if tableNumber is not positive integer', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber: -5,
          capacity: 4,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if capacity is out of range', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber: 15,
          capacity: 25, // max is 20
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 409 if tableNumber already exists', async () => {
      await createTestTable({ tableNumber: 30 });

      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber: 30,
          capacity: 4,
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    test('should return 401 if not authenticated', async () => {
      const response = await request(app).post('/api/tables').send({
        tableNumber: 15,
        capacity: 4,
      });

      expect(response.status).toBe(401);
    });

    test('should return 403 if not admin', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableNumber: 15,
          capacity: 4,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permission');
    });

    test('should accept capacity of 1', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber: 99,
          capacity: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.capacity).toBe(1);
    });

    test('should accept capacity of 20', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber: 98,
          capacity: 20,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.capacity).toBe(20);
    });
  });

  describe('PUT /api/tables/:id (admin)', () => {
    test('should update table capacity', async () => {
      const table = await createTestTable({ tableNumber: 40, capacity: 4 });

      const response = await request(app)
        .put(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          capacity: 6,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.capacity).toBe(6);
    });

    test('should update table status', async () => {
      const table = await createTestTable({ tableNumber: 41, capacity: 4 });

      const response = await request(app)
        .put(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'maintenance',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('maintenance');
    });

    test('should update capacity and status together', async () => {
      const table = await createTestTable({ tableNumber: 42, capacity: 4 });

      const response = await request(app)
        .put(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          capacity: 8,
          status: 'maintenance',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.capacity).toBe(8);
      expect(response.body.data.status).toBe('maintenance');
    });

    test('should return 404 if table not found', async () => {
      const fakeId = '000000000000000000000000';

      const response = await request(app)
        .put(`/api/tables/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          capacity: 6,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    test('should return 400 if capacity is out of range', async () => {
      const table = await createTestTable();

      const response = await request(app)
        .put(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          capacity: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if status is invalid', async () => {
      const table = await createTestTable();

      const response = await request(app)
        .put(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 403 if not admin', async () => {
      const table = await createTestTable();

      const response = await request(app)
        .put(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          capacity: 6,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permission');
    });

    test('should return 401 if not authenticated', async () => {
      const table = await createTestTable();

      const response = await request(app)
        .put(`/api/tables/${table._id}`)
        .send({
          capacity: 6,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/tables/:id (admin)', () => {
    test('should delete table', async () => {
      const table = await createTestTable({ tableNumber: 50 });

      const response = await request(app)
        .delete(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify table is deleted
      const foundTable = await Table.findById(table._id);
      expect(foundTable).toBeNull();
    });

    test('should return 404 if table not found', async () => {
      const fakeId = '000000000000000000000000';

      const response = await request(app)
        .delete(`/api/tables/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    test('should return 403 if not admin', async () => {
      const table = await createTestTable();

      const response = await request(app)
        .delete(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permission');
    });

    test('should return 401 if not authenticated', async () => {
      const table = await createTestTable();

      const response = await request(app).delete(`/api/tables/${table._id}`);

      expect(response.status).toBe(401);
    });

    test('should not affect other tables', async () => {
      const table1 = await createTestTable({ tableNumber: 51 });
      const table2 = await createTestTable({ tableNumber: 52 });

      await request(app)
        .delete(`/api/tables/${table1._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const foundTable2 = await Table.findById(table2._id);
      expect(foundTable2).toBeDefined();
    });
  });

  describe('Role-Based Access Control', () => {
    test('customer cannot create table', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableNumber: 60,
          capacity: 4,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permission');
    });

    test('customer cannot update table', async () => {
      const table = await createTestTable();

      const response = await request(app)
        .put(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          capacity: 6,
        });

      expect(response.status).toBe(403);
    });

    test('customer cannot delete table', async () => {
      const table = await createTestTable();

      const response = await request(app)
        .delete(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    test('customer can view all tables', async () => {
      await createTestTables(3);

      const response = await request(app)
        .get('/api/tables')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
    });

    test('admin can create table', async () => {
      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tableNumber: 61,
          capacity: 4,
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Table Status Transitions', () => {
    test('table should start with available status', async () => {
      const table = await createTestTable();

      expect(table.status).toBe('available');
    });

    test('should transition table to maintenance', async () => {
      const table = await createTestTable();

      const response = await request(app)
        .put(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'maintenance',
        });

      expect(response.body.data.status).toBe('maintenance');
    });

    test('should transition table back to available', async () => {
      const table = await createTestTable({ status: 'maintenance' });

      const response = await request(app)
        .put(`/api/tables/${table._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'available',
        });

      expect(response.body.data.status).toBe('available');
    });
  });
});

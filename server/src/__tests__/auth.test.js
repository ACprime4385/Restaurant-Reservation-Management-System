import './setup.js';
import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.js';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';


// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.get('/api/protected', protect, (req, res) => {
  res.json({ user: req.user });
});

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new user with valid data', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john@test.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.name).toBe('John Doe');
      expect(response.body.user.email).toBe('john@test.com');
      expect(response.body.user.role).toBe('customer'); // default role
      expect(response.body.user.password).toBeUndefined(); // password should not be returned
    });

    test('should register user with admin role if specified', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
      });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('admin');
    });

    test('should return 400 if name is missing', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'user@test.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if email is invalid', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if password is less than 6 characters', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'user@test.com',
        password: '12345',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 409 if user already exists', async () => {
      const email = 'duplicate@test.com';

      // Register first user
      await request(app).post('/api/auth/register').send({
        name: 'User 1',
        email,
        password: 'password123',
      });

      // Try to register with same email
      const response = await request(app).post('/api/auth/register').send({
        name: 'User 2',
        email,
        password: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    test('should hash password before storing', async () => {
      const password = 'mySecurePassword123';

      await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'secure@test.com',
        password,
      });

      const user = await User.findOne({ email: 'secure@test.com' }).select('+password');
      expect(user.password).not.toBe(password);
      expect(user.password).toHaveLength(60); // bcrypt hash length
    });

    test('should return valid JWT token', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'jwt@test.com',
        password: 'password123',
      });

      expect(response.body.token).toBeTruthy();
      // Token should be a valid JWT (3 parts separated by dots)
      const parts = response.body.token.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
      });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@test.com');
    });

    test('should return 400 if email is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 if password is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 401 if user does not exist', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@test.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should return 401 if password is incorrect', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should not return password in response', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(response.body.user.password).toBeUndefined();
    });

    test('should return valid JWT token on successful login', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(response.body.token).toBeTruthy();
      const parts = response.body.token.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return user data with valid token', async () => {
      const registerRes = await request(app).post('/api/auth/register').send({
        name: 'Current User',
        email: 'current@test.com',
        password: 'password123',
      });

      const token = registerRes.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('Current User');
      expect(response.body.user.email).toBe('current@test.com');
    });

    test('should return 401 if no token provided', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Not authorized');
    });

    test('should return 401 if token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Not authorized');
    });

    test('should return 401 if token has expired signature', async () => {
      // Create an invalid JWT
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAifQ.invalid_signature';

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });

    test('should not include password in me response', async () => {
      const registerRes = await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'nopass@test.com',
        password: 'password123',
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerRes.body.token}`);

      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('JWT Token Handling', () => {
    test('should include Authorization Bearer prefix in token', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'bearer@test.com',
        password: 'password123',
      });

      const token = response.body.token;
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meResponse.status).toBe(200);
    });

    test('should fail if Bearer prefix is missing', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'nobearer@test.com',
        password: 'password123',
      });

      const token = response.body.token;
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', token); // Missing "Bearer " prefix

      expect(meResponse.status).toBe(401);
    });
  });

  describe('Protected Routes', () => {
    test('should allow access to protected route with valid token', async () => {
      const registerRes = await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'protected@test.com',
        password: 'password123',
      });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${registerRes.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });

    test('should deny access to protected route without token', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.status).toBe(401);
    });
  });
});

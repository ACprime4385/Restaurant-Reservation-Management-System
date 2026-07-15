import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Table from '../models/Table.js';
import Reservation from '../models/Reservation.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const createTestUser = async (userData = {}) => {
  const defaults = {
    name: 'Test User',
    email: `user-${Date.now()}@test.com`,
    password: 'password123',
    role: 'customer',
  };

  const user = await User.create({ ...defaults, ...userData });
  return user;
};

export const createTestAdmin = async (userData = {}) => {
  return createTestUser({ ...userData, role: 'admin' });
};

export const createTestTable = async (tableData = {}) => {
  const defaults = {
    tableNumber: Math.floor(Math.random() * 100),
    capacity: 4,
    status: 'available',
  };

  const table = await Table.create({ ...defaults, ...tableData });
  return table;
};

export const createTestTables = async (count = 5) => {
  const tables = [];
  for (let i = 0; i < count; i++) {
    tables.push(await createTestTable({ tableNumber: i + 1, capacity: (i % 3) + 2 }));
  }
  return tables;
};

export const createTestReservation = async (reservationData = {}) => {
  const user = await createTestUser();
  const table = await createTestTable();

  const defaults = {
    customer: user._id,
    table: table._id,
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    timeSlot: '18:00',
    numberOfGuests: 2,
    status: 'confirmed',
    notes: '',
  };

  const reservation = await Reservation.create({ ...defaults, ...reservationData });
  return reservation;
};

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const getAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

export const seedTestData = async () => {
  const admin = await createTestAdmin();
  const customer1 = await createTestUser({ email: 'customer1@test.com' });
  const customer2 = await createTestUser({ email: 'customer2@test.com' });

  const tables = await createTestTables(5);

  return {
    admin,
    customer1,
    customer2,
    tables,
  };
};

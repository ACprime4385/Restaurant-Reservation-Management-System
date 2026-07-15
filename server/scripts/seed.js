import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Table from '../src/models/Table.js';

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    await User.deleteMany({});
    await Table.deleteMany({});
    console.log('✓ Cleared existing data');

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@restaurant.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('✓ Created admin user:', adminUser.email);

    const customerUser = await User.create({
      name: 'John Doe',
      email: 'customer@restaurant.com',
      password: 'customer123',
      role: 'customer',
    });
    console.log('✓ Created test customer:', customerUser.email);

    const tables = await Table.insertMany([
      { tableNumber: 1, capacity: 2 },
      { tableNumber: 2, capacity: 2 },
      { tableNumber: 3, capacity: 4 },
      { tableNumber: 4, capacity: 4 },
      { tableNumber: 5, capacity: 6 },
      { tableNumber: 6, capacity: 6 },
      { tableNumber: 7, capacity: 8 },
      { tableNumber: 8, capacity: 8 },
      { tableNumber: 9, capacity: 10 },
      { tableNumber: 10, capacity: 10 },
    ]);
    console.log(`✓ Created ${tables.length} tables`);

    console.log('\n=== Seed Credentials ===');
    console.log('Admin Email: admin@restaurant.com');
    console.log('Admin Password: admin123');
    console.log('Customer Email: customer@restaurant.com');
    console.log('Customer Password: customer123');

    process.exit(0);
  } catch (error) {
    console.error('✗ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();

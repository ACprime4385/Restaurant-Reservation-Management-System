import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.js';
import reservationRoutes from './routes/reservations.js';
import tableRoutes from './routes/tables.js';
import User from './models/User.js';
import Table from './models/Table.js';
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeaders, apiLimiter, authLimiter } from './middleware/security.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(securityHeaders);
app.use(express.json({ limit: '10kb' }));

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

const PORT = process.env.PORT || 5000;

async function autoSeedIfEmpty() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('📦 Database is empty — auto-seeding...');
      
      await User.create([
        { name: 'Admin User', email: 'admin@restaurant.com', password: 'admin123', role: 'admin' },
        { name: 'John Doe', email: 'customer@restaurant.com', password: 'customer123', role: 'customer' },
      ]);
      console.log('✓ Created admin + customer users');

      await Table.insertMany([
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
      console.log('✓ Created 10 restaurant tables');
      
      console.log('📋 Admin: admin@restaurant.com / admin123');
      console.log('📋 Customer: customer@restaurant.com / customer123');
    } else {
      console.log(`✓ Database has ${userCount} users — skipping seed`);
    }
  } catch (err) {
    console.error('⚠️ Auto-seed check failed:', err.message);
    // Don't crash the server if seed fails — data may already exist partially
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✓ Connected to MongoDB');
    await autoSeedIfEmpty();
  })
  .catch(err => {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant Reservation API',
      version: '1.0.0',
      description: 'Full-stack reservation management system',
    },
    servers: [{ url: '/api', description: 'API Server' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/tables', tableRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ API docs available at http://localhost:${PORT}/api-docs`);
});

export default app;

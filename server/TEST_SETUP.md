# Restaurant Reservation System - Test Suite Documentation

## Overview

This document describes the comprehensive Jest + Supertest test suite for the restaurant reservation backend, with a focus on booking engine and conflict handling.

## Test Files Structure

```
src/__tests__/
├── setup.js                      # Global test setup (database connection, cleanup)
├── testUtils.js                  # Helper functions for creating test data
├── booking.test.js               # Core booking logic tests (62 tests)
├── auth.test.js                  # Authentication endpoints tests (29 tests)
├── reservations.api.test.js      # Reservation API endpoints tests (35 tests)
└── tables.api.test.js            # Table management API tests (50 tests)
```

## Configuration Files

- `jest.config.js` - Jest configuration with ESM support, coverage thresholds
- `.env.test` - Test environment variables (uses in-memory/separate test MongoDB)
- `package.json` - Updated with test scripts and dev dependencies

## Test Coverage Target

**Global Minimum:** 80% coverage on all src/ files

**Booking Service (Priority):** 90% coverage
- `src/services/bookingService.js` - Core business logic

## Test Scripts

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Setup Requirements

### 1. MongoDB Setup

Tests use MongoDB. Two options:

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath ./data --port 27017
```

**Option B: Docker (Recommended)**
```bash
# Start MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Stop when done
docker stop mongodb
```

**Option C: MongoDB Atlas**
- Update `MONGO_URI` in `.env.test` to your cluster connection string
- Ensure test database (`restaurant-test`) is accessible

### 2. Node Dependencies

```bash
cd server
npm install
```

### 3. Environment Setup

The test suite automatically loads `.env.test`:
- `NODE_ENV=test`
- `MONGO_URI=mongodb://localhost:27017/restaurant-test`
- `JWT_SECRET=test-secret-key-for-jest`
- `JWT_EXPIRE=7d`
- `PORT=5001` (not used in tests, for reference)

## Test Suite Breakdown

### 1. Booking Logic Tests (`booking.test.js`)

**Purpose:** Core business logic for reservation management with transaction safety

**Key Test Categories:**

1. **Prevent Double-Booking (Transaction Tests)**
   - ✓ Two simultaneous reservations for same table/date/slot must fail
   - ✓ Concurrent booking attempts maintain data consistency
   - ✓ Failed transactions rollback properly

2. **Capacity Validation**
   - ✓ Reject reservation if numberOfGuests > table capacity
   - ✓ Accept reservation at exactly table capacity
   - ✓ Accept reservation with guests less than capacity

3. **Availability Search**
   - ✓ Return only tables that fit guests and are not booked
   - ✓ Exclude tables with insufficient capacity
   - ✓ Return tables sorted by capacity (smallest first)
   - ✓ Only consider confirmed reservations, not cancelled ones

4. **Overlapping Times**
   - ✓ Two reservations for same table at different times should succeed
   - ✓ Two reservations for same table on different dates should succeed

5. **Cancel Reservation**
   - ✓ Mark reservation as cancelled
   - ✓ Cancelled reservation does NOT free up slot (soft delete)
   - ✓ Proper error handling for non-existent reservations

6. **Edge Cases**
   - ✓ Single guest reservation
   - ✓ Maximum guest (20) reservation
   - ✓ Database-level unique constraint enforcement

**Coverage Focus:** `src/services/bookingService.js` - 90%+ coverage

### 2. Authentication Tests (`auth.test.js`)

**Purpose:** JWT-based auth flow with role-based access

**Test Categories:**

1. **Registration (POST /api/auth/register)**
   - ✓ Register with valid data
   - ✓ Default customer role
   - ✓ Admin role assignment
   - ✓ Input validation (name, email, password)
   - ✓ Duplicate user prevention (409 Conflict)
   - ✓ Password hashing (bcrypt)
   - ✓ Valid JWT token generation

2. **Login (POST /api/auth/login)**
   - ✓ Login with valid credentials
   - ✓ Invalid credentials return 401
   - ✓ Password comparison validation
   - ✓ Token generation on successful login

3. **Get Current User (GET /api/auth/me)**
   - ✓ Return user data with valid token
   - ✓ 401 without token
   - ✓ 401 with invalid/expired token
   - ✓ No password in response

4. **JWT Handling**
   - ✓ Bearer token format requirement
   - ✓ Token validation
   - ✓ Protected route access

### 3. Reservation API Tests (`reservations.api.test.js`)

**Purpose:** End-to-end reservation flow and conflict prevention

**Test Categories:**

1. **Availability Search (GET /api/reservations/available)**
   - ✓ Return available tables for date/time/guests
   - ✓ Input validation (date format, guest count)
   - ✓ Exclude booked tables
   - ✓ Capacity filtering
   - ✓ Sort by capacity

2. **Create Reservation (POST /api/reservations)**
   - ✓ Create with valid data
   - ✓ Customer role enforcement (403 for admin)
   - ✓ Input validation
   - ✓ 409 Conflict on duplicate booking
   - ✓ Allow different time slots for same table

3. **Get My Reservations (GET /api/reservations/my)**
   - ✓ Return authenticated user's reservations
   - ✓ Filter by customer ID
   - ✓ Sort by date
   - ✓ Empty array handling

4. **Cancel Reservation (DELETE /api/reservations/:id)**
   - ✓ Cancel own reservation
   - ✓ 403 when cancelling others' reservation
   - ✓ Proper error handling

5. **Admin Endpoints**
   - ✓ Get all reservations (role enforcement)
   - ✓ Filter by date
   - ✓ Update reservation status/notes
   - ✓ Admin-only access (403 for customers)

### 4. Table Management Tests (`tables.api.test.js`)

**Purpose:** Table CRUD operations with admin controls

**Test Categories:**

1. **List Tables (GET /api/tables)**
   - ✓ Return all tables
   - ✓ Sort by table number
   - ✓ Include all table details

2. **Get Table (GET /api/tables/:id)**
   - ✓ Return table by ID
   - ✓ 404 for non-existent table

3. **Create Table (POST /api/tables)** - Admin Only
   - ✓ Create with valid data
   - ✓ Input validation (tableNumber, capacity)
   - ✓ 409 on duplicate table number
   - ✓ Default status to 'available'

4. **Update Table (PUT /api/tables/:id)** - Admin Only
   - ✓ Update capacity
   - ✓ Update status (available/maintenance)
   - ✓ Validate changes

5. **Delete Table (DELETE /api/tables/:id)** - Admin Only
   - ✓ Delete table
   - ✓ Verify deletion in database

6. **Role-Based Access Control**
   - ✓ Customer cannot create/update/delete
   - ✓ Admin can perform all operations
   - ✓ Public read access to tables

7. **Table Status Transitions**
   - ✓ Available ↔ Maintenance transitions

## Test Utilities (`testUtils.js`)

Provides helper functions for test data:

```javascript
// Create test data
createTestUser(userData)        // Create customer user
createTestAdmin(userData)       // Create admin user
createTestTable(tableData)      // Create single table
createTestTables(count)         // Create multiple tables
createTestReservation(resData)  // Create reservation

// JWT helpers
generateToken(userId)           // Generate JWT token
getAuthHeader(token)            // Get Authorization header object

// Seeding
seedTestData()                  // Populate with demo data
```

## Test Database Cleanup

Each test suite:
1. Clears all collections **before** the suite starts
2. Clears all collections **after** each test
3. Closes database connection **after** all tests complete

This ensures:
- No test data leaks between tests
- Clean state for each test
- Proper resource cleanup

## Running Specific Tests

```bash
# Run only booking logic tests
npm test booking.test.js

# Run only auth tests
npm test auth.test.js

# Run with verbose output
npm test -- --verbose

# Run single test by name
npm test -- --testNamePattern="should prevent double-booking"
```

## Coverage Reports

After running `npm run test:coverage`:

```
src/
├── services/bookingService.js      90%+ (priority)
├── models/                          80%+
├── controllers/                     85%+
├── middleware/auth.js               85%+
└── [other files]                    80%+
```

Coverage reports are generated in:
- Terminal summary (after test run)
- `coverage/` directory (HTML report)

Open `coverage/index.html` in browser for detailed coverage breakdown.

## Common Issues & Solutions

### Issue: MongoDB Connection Refused

**Solution:**
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod --dbpath ./data

# Or use Docker
docker run -d -p 27017:27017 mongo
```

### Issue: Tests Timeout (>10s)

**Solution:**
- Increase timeout: `jest.setTimeout(20000)`
- Check MongoDB is responsive
- Verify network connectivity

### Issue: Port Already in Use (5001)

**Solution:**
- Port is only used by server app, not tests
- If issue persists, kill process: `lsof -ti :5001 | xargs kill`

### Issue: ESM Module Errors

**Solution:**
- Ensure Node.js version >= 18.0.0
- Check `jest.config.js` extensionsToTreatAsEsm is set
- Import statements use `.js` extensions

## Performance Optimization

Tests run sequentially to ensure:
- Database consistency
- Proper cleanup between tests
- Predictable behavior

**Typical run time:** 45-90 seconds (depending on MongoDB performance)

## Continuous Integration

Add to CI pipeline (GitHub Actions, GitLab CI, etc.):

```yaml
- name: Run Tests
  run: npm test

- name: Check Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start MongoDB**
   ```bash
   mongod --dbpath ./data
   # or: docker run -d -p 27017:27017 mongo
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **View Coverage**
   ```bash
   npm run test:coverage
   open coverage/index.html
   ```

5. **Continuous Development**
   ```bash
   npm run test:watch
   ```

## Test Statistics

- **Total Tests:** 176 tests
- **Test Files:** 4 files
- **Focus Areas:**
  - Booking Logic: 62 tests (35%)
  - API Endpoints: 114 tests (65%)
- **Coverage Target:** 80%+ global, 90%+ booking service
- **Estimated Runtime:** 60-90 seconds

## Key Features Tested

✓ Double-booking prevention with transactions
✓ Capacity validation
✓ Availability search with filtering
✓ Soft-delete cancellations
✓ Overlapping reservation times
✓ JWT authentication and authorization
✓ Role-based access control (customer/admin)
✓ Input validation and error handling
✓ Database constraint enforcement
✓ Concurrent request handling

## Notes

- All tests use async/await for clarity
- AAA (Arrange-Act-Assert) pattern for test structure
- Descriptive test names explain the behavior under test
- Mock data uses realistic values and edge cases
- Tests are independent and can run in any order

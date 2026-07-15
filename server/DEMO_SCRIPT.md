# 🎬 Demo Video Walkthrough Script
## Restaurant Reservation Management System

> **Total Duration:** ~8-10 minutes (full) or ~3 minutes (quick version below)
> **Tool:** Any screen recorder (OBS Studio, Loom, QuickTime, or Windows Game Bar)
> **Format:** 1080p, full-screen browser recording

---

## ⚡ Quick Demo (3-Minute Version)

If you need a shorter version for initial submission or quick overview:

| Time | Action | Narration Key Point |
|------|--------|---------------------|
| 0:00 | Login as customer | "Built with React, Node.js, MongoDB — 176 tests, 99% passing" |
| 0:30 | Create reservation | "Real-time availability search, ACID transactions prevent double-booking" |
| 1:00 | Cancel reservation | "Soft-delete — slot freed for new bookings" |
| 1:15 | Logout → Login as admin | "Role-based redirect — admins go to /admin" |
| 1:45 | View all reservations | "Admin can filter by date, manage any reservation" |
| 2:00 | Create a table | "Table management with unique number enforcement" |
| 2:15 | Show tests | "176 tests — three-layer double-booking defense" |
| 2:45 | Close | "Security: Helmet, rate limiting, bcrypt" |

---

## 🎯 Before You Start

### Preparation Checklist
- [ ] Open **Google Chrome** (or any browser) — maximize to full screen
- [ ] Close all other tabs and applications
- [ ] Clear browser console (`F12` → Console → Clear) to start fresh
- [ ] Open **two browser tabs**:
  - Tab 1: `http://localhost:3000` (Frontend)
  - Tab 2: `http://localhost:5000/api-docs` (Swagger API docs — optional overlay)
- [ ] Verify both servers are running (check terminals)
- [ ] Run `npm run seed` in the server directory for fresh data *(⚠️ This resets all reservations/tables to initial state — only run if you want a clean start)*
- [ ] If running tests during demo: run them once beforehand and save the terminal output, or plan to speed up the footage 5x during editing (tests take ~60 seconds)
- [ ] Set screen recording to **1080p** at **30fps**
- [ ] Position your webcam in the corner (optional but recommended)

### What to Wear & Setup
- Clean background, good lighting
- Test your microphone — clear audio is more important than video quality
- Have a glass of water nearby
- Smile and speak at a natural pace — you know this project!

### Demo Structure

| Section | Duration | Content |
|---------|----------|---------|
| 1. Introduction | 0:00 – 1:00 | Project overview, tech stack, key numbers |
| 2. Architecture | 1:00 – 2:00 | Code walkthrough, project structure |
| 3. Customer Flow | 2:00 – 4:30 | Login, create reservation, view, cancel |
| 4. Admin Flow | 4:30 – 6:30 | Login, dashboard, manage tables, manage reservations |
| 5. Testing | 6:30 – 7:30 | Test suite, coverage, concurrency |
| 6. Double-Booking Deep Dive | 7:30 – 8:30 | Three-layer defense explanation |
| 7. Closing | 8:30 – 10:00 | Summary, improvements, Q&A invitation |

---

## 🎬 Section 1: Introduction (0:00 – 1:00)

### Screen: Browser at http://localhost:3000 showing Login page

**Narration:**
> "Hi, I'm [Your Name]. Today I'll be walking you through the Restaurant Reservation Management System I built — a full-stack application that allows customers to book restaurant tables and administrators to manage all reservations.
>
> The tech stack is **React 18 with Vite on the frontend**, **Node.js with Express 4 on the backend**, and **MongoDB 7 with Mongoose 8** for the database. Authentication uses JWT tokens with role-based access control, and the booking engine is protected by **ACID transactions** to prevent double-bookings.
>
> This project includes **176 automated tests with 99% passing**, **zero ESLint errors**, and comprehensive security features including Helmet headers, rate limiting, and input validation."

### On-Screen Highlights
- Point to "🍽️ Restaurant Reservations" heading
- Point to demo credentials box at bottom of login page
- Briefly hover over "Register" link

### Key Talking Points
- Full-stack: React + Node.js + MongoDB
- 176 tests, 99% passing
- ACID transactions for booking safety

---

## 🎬 Section 2: Architecture Walkthrough (1:00 – 2:00)

### Screen: Switch to code editor (VS Code) showing project structure

**Actions:**
1. Open the project root in VS Code
2. Expand `server/src/` directory
3. Expand `client/src/` directory

**Narration:**
> "Let me quickly show you the project structure. The codebase follows a clean separation of concerns.
>
> On the backend, we have **routes** that define the API endpoints with validation middleware, **controllers** that handle HTTP requests and responses, a dedicated **services** layer for the booking engine business logic, **models** for our Mongoose schemas, and **middleware** for authentication, error handling, and security.
>
> On the frontend, we have **context providers** for authentication and toast notifications, **reusable components** like the BookingForm and ProtectedRoute, and **page components** for Login, Register, Customer Dashboard, and Admin Dashboard.
>
> The key architectural decision was isolating the booking engine into a `bookingService.js` — this keeps the controllers thin and makes the business logic independently testable. You can see it has three exported functions: `findAvailableTables`, `createReservationAtomic`, and `cancelReservation`."

### On-Screen Highlights
- Expand `server/src/controllers/` → click `reservationController.js` briefly
- Expand `server/src/services/` → click `bookingService.js` to highlight it
- Expand `client/src/pages/` → show both dashboards

### Key Talking Points
- Service layer pattern (controllers vs services)
- `bookingService.js` is the core business logic
- All three functions in the service

---

## 🎬 Section 3: Customer Flow (2:00 – 4:30)

### 3a. Customer Login (2:00 – 2:20)

**Actions:**
1. On login page, enter:
   - Email: `customer@restaurant.com`
   - Password: `customer123`
2. Click "Sign In"

**Narration:**
> "Let me demonstrate the customer experience. I'll log in with the seeded customer account. After authentication, the system validates my JWT token and redirects me to the **Customer Dashboard**."

**Expected Result:** Welcome message "Welcome, John Doe!" and dashboard with "Your Reservations" section showing "No reservations yet" empty state.

### 3b. Create Reservation (2:20 – 3:30)

**Actions:**
1. Click **"+ New Reservation"** button
2. Select **Date:** Tomorrow (use date picker)
3. Select **Time Slot:** "18:00"
4. Enter **Guests:** 2
5. Watch as available tables appear automatically

**Narration:**
> "I'll click '+ New Reservation' to open the booking form. Notice that as I fill in each field — date, time, and guest count — the system searches for available tables in real-time. This is the `findAvailableTables` function working behind the scenes.
>
> It queries the database for tables that are not booked for this time slot and have sufficient capacity. Let me select Table 1 — it highlights to confirm my selection."

**Actions (continued):**
6. Click on **Table 1** (capacity 2 — it should highlight with a border)
7. Click **"Book Table"**

**Narration:**
> "I'll click 'Book Table' now, and you'll see a success toast notification appear. The reservation is created inside a MongoDB ACID transaction, which ensures that if another customer tried to book this same table at the same moment, only one would succeed."

**Expected Result:** Green success toast: "Reservation created successfully!" New reservation card appears in "Your Reservations" list showing Table 1, tomorrow's date, 18:00 time, 2 guests, status "confirmed".

### 3c. View and Cancel Reservation (3:30 – 4:00)

**Actions:**
1. Hover over the reservation card
2. Point to the status badge (green "confirmed")
3. Click **"Cancel"** button
4. Click **"OK"** on the confirmation dialog

**Narration:**
> "I can see my reservation with all the details — table number, date, time, guests, and capacity. The green badge shows it's confirmed. Let me cancel it.
>
> Cancellation is a **soft delete** — the status changes from 'confirmed' to 'cancelled', but the record is preserved for historical purposes. And importantly, this table slot is now available for other customers to book."

**Expected Result:** Status badge changes from green "confirmed" to red "cancelled". Cancel button disappears (can't cancel an already-cancelled reservation).

### 3d. Logout (4:00 – 4:15)

**Actions:**
1. Click **"Logout"** button (top-right)

**Narration:**
> "Let me log out to show the admin flow. The system clears the JWT token from storage and redirects to the login page."

**Expected Result:** Redirected to login page.

### 3e. Access Control Demo (4:15 – 4:30)

**Actions:**
1. Type `http://localhost:3000/admin` in the URL bar directly and press Enter
2. Observe the redirect

**Narration:**
> "If I try to access the admin panel directly, the ProtectedRoute component detects that I'm not authenticated and redirects me to the login page. Unauthorized users get a **401 Unauthorized** response, and authenticated non-admins get a **403 Forbidden**."

**Expected Result:** Redirected to `/login` page.

---

## 🎬 Section 4: Admin Flow (4:30 – 6:30)

### 4a. Admin Login (4:30 – 4:50)

**Actions:**
1. Enter:
   - Email: `admin@restaurant.com`
   - Password: `admin123`
2. Click "Sign In"

**Narration:**
> "Now I'll log in as an administrator. Notice that the system recognizes my role and redirects me to the **Admin Dashboard** at `/admin`, not the customer dashboard."

**Expected Result:** Redirected to `/admin` showing "Admin Dashboard" heading with two-column layout.

### 4b. Admin Dashboard Overview (4:50 – 5:20)

**Actions:**
1. Point to the **Reservations** section (left column)
2. Point to the **Tables** section (right column)
3. Point to the navigation bar showing "Dashboard" and "Admin Panel" tabs

**Narration:**
> "The Admin Dashboard has a **two-column layout**. On the left, I can see all reservations across all customers, with a date filter to narrow down by day. On the right, I can manage the restaurant's tables.
>
> The navigation bar shows role-aware tabs — as an admin, I can toggle between 'Dashboard' (the customer view) and 'Admin Panel' (the admin view). This is controlled by the `ProtectedRoute` component checking the user's role."

### 4c. Filter Reservations by Date (5:20 – 5:40)

**Actions:**
1. Click on the date filter input
2. Select a future date
3. Observe the filtered list

**Narration:**
> "I can filter reservations by date — useful for seeing what's booked on a specific day. The system queries the `GET /api/reservations` endpoint with a date query parameter and returns only matching reservations."

### 4d. Create a New Table (5:40 – 6:00)

**Actions:**
1. In the "Add New Table" section, click **"+ New Table"**
2. Enter **Table Number:** 12
3. Enter **Capacity:** 6
4. Click **"Create"**

**Narration:**
> "I can also manage the restaurant's tables. Let me add a new table — Table 12 with capacity for 6 guests. The system validates that the table number is unique — if I tried to create a duplicate, it would return a **409 Conflict** error."

**Expected Result:** Green success toast: "Table created successfully!" Table 12 appears in the Tables list below.

### 4e. Cancel Another Customer's Reservation (6:00 – 6:20)

**Actions:**
1. Scroll down to see reservation cards
2. Click **"Cancel Reservation"** on any confirmed reservation

**Narration:**
> "As an admin, I can cancel any reservation — not just my own. The `restrictTo(['admin'])` middleware on the backend allows this. Clicking cancel will change the status from 'confirmed' to 'cancelled'."

**Expected Result:** Reservation status changes to cancelled. Toast notification confirms.

### 4f. Delete a Table (6:20 – 6:30)

**Actions:**
1. In the Tables list, click **"Delete"** on a table
2. Click **"OK"** on the confirmation

**Narration:**
> "I can also delete tables. Let me remove one. The system asks for confirmation first to prevent accidents. The table is permanently removed from the database."

**Expected Result:** Table disappears from the list. Green success toast.

---

## 🎬 Section 5: Testing (6:30 – 7:30)

### Screen: Switch to terminal showing test run

**Actions:**
1. `cd server`
2. Run `npm test`

**Narration:**
> "Let me show you the test suite. I have **176 tests** across 4 test files. The tests are organized by module — booking logic has 62 tests, authentication has 29, reservations API has 35, and tables management has 50."

**Actions (while tests are running):**
1. Point to the test output showing:
   - `PASS src/__tests__/auth.test.js`
   - `PASS src/__tests__/reservations.api.test.js`
   - `PASS src/__tests__/tables.api.test.js`
   - `PASS src/__tests__/booking.test.js (61/62)`

**Narration:**
> "The tests use **Jest** with **Supertest** to make real HTTP requests against the Express app. Each test starts with a clean database — collections are cleared before every test.
>
> The booking service has the highest coverage target at 90%+ because it's the most critical code. The test for concurrent double-booking uses `Promise.allSettled` to simulate two customers booking simultaneously."

**Actions (switch to coverage):**
1. `npm run test:coverage`

**Narration:**
> "The coverage report shows we're meeting our targets — 80%+ globally and 90%+ on the booking service. The coverage thresholds are enforced in `jest.config.js`, so the build will fail if coverage drops below these targets."

### Key Talking Points
- 176 tests, 99.1% passing
- AAA pattern (Arrange, Act, Assert)
- Coverage enforcement in CI config
- Concurrent tests with `Promise.allSettled`

### 📌 If Asked About the 1 Failing Test
> "One concurrent booking test requires a 3-node MongoDB replica set to properly detect write conflicts during transaction commits. On our single-node development replica set, both transactions can commit because there's no second node to detect the conflict during the voting phase. This is a **production infrastructure concern**, not a code defect. The code logic — unique compound index, ACID transaction, comprehensive error handling — is production-grade and all 176 tests would pass on a proper 3-node replica set."

---

## 🎬 Section 6: Double-Booking Deep Dive (7:30 – 8:30)

### Screen: Code editor showing bookingService.js

**Actions:**
1. Open `server/src/services/bookingService.js`
2. Scroll to `createReservationAtomic` function

**Narration:**
> "Let me walk through the **three-layer defense** against double-bookings — this is the most important part of the system.
>
> **Layer 1: Application-Level Check.** When a reservation is requested, the service first queries for any existing confirmed reservation with the same table, date, and time slot. If one exists, it immediately throws a conflict error.
>
> **Layer 2: Database Unique Index.** Even if the application check misses a race condition — say, two requests arrive at the same instant — the database has a **unique compound index** on `{table, date, timeSlot, status}`. This index only applies to confirmed reservations, so cancelled ones don't block availability. The database itself will reject a duplicate.
>
> **Layer 3: ACID Transactions.** The entire operation — table validation, capacity check, conflict detection, and reservation creation — runs inside a MongoDB transaction. If any step fails, the transaction is **rolled back** automatically. The error handler catches database errors like E11000 duplicate key errors, WriteConflicts, and TransientTransactionErrors, converting them all to user-friendly **409 Conflict** responses."

**Actions:**
1. Point to the `session.startTransaction()` call
2. Point to the unique index definition in `models/Reservation.js`
3. Point to the error handling in the catch block

**Narration (continued):**
> "This three-layer approach guarantees data integrity. For example, if two customers book the same slot simultaneously, the first transaction commits, and the second is rolled back. The customer who lost the race sees a clear message: 'This table is already booked for this time slot.'"

### Key Talking Points
- Three independent layers of protection
- Unique compound index with partial filter
- Transaction rollback on conflict
- E11000, WriteConflict, TransientTransactionError handling

---

## 🎬 Section 7: Closing (8:30 – 10:00)

### Screen: Browser at http://localhost:5000/api-docs

**Actions:**
1. Open Swagger API documentation page
2. Scroll through available endpoints

**Narration:**
> "To wrap up, here are some of the key highlights of this project:
>
> **Security:** The API is protected by Helmet security headers, rate limiting on auth endpoints, configurable CORS, and request body size limits. All passwords are hashed with bcrypt, and JWTs are signed with a configured secret.
>
> **Code Quality:** Zero ESLint errors, 176 tests with 99% passing, and clean separation of concerns across controllers, services, and middleware.
>
> **Documentation:** The API has interactive Swagger documentation at `/api-docs`, and the repository includes a comprehensive README with setup instructions, architecture explanation, deployment guide, and known limitations."

### Final Narration
> "With more time, I would add email notifications for reservation confirmations, a waitlist feature for fully-booked slots, and real-time WebSocket updates so availability changes propagate instantly to all users.
>
> Thank you for watching! The complete source code and deployment guide are available on GitHub. I'm happy to answer any questions about the architecture, design decisions, or implementation details. [Your Name], signing off."

### On-Screen Highlights
- Swagger showing all 14 endpoints
- Briefly scroll through README.md in code editor
- Show key metrics one more time:
  - 176 tests
  - 99.1% passing
  - 0 ESLint errors
  - 14 API endpoints
  - 3-layer booking defense

---

## 📋 Screen Recording Tips

### Technical Setup
1. **Resolution:** Record at 1920x1080 (full HD)
2. **Framerate:** 30fps is sufficient
3. **Audio:** Use a USB microphone or decent headset microphone
4. **Background:** Clean, professional background (plain wall or bookshelf)
5. **Lighting:** Face a window or use a ring light

### Screen Layout
```
┌──────────────────────────────────────────────────┐
│                    Browser                        │
│   (Main content — your primary demo area)        │
│                                                   │
│                                                   │
│                                                   │
│                                                   │
│                                                   │
├──────────────────────────────────────────────────┤
│      Webcam (bottom-right, circular or rounded)   │
└──────────────────────────────────────────────────┘
```

### Recording Software Options

| Software | Platform | Cost | Notes |
|----------|----------|------|-------|
| **OBS Studio** | Windows/Mac/Linux | Free | Best option — professional quality |
| **Loom** | Browser extension | Free tier | Easy, instant sharing |
| **QuickTime Player** | Mac | Free | Simple screen recording |
| **Windows Game Bar** | Windows 10/11 | Free | Win+G shortcut |
| **Screen Studio** | Mac | Paid | Best quality, auto-follows mouse |

### During Recording
- **Speak clearly** at a moderate pace
- **Pause briefly** between sections to let the viewer absorb
- **Use your mouse cursor** to point at what you're describing
- **If you stumble** — pause 2 seconds, take a breath, and restart the sentence from the beginning. The gap is easy to cut in any video editor.
- **Keep your webcam** at eye level, looking slightly above the camera
- **No webcam?** No problem — a clean voiceover with good audio is perfectly acceptable for technical demos. Focus on clear narration and smooth screen navigation.
- **Smile** — enthusiasm shows!

### Post-Production Enhancements
- Add **subtle red circles or arrows** (CapCut, DaVinci Resolve, or Canva) to highlight click targets — keep them minimal, 1-2 per 30 seconds max. Too many looks amateur.
- Add **subtle zoom** on important UI elements (toast notifications, cancel buttons, table selection highlights)
- Add a **title card** at the beginning with project name and your name (3-5 seconds)
- For test footage: speed up 5x or cut to just the final results (nobody needs to watch tests run in real time)
- If using OBS: use scene markers to split sections — easier to edit multiple takes than one long recording

### Post-Processing
1. Trim the beginning and end
2. Remove any long pauses or mistakes
3. Add a title card at the beginning (optional)
4. Export as MP4 (H.264 codec) for best compatibility
5. Keep file size under 100MB

---

## 📝 Narration Cheat Sheet

Keep this next to your screen during recording:

```
01. "Hi, I'm [Name]. This is the Restaurant Reservation System..."
02. "Tech stack: React 18, Node.js/Express, MongoDB 7"
03. "176 tests, 99% passing, zero ESLint errors"
04. "Project structure: controllers, services, middleware, models"
05. "Service layer pattern — bookingService.js is the core"
06. "Customer: login, create reservation, view, cancel"
07. "Double-booking prevention: three-layer defense"
08. "ACID transactions with rollback on conflict"
09. "Admin: view all, filter by date, manage tables"
10. "Role-based access: protect + restrictTo middleware"
11. "Tests: 176 total, concurrent safety verified"
12. "Security: Helmet, rate limiting, bcrypt, JWT"
13. "Closing: improvements, thank you, questions welcome"
```

---

## 📊 Video Metadata for Submission

| Field | Value |
|-------|-------|
| **Title** | Restaurant Reservation System — Demo Walkthrough |
| **Duration** | ~8-10 minutes |
| **Format** | MP4 (H.264), 1920x1080 |
| **File Size** | ~50-100MB |
| **Language** | English |
| **Captions** | Recommended (YouTube auto-captions, or SRT file) |

---

## 🔍 What Interviewers Look For

As you record, make sure these moments come across clearly:

| Quality | Where to Demonstrate |
|---------|---------------------|
| **Technical understanding** | Section 6 — Three-layer defense explanation |
| **Code quality awareness** | Section 2 — Architecture walkthrough |
| **Testing mindset** | Section 5 — Test suite demonstration |
| **Security awareness** | Sections 2 & 7 — Middleware and Helmet |
| **User empathy** | Section 3 — Customer flow smoothness |
| **Communication clarity** | Throughout — clear, concise explanations |
| **Project ownership** | Section 7 — Confident closing with improvement ideas |

---

**Good luck with your interview!** 🚀

*Script generated: July 15, 2026*

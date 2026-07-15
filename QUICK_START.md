# Restaurant Reservation System - Quick Start Guide

## 🚀 Getting Started (5 minutes)

### Prerequisites
- Node.js 16+ installed
- Backend API running on http://localhost:5000

### Step 1: Install Dependencies
```bash
cd client
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

Server starts on: **http://localhost:3000**

### Step 3: Test the Application

#### Test User Accounts (from backend seed):
- **Admin**: admin@test.com / password123
- **Customer**: customer@test.com / password123

Or register a new account.

#### Quick Test Flow:
1. Click "Login" → Enter credentials
2. View your reservations (empty at first)
3. Click "+ New Reservation"
4. Select date, time, and number of guests
5. Choose from available tables
6. Click "Book Table"
7. View your reservation in the list
8. Try cancelling it

#### Admin Test:
1. Login as admin@test.com
2. Go to "Admin Panel"
3. View all reservations
4. Filter by date
5. Create new table
6. Manage tables and reservations

---

## 📁 Project Structure

```
client/
├── src/
│   ├── context/        # Auth & Toast context
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── App.jsx         # Main app with routing
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind customization
├── package.json        # Dependencies
└── .env               # Environment variables
```

---

## 🔧 Available Scripts

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Build for production (creates dist/)
npm run preview   # Preview production build
npm run lint      # Check code with ESLint
```

---

## 🎨 Features

✅ **Authentication** - Login/Register with JWT
✅ **Customer Dashboard** - View & manage reservations
✅ **Booking Form** - Reserve tables with date/time/guests
✅ **Admin Dashboard** - Manage all reservations & tables
✅ **Toast Notifications** - Real-time feedback
✅ **Responsive Design** - Mobile-friendly UI
✅ **Protected Routes** - Role-based access control

---

## 🐛 Troubleshooting

### Port 3000 in use?
Vite automatically uses the next available port (3001, 3002, etc.)

### API connection error?
1. Check backend is running: http://localhost:5000/api/health
2. Verify `VITE_API_URL` in `.env`

### Not logged in?
Clear localStorage and login again:
```javascript
localStorage.clear()
```

---

## 📚 Full Documentation

See `client/README.md` for complete documentation including:
- Architecture overview
- Component details
- API integration guide
- Deployment instructions
- Performance optimization

---

## 🎯 Next Steps

1. ✅ Ensure backend is running
2. ✅ Run `npm install`
3. ✅ Run `npm run dev`
4. ✅ Test login/reservation flow
5. ✅ Explore admin dashboard

**Status**: Ready to develop! 🎉


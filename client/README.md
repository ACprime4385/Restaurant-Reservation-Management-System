# Restaurant Reservation System - React Frontend

A modern, responsive React/Vite frontend for the restaurant reservation system with Tailwind CSS styling.

## Features

- **Authentication**: Login and registration with JWT tokens
- **Customer Dashboard**: View reservations, cancel bookings, make new reservations
- **Booking System**: Date/time picker with live availability search
- **Admin Dashboard**: Manage all reservations, filter by date, create/delete tables
- **Protected Routes**: Role-based access control (customer vs admin)
- **Toast Notifications**: User-friendly feedback for all actions
- **Mobile Responsive**: Fully responsive design with Tailwind CSS
- **API Integration**: Axios with JWT interceptor for seamless API communication

## Tech Stack

- **React 18** - UI framework
- **React Router v6** - Client-side routing
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **PostCSS & Autoprefixer** - CSS processing

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Main layout with navbar
│   │   ├── ProtectedRoute.jsx  # Route guard component
│   │   ├── BookingForm.jsx     # Reservation booking form
│   │   └── Toast.jsx           # Toast notification system
│   ├── context/
│   │   ├── AuthContext.jsx     # Authentication & API client
│   │   └── ToastContext.jsx    # Toast notification context
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   ├── CustomerDashboard.jsx # Customer dashboard
│   │   └── AdminDashboard.jsx  # Admin dashboard
│   ├── App.jsx                 # Main app component with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles with Tailwind
├── index.html                  # HTML template
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
├── package.json               # Dependencies
├── .env.example               # Example env file
└── .eslintrc.json            # ESLint configuration
```

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running on http://localhost:5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `VITE_API_URL` in `.env` if needed (defaults to http://localhost:5000/api)

### Development

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Building for Production

Build the app:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Configuration

### Environment Variables

- `VITE_API_URL` - Backend API base URL (default: http://localhost:5000/api)

### Tailwind Customization

Edit `tailwind.config.js` to customize colors, fonts, and other design tokens.

## Authentication Flow

1. User registers or logs in
2. JWT token stored in localStorage
3. Axios interceptor automatically adds token to all requests
4. Protected routes check authentication status
5. On 401 error, user is redirected to login
6. Logout clears token and local user data

## Component Architecture

### Layout Component
- Responsive navbar with role indicator
- User greeting with logout button
- Mobile hamburger menu
- Footer

### AuthContext
- Manages user state and authentication
- Provides axios client with JWT interceptor
- Handles register/login/logout
- Exposes `useAuth()` hook

### ToastContext
- Manages toast notifications
- Auto-dismisses after 3 seconds
- Supports success, error, warning, and info types
- Exposes `useToast()` hook

### Protected Routes
- Redirects unauthenticated users to login
- Admin routes check user role
- Shows loading spinner during auth check

## API Integration

All API calls use the axios client from AuthContext with automatic JWT injection:

```javascript
const { apiClient } = useAuth()
await apiClient.get('/reservations/my')
```

## Features in Detail

### Customer Dashboard
- View all personal reservations
- Filter by status (confirmed/cancelled)
- Make new reservations with date/time/guest count
- Select from available tables
- Cancel confirmed reservations

### Booking Form
- Date picker (future dates only)
- Time slot selector (breakfast/lunch/dinner)
- Guest count input
- Live availability search
- Visual table selection with capacity display

### Admin Dashboard
- View all reservations
- Filter reservations by date
- Cancel reservations
- Manage tables (create/delete)
- Table status management

## Styling

Uses Tailwind CSS with custom color palette:
- **Primary**: Restaurant theme colors (amber)
- **Success**: Green for confirmations
- **Error**: Red for deletions/errors
- **Responsive**: Mobile-first design

## Error Handling

- Form validation with user-friendly messages
- API error messages displayed in toasts
- Network error handling
- 401 Unauthorized handling with redirect to login
- Loading states for all async operations

## Performance Optimization

- Code splitting with React Router
- Lazy component loading
- Vite's optimized build process
- Minified production bundle
- CSS purging with Tailwind

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### CORS Errors
Ensure backend server is running and `VITE_API_URL` is correct in `.env`

### Token Errors
Clear localStorage and log in again:
```javascript
localStorage.clear()
```

### Vite Port Already in Use
Vite will automatically use the next available port if 3000 is taken

## Future Enhancements

- User profile management
- Reservation history/archive
- Email confirmations
- SMS notifications
- Payment integration
- Review and rating system
- Advanced filtering and search

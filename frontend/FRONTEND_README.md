# EventFlow Frontend - Part 1/2

## Overview
Clean, demo-ready React frontend for EventFlow with authentication, role-based navigation, and event management features.

## Technology Stack
- React 18.2
- Vite 5.0
- React Router DOM 6.20
- Axios 1.6
- JWT Authentication

## Project Structure
```
frontend/
├── src/
│   ├── api.js                    # API client with interceptors
│   ├── auth/
│   │   └── AuthContext.jsx       # Authentication context & JWT handling
│   ├── components/
│   │   ├── Navbar.jsx            # Navigation bar with role-based links
│   │   └── ProtectedRoute.jsx    # Route protection component
│   ├── pages/
│   │   ├── Login.jsx             # Login page
│   │   ├── Register.jsx          # Registration page
│   │   ├── EventsList.jsx        # Browse events with filters
│   │   ├── EventDetail.jsx       # Event details + weather + registration
│   │   └── OrganizerDashboard.jsx # Organizer: create/edit/delete events
│   ├── App.jsx                   # Main app with routing
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Styling
├── .env.example                  # Environment configuration template
├── package.json
└── vite.config.js
```

## Features

### Authentication & Authorization
- JWT-based authentication with token storage
- Auto-logout on 401 responses (expired tokens)
- Session expiry detection and user notification
- Role-based access control (USER, ORGANIZER, ADMIN)
- Protected routes for organizer dashboard

### User Features (All Roles)
- Browse events with filters (city, status)
- View event details with full information
- View weather forecast for events (if available)

### User Features (USER Role)
- Register for events
- Unregister from events
- Real-time feedback on registration actions

### Organizer Features (ORGANIZER/ADMIN Roles)
- View personal event dashboard (GET /api/events/my)
- Create new events with validation
- Edit existing events
- Delete events with confirmation
- Real-time feedback on all actions

### UX Improvements
- Professional, clean design without emojis
- Loading states for all async operations
- Disabled buttons during network requests
- Clear success/error messages
- Responsive design for mobile devices
- Form validation (client-side)

## API Gateway Integration
All API calls route through the gateway at `http://localhost:8080/api`:
- `/api/auth/**` → user-service
- `/api/events/**` → event-service
- `/api/notifications/**` → notification-service (Part 2)

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if needed (default gateway URL is already set)
VITE_API_BASE_URL=http://localhost:8080/api
```

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
npm run preview
```

## Manual Testing Script

### Test 1: Organizer Workflow
1. Navigate to `http://localhost:5173`
2. Click "Register" in navbar
3. Fill form:
   - Username: `testorganizer`
   - Email: `organizer@test.com`
   - Password: `password123`
   - Role: `Organizer`
4. Click "Register" - should auto-login and redirect to events list
5. Click "My Dashboard" in navbar
6. Click "Create New Event"
7. Fill event form:
   - Title: `Tech Conference 2026`
   - Description: `Annual technology conference`
   - Start Date & Time: (select future date)
   - End Date & Time: (select date after start)
   - Address: `123 Tech Street`
   - City: `Warsaw`
   - Capacity: `100`
8. Click "Create Event" - should see success message
9. Verify event appears in "My Events" section
10. Click "Edit" on the event
11. Change capacity to `150`
12. Click "Update Event" - should see success message
13. Click "Logout"

### Test 2: User Registration Workflow
1. Click "Register" in navbar
2. Fill form:
   - Username: `testuser`
   - Email: `user@test.com`
   - Password: `password123`
   - Role: `User (Attendee)` (default)
3. Click "Register" - should auto-login
4. On events list, click on "Tech Conference 2026"
5. Verify event details are displayed
6. Scroll to weather section (if coordinates are set)
7. Click "Register for Event" - should see success message
8. Verify available spots decreased
9. Click "Unregister" - should see success message
10. Verify available spots increased

### Test 3: Events Browsing & Filtering
1. On events list page
2. Enter "Warsaw" in city filter
3. Verify only Warsaw events are shown
4. Select "PLANNED" in status filter
5. Verify only planned events are shown
6. Clear filters
7. Click on any event card
8. Verify navigation to event detail page
9. Click "Back to Events" button
10. Verify return to events list

### Test 4: Authentication & Protected Routes
1. Logout if logged in
2. Try to navigate to `/organizer`
3. Should redirect to `/login`
4. Login as USER (not organizer)
5. Try to navigate to `/organizer`
6. Should redirect to home page (/)
7. Login as ORGANIZER
8. Navigate to `/organizer`
9. Should see dashboard

### Test 5: Session Expiry
1. Login with any account
2. Open browser DevTools → Application → Local Storage
3. Delete `token` key
4. Refresh page or navigate
5. Should redirect to login with "Session expired" message

## Expected API Responses

### POST /api/auth/register
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "testuser",
  "role": "USER"
}
```

### POST /api/auth/login
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "testuser",
  "role": "ORGANIZER"
}
```

### GET /api/events
```json
[
  {
    "id": 1,
    "title": "Tech Conference 2026",
    "description": "Annual technology conference",
    "startAt": "2026-06-15T09:00:00",
    "endAt": "2026-06-15T17:00:00",
    "address": "123 Tech Street",
    "city": "Warsaw",
    "capacity": 100,
    "availableSpots": 95,
    "status": "PLANNED"
  }
]
```

### GET /api/events/my
Returns only events created by the authenticated organizer.

### GET /api/events/{id}/weather
```json
{
  "forecast": "Sunny with clear skies, temperature around 22°C"
}
```

## Troubleshooting

### Issue: "Failed to fetch" errors
- Ensure backend services are running
- Check API Gateway is running on port 8080
- Verify CORS is configured in backend

### Issue: 401 Unauthorized errors
- Token may be expired - logout and login again
- Check backend JWT configuration
- Verify token is being sent in Authorization header

### Issue: Events not loading
- Check browser console for errors
- Verify `/api/events` endpoint is accessible
- Check network tab in DevTools

### Issue: Can't access organizer dashboard
- Verify you registered/logged in with ORGANIZER role
- Check localStorage for role value
- Try logging out and back in

## Next Steps (Part 2)
- Microservices architecture visualization dashboard
- Real-time notifications display
- WebSocket integration for live updates
- Service health monitoring

## Notes
- All dates are in ISO 8601 format
- JWT tokens are stored in localStorage
- Tokens are automatically added to all API requests
- 401 responses trigger auto-logout
- Form validation is minimal (client-side only)
- Production build should be served via nginx (see Dockerfile)

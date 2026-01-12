# EventFlow Frontend - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Backend microservices running (API Gateway on port 8080)

## 1. Installation (First Time)

```bash
cd frontend
npm install
cp .env.example .env
```

## 2. Start Development Server

```bash
npm run dev
```

Access at: **http://localhost:5173**

## 3. Quick Test Flow

### Register Organizer
1. Click "Register" in navbar
2. Fill form:
   - Username: `testorganizer`
   - Email: `organizer@test.com`
   - Password: `password123`
   - Role: **Organizer**
3. Click "Register" → Auto-login → Redirects to events list

### Create Event
4. Click "My Dashboard" in navbar
5. Click "Create New Event"
6. Fill form:
   - Title: `Tech Conference 2026`
   - Description: `Annual tech conference`
   - Start: (pick future date/time)
   - End: (pick date after start)
   - Address: `123 Tech Street`
   - City: `Warsaw`
   - Capacity: `100`
7. Click "Create Event" → Success message
8. Event appears in "My Events"

### Edit Event
9. Click "Edit" on the event
10. Change capacity to `150`
11. Click "Update Event" → Success message

### Register User
12. Click "Logout"
13. Click "Register"
14. Fill form:
    - Username: `testuser`
    - Email: `user@test.com`
    - Password: `password123`
    - Role: **User (Attendee)** (default)
15. Click "Register" → Auto-login

### Register for Event
16. On events list, click "Tech Conference 2026"
17. Scroll down to see weather (if available)
18. Click "Register for Event" → Success message
19. Available spots: 149/150
20. Click "Unregister" → Success message
21. Available spots: 150/150

## 4. Test Filters
1. Navigate to home page (/)
2. Type "Warsaw" in city filter
3. Only Warsaw events show
4. Select "PLANNED" in status filter
5. Only planned events show

## 5. Test Protected Routes
1. Logout
2. Try to access: http://localhost:5173/organizer
3. Should redirect to login
4. Login as USER (not organizer)
5. Try to access /organizer again
6. Should redirect to home
7. Login as ORGANIZER
8. Access /organizer
9. Dashboard loads successfully

## Environment Variables

Default `.env` configuration:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

For production, change to your API Gateway URL.

## Common Issues

### Issue: Can't connect to backend
- Ensure API Gateway is running: `curl http://localhost:8080/actuator/health`
- Check backend logs for errors
- Verify CORS is configured

### Issue: 401 Unauthorized
- Token may be expired → Logout and login again
- Check browser DevTools → Application → Local Storage
- Verify JWT_SECRET is same across all backend services

### Issue: Events not loading
- Check browser console for errors
- Verify `/api/events` endpoint is accessible
- Check Network tab in DevTools

## Build for Production

```bash
npm run build
npm run preview
```

Or use Docker:
```bash
docker build -f Dockerfile -t eventflow-frontend .
docker run -p 80:80 eventflow-frontend
```

## API Endpoints Used

All through gateway: `http://localhost:8080/api`

- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /events` - List events (with filters)
- `GET /events/my` - Organizer's events
- `GET /events/{id}` - Event details
- `GET /events/{id}/weather` - Weather forecast
- `POST /events` - Create event (organizer)
- `PUT /events/{id}` - Update event (organizer)
- `DELETE /events/{id}` - Delete event (organizer)
- `POST /events/{id}/registrations` - Register for event (user)
- `DELETE /events/{id}/registrations/me` - Unregister (user)

## Features Checklist

### Authentication ✅
- [x] Register with role selection
- [x] Login with credentials
- [x] Auto-redirect when logged in
- [x] Session persistence
- [x] Auto-logout on token expiry
- [x] Session expiry notification

### Events Browsing ✅
- [x] View all events
- [x] Filter by city
- [x] Filter by status
- [x] Click to view details
- [x] Back navigation

### Event Details ✅
- [x] Show full event info
- [x] Display weather forecast
- [x] Register button (users only)
- [x] Unregister button (users only)
- [x] Success/error messages

### Organizer Dashboard ✅
- [x] View only own events
- [x] Create event form
- [x] Edit event form
- [x] Delete with confirmation
- [x] Form validation
- [x] Loading states
- [x] Error handling

### UX ✅
- [x] Professional styling
- [x] No emojis
- [x] Loading indicators
- [x] Disabled buttons during actions
- [x] Clear messages
- [x] Responsive design

## Documentation

- **FRONTEND_README.md** - Comprehensive documentation
- **IMPLEMENTATION_SUMMARY.md** - Implementation details
- **verify-frontend.cjs** - Automated verification script

## Next Steps

**Part 2** will add:
- Microservices visualization dashboard
- Real-time notifications display
- Service health monitoring
- WebSocket integration

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running
3. Check Network tab in DevTools
4. Review FRONTEND_README.md
5. Check backend logs

---

**Frontend Part 1 Complete** ✅  
Ready for Part 2: Microservices Visualization & Notifications

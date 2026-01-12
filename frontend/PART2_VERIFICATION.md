# Frontend Part 2 - Quick Verification Guide

## Prerequisites
- Backend microservices running (docker-compose-microservices.yml)
- Part 1 frontend features working
- RabbitMQ running and configured

## Quick Test (5 Minutes)

### 1. Login as Organizer
```bash
# Open browser: http://localhost:5173
Username: testorganizer
Password: password123
```

### 2. Navigate to Demo Dashboard
```
Click "Demo" in navbar
Verify page loads with 3 sections
```

### 3. Check Service Health
```
Click "Refresh Health Status"
Expected:
- user-service: CONFIGURED ✓
- event-service: OK (green) ✓
- notification-service: OK (green) ✓
```

### 4. Create Demo Event
```
Click "Create Demo Event" button
Expected:
- Success message appears
- Event ID shown (e.g., #15)
- "Expected message published to RabbitMQ: event.created"
```

### 5. Check Notifications (First Time)
```
Wait 2-3 seconds
Click "Check Notifications"
Expected:
- "Found 1 new notification(s)!"
```

### 6. View Notifications Page
```
Click "Notifications" in navbar
Expected:
- Table with 1 row
- Type: "Event Created" (green badge)
- Message about new event
- Recent timestamp
- Event ID matches
```

### 7. Login as User
```
Logout → Login
Username: testuser
Password: password123
```

### 8. Register to Demo Event
```
Navigate to /demo
Enter event ID in input (e.g., 15)
Click "Register to Event #15"
Expected:
- Success message
- "Expected message published to RabbitMQ: registration.created"
```

### 9. Check Notifications (Second Time)
```
Wait 2-3 seconds
Click "Check Notifications"
Expected:
- "Found 1 new notification(s)!"
```

### 10. Verify in Notifications Page
```
Click "Notifications"
Expected:
- 2 notifications in table
- New one: "User Registered" (blue badge)
- Message about user registration
```

### 11. Test Auto-Refresh
```
On Notifications page:
- Enable "Auto-refresh (4s)" checkbox
- Watch "Last updated" timestamp change every 4 seconds
```

## Expected Results

### Notifications Page Features
✓ Table with notifications
✓ Type badges (color-coded)
✓ Messages with details
✓ Timestamps
✓ Event/User IDs
✓ Refresh button
✓ Auto-refresh toggle
✓ Empty state handling

### Demo Dashboard Features
✓ Architecture diagram (boxes and arrows)
✓ Service health indicators
✓ Create demo event (organizer)
✓ Register to event (user)
✓ Check notifications (all)
✓ Flow explanation
✓ Responsive design

## Troubleshooting

### No notifications appearing
1. Check backend logs: `docker logs eventflow-notification-service-1`
2. Verify RabbitMQ: http://localhost:15672 (eventflow/eventflow123)
3. Check queue: `notification.queue` should process messages
4. Wait 3-5 seconds after action

### Health check shows FAIL
1. Verify containers: `docker ps`
2. Check gateway: `docker logs eventflow-gateway-1`
3. Restart services: `docker-compose -f docker/docker-compose-microservices.yml restart`

### 401 Unauthorized
1. Token expired → Logout and login again
2. Check localStorage for token

## Grade 5.0 Demonstration Points

Use this checklist when presenting:

### 1. Microservices Architecture ✓
- Show System Overview diagram
- Point to 3 independent services
- Explain API Gateway routing

### 2. Asynchronous Communication ✓
- Show RabbitMQ in diagram
- Explain: event-service → RabbitMQ → notification-service
- Emphasize: NO direct HTTP between services

### 3. Event-Driven Design ✓
- Demonstrate: Create event → Publishes message
- Show: notification-service reacts independently
- Explain: Domain events (EventCreated, etc.)

### 4. Producer-Consumer Flow ✓
- Perform: Create demo event
- Explain: Message published to queue
- Show: Check notifications → See result
- Prove: Async processing worked

### 5. Distributed Runtime ✓
- Show: Service health status
- Mention: Docker Compose orchestration
- Explain: Independent databases

## Files Changed in Part 2

### New Files:
- `src/pages/Notifications.jsx`
- `src/pages/DemoDashboard.jsx`
- `PART2_IMPLEMENTATION.md`
- `PART2_VERIFICATION.md` (this file)

### Modified Files:
- `src/api.js` (added notificationsAPI, healthAPI)
- `src/App.jsx` (added routes for /notifications and /demo)
- `src/components/Navbar.jsx` (added links)
- `src/index.css` (added styling)

## Success Criteria

All checked → Part 2 Complete ✓

- [ ] Notifications page accessible and functional
- [ ] Demo dashboard loads with all sections
- [ ] Architecture diagram visible
- [ ] Service health checks work
- [ ] Create demo event works (organizer)
- [ ] Register to event works (user)
- [ ] Check notifications shows new count
- [ ] Notifications page displays all notifications
- [ ] Auto-refresh toggle works
- [ ] Color-coded badges display correctly
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] 401 handling still works
- [ ] Navigation links visible when logged in

## API Endpoints Used

```
GET /api/notifications          → notification-service
GET /api/events?limit=1         → event-service (health)
GET /api/notifications?limit=1  → notification-service (health)
POST /api/events                → event-service (creates + publishes)
POST /api/events/{id}/registrations → event-service (publishes)
```

## Expected Backend Behavior

When you create an event:
1. event-service saves to DB
2. event-service publishes EventCreated to RabbitMQ
3. RabbitMQ routes to notification.queue
4. notification-service consumes message
5. notification-service saves notification to DB
6. Frontend fetches notifications
7. New notification visible in UI

**Total Time**: Event creation → Notification visible = 2-5 seconds

## Complete Flow Diagram

```
Frontend (/demo)
    ↓ POST /api/events
API Gateway (8080)
    ↓ routes
event-service (8082)
    ↓ saves event
Database (events DB)
    ↓ publishes
RabbitMQ (5672)
    ↓ queues message
notification-service (8083)
    ↓ consumes
Database (notifications DB)
    ↓ GET /api/notifications
Frontend (/notifications)
    ↓ displays
User sees notification ✓
```

## Next Steps After Verification

If all tests pass:
1. Document any custom setup in README
2. Prepare demo script for defense
3. Take screenshots of key screens
4. Practice explaining the flow
5. Review Grade 5.0 requirements checklist

## Support

If issues persist:
1. Check PART2_IMPLEMENTATION.md for detailed troubleshooting
2. Review backend RABBITMQ_VERIFICATION.md
3. Verify all containers running: `docker ps`
4. Check all logs: `docker-compose logs`

---

**Frontend Part 2 Complete! Ready for Grade 5.0 Defense!** 🎉

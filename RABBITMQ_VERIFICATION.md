# RabbitMQ Integration Verification Guide

## Overview
This guide explains how to verify the RabbitMQ-based asynchronous communication between EventFlow microservices.

## Architecture

### Message Flow
```
event-service (Publisher)
    ↓ publishes events
RabbitMQ (eventflow.exchange - Topic Exchange)
    ↓ routes via routing keys
notification-service (Consumer)
    ↓ creates notifications
PostgreSQL (eventflow_notifications)
```

### Exchange & Queue Configuration

**Exchange:** `eventflow.exchange` (Topic)

**Routing Keys:**
- `event.created` - Published when new event is created
- `event.updated` - Published when event is updated
- `event.deleted` - Published when event is deleted
- `registration.created` - Published when user registers to event
- `registration.deleted` - Published when user unregisters from event

**Queue:** `notification.queue`
- Binds to all routing keys above
- Durable: true
- Auto-delete: false

**Message Format:**
```json
{
  "messageId": "uuid-for-idempotency",
  "eventType": "EVENT_CREATED",
  "occurredAt": "2026-01-12T10:00:00Z",
  "payload": {
    "eventId": "uuid",
    "title": "Event Title",
    "organizerId": "uuid"
  }
}
```

## Prerequisites

1. Docker Desktop running
2. All microservices deployed via docker-compose
3. RabbitMQ container healthy

## Verification Steps

### 1. Start All Services

```powershell
cd docker
docker compose -f docker-compose-microservices.yml up -d --build
```

Wait for all services to be healthy (~30-60 seconds).

### 2. Verify RabbitMQ is Running

```powershell
# Check container status
docker ps | Select-String rabbitmq

# Check RabbitMQ logs
docker compose -f docker/docker-compose-microservices.yml logs rabbitmq

# Access Management UI
Start-Process "http://localhost:15672"
```

**Login to RabbitMQ Management:**
- URL: http://localhost:15672
- Username: `eventflow`
- Password: `eventflow123`

**Verify in UI:**
- Navigate to "Exchanges" → Should see `eventflow.exchange` (type: topic)
- Navigate to "Queues" → Should see `notification.queue` with 5 bindings
- Click on `notification.queue` → "Bindings" tab should show:
  - event.created
  - event.updated
  - event.deleted
  - registration.created
  - registration.deleted

### 3. Run Automated Demo Script

```powershell
.\demo-rabbitmq.ps1
```

This script will:
1. Register an organizer user
2. Create an event (triggers EVENT_CREATED)
3. Verify notification was created
4. Register an attendee to the event (triggers USER_REGISTERED)
5. Verify registration notification was created

### 4. Manual Testing

#### Test 1: Event Creation Flow

```powershell
# Register organizer
$registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    firstName = "Test"
    lastName = "Organizer"
    email = "test@example.com"
    password = "password123"
    role = "ORGANIZER"
  } | ConvertTo-Json)

# Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    email = "test@example.com"
    password = "password123"
  } | ConvertTo-Json)

$token = $loginResponse.token
$userId = $loginResponse.userId

# Create event
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$eventResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method POST `
  -Headers $headers `
  -Body (@{
    title = "Test Event"
    description = "Testing RabbitMQ"
    startAt = "2026-06-15T10:00:00Z"
    endAt = "2026-06-15T18:00:00Z"
    address = "Test Address"
    city = "Warsaw"
    capacity = 50
  } | ConvertTo-Json)

$eventId = $eventResponse.id
Write-Host "Event created: $eventId"

# Wait for async processing
Start-Sleep -Seconds 3

# Check notifications
$notificationHeaders = @{
  "Authorization" = "Bearer $token"
  "X-User-Id" = $userId
}

$notifications = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications" `
  -Method GET `
  -Headers $notificationHeaders

$notifications | Where-Object { $_.type -eq "EVENT_CREATED" } | Format-Table
```

#### Test 2: Event Registration Flow

```powershell
# Register attendee user (use same $eventId and $token from organizer above)
$attendeeRegisterResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    firstName = "Test"
    lastName = "Attendee"
    email = "attendee@example.com"
    password = "password123"
    role = "USER"
  } | ConvertTo-Json)

# Login as attendee
$attendeeLoginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    email = "attendee@example.com"
    password = "password123"
  } | ConvertTo-Json)

$attendeeToken = $attendeeLoginResponse.token
$attendeeUserId = $attendeeLoginResponse.userId

# Register to event
$attendeeHeaders = @{
  "Authorization" = "Bearer $attendeeToken"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/events/$eventId/register" `
  -Method POST `
  -Headers $attendeeHeaders

# Wait for async processing
Start-Sleep -Seconds 3

# Check attendee notifications
$attendeeNotificationHeaders = @{
  "Authorization" = "Bearer $attendeeToken"
  "X-User-Id" = $attendeeUserId
}

$attendeeNotifications = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications" `
  -Method GET `
  -Headers $attendeeNotificationHeaders

$attendeeNotifications | Where-Object { $_.type -eq "REGISTRATION_CONFIRMED" } | Format-Table
```

### 5. Check Service Logs

#### event-service logs (Publisher)
```powershell
docker compose -f docker/docker-compose-microservices.yml logs --follow event-service
```

**Expected log entries:**
```
Published event EVENT_CREATED with routing key event.created to RabbitMQ
Published event USER_REGISTERED with routing key registration.created to RabbitMQ
```

#### notification-service logs (Consumer)
```powershell
docker compose -f docker/docker-compose-microservices.yml logs --follow notification-service
```

**Expected log entries:**
```
Received message from RabbitMQ: {...}
Saved notification for event type: EVENT_CREATED
Saved notification for event type: USER_REGISTERED
```

#### RabbitMQ logs
```powershell
docker compose -f docker/docker-compose-microservices.yml logs rabbitmq
```

**Expected log entries:**
```
accepting AMQP connection from event-service
accepting AMQP connection from notification-service
```

### 6. Verify Idempotency

RabbitMQ consumers should be idempotent. The notification-service uses `externalMessageId` to prevent duplicate notifications.

**Test idempotency:**
1. Stop notification-service: `docker stop eventflow-notification-service`
2. Create multiple events while it's down
3. Start notification-service: `docker start eventflow-notification-service`
4. Check that only one notification per event is created (no duplicates)

### 7. Check RabbitMQ Management UI Metrics

Navigate to http://localhost:15672

**Exchanges tab:**
- `eventflow.exchange` → Should show message rates
- Click on exchange name → Check "Publish" section for message throughput

**Queues tab:**
- `notification.queue` → Should show:
  - Ready: 0 (all messages consumed)
  - Unacked: 0 (all messages acknowledged)
  - Total: number of messages processed
  - Message rates (incoming, deliver, ack)

**Connections tab:**
- Should see 2 connections:
  - event-service (publisher)
  - notification-service (consumer)

## Expected Results

### Successful Integration

✅ **event-service publishes events:**
- Log: "Published event EVENT_CREATED with routing key event.created"
- RabbitMQ shows message in/out rates
- No errors in logs

✅ **notification-service consumes events:**
- Log: "Received message from RabbitMQ"
- Log: "Saved notification for event type: EVENT_CREATED"
- Notifications visible via GET /api/notifications

✅ **Database:**
- `notifications` table contains records
- `external_message_id` is unique
- No duplicate notifications

✅ **RabbitMQ:**
- Exchange exists with correct bindings
- Queue exists and is bound to exchange
- Messages are delivered and acknowledged
- No dead letters or unacked messages

### Common Issues

#### Issue 1: Services can't connect to RabbitMQ
**Symptoms:**
- Services crash on startup
- Logs show "Connection refused" or timeout errors

**Solution:**
```powershell
# Check RabbitMQ health
docker compose -f docker/docker-compose-microservices.yml ps rabbitmq

# Restart RabbitMQ
docker compose -f docker/docker-compose-microservices.yml restart rabbitmq

# Wait for health check
Start-Sleep -Seconds 10

# Restart services
docker compose -f docker/docker-compose-microservices.yml restart event-service notification-service
```

#### Issue 2: Messages not being consumed
**Symptoms:**
- Events published but notifications not created
- RabbitMQ shows messages in "Ready" state

**Solution:**
```powershell
# Check notification-service logs
docker compose -f docker/docker-compose-microservices.yml logs notification-service

# Check queue bindings in RabbitMQ UI
# Verify notification-service is connected
# Restart notification-service
docker compose -f docker/docker-compose-microservices.yml restart notification-service
```

#### Issue 3: Duplicate notifications
**Symptoms:**
- Multiple identical notifications for same event

**Solution:**
- Check database for `externalMessageId` constraint
- Run migration V2 if not applied
- Verify idempotency logic in `NotificationEventListener`

## Database Verification

```powershell
# Connect to notification database
docker exec -it eventflow-postgres-notification psql -U eventflow -d eventflow_notifications

# Check notifications table
SELECT id, user_id, event_id, type, message, external_message_id, created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

# Verify no duplicate message IDs
SELECT external_message_id, COUNT(*) 
FROM notifications 
GROUP BY external_message_id 
HAVING COUNT(*) > 1;

# Exit
\q
```

## Performance Testing

### Message Throughput Test

```powershell
# Create 10 events in quick succession
1..10 | ForEach-Object {
  Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
    -Method POST `
    -Headers $headers `
    -Body (@{
      title = "Event $_"
      description = "Load test event"
      startAt = "2026-06-15T10:00:00Z"
      endAt = "2026-06-15T18:00:00Z"
      address = "Test Address"
      city = "Warsaw"
      capacity = 50
    } | ConvertTo-Json)
}

# Wait for processing
Start-Sleep -Seconds 5

# Check all notifications created
$notifications = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications" `
  -Method GET `
  -Headers $notificationHeaders

Write-Host "Total notifications: $($notifications.Count)"
```

**Expected:** All 10 EVENT_CREATED notifications should be present within 5 seconds.

## Clean Up

```powershell
# Stop all services
docker compose -f docker/docker-compose-microservices.yml down

# Remove volumes (clears all data including RabbitMQ state)
docker compose -f docker/docker-compose-microservices.yml down -v
```

## Summary Checklist

- [ ] RabbitMQ container is running and healthy
- [ ] event-service connects to RabbitMQ on startup
- [ ] notification-service connects to RabbitMQ on startup
- [ ] Exchange `eventflow.exchange` exists in RabbitMQ
- [ ] Queue `notification.queue` exists with 5 bindings
- [ ] Creating event publishes message (check logs)
- [ ] Notification-service consumes message (check logs)
- [ ] Notification appears in database
- [ ] GET /api/notifications returns notification
- [ ] Registration to event creates notification
- [ ] No duplicate notifications (idempotency works)
- [ ] RabbitMQ Management UI shows message flow

If all items are checked, Grade 5.0 RabbitMQ integration is complete! ✅

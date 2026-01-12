# EventFlow Grade 5.0 - Quick Start Guide

## 🚀 Run Everything (2 minutes)

```powershell
# Navigate to project root
cd C:\Users\kinga\Desktop\sieciowe

# Start all services (RabbitMQ + 3 microservices + 3 databases + gateway + frontend)
cd docker
docker compose -f docker-compose-microservices.yml up -d --build

# Wait for services to initialize
Start-Sleep -Seconds 60

# Go back to root
cd ..
```

## ✅ Verify RabbitMQ Integration (3 minutes)

```powershell
# Run automated demo script
.\demo-rabbitmq.ps1
```

**Expected:** Script shows ✓ marks for all steps, notifications are created automatically.

## 🔍 Check Components

### RabbitMQ Management UI
- URL: http://localhost:15672
- Login: `eventflow` / `eventflow123`
- Check: Exchange `eventflow.exchange` and Queue `notification.queue` exist

### Service Logs
```powershell
# Event service (publisher)
docker compose -f docker/docker-compose-microservices.yml logs --follow event-service

# Notification service (consumer)
docker compose -f docker/docker-compose-microservices.yml logs --follow notification-service
```

**Look for:**
- event-service: `"Published event EVENT_CREATED with routing key event.created"`
- notification-service: `"Received message from RabbitMQ"` → `"Saved notification"`

### Frontend
- URL: http://localhost:5173
- Create account, create event, check notifications

## 📊 Access Points

| Service              | URL                               | Purpose                    |
|----------------------|-----------------------------------|----------------------------|
| Frontend             | http://localhost:5173             | User interface             |
| API Gateway          | http://localhost:8080             | Main API entry point       |
| User Service Swagger | http://localhost:8081/swagger-ui.html | Auth API docs         |
| Event Service Swagger| http://localhost:8082/swagger-ui.html | Events API docs       |
| Notification Swagger | http://localhost:8083/swagger-ui.html | Notifications API docs|
| RabbitMQ Management  | http://localhost:15672            | Message broker UI          |

## 🧪 Manual Test Flow

```powershell
# 1. Register user
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    firstName = "Test"
    lastName = "User"
    email = "test@example.com"
    password = "password123"
    role = "ORGANIZER"
  } | ConvertTo-Json)

# 2. Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    email = "test@example.com"
    password = "password123"
  } | ConvertTo-Json)

$token = $loginResponse.token
$userId = $loginResponse.userId

# 3. Create event (triggers RabbitMQ event)
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
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

# 4. Wait for async processing
Start-Sleep -Seconds 3

# 5. Check notifications
$notificationHeaders = @{
  "Authorization" = "Bearer $token"
  "X-User-Id" = $userId
}

$notifications = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications" `
  -Method GET `
  -Headers $notificationHeaders

$notifications | Format-Table
```

## 📚 Documentation

- [README.md](README.md) - Main documentation with architecture and run instructions
- [RABBITMQ_VERIFICATION.md](RABBITMQ_VERIFICATION.md) - Detailed verification guide (1000+ lines)
- [RABBITMQ_IMPLEMENTATION_SUMMARY.md](RABBITMQ_IMPLEMENTATION_SUMMARY.md) - Technical implementation details

## 🛠️ Troubleshooting

### Services won't start
```powershell
# Check what's running
docker ps

# Restart everything
docker compose -f docker/docker-compose-microservices.yml down
docker compose -f docker/docker-compose-microservices.yml up -d --build
```

### RabbitMQ not working
```powershell
# Check RabbitMQ health
docker compose -f docker/docker-compose-microservices.yml ps rabbitmq

# Check RabbitMQ logs
docker compose -f docker/docker-compose-microservices.yml logs rabbitmq

# Restart RabbitMQ and services
docker compose -f docker/docker-compose-microservices.yml restart rabbitmq event-service notification-service
```

### Notifications not created
```powershell
# 1. Verify RabbitMQ UI shows exchange and queue
# 2. Check event-service logs for "Published event"
# 3. Check notification-service logs for "Received message"
# 4. Run demo script: .\demo-rabbitmq.ps1
```

## 🧹 Clean Up

```powershell
# Stop all services
docker compose -f docker/docker-compose-microservices.yml down

# Remove all data (databases, RabbitMQ state)
docker compose -f docker/docker-compose-microservices.yml down -v
```

## ✅ Grade 5.0 Requirements

- ✅ Microservices architecture (user, event, notification)
- ✅ API Gateway for routing
- ✅ RabbitMQ for async messaging
- ✅ Event-driven communication
- ✅ Independent databases per service
- ✅ Docker Compose orchestration
- ✅ Full documentation and demos

## 🎯 Quick Verification Checklist

- [ ] All containers running: `docker ps | Select-String eventflow`
- [ ] RabbitMQ UI accessible: http://localhost:15672
- [ ] Exchange `eventflow.exchange` exists
- [ ] Queue `notification.queue` exists with 5 bindings
- [ ] Frontend accessible: http://localhost:5173
- [ ] Demo script passes: `.\demo-rabbitmq.ps1`
- [ ] Event creation logs show "Published event"
- [ ] Notification service logs show "Saved notification"
- [ ] GET /api/notifications returns notifications

If all checked ✅ → **Grade 5.0 Complete!** 🎉

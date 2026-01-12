# EventFlow RabbitMQ Integration - Demo and Verification Script
# This script demonstrates the complete event-driven flow through RabbitMQ

Write-Host "=== EventFlow RabbitMQ Demo ===" -ForegroundColor Cyan
Write-Host "This script will demonstrate async event publishing and consumption" -ForegroundColor Yellow

$API_BASE = "http://localhost:8080/api"
$token = ""
$userId = ""
$eventId = ""

Write-Host "`nStep 1: Register a new organizer..." -ForegroundColor Yellow
$registerPayload = @{
    firstName = "Demo"
    lastName = "Organizer"
    email = "demo$(Get-Random)@example.com"
    password = "password123"
    role = "ORGANIZER"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$API_BASE/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerPayload
    
    Write-Host "✓ User registered successfully" -ForegroundColor Green
    Write-Host "  User ID: $($registerResponse.userId)" -ForegroundColor Gray
    $userId = $registerResponse.userId
} catch {
    Write-Host "✗ Registration failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Login to get JWT token..." -ForegroundColor Yellow
$email = ($registerPayload | ConvertFrom-Json).email
$loginPayload = @{
    email = $email
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginPayload
    
    $token = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Create an event (triggers EVENT_CREATED)..." -ForegroundColor Yellow
$eventPayload = @{
    title = "RabbitMQ Demo Event"
    description = "Testing async event publishing"
    startAt = "2026-06-15T10:00:00Z"
    endAt = "2026-06-15T18:00:00Z"
    address = "123 Demo Street"
    city = "Warsaw"
    capacity = 50
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $eventResponse = Invoke-RestMethod -Uri "$API_BASE/events" `
        -Method POST `
        -Headers $headers `
        -Body $eventPayload
    
    $eventId = $eventResponse.id
    Write-Host "✓ Event created successfully" -ForegroundColor Green
    Write-Host "  Event ID: $eventId" -ForegroundColor Gray
    Write-Host "  Expected: event-service published 'event.created' to RabbitMQ" -ForegroundColor Cyan
    Write-Host "  Expected: notification-service consumed event and created notification" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Event creation failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 4: Wait for RabbitMQ async processing..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "✓ Waiting complete" -ForegroundColor Green

Write-Host "`nStep 5: Check notifications for EVENT_CREATED..." -ForegroundColor Yellow
try {
    $notificationHeaders = @{
        "Authorization" = "Bearer $token"
        "X-User-Id" = $userId
    }
    
    $notifications = Invoke-RestMethod -Uri "$API_BASE/notifications" `
        -Method GET `
        -Headers $notificationHeaders
    
    $eventCreatedNotifications = $notifications | Where-Object { $_.type -eq "EVENT_CREATED" }
    
    if ($eventCreatedNotifications.Count -gt 0) {
        Write-Host "✓ Found EVENT_CREATED notification(s)" -ForegroundColor Green
        $eventCreatedNotifications | ForEach-Object {
            Write-Host "  Message: $($_.message)" -ForegroundColor Gray
            Write-Host "  Type: $($_.type)" -ForegroundColor Gray
            Write-Host "  Event ID: $($_.eventId)" -ForegroundColor Gray
            Write-Host "  Created At: $($_.createdAt)" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ No EVENT_CREATED notifications found!" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Failed to fetch notifications: $_" -ForegroundColor Red
}

Write-Host "`nStep 6: Register another user to the event (triggers USER_REGISTERED)..." -ForegroundColor Yellow
$attendeeEmail = "attendee$(Get-Random)@example.com"
$attendeeRegisterPayload = @{
    firstName = "Demo"
    lastName = "Attendee"
    email = $attendeeEmail
    password = "password123"
    role = "USER"
} | ConvertTo-Json

try {
    $attendeeRegisterResponse = Invoke-RestMethod -Uri "$API_BASE/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $attendeeRegisterPayload
    
    $attendeeUserId = $attendeeRegisterResponse.userId
    Write-Host "✓ Attendee registered" -ForegroundColor Green
    
    # Login as attendee
    $attendeeLoginPayload = @{
        email = $attendeeEmail
        password = "password123"
    } | ConvertTo-Json
    
    $attendeeLoginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $attendeeLoginPayload
    
    $attendeeToken = $attendeeLoginResponse.token
    
    # Register to event
    $attendeeHeaders = @{
        "Authorization" = "Bearer $attendeeToken"
    }
    
    $registrationResponse = Invoke-RestMethod -Uri "$API_BASE/events/$eventId/register" `
        -Method POST `
        -Headers $attendeeHeaders
    
    Write-Host "✓ Attendee registered to event" -ForegroundColor Green
    Write-Host "  Expected: event-service published 'registration.created' to RabbitMQ" -ForegroundColor Cyan
    Write-Host "  Expected: notification-service consumed event and created notification" -ForegroundColor Cyan
    
    Write-Host "`nStep 7: Wait for RabbitMQ processing..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "`nStep 8: Check attendee notifications for REGISTRATION_CONFIRMED..." -ForegroundColor Yellow
    $attendeeNotificationHeaders = @{
        "Authorization" = "Bearer $attendeeToken"
        "X-User-Id" = $attendeeUserId
    }
    
    $attendeeNotifications = Invoke-RestMethod -Uri "$API_BASE/notifications" `
        -Method GET `
        -Headers $attendeeNotificationHeaders
    
    $registrationNotifications = $attendeeNotifications | Where-Object { $_.type -eq "REGISTRATION_CONFIRMED" }
    
    if ($registrationNotifications.Count -gt 0) {
        Write-Host "✓ Found REGISTRATION_CONFIRMED notification(s)" -ForegroundColor Green
        $registrationNotifications | ForEach-Object {
            Write-Host "  Message: $($_.message)" -ForegroundColor Gray
            Write-Host "  Type: $($_.type)" -ForegroundColor Gray
            Write-Host "  Event ID: $($_.eventId)" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ No REGISTRATION_CONFIRMED notifications found!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Attendee registration flow failed: $_" -ForegroundColor Red
}

Write-Host "`n=== RabbitMQ Integration Summary ===" -ForegroundColor Cyan
Write-Host "Check service logs for detailed RabbitMQ activity:" -ForegroundColor Yellow
Write-Host "  event-service:        docker compose -f docker/docker-compose-microservices.yml logs --follow event-service" -ForegroundColor Gray
Write-Host "  notification-service: docker compose -f docker/docker-compose-microservices.yml logs --follow notification-service" -ForegroundColor Gray
Write-Host "`nCheck RabbitMQ Management UI:" -ForegroundColor Yellow
Write-Host "  URL: http://localhost:15672" -ForegroundColor Gray
Write-Host "  Username: eventflow" -ForegroundColor Gray
Write-Host "  Password: eventflow123" -ForegroundColor Gray

Write-Host "`nVerify exchange and queue:" -ForegroundColor Yellow
Write-Host "  Exchange: eventflow.exchange (topic)" -ForegroundColor Gray
Write-Host "  Queue: notification.queue" -ForegroundColor Gray
Write-Host "  Bindings: event.created, event.updated, event.deleted, registration.created, registration.deleted" -ForegroundColor Gray

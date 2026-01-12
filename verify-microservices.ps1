# Verify Microservices Deployment Script
# This script checks if all microservices are running correctly

Write-Host "=== EventFlow Microservices Verification ===" -ForegroundColor Cyan

$services = @(
    @{Name="API Gateway"; Url="http://localhost:8080/actuator/health"},
    @{Name="User Service"; Url="http://localhost:8081/actuator/health"},
    @{Name="Event Service"; Url="http://localhost:8082/actuator/health"},
    @{Name="Notification Service"; Url="http://localhost:8083/actuator/health"}
)

Write-Host "`nChecking service health..." -ForegroundColor Yellow

$allHealthy = $true

foreach ($service in $services) {
    Write-Host "`nTesting $($service.Name) at $($service.Url)..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $service.Url -Method GET -TimeoutSec 5 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Host " OK" -ForegroundColor Green
        } else {
            Write-Host " FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
            $allHealthy = $false
        }
    } catch {
        Write-Host " ERROR: $_" -ForegroundColor Red
        $allHealthy = $false
    }
}

Write-Host "`n=== Testing Authentication Flow ===" -ForegroundColor Cyan

# Test user registration
Write-Host "`n1. Testing user registration..." -NoNewline
$registerBody = @{
    firstName = "Test"
    lastName = "User"
    email = "test$(Get-Random)@example.com"
    password = "password123"
    role = "ORGANIZER"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -UseBasicParsing
    
    if ($registerResponse.StatusCode -eq 200 -or $registerResponse.StatusCode -eq 201) {
        Write-Host " OK" -ForegroundColor Green
        
        # Extract email for login
        $userEmail = ($registerBody | ConvertFrom-Json).email
        
        # Test login
        Write-Host "2. Testing user login..." -NoNewline
        $loginBody = @{
            email = $userEmail
            password = "password123"
        } | ConvertTo-Json
        
        $loginResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $loginBody `
            -UseBasicParsing
        
        if ($loginResponse.StatusCode -eq 200) {
            Write-Host " OK" -ForegroundColor Green
            
            $loginData = $loginResponse.Content | ConvertFrom-Json
            $token = $loginData.token
            
            # Test event creation
            Write-Host "3. Testing event creation with JWT..." -NoNewline
            $eventBody = @{
                name = "Test Event"
                description = "Test event via API"
                startDate = "2024-12-31T10:00:00"
                endDate = "2024-12-31T18:00:00"
                location = "Warsaw, Poland"
                maxAttendees = 50
            } | ConvertTo-Json
            
            $headers = @{
                "Authorization" = "Bearer $token"
                "Content-Type" = "application/json"
            }
            
            $eventResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/events" `
                -Method POST `
                -Headers $headers `
                -Body $eventBody `
                -UseBasicParsing
            
            if ($eventResponse.StatusCode -eq 200 -or $eventResponse.StatusCode -eq 201) {
                Write-Host " OK" -ForegroundColor Green
            } else {
                Write-Host " FAILED" -ForegroundColor Red
                $allHealthy = $false
            }
        } else {
            Write-Host " FAILED" -ForegroundColor Red
            $allHealthy = $false
        }
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host " ERROR: $_" -ForegroundColor Red
    $allHealthy = $false
}

Write-Host "`n=== Verification Summary ===" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "All checks passed! Microservices architecture is working correctly." -ForegroundColor Green
    Write-Host "`nYou can now:" -ForegroundColor Yellow
    Write-Host "- Access frontend at http://localhost:5173"
    Write-Host "- View API docs at http://localhost:8081/swagger-ui.html (User Service)"
    Write-Host "- View API docs at http://localhost:8082/swagger-ui.html (Event Service)"
    Write-Host "- View API docs at http://localhost:8083/swagger-ui.html (Notification Service)"
} else {
    Write-Host "Some checks failed. Please review the errors above." -ForegroundColor Red
    Write-Host "`nTroubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check Docker logs: docker compose -f docker/docker-compose-microservices.yml logs"
    Write-Host "2. Restart services: docker compose -f docker/docker-compose-microservices.yml restart"
    Write-Host "3. Rebuild from scratch: docker compose -f docker/docker-compose-microservices.yml down -v; docker compose -f docker/docker-compose-microservices.yml up -d --build"
    exit 1
}

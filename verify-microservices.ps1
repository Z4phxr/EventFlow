# EventFlow Microservices Verification Script
Write-Host " EventFlow Microservices Health Check" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

function Test-Endpoint {
    param([string]$Name, [string]$Url, [int]$ExpectedStatus = 200)
    try {
        Write-Host " Testing $Name..." -NoNewline
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "  OK ($($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  FAIL ($($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "
1 Checking Docker Containers..."
Write-Host "================================"

$containers = @(
    "eventflow-gateway",
    "eventflow-user-service", 
    "eventflow-event-service",
    "eventflow-notification-service",
    "eventflow-rabbitmq",
    "eventflow-postgres-user",
    "eventflow-postgres-event", 
    "eventflow-postgres-notification",
    "eventflow-frontend"
)

$runningContainers = 0
foreach ($container in $containers) {
    try {
        $status = docker inspect --format='{{.State.Status}}' $container 2>$null
        if ($status -eq "running") {
            Write-Host " $container  Running" -ForegroundColor Green
            $runningContainers++
        } else {
            Write-Host " $container  Not running" -ForegroundColor Red
        }
    } catch {
        Write-Host " $container  Not found" -ForegroundColor Red
    }
}

Write-Host "
Container Status: $runningContainers/$($containers.Length) running"

if ($runningContainers -lt $containers.Length) {
    Write-Host "
  Starting missing containers..." -ForegroundColor Yellow
    try {
        Set-Location -Path "docker"
        docker compose -f docker-compose-microservices.yml up -d
        Set-Location -Path ".."
        Start-Sleep -Seconds 15
    } catch {
        Set-Location -Path ".."
    }
}

Write-Host "
2 Checking Service Health..."
Write-Host "============================="

Start-Sleep -Seconds 5
$healthyServices = 0

if (Test-Endpoint "API Gateway" "http://localhost:18080/actuator/health") { $healthyServices++ }
if (Test-Endpoint "User Service" "http://localhost:8081/actuator/health") { $healthyServices++ }
if (Test-Endpoint "Event Service" "http://localhost:8082/actuator/health") { $healthyServices++ }
if (Test-Endpoint "Notification Service" "http://localhost:8083/actuator/health") { $healthyServices++ }

Write-Host "
3 Testing RabbitMQ..."
Test-Endpoint "RabbitMQ Management" "http://localhost:15672"

Write-Host "
4 Testing Frontend..."
Test-Endpoint "Frontend" "http://localhost:5173"

Write-Host "
 SUMMARY" -ForegroundColor Magenta
Write-Host "=========="
Write-Host "Containers: $runningContainers/$($containers.Length) running"
Write-Host "Health Checks: $healthyServices/4 passing"

if ($runningContainers -eq $containers.Length -and $healthyServices -eq 4) {
    Write-Host "
 ALL SYSTEMS OPERATIONAL!" -ForegroundColor Green
} else {
    Write-Host "
  Some issues detected" -ForegroundColor Yellow
}

Write-Host "
 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173"
Write-Host "   API Gateway: http://localhost:18080"
Write-Host "   RabbitMQ: http://localhost:15672"

# EventFlow - One-Command Startup Script
# Usage: .\start.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   EventFlow - Starting Application    " -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker is running
$dockerRunning = docker info 2>$null
if (-not $?) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "[1/4] Stopping existing containers..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\docker"
docker-compose down --remove-orphans 2>$null

# Clean up old images if rebuild is needed
Write-Host "[2/4] Building application (this may take 2-5 minutes on first run)..." -ForegroundColor Yellow
docker-compose build --no-cache

# Start all services
Write-Host "[3/4] Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be ready
Write-Host "[4/4] Waiting for services to be ready..." -ForegroundColor Yellow
$maxWait = 120
$waited = 0
$ready = $false

while (-not $ready -and $waited -lt $maxWait) {
    Start-Sleep -Seconds 5
    $waited += 5
    
    # Check if backend is responding
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/events" -Method GET -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
        }
    } catch {
        Write-Host "  Waiting... ($waited seconds)" -ForegroundColor Gray
    }
}

if ($ready) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   EventFlow is ready!                 " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
    Write-Host "  API:       http://localhost:8080/api" -ForegroundColor White
    Write-Host ""
    Write-Host "  Demo Accounts:" -ForegroundColor Cyan
    Write-Host "    Organizer: organizer@example.com / password123" -ForegroundColor White
    Write-Host "    User:      user@example.com / password123" -ForegroundColor White
    Write-Host ""
    Write-Host "  To stop: cd docker && docker-compose down" -ForegroundColor Gray
    Write-Host ""
    
    # Open browser
    Start-Process "http://localhost:5173"
} else {
    Write-Host ""
    Write-Host "WARNING: Services may still be starting. Check with:" -ForegroundColor Yellow
    Write-Host "  docker-compose logs -f" -ForegroundColor White
    Write-Host ""
}

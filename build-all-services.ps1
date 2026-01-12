# Build All Microservices Script
# This script builds all microservices and the API gateway

Write-Host "=== Building EventFlow Microservices ===" -ForegroundColor Cyan

$services = @(
    "services\user-service",
    "services\event-service", 
    "services\notification-service",
    "gateway"
)

$success = $true
$rootDir = Get-Location

foreach ($service in $services) {
    Write-Host "`nBuilding $service..." -ForegroundColor Yellow
    
    if (Test-Path $service) {
        Set-Location $service
        
        # Clean and build
        mvn clean install -DskipTests
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Build failed for $service" -ForegroundColor Red
            $success = $false
            Set-Location $rootDir
            break
        }
        
        Write-Host "SUCCESS: $service built successfully" -ForegroundColor Green
        Set-Location $rootDir
    } else {
        Write-Host "ERROR: Directory $service not found" -ForegroundColor Red
        $success = $false
        break
    }
}

Write-Host "`n=== Build Summary ===" -ForegroundColor Cyan
if ($success) {
    Write-Host "All services built successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Start microservices: cd docker; docker compose -f docker-compose-microservices.yml up -d --build"
    Write-Host "2. Check logs: docker compose -f docker-compose-microservices.yml logs --follow"
    Write-Host "3. Test API: curl http://localhost:8080/actuator/health"
} else {
    Write-Host "Build failed. Please check errors above." -ForegroundColor Red
    exit 1
}

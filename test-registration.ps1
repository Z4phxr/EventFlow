# Test registration through API Gateway
$testUser = @{
    username = "testuser7"
    email = "test7@example.com"
    password = "TestPass123"
    role = "USER"
}

$json = $testUser | ConvertTo-Json
Write-Host "Testing registration with:"
Write-Host $json

# Try direct to user service first
Write-Host "`nTesting direct to user service..."
try {
    $directResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" -Method POST -Body $json -ContentType "application/json"
    Write-Host "Direct call succeeded: $directResponse"
} catch {
    Write-Host "Direct call failed: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}

# Try through gateway
Write-Host "`nTesting through API Gateway..."
try {
    $gatewayResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -Body $json -ContentType "application/json"
    Write-Host "Gateway call succeeded: $gatewayResponse"
} catch {
    Write-Host "Gateway call failed: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}
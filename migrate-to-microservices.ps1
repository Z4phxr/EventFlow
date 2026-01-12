# PowerShell script to migrate monolith code to microservices
$ErrorActionPreference = "Stop"

$projectRoot = "c:\Users\kinga\Desktop\sieciowe"
$backendSrc = "$projectRoot\backend\src\main\java\com\eventflow"
$userServiceSrc = "$projectRoot\services\user-service\src\main\java\com\eventflow\userservice"
$eventServiceSrc = "$projectRoot\services\event-service\src\main\java\com\eventflow\eventservice"

Write-Host "Starting microservices migration..." -ForegroundColor Green

# Function to copy and replace package names
function Copy-AndReplacePackage {
    param(
        [string]$SourcePath,
        [string]$DestPath,
        [string]$OldPackage,
        [string]$NewPackage
    )
    
    if (Test-Path $SourcePath) {
        $content = Get-Content $SourcePath -Raw
        $newContent = $content -replace [regex]::Escape($OldPackage), $NewPackage
        New-Item -ItemType File -Path $DestPath -Force | Out-Null
        Set-Content -Path $DestPath -Value $newContent
        Write-Host "  Copied: $(Split-Path $DestPath -Leaf)" -ForegroundColor Cyan
    }
}

# USER SERVICE - Copy auth, users, security
Write-Host "`nMigrating USER SERVICE..." -ForegroundColor Yellow

# Copy auth controller
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\auth\controller\AuthController.java" `
    -DestPath "$userServiceSrc\auth\AuthController.java" `
    -OldPackage "package com.eventflow.auth.controller" `
    -NewPackage "package com.eventflow.userservice.auth"

# Copy auth service
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\auth\service\AuthService.java" `
    -DestPath "$userServiceSrc\auth\AuthService.java" `
    -OldPackage "package com.eventflow.auth.service" `
    -NewPackage "package com.eventflow.userservice.auth"

# Copy auth DTOs
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\auth\dto\AuthResponse.java" `
    -DestPath "$userServiceSrc\dto\AuthResponse.java" `
    -OldPackage "package com.eventflow.auth.dto" `
    -NewPackage "package com.eventflow.userservice.dto"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\auth\dto\LoginRequest.java" `
    -DestPath "$userServiceSrc\dto\LoginRequest.java" `
    -OldPackage "package com.eventflow.auth.dto" `
    -NewPackage "package com.eventflow.userservice.dto"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\auth\dto\RegisterRequest.java" `
    -DestPath "$userServiceSrc\dto\RegisterRequest.java" `
    -OldPackage "package com.eventflow.auth.dto" `
    -NewPackage "package com.eventflow.userservice.dto"

# Copy user entities
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\users\entity\User.java" `
    -DestPath "$userServiceSrc\user\User.java" `
    -OldPackage "package com.eventflow.users.entity" `
    -NewPackage "package com.eventflow.userservice.user"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\users\entity\UserRole.java" `
    -DestPath "$userServiceSrc\user\UserRole.java" `
    -OldPackage "package com.eventflow.users.entity" `
    -NewPackage "package com.eventflow.userservice.user"

# Copy user repository
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\users\repository\UserRepository.java" `
    -DestPath "$userServiceSrc\user\UserRepository.java" `
    -OldPackage "package com.eventflow.users.repository" `
    -NewPackage "package com.eventflow.userservice.user"

# Copy user service
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\users\service\UserDetailsServiceImpl.java" `
    -DestPath "$userServiceSrc\user\UserDetailsServiceImpl.java" `
    -OldPackage "package com.eventflow.users.service" `
    -NewPackage "package com.eventflow.userservice.user"

# Copy security classes
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\security\JwtTokenProvider.java" `
    -DestPath "$userServiceSrc\security\JwtTokenProvider.java" `
    -OldPackage "package com.eventflow.common.security" `
    -NewPackage "package com.eventflow.userservice.security"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\security\JwtAuthenticationFilter.java" `
    -DestPath "$userServiceSrc\security\JwtAuthenticationFilter.java" `
    -OldPackage "package com.eventflow.common.security" `
    -NewPackage "package com.eventflow.userservice.security"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\security\SecurityConfig.java" `
    -DestPath "$userServiceSrc\security\SecurityConfig.java" `
    -OldPackage "package com.eventflow.common.security" `
    -NewPackage "package com.eventflow.userservice.security"

# Copy exception classes
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\exception\BusinessException.java" `
    -DestPath "$userServiceSrc\common\exception\BusinessException.java" `
    -OldPackage "package com.eventflow.common.exception" `
    -NewPackage "package com.eventflow.userservice.common.exception"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\exception\GlobalExceptionHandler.java" `
    -DestPath "$userServiceSrc\common\exception\GlobalExceptionHandler.java" `
    -OldPackage "package com.eventflow.common.exception" `
    -NewPackage "package com.eventflow.userservice.common.exception"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\exception\ErrorResponse.java" `
    -DestPath "$userServiceSrc\common\exception\ErrorResponse.java" `
    -OldPackage "package com.eventflow.common.exception" `
    -NewPackage "package com.eventflow.userservice.common.exception"

# Copy encryption converter
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\encryption\EmailEncryptionConverter.java" `
    -DestPath "$userServiceSrc\common\encryption\EmailEncryptionConverter.java" `
    -OldPackage "package com.eventflow.common.encryption" `
    -NewPackage "package com.eventflow.userservice.common.encryption"

# Copy OpenAPI config
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\config\OpenApiConfig.java" `
    -DestPath "$userServiceSrc\security\OpenApiConfig.java" `
    -OldPackage "package com.eventflow.common.config" `
    -NewPackage "package com.eventflow.userservice.security"

Write-Host "`nMicroservices migration completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run similar migration for event-service" -ForegroundColor White
Write-Host "2. Fix import statements in migrated files" -ForegroundColor White
Write-Host "3. Create main application classes" -ForegroundColor White
Write-Host "4. Create Flyway migrations" -ForegroundColor White

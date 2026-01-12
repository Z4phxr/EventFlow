# Complete microservices migration script
$ErrorActionPreference = "Stop"

$projectRoot = "c:\Users\kinga\Desktop\sieciowe"
$backendSrc = "$projectRoot\backend\src\main\java\com\eventflow"
$eventServiceSrc = "$projectRoot\services\event-service\src\main\java\com\eventflow\eventservice"

Write-Host "Migrating EVENT SERVICE..." -ForegroundColor Yellow

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

# Event controller
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\events\controller\EventController.java" `
    -DestPath "$eventServiceSrc\event\EventController.java" `
    -OldPackage "package com.eventflow.events.controller" `
    -NewPackage "package com.eventflow.eventservice.event"

# Event service  
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\events\service\EventService.java" `
    -DestPath "$eventServiceSrc\event\EventService.java" `
    -OldPackage "package com.eventflow.events.service" `
    -NewPackage "package com.eventflow.eventservice.event"

# Event entity
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\events\entity\Event.java" `
    -DestPath "$eventServiceSrc\event\Event.java" `
    -OldPackage "package com.eventflow.events.entity" `
    -NewPackage "package com.eventflow.eventservice.event"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\events\entity\EventStatus.java" `
    -DestPath "$eventServiceSrc\event\EventStatus.java" `
    -OldPackage "package com.eventflow.events.entity" `
    -NewPackage "package com.eventflow.eventservice.event"

# Event repository
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\events\repository\EventRepository.java" `
    -DestPath "$eventServiceSrc\event\EventRepository.java" `
    -OldPackage "package com.eventflow.events.repository" `
    -NewPackage "package com.eventflow.eventservice.event"

# Event DTOs
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\events\dto\EventCreateRequest.java" `
    -DestPath "$eventServiceSrc\event\EventCreateRequest.java" `
    -OldPackage "package com.eventflow.events.dto" `
    -NewPackage "package com.eventflow.eventservice.event"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\events\dto\EventUpdateRequest.java" `
    -DestPath "$eventServiceSrc\event\EventUpdateRequest.java" `
    -OldPackage "package com.eventflow.events.dto" `
    -NewPackage "package com.eventflow.eventservice.event"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\events\dto\EventResponse.java" `
    -DestPath "$eventServiceSrc\event\EventResponse.java" `
    -OldPackage "package com.eventflow.events.dto" `
    -NewPackage "package com.eventflow.eventservice.event"

# Registration controller
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\registrations\controller\RegistrationController.java" `
    -DestPath "$eventServiceSrc\registration\RegistrationController.java" `
    -OldPackage "package com.eventflow.registrations.controller" `
    -NewPackage "package com.eventflow.eventservice.registration"

# Registration service
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\registrations\service\RegistrationService.java" `
    -DestPath "$eventServiceSrc\registration\RegistrationService.java" `
    -OldPackage "package com.eventflow.registrations.service" `
    -NewPackage "package com.eventflow.eventservice.registration"

# Registration entity
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\registrations\entity\Registration.java" `
    -DestPath "$eventServiceSrc\registration\Registration.java" `
    -OldPackage "package com.eventflow.registrations.entity" `
    -NewPackage "package com.eventflow.eventservice.registration"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\registrations\entity\RegistrationStatus.java" `
    -DestPath "$eventServiceSrc\registration\RegistrationStatus.java" `
    -OldPackage "package com.eventflow.registrations.entity" `
    -NewPackage "package com.eventflow.eventservice.registration"

# Registration repository
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\registrations\repository\RegistrationRepository.java" `
    -DestPath "$eventServiceSrc\registration\RegistrationRepository.java" `
    -OldPackage "package com.eventflow.registrations.repository" `
    -NewPackage "package com.eventflow.eventservice.registration"

# Registration DTO
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\registrations\dto\RegistrationResponse.java" `
    -DestPath "$eventServiceSrc\registration\RegistrationResponse.java" `
    -OldPackage "package com.eventflow.registrations.dto" `
    -NewPackage "package com.eventflow.eventservice.registration"

# Integration services
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\integrations\service\GeocodingService.java" `
    -DestPath "$eventServiceSrc\integration\GeocodingService.java" `
    -OldPackage "package com.eventflow.integrations.service" `
    -NewPackage "package com.eventflow.eventservice.integration"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\integrations\service\WeatherService.java" `
    -DestPath "$eventServiceSrc\integration\WeatherService.java" `
    -OldPackage "package com.eventflow.integrations.service" `
    -NewPackage "package com.eventflow.eventservice.integration"

# Integration DTOs
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\integrations\dto\Coordinates.java" `
    -DestPath "$eventServiceSrc\integration\Coordinates.java" `
    -OldPackage "package com.eventflow.integrations.dto" `
    -NewPackage "package com.eventflow.eventservice.integration"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\integrations\dto\WeatherResponse.java" `
    -DestPath "$eventServiceSrc\integration\WeatherResponse.java" `
    -OldPackage "package com.eventflow.integrations.dto" `
    -NewPackage "package com.eventflow.eventservice.integration"

# Security classes (JWT validation only)
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\security\JwtTokenProvider.java" `
    -DestPath "$eventServiceSrc\security\JwtTokenProvider.java" `
    -OldPackage "package com.eventflow.common.security" `
    -NewPackage "package com.eventflow.eventservice.security"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\security\JwtAuthenticationFilter.java" `
    -DestPath "$eventServiceSrc\security\JwtAuthenticationFilter.java" `
    -OldPackage "package com.eventflow.common.security" `
    -NewPackage "package com.eventflow.eventservice.security"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\security\SecurityConfig.java" `
    -DestPath "$eventServiceSrc\security\SecurityConfig.java" `
    -OldPackage "package com.eventflow.common.security" `
    -NewPackage "package com.eventflow.eventservice.security"

# Exception classes
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\exception\BusinessException.java" `
    -DestPath "$eventServiceSrc\common\exception\BusinessException.java" `
    -OldPackage "package com.eventflow.common.exception" `
    -NewPackage "package com.eventflow.eventservice.common.exception"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\exception\GlobalExceptionHandler.java" `
    -DestPath "$eventServiceSrc\common\exception\GlobalExceptionHandler.java" `
    -OldPackage "package com.eventflow.common.exception" `
    -NewPackage "package com.eventflow.eventservice.common.exception"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\exception\ErrorResponse.java" `
    -DestPath "$eventServiceSrc\common\exception\ErrorResponse.java" `
    -OldPackage "package com.eventflow.common.exception" `
    -NewPackage "package com.eventflow.eventservice.common.exception"

# Domain event classes
Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\events\DomainEvent.java" `
    -DestPath "$eventServiceSrc\common\events\DomainEvent.java" `
    -OldPackage "package com.eventflow.common.events" `
    -NewPackage "package com.eventflow.eventservice.common.events"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\events\DomainEventPublisher.java" `
    -DestPath "$eventServiceSrc\common\events\DomainEventPublisher.java" `
    -OldPackage "package com.eventflow.common.events" `
    -NewPackage "package com.eventflow.eventservice.common.events"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\events\LocalDomainEventPublisher.java" `
    -DestPath "$eventServiceSrc\common\events\LocalDomainEventPublisher.java" `
    -OldPackage "package com.eventflow.common.events" `
    -NewPackage "package com.eventflow.eventservice.common.events"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\events\EventCreated.java" `
    -DestPath "$eventServiceSrc\common\events\EventCreated.java" `
    -OldPackage "package com.eventflow.common.events" `
    -NewPackage "package com.eventflow.eventservice.common.events"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\events\EventUpdated.java" `
    -DestPath "$eventServiceSrc\common\events\EventUpdated.java" `
    -OldPackage "package com.eventflow.common.events" `
    -NewPackage "package com.eventflow.eventservice.common.events"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\events\UserRegisteredToEvent.java" `
    -DestPath "$eventServiceSrc\common\events\UserRegisteredToEvent.java" `
    -OldPackage "package com.eventflow.common.events" `
    -NewPackage "package com.eventflow.eventservice.common.events"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\events\UserUnregisteredFromEvent.java" `
    -DestPath "$eventServiceSrc\common\events\UserUnregisteredFromEvent.java" `
    -OldPackage "package com.eventflow.common.events" `
    -NewPackage "package com.eventflow.eventservice.common.events"

Copy-AndReplacePackage `
    -SourcePath "$backendSrc\common\config\OpenApiConfig.java" `
    -DestPath "$eventServiceSrc\security\OpenApiConfig.java" `
    -OldPackage "package com.eventflow.common.config" `
    -NewPackage "package com.eventflow.eventservice.security"

Write-Host "Event service migration completed!" -ForegroundColor Green

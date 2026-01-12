# Fix imports in event-service
$eventServiceSrc = "c:\Users\kinga\Desktop\sieciowe\services\event-service\src\main\java\com\eventflow\eventservice"

Write-Host "Fixing imports in event-service..." -ForegroundColor Green

Get-ChildItem -Path $eventServiceSrc -Recurse -Filter *.java | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw
    
    # Replace old package imports with new ones
    $content = $content -replace 'import com\.eventflow\.events\.controller\.', 'import com.eventflow.eventservice.event.'
    $content = $content -replace 'import com\.eventflow\.events\.service\.', 'import com.eventflow.eventservice.event.'
    $content = $content -replace 'import com\.eventflow\.events\.entity\.', 'import com.eventflow.eventservice.event.'
    $content = $content -replace 'import com\.eventflow\.events\.repository\.', 'import com.eventflow.eventservice.event.'
    $content = $content -replace 'import com\.eventflow\.events\.dto\.', 'import com.eventflow.eventservice.event.'
    $content = $content -replace 'import com\.eventflow\.registrations\.controller\.', 'import com.eventflow.eventservice.registration.'
    $content = $content -replace 'import com\.eventflow\.registrations\.service\.', 'import com.eventflow.eventservice.registration.'
    $content = $content -replace 'import com\.eventflow\.registrations\.entity\.', 'import com.eventflow.eventservice.registration.'
    $content = $content -replace 'import com\.eventflow\.registrations\.repository\.', 'import com.eventflow.eventservice.registration.'
    $content = $content -replace 'import com\.eventflow\.registrations\.dto\.', 'import com.eventflow.eventservice.registration.'
    $content = $content -replace 'import com\.eventflow\.integrations\.service\.', 'import com.eventflow.eventservice.integration.'
    $content = $content -replace 'import com\.eventflow\.integrations\.dto\.', 'import com.eventflow.eventservice.integration.'
    $content = $content -replace 'import com\.eventflow\.common\.security\.', 'import com.eventflow.eventservice.security.'
    $content = $content -replace 'import com\.eventflow\.common\.exception\.', 'import com.eventflow.eventservice.common.exception.'
    $content = $content -replace 'import com\.eventflow\.common\.events\.', 'import com.eventflow.eventservice.common.events.'
    $content = $content -replace 'import com\.eventflow\.common\.config\.', 'import com.eventflow.eventservice.security.'
    $content = $content -replace 'import com\.eventflow\.users\.entity\.User;', '// User entity not in event-service - handled via JWT'
    
    Set-Content -Path $file.FullName -Value $content
    Write-Host "  Fixed: $($file.Name)" -ForegroundColor Cyan
}

Write-Host "Import fixing completed!" -ForegroundColor Green

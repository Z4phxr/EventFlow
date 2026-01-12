# PowerShell script to fix imports in user-service
$userServiceSrc = "c:\Users\kinga\Desktop\sieciowe\services\user-service\src\main\java\com\eventflow\userservice"

Write-Host "Fixing imports in user-service..." -ForegroundColor Green

Get-ChildItem -Path $userServiceSrc -Recurse -Filter *.java | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw
    
    # Replace old package imports with new ones
    $content = $content -replace 'import com\.eventflow\.auth\.dto\.', 'import com.eventflow.userservice.dto.'
    $content = $content -replace 'import com\.eventflow\.auth\.service\.', 'import com.eventflow.userservice.auth.'
    $content = $content -replace 'import com\.eventflow\.users\.entity\.', 'import com.eventflow.userservice.user.'
    $content = $content -replace 'import com\.eventflow\.users\.repository\.', 'import com.eventflow.userservice.user.'
    $content = $content -replace 'import com\.eventflow\.users\.service\.', 'import com.eventflow.userservice.user.'
    $content = $content -replace 'import com\.eventflow\.common\.security\.', 'import com.eventflow.userservice.security.'
    $content = $content -replace 'import com\.eventflow\.common\.exception\.', 'import com.eventflow.userservice.common.exception.'
    $content = $content -replace 'import com\.eventflow\.common\.encryption\.', 'import com.eventflow.userservice.common.encryption.'
    $content = $content -replace 'import com\.eventflow\.common\.config\.', 'import com.eventflow.userservice.security.'
    
    Set-Content -Path $file.FullName -Value $content
    Write-Host "  Fixed: $($file.Name)" -ForegroundColor Cyan
}

Write-Host "Import fixing completed!" -ForegroundColor Green

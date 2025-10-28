Write-Host "=== ALL TOPICS - REQUIRED IMAGE FILES ===" -ForegroundColor Green
Write-Host ""

$allTopicFiles = Get-ChildItem "files/topics/*.json" | Where-Object { $_.BaseName -ne 'default' }

foreach ($topicFile in $allTopicFiles) {
    $topicName = $topicFile.BaseName
    Write-Host "TOPIC: $($topicName.ToUpper())" -ForegroundColor Cyan
    Write-Host "Folder: images/preferences/$topicName/" -ForegroundColor Gray
    
    try {
        $topicData = Get-Content $topicFile.FullName -Raw | ConvertFrom-Json
        $allOptions = @()
        
        foreach ($question in $topicData.questions) {
            if ($question.option1) { $allOptions += $question.option1 }
            if ($question.option2) { $allOptions += $question.option2 }
        }
        
        $uniqueOptions = $allOptions | Sort-Object -Unique
        
        foreach ($option in $uniqueOptions) {
            $filename = $option.ToLower() -replace '[\s\/]+', '-' -replace '[^\w\-]', ''
            Write-Host "  $filename.jpg" -ForegroundColor Yellow -NoNewline
            Write-Host " ($option)" -ForegroundColor Gray
        }
        
        Write-Host "  Total: $($uniqueOptions.Count) files needed" -ForegroundColor Magenta
        Write-Host ""
        
    } catch {
        Write-Host "  Error reading topic" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host "To rename your images, use:" -ForegroundColor Gray
Write-Host "  .\rename-images-simple.ps1 topicname" -ForegroundColor White
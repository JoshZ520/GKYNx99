# Simple Image Renaming Script for Table Talk Game
param(
    [Parameter(Mandatory=$true)]
    [string]$TopicName,
    
    [switch]$WhatIf
)

Write-Host "Image Renaming for Topic: $TopicName" -ForegroundColor Green

# Check if topic file exists
$topicFile = "files/topics/$TopicName.json"
if (-not (Test-Path $topicFile)) {
    Write-Error "Topic file not found: $topicFile"
    Write-Host "Available topics:" -ForegroundColor Yellow
    Get-ChildItem "files/topics/*.json" | Where-Object { $_.BaseName -ne 'default' } | ForEach-Object { 
        Write-Host "  - $($_.BaseName)" -ForegroundColor Cyan
    }
    exit 1
}

# Load topic data
try {
    $topicData = Get-Content $topicFile -Raw | ConvertFrom-Json
    
    # Extract all unique options
    $allOptions = @()
    foreach ($question in $topicData.questions) {
        if ($question.option1) { $allOptions += $question.option1 }
        if ($question.option2) { $allOptions += $question.option2 }
    }
    
    $uniqueOptions = $allOptions | Sort-Object -Unique
    Write-Host "Found $($uniqueOptions.Count) unique options for this topic" -ForegroundColor Blue
    
} catch {
    Write-Error "Error reading topic file: $_"
    exit 1
}

# Check image folder
$imageFolderPath = "images/preferences/$TopicName"
if (-not (Test-Path $imageFolderPath)) {
    Write-Error "Image folder not found: $imageFolderPath"
    Write-Host "Create it with: mkdir `"$imageFolderPath`"" -ForegroundColor Yellow
    exit 1
}

# Get existing images
$existingImages = Get-ChildItem $imageFolderPath -File | Where-Object { 
    $_.Extension -match '\.(jpg|jpeg|png|webp)$' 
}

if ($existingImages.Count -eq 0) {
    Write-Host "No images found in $imageFolderPath" -ForegroundColor Yellow
    Write-Host "Add some images to the folder first!" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found $($existingImages.Count) images to rename" -ForegroundColor Blue

if ($existingImages.Count -lt $uniqueOptions.Count) {
    Write-Warning "You have $($existingImages.Count) images but need $($uniqueOptions.Count)"
    Write-Host "Will rename available images only" -ForegroundColor Yellow
}

# Rename images
Write-Host "`nRenaming images..." -ForegroundColor Green

for ($i = 0; $i -lt [Math]::Min($existingImages.Count, $uniqueOptions.Count); $i++) {
    $currentImage = $existingImages[$i]
    $targetOption = $uniqueOptions[$i]
    
    # Create clean filename
    $targetFilename = $targetOption.ToLower() -replace '[\s\/]+', '-' -replace '[^\w\-]', ''
    $targetFilename = "$targetFilename.jpg"
    
    $targetPath = Join-Path $imageFolderPath $targetFilename
    
    if ($WhatIf) {
        Write-Host "PREVIEW: '$($currentImage.Name)' -> '$targetFilename'" -ForegroundColor Cyan
        Write-Host "  For option: '$targetOption'" -ForegroundColor Gray
    } else {
        try {
            Rename-Item $currentImage.FullName $targetPath -ErrorAction Stop
            Write-Host "✓ '$($currentImage.Name)' -> '$targetFilename'" -ForegroundColor Green
            Write-Host "  For option: '$targetOption'" -ForegroundColor Gray
        } catch {
            Write-Error "Failed to rename $($currentImage.Name): $_"
        }
    }
}

Write-Host "`nDone!" -ForegroundColor Green
if ($WhatIf) {
    Write-Host "Run without -WhatIf to actually rename files" -ForegroundColor Yellow
} else {
    Write-Host "Images are ready for the game!" -ForegroundColor Green
}
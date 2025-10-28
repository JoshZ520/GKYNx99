# Simple Image Renamer
param([string]$TopicName, [switch]$WhatIf)

$topicFile = "files/topics/$TopicName.json"
if (-not (Test-Path $topicFile)) {
    Write-Host "Topic not found: $TopicName" -ForegroundColor Red
    exit 1
}

$topicData = Get-Content $topicFile -Raw | ConvertFrom-Json
$allOptions = @()

foreach ($question in $topicData.questions) {
    if ($question.option1) { $allOptions += $question.option1 }
    if ($question.option2) { $allOptions += $question.option2 }
}

$uniqueOptions = $allOptions | Sort-Object -Unique
$imageFolderPath = "images/preferences/$TopicName"

if (-not (Test-Path $imageFolderPath)) {
    Write-Host "Folder not found: $imageFolderPath" -ForegroundColor Red
    exit 1
}

$existingImages = Get-ChildItem $imageFolderPath -File | Where-Object { 
    $_.Extension -match '\.(jpg|jpeg|png|webp)$' 
}

if ($existingImages.Count -eq 0) {
    Write-Host "No images found in folder" -ForegroundColor Yellow
    exit 1
}

Write-Host "Renaming $($existingImages.Count) images for topic: $TopicName" -ForegroundColor Green

for ($i = 0; $i -lt [Math]::Min($existingImages.Count, $uniqueOptions.Count); $i++) {
    $currentImage = $existingImages[$i]
    $targetOption = $uniqueOptions[$i]
    $targetFilename = ($targetOption.ToLower() -replace '[\s\/]+', '-' -replace '[^\w\-]', '') + ".jpg"
    $targetPath = Join-Path $imageFolderPath $targetFilename
    
    if ($WhatIf) {
        Write-Host "PREVIEW: $($currentImage.Name) -> $targetFilename" -ForegroundColor Cyan
    } else {
        Rename-Item $currentImage.FullName $targetPath
        Write-Host "RENAMED: $($currentImage.Name) -> $targetFilename" -ForegroundColor Green
    }
}

Write-Host "Complete!" -ForegroundColor Green
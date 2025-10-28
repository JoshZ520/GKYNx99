# Remove Blank Lines Script
# This script removes completely blank lines from files while preserving formatting

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Path,
    
    [switch]$Recursive,
    
    [string[]]$Include = @("*.js", "*.css", "*.html", "*.json", "*.md", "*.txt"),
    
    [string[]]$Exclude = @("node_modules", ".git", "*.min.*"),
    
    [switch]$WhatIf
)

function Remove-BlankLines {
    param([string]$FilePath)
    
    try {
        # Read all lines from the file
        $lines = Get-Content -Path $FilePath -Raw
        
        if ($null -eq $lines) {
            Write-Host "File is empty or could not be read: $FilePath" -ForegroundColor Yellow
            return
        }
        
        # Split into lines and process
        $allLines = $lines -split "`r?`n"
        $nonBlankLines = @()
        $blankLinesRemoved = 0
        
        foreach ($line in $allLines) {
            if ($line.Trim() -ne "") {
                $nonBlankLines += $line
            } else {
                $blankLinesRemoved++
            }
        }
        
        if ($blankLinesRemoved -gt 0) {
            if ($WhatIf) {
                Write-Host "WHAT-IF: Would remove $blankLinesRemoved blank lines from: $FilePath" -ForegroundColor Cyan
            } else {
                # Join lines back with newlines and write to file
                $newContent = $nonBlankLines -join "`n"
                Set-Content -Path $FilePath -Value $newContent -NoNewline
                Write-Host "Removed $blankLinesRemoved blank lines from: $FilePath" -ForegroundColor Green
            }
        } else {
            Write-Host "No blank lines found in: $FilePath" -ForegroundColor Gray
        }
    }
    catch {
        Write-Error "Error processing file $FilePath`: $_"
    }
}

# Main execution
try {
    if (Test-Path $Path -PathType Container) {
        # It's a directory
        $searchParams = @{
            Path = $Path
            File = $true
        }
        
        if ($Recursive) {
            $searchParams.Recurse = $true
        }
        
        $files = Get-ChildItem @searchParams | Where-Object {
            $file = $_
            
            # Check include patterns
            $includeMatch = $false
            foreach ($pattern in $Include) {
                if ($file.Name -like $pattern) {
                    $includeMatch = $true
                    break
                }
            }
            
            if (-not $includeMatch) {
                return $false
            }
            
            # Check exclude patterns
            foreach ($pattern in $Exclude) {
                if ($file.Name -like $pattern -or $file.FullName -like "*$pattern*") {
                    return $false
                }
            }
            
            return $true
        }
        
        if ($files.Count -eq 0) {
            Write-Host "No matching files found in: $Path" -ForegroundColor Yellow
            return
        }
        
        Write-Host "Processing $($files.Count) files..." -ForegroundColor Blue
        
        foreach ($file in $files) {
            Remove-BlankLines -FilePath $file.FullName
        }
    }
    elseif (Test-Path $Path -PathType Leaf) {
        # It's a single file
        Write-Host "Processing single file..." -ForegroundColor Blue
        Remove-BlankLines -FilePath $Path
    }
    else {
        Write-Error "Path not found: $Path"
    }
}
catch {
    Write-Error "Script execution error: $_"
}

Write-Host "`nScript completed!" -ForegroundColor Blue
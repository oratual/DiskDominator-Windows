# DiskDominator Build Script - Final Version
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   DiskDominator Build Script - Final" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Change to project directory
Set-Location "K:\_Glados\DiskDominator"

# Check Node.js
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Node.js $nodeVersion installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Node.js not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Rust
$rustVersion = rustc --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Rust $rustVersion installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Rust not installed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Create simplified Cargo.toml
Write-Host "Creating simplified Cargo.toml..." -ForegroundColor Cyan
$cargoContent = @"
[package]
name = "disk-dominator"
version = "0.1.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "1", features = [] }

[dependencies]
tauri = { version = "1", features = ["fs-all", "path-all", "os-all", "shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
"@

$cargoContent | Out-File -FilePath "src-tauri\Cargo.toml" -Encoding utf8

# Remove workspace Cargo.toml if exists
if (Test-Path "Cargo.toml") {
    Move-Item "Cargo.toml" "Cargo.toml.workspace-backup" -Force
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Yellow
Write-Host "   Building Tauri Application" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Yellow
Write-Host ""

# Create logs directory
$logsDir = "build-logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "$logsDir\build-$timestamp.log"
$errorFile = "$logsDir\errors-$timestamp.log"

Write-Host "Logs will be saved to:" -ForegroundColor Cyan
Write-Host "  Build log: $logFile" -ForegroundColor White
Write-Host "  Error log: $errorFile" -ForegroundColor White
Write-Host ""

# Run build directly with npm (without using full path)
Write-Host "Running build (this may take several minutes)..." -ForegroundColor Yellow
Write-Host ""

# Start transcript to capture all output
Start-Transcript -Path $logFile

try {
    # Run npm directly (it should be in PATH)
    npm run tauri:build 2>&1 | ForEach-Object {
        # Display output
        Write-Host $_
        
        # Capture errors
        if ($_ -match "error:|Error:|failed|ERROR") {
            Add-Content -Path $errorFile -Value $_
        }
    }
    
    $buildSuccess = $LASTEXITCODE -eq 0
} catch {
    Write-Host "Build error: $_" -ForegroundColor Red
    Add-Content -Path $errorFile -Value "Build exception: $_"
    $buildSuccess = $false
} finally {
    Stop-Transcript
}

# Check if build succeeded
if ($buildSuccess -and (Test-Path "src-tauri\target\release\disk-dominator.exe")) {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "   BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    
    $exePath = Resolve-Path "src-tauri\target\release\disk-dominator.exe"
    Write-Host "Executable created at:" -ForegroundColor Yellow
    Write-Host "  $exePath" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Opening output folder..." -ForegroundColor Cyan
    explorer.exe "src-tauri\target\release"
} else {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "   BUILD FAILED" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
    
    if (Test-Path $errorFile) {
        Write-Host ""
        Write-Host "Errors found:" -ForegroundColor Red
        Get-Content $errorFile | Select-Object -Last 20 | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Check the full logs at:" -ForegroundColor Yellow
    Write-Host "  $logFile" -ForegroundColor White
    Write-Host "  $errorFile" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
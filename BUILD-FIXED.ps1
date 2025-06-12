# DiskDominator Build Script - Fixed Version
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   DiskDominator Build Script - Fixed" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Change to project directory
Set-Location "K:\_Glados\DiskDominator"

# Find npm and node in common locations
$npmPaths = @(
    "$env:ProgramFiles\nodejs\npm.cmd",
    "$env:ProgramFiles (x86)\nodejs\npm.cmd",
    "$env:APPDATA\npm\npm.cmd",
    "$env:LOCALAPPDATA\Programs\node\npm.cmd"
)

$npmPath = $null
foreach ($path in $npmPaths) {
    if (Test-Path $path) {
        $npmPath = $path
        break
    }
}

if (-not $npmPath) {
    # Try to find npm in PATH
    $npmInPath = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmInPath) {
        $npmPath = $npmInPath.Source
    }
}

if (-not $npmPath) {
    Write-Host "[ERROR] npm not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found npm at: $npmPath" -ForegroundColor Green

# Check Node.js
$nodeVersion = & node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Node.js $nodeVersion installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Node.js not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Rust
$rustVersion = & rustc --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Rust $rustVersion installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Rust not installed" -ForegroundColor Red
    Write-Host "Install from: https://rustup.rs/" -ForegroundColor Yellow
    Write-Host "Make sure to install the MSVC toolchain!" -ForegroundColor Red
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
$logsDir = "K:\_Glados\DiskDominator\build-logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "$logsDir\build-$timestamp.log"

Write-Host "Build log: $logFile" -ForegroundColor Cyan
Write-Host ""

# Run build using cmd.exe to avoid PowerShell issues
Write-Host "Running build..." -ForegroundColor Yellow
$buildCmd = "cd /d K:\_Glados\DiskDominator && $npmPath run tauri:build"
$result = cmd.exe /c $buildCmd 2>&1 | Tee-Object -FilePath $logFile

# Check if build succeeded
$success = $false
if (Test-Path "src-tauri\target\release\disk-dominator.exe") {
    $success = $true
}

if ($success) {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "   BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "Executable: src-tauri\target\release\disk-dominator.exe" -ForegroundColor Yellow
    explorer.exe "src-tauri\target\release"
} else {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "   BUILD FAILED" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
    
    # Try to extract error from log
    Write-Host ""
    Write-Host "Recent errors:" -ForegroundColor Red
    $logContent = Get-Content $logFile -ErrorAction SilentlyContinue
    if ($logContent) {
        $logContent | Select-String -Pattern "error:|Error:|failed" | Select-Object -Last 10 | ForEach-Object {
            Write-Host $_.Line -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Full log saved to: $logFile" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
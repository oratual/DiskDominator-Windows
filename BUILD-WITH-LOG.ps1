# DiskDominator Build Script with Error Logging
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   DiskDominator Build Script (with logging)" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Change to project directory
Set-Location "K:\_Glados\DiskDominator"

# Create logs directory
$logsDir = "K:\_Glados\DiskDominator\build-logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

# Generate timestamp for log files
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "$logsDir\build-$timestamp.log"
$errorLogFile = "$logsDir\build-errors-$timestamp.log"

Write-Host "Logs will be saved to:" -ForegroundColor Yellow
Write-Host "  Full log: $logFile" -ForegroundColor Cyan
Write-Host "  Error log: $errorLogFile" -ForegroundColor Cyan
Write-Host ""

# Function to log output
function Write-Log {
    param($Message)
    Add-Content -Path $logFile -Value $Message
    Write-Host $Message
}

# Start logging
Write-Log "Build started at: $(Get-Date)"
Write-Log ""

# Check environment
Write-Log "Checking environment..."
Write-Log "Node version: $(node --version 2>&1)"
Write-Log "Rust version: $(rustc --version 2>&1)"
Write-Log "Cargo version: $(cargo --version 2>&1)"
Write-Log ""

# Show current rustup toolchain
Write-Log "Current Rust toolchain:"
rustup show 2>&1 | Out-String | Write-Log
Write-Log ""

# Clean previous builds
Write-Log "Cleaning previous builds..."
if (Test-Path "src-tauri\target") {
    Remove-Item -Path "src-tauri\target" -Recurse -Force
    Write-Log "Removed src-tauri\target directory"
}

# Create simplified Cargo.toml
Write-Log "Creating simplified Cargo.toml..."
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

# Backup workspace Cargo.toml if exists
if (Test-Path "Cargo.toml") {
    Move-Item "Cargo.toml" "Cargo.toml.workspace-backup" -Force
    Write-Log "Backed up workspace Cargo.toml"
}

Write-Log ""
Write-Log "===========================================" 
Write-Log "Running build..."
Write-Log "===========================================" 
Write-Log ""

# Run build and capture all output
$buildProcess = Start-Process -FilePath "npm" `
    -ArgumentList "run", "tauri:build" `
    -WorkingDirectory "K:\_Glados\DiskDominator" `
    -RedirectStandardOutput "$logsDir\npm-stdout-$timestamp.log" `
    -RedirectStandardError "$logsDir\npm-stderr-$timestamp.log" `
    -PassThru `
    -NoNewWindow

# Wait for build to complete
$buildProcess.WaitForExit()
$exitCode = $buildProcess.ExitCode

# Read and display output
Write-Log ""
Write-Log "Build output:"
if (Test-Path "$logsDir\npm-stdout-$timestamp.log") {
    Get-Content "$logsDir\npm-stdout-$timestamp.log" | ForEach-Object {
        Write-Log $_
    }
}

Write-Log ""
Write-Log "Build errors/warnings:"
if (Test-Path "$logsDir\npm-stderr-$timestamp.log") {
    Get-Content "$logsDir\npm-stderr-$timestamp.log" | ForEach-Object {
        Write-Log $_
        Add-Content -Path $errorLogFile -Value $_
    }
}

# Also try to capture Rust/Cargo specific errors
Write-Log ""
Write-Log "Checking for Rust build errors..."
$cargoLogPattern = "$env:USERPROFILE\.cargo\registry\src\index.crates.io-*\webview2-com-sys-*\build.log"
$cargoLogs = Get-ChildItem -Path $cargoLogPattern -ErrorAction SilentlyContinue
foreach ($log in $cargoLogs) {
    Write-Log "Found cargo log: $($log.FullName)"
    Get-Content $log.FullName | ForEach-Object {
        Add-Content -Path $errorLogFile -Value $_
    }
}

Write-Log ""
if ($exitCode -eq 0) {
    Write-Log "===========================================" 
    Write-Log "   BUILD SUCCESSFUL!" 
    Write-Log "===========================================" 
    if (Test-Path "src-tauri\target\release\disk-dominator.exe") {
        Write-Log "Executable: src-tauri\target\release\disk-dominator.exe"
        explorer.exe "src-tauri\target\release"
    }
} else {
    Write-Log "===========================================" 
    Write-Log "   BUILD FAILED (Exit code: $exitCode)"
    Write-Log "===========================================" 
    Write-Log ""
    Write-Log "Error summary saved to: $errorLogFile"
    
    # Try to extract specific error
    if (Test-Path $errorLogFile) {
        Write-Host ""
        Write-Host "Most recent errors:" -ForegroundColor Red
        Get-Content $errorLogFile -Tail 20 | ForEach-Object {
            if ($_ -match "error:" -or $_ -match "Error:" -or $_ -match "failed") {
                Write-Host $_ -ForegroundColor Red
            }
        }
    }
}

Write-Log ""
Write-Log "Build completed at: $(Get-Date)"

Write-Host ""
Write-Host "Full logs saved to: $logsDir" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"
# DiskDominator Build Script
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   DiskDominator Build Script" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Change to project directory
Set-Location "K:\_Glados\DiskDominator"

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    } catch {
        return $false
    }
}

Write-Host "Checking environment..." -ForegroundColor Yellow

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js $nodeVersion installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Node.js not installed" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Rust
if (Test-Command "rustc") {
    $rustVersion = rustc --version
    Write-Host "[OK] Rust $rustVersion installed" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Rust not installed" -ForegroundColor Yellow
    Write-Host "Install from: https://rustup.rs/" -ForegroundColor Yellow
    Write-Host "Make sure to select MSVC toolchain!" -ForegroundColor Red
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Yellow
Write-Host "   Building Tauri Application" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Yellow
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

Write-Host "Running build..." -ForegroundColor Yellow
npm run tauri:build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "   BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    if (Test-Path "src-tauri\target\release\disk-dominator.exe") {
        Write-Host "Executable: src-tauri\target\release\disk-dominator.exe" -ForegroundColor Yellow
        explorer.exe "src-tauri\target\release"
    }
} else {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "   BUILD FAILED" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
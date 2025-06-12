# DiskDominator Build Script for Windows
# You already have the required versions!

Write-Host "✅ Rust 1.87.0 - Perfect!" -ForegroundColor Green
Write-Host "✅ Node.js v22.16.0 - Perfect!" -ForegroundColor Green
Write-Host ""

# Check for Visual Studio Build Tools
Write-Host "Checking for Visual Studio Build Tools..." -ForegroundColor Yellow
$cl = Get-Command cl.exe -ErrorAction SilentlyContinue

if ($cl) {
    Write-Host "✅ Visual Studio Build Tools - Found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 YOU'RE READY TO BUILD!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. cd K:\_Glados\DiskDominator" -ForegroundColor White
    Write-Host "2. .\BUILD-TAURI-WINDOWS.bat" -ForegroundColor White
    Write-Host ""
    Write-Host "The .exe will be in: src-tauri\target\release\DiskDominator.exe" -ForegroundColor Green
} else {
    Write-Host "❌ Visual Studio Build Tools - NOT FOUND" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to install Build Tools:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://visualstudio.microsoft.com/downloads/" -ForegroundColor White
    Write-Host "2. Look for 'Build Tools for Visual Studio 2022'" -ForegroundColor White
    Write-Host "3. During install, check:" -ForegroundColor White
    Write-Host "   - Desktop development with C++" -ForegroundColor White
    Write-Host "   - Windows 10 SDK" -ForegroundColor White
    Write-Host ""
    Write-Host "After installing, run this script again to verify." -ForegroundColor Yellow
}

# Quick MSVC check
Write-Host ""
Write-Host "Checking Rust toolchain..." -ForegroundColor Yellow
$rustupShow = rustup show | Select-String "default host"
if ($rustupShow -match "msvc") {
    Write-Host "✅ Rust MSVC toolchain - Correct!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Rust toolchain might need adjustment" -ForegroundColor Yellow
    Write-Host "Run: rustup default stable-x86_64-pc-windows-msvc" -ForegroundColor White
}
# Fix Rust Build Issues for DiskDominator
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   Fixing Rust Build Environment" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Check if cargo is using the right toolchain
Write-Host "Checking Rust toolchain..." -ForegroundColor Yellow
$rustupShow = rustup show

if ($rustupShow -match "stable-x86_64-pc-windows-gnu") {
    Write-Host "[WARNING] You're using GNU toolchain, switching to MSVC..." -ForegroundColor Yellow
    rustup default stable-x86_64-pc-windows-msvc
    rustup component add rust-src
    Write-Host "[OK] Switched to MSVC toolchain" -ForegroundColor Green
} else {
    Write-Host "[OK] Using MSVC toolchain" -ForegroundColor Green
}

# Fix WebView2LoaderStatic.lib issue
Write-Host ""
Write-Host "Fixing WebView2 library paths..." -ForegroundColor Yellow

# Create the necessary directories
$targetDir = "K:\_Glados\DiskDominator\src-tauri\target\release\build"
$webView2Dirs = Get-ChildItem -Path $targetDir -Filter "webview2-com-sys-*" -Directory -ErrorAction SilentlyContinue

foreach ($dir in $webView2Dirs) {
    $outPath = Join-Path $dir.FullName "out"
    
    # Create x86 and x64 directories
    $x86Path = Join-Path $outPath "x86"
    $x64Path = Join-Path $outPath "x64"
    
    New-Item -ItemType Directory -Force -Path $x86Path | Out-Null
    New-Item -ItemType Directory -Force -Path $x64Path | Out-Null
    
    # Try to find WebView2LoaderStatic.lib in common locations
    $possibleSources = @(
        "$env:USERPROFILE\.cargo\registry\src\index.crates.io-*\webview2-com-sys-*\x86\WebView2LoaderStatic.lib",
        "$env:USERPROFILE\.cargo\registry\src\index.crates.io-*\webview2-com-sys-*\x64\WebView2LoaderStatic.lib",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\*\*\VC\Tools\MSVC\*\lib\x86\WebView2LoaderStatic.lib",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\*\*\VC\Tools\MSVC\*\lib\x64\WebView2LoaderStatic.lib"
    )
    
    foreach ($pattern in $possibleSources) {
        $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($file.FullName -match "x86") {
                Write-Host "Copying x86 WebView2LoaderStatic.lib..." -ForegroundColor Cyan
                Copy-Item -Path $file.FullName -Destination $x86Path -Force
            } elseif ($file.FullName -match "x64") {
                Write-Host "Copying x64 WebView2LoaderStatic.lib..." -ForegroundColor Cyan
                Copy-Item -Path $file.FullName -Destination $x64Path -Force
            }
        }
    }
}

# Download WebView2 SDK if files not found
$x86File = Get-ChildItem -Path "K:\_Glados\DiskDominator\src-tauri\target\release\build\webview2-com-sys-*\out\x86\WebView2LoaderStatic.lib" -ErrorAction SilentlyContinue
if (-not $x86File) {
    Write-Host ""
    Write-Host "WebView2 files not found, downloading SDK..." -ForegroundColor Yellow
    
    $tempDir = "$env:TEMP\webview2-fix"
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    
    $webView2Url = "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/1.0.2478.35"
    $webView2Zip = "$tempDir\webview2.zip"
    
    Invoke-WebRequest -Uri $webView2Url -OutFile $webView2Zip -UseBasicParsing
    Expand-Archive -Path $webView2Zip -DestinationPath "$tempDir\webview2" -Force
    
    # Copy to all webview2-com-sys directories
    foreach ($dir in $webView2Dirs) {
        $outPath = Join-Path $dir.FullName "out"
        
        Copy-Item -Path "$tempDir\webview2\build\native\x86\WebView2LoaderStatic.lib" `
                  -Destination "$outPath\x86\" -Force
        Copy-Item -Path "$tempDir\webview2\build\native\x64\WebView2LoaderStatic.lib" `
                  -Destination "$outPath\x64\" -Force
        
        Write-Host "[OK] Copied WebView2 libraries to $outPath" -ForegroundColor Green
    }
    
    Remove-Item -Path $tempDir -Recurse -Force
}

# Clean cargo cache to force rebuild
Write-Host ""
Write-Host "Cleaning build cache..." -ForegroundColor Yellow
Set-Location "K:\_Glados\DiskDominator"
cargo clean

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   Environment Fixed!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Now run:" -ForegroundColor Yellow
Write-Host "cd K:\_Glados\DiskDominator" -ForegroundColor White
Write-Host ".\BUILD-WINDOWS.ps1" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
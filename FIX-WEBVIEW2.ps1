# Fix WebView2 and Build Tools for DiskDominator
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   Fixing WebView2 and Build Tools" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Function to check if running as admin
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click on PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Checking Visual Studio Build Tools..." -ForegroundColor Yellow

# Check if VS Build Tools are properly installed
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path $vsWhere) {
    $vsPath = & $vsWhere -latest -property installationPath
    if ($vsPath) {
        Write-Host "[OK] Visual Studio found at: $vsPath" -ForegroundColor Green
    }
} else {
    Write-Host "[WARNING] Visual Studio Build Tools may not be properly installed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Installing WebView2 SDK..." -ForegroundColor Yellow

# Create temp directory
$tempDir = "$env:TEMP\webview2-install"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Download WebView2 SDK NuGet package
$webView2Url = "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/1.0.2478.35"
$webView2Zip = "$tempDir\webview2.zip"

Write-Host "Downloading WebView2 SDK..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $webView2Url -OutFile $webView2Zip -UseBasicParsing
    Write-Host "[OK] Downloaded WebView2 SDK" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to download WebView2 SDK: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Extract WebView2
Write-Host "Extracting WebView2 SDK..." -ForegroundColor Cyan
Expand-Archive -Path $webView2Zip -DestinationPath "$tempDir\webview2" -Force

# Find VS installation and copy WebView2Loader
$vsInstallations = @(
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\BuildTools",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Enterprise",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\BuildTools",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\Community"
)

$webView2Found = $false
foreach ($vsPath in $vsInstallations) {
    if (Test-Path $vsPath) {
        Write-Host "Found VS at: $vsPath" -ForegroundColor Green
        
        # Create WebView2 directories if they don't exist
        $webView2Paths = @(
            "$vsPath\VC\Tools\MSVC\*\lib\x64",
            "$vsPath\VC\Tools\MSVC\*\lib\x86"
        )
        
        foreach ($path in $webView2Paths) {
            $resolvedPaths = Resolve-Path -Path $path -ErrorAction SilentlyContinue
            foreach ($resolvedPath in $resolvedPaths) {
                Write-Host "Copying WebView2Loader to: $resolvedPath" -ForegroundColor Cyan
                
                # Copy the appropriate WebView2Loader file
                if ($resolvedPath -match "x64") {
                    $sourceFile = "$tempDir\webview2\build\native\x64\WebView2LoaderStatic.lib"
                } else {
                    $sourceFile = "$tempDir\webview2\build\native\x86\WebView2LoaderStatic.lib"
                }
                
                if (Test-Path $sourceFile) {
                    Copy-Item -Path $sourceFile -Destination $resolvedPath -Force
                    $webView2Found = $true
                }
            }
        }
    }
}

if ($webView2Found) {
    Write-Host "[OK] WebView2Loader installed successfully" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Could not find VS installation paths" -ForegroundColor Yellow
    Write-Host "You may need to install Visual Studio Build Tools manually" -ForegroundColor Yellow
}

# Install WebView2 Runtime
Write-Host ""
Write-Host "Installing WebView2 Runtime..." -ForegroundColor Yellow
$webView2RuntimeUrl = "https://go.microsoft.com/fwlink/p/?LinkId=2124703"
$webView2RuntimeInstaller = "$tempDir\MicrosoftEdgeWebview2Setup.exe"

try {
    Invoke-WebRequest -Uri $webView2RuntimeUrl -OutFile $webView2RuntimeInstaller -UseBasicParsing
    Write-Host "Installing WebView2 Runtime..." -ForegroundColor Cyan
    Start-Process -FilePath $webView2RuntimeInstaller -ArgumentList "/silent /install" -Wait
    Write-Host "[OK] WebView2 Runtime installed" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not install WebView2 Runtime: $_" -ForegroundColor Yellow
}

# Clean up
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Close this window" -ForegroundColor White
Write-Host "2. Open a new PowerShell as Administrator" -ForegroundColor White
Write-Host "3. Run: cd K:\_Glados\DiskDominator" -ForegroundColor White
Write-Host "4. Run: .\BUILD-WINDOWS.ps1" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
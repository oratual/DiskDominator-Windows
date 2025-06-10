# DiskDominator Windows Test Script
# Run with: powershell -ExecutionPolicy Bypass -File test-windows.ps1

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = "test-windows-$timestamp.log"

function Write-Log {
    param($Message, $Type = "INFO")
    $logMessage = "[$Type] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message"
    Write-Host $logMessage -ForegroundColor $(if ($Type -eq "PASS") {"Green"} elseif ($Type -eq "FAIL") {"Red"} elseif ($Type -eq "WARN") {"Yellow"} else {"White"})
    Add-Content -Path $logFile -Value $logMessage
}

Write-Log "Starting DiskDominator Windows Test" "INFO"
Write-Log "Working Directory: $(Get-Location)" "INFO"
Write-Host ""

# Test 1: System Information
Write-Log "=== TEST 1: System Information ===" "INFO"
Write-Log "Windows Version: $([System.Environment]::OSVersion.VersionString)" "INFO"
Write-Log "PowerShell Version: $($PSVersionTable.PSVersion)" "INFO"
Write-Log "Architecture: $env:PROCESSOR_ARCHITECTURE" "INFO"
Write-Host ""

# Test 2: Node.js Check
Write-Log "=== TEST 2: Node.js Check ===" "INFO"
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Log "Node.js Version: $nodeVersion" "PASS"
    } else {
        Write-Log "Node.js not found in PATH" "FAIL"
    }
} catch {
    Write-Log "Node.js not installed" "FAIL"
}

# Test 3: Build Directory Structure
Write-Log "=== TEST 3: Build Directory Structure ===" "INFO"
if (Test-Path "build") {
    Write-Log "Build directory exists" "PASS"
    $buildContents = Get-ChildItem -Path "build" -Recurse | Select-Object FullName, Length
    $buildContents | ForEach-Object {
        Write-Log "  $($_.FullName) ($($_.Length) bytes)" "INFO"
    }
} else {
    Write-Log "Build directory not found" "FAIL"
}
Write-Host ""

# Test 4: Executable Testing
Write-Log "=== TEST 4: Executable Testing ===" "INFO"
$exePath = "build\portable\DiskDominator.exe"
$batPath = "build\portable\DiskDominator.bat"

if (Test-Path $exePath) {
    Write-Log "Found DiskDominator.exe" "PASS"
    $fileInfo = Get-Item $exePath
    Write-Log "  Size: $($fileInfo.Length) bytes" "INFO"
    Write-Log "  Created: $($fileInfo.CreationTime)" "INFO"
    
    # Check if it's a real exe or placeholder
    if ($fileInfo.Length -lt 100) {
        Write-Log "  WARNING: File size suggests this might be a placeholder" "WARN"
    }
} elseif (Test-Path $batPath) {
    Write-Log "Found DiskDominator.bat (fallback)" "PASS"
    $content = Get-Content $batPath -Raw
    if ($content -match "npm run dev") {
        Write-Log "  Batch file contains npm command" "PASS"
    }
} else {
    Write-Log "No executable found" "FAIL"
}
Write-Host ""

# Test 5: Package Files
Write-Log "=== TEST 5: Package Files ===" "INFO"
$requiredFiles = @(
    "package.json",
    ".next",
    "build\portable\README.txt",
    "build\installer\DiskDominator.nsi"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Log "$file exists" "PASS"
    } else {
        Write-Log "$file missing" "FAIL"
    }
}
Write-Host ""

# Test 6: Port Availability
Write-Log "=== TEST 6: Port 3002 Availability ===" "INFO"
$tcpConnection = Test-NetConnection -ComputerName localhost -Port 3002 -WarningAction SilentlyContinue
if ($tcpConnection.TcpTestSucceeded) {
    Write-Log "Port 3002 is in use (server might be running)" "WARN"
} else {
    Write-Log "Port 3002 is available" "PASS"
}
Write-Host ""

# Test 7: WSL Integration
Write-Log "=== TEST 7: WSL Integration ===" "INFO"
$wslPath = "\\wsl$\Ubuntu\home\lauta\glados\DiskDominator"
if (Test-Path $wslPath) {
    Write-Log "WSL path accessible" "PASS"
    
    # Try to copy log to WSL
    try {
        Copy-Item $logFile -Destination "$wslPath\$logFile" -Force
        Write-Log "Log file copied to WSL" "PASS"
    } catch {
        Write-Log "Could not copy to WSL: $_" "WARN"
    }
} else {
    Write-Log "WSL path not accessible" "WARN"
}
Write-Host ""

# Test 8: Try Running Portable Version
Write-Log "=== TEST 8: Execution Test ===" "INFO"
if (Test-Path $batPath) {
    Write-Log "Testing batch file execution (dry run)..." "INFO"
    
    # Read the batch file and analyze
    $batContent = Get-Content $batPath -Raw
    
    if ($batContent -match "npm run dev") {
        Write-Log "  Uses npm run dev" "INFO"
    }
    if ($batContent -match "localhost:3002") {
        Write-Log "  Points to localhost:3002" "INFO"
    }
    if ($batContent -match "start http") {
        Write-Log "  Opens browser automatically" "INFO"
    }
}
Write-Host ""

# Test 9: Dependencies Check
Write-Log "=== TEST 9: Dependencies Check ===" "INFO"
if (Test-Path "node_modules") {
    $nodeModulesSize = (Get-ChildItem "node_modules" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Log "node_modules exists (${nodeModulesSize}MB)" "PASS"
} else {
    Write-Log "node_modules not found - run 'npm install'" "FAIL"
}
Write-Host ""

# Summary
Write-Host "========================================"
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================"

$logContent = Get-Content $logFile
$passes = ($logContent | Select-String "\[PASS\]").Count
$fails = ($logContent | Select-String "\[FAIL\]").Count
$warns = ($logContent | Select-String "\[WARN\]").Count

Write-Host "Passed: $passes" -ForegroundColor Green
Write-Host "Failed: $fails" -ForegroundColor Red
Write-Host "Warnings: $warns" -ForegroundColor Yellow
Write-Host ""
Write-Host "Log file: $logFile" -ForegroundColor White
Write-Host ""

# Create a simplified error report
$errorReport = @"
DiskDominator Windows Test Report
Generated: $(Get-Date)

SUMMARY:
- Passed: $passes
- Failed: $fails  
- Warnings: $warns

KEY ISSUES:
"@

if ($fails -gt 0) {
    $errorReport += "`n`nFAILURES:"
    $logContent | Select-String "\[FAIL\]" | ForEach-Object {
        $errorReport += "`n- $($_.Line)"
    }
}

if ($warns -gt 0) {
    $errorReport += "`n`nWARNINGS:"
    $logContent | Select-String "\[WARN\]" | ForEach-Object {
        $errorReport += "`n- $($_.Line)"
    }
}

$errorReportFile = "test-error-report-$timestamp.txt"
$errorReport | Out-File -FilePath $errorReportFile

Write-Host "Error report saved to: $errorReportFile" -ForegroundColor Yellow

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
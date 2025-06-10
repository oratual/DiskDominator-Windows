@echo off
setlocal enabledelayedexpansion

echo ===================================
echo DiskDominator Windows Test Script
echo ===================================
echo.

REM Create log file with timestamp
set LOGFILE=test-windows-%date:~-4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%.log
set LOGFILE=%LOGFILE: =0%

echo Starting test at %date% %time% > %LOGFILE%
echo. >> %LOGFILE%

REM Test 1: Check Node.js
echo [TEST 1] Checking Node.js installation...
echo [TEST 1] Checking Node.js installation... >> %LOGFILE%
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Node.js found
    echo [PASS] Node.js found >> %LOGFILE%
    node --version >> %LOGFILE% 2>&1
) else (
    echo [FAIL] Node.js not found! Please install from https://nodejs.org/
    echo [FAIL] Node.js not found >> %LOGFILE%
)
echo. >> %LOGFILE%

REM Test 2: Check if portable exe exists
echo [TEST 2] Checking portable executable...
echo [TEST 2] Checking portable executable... >> %LOGFILE%
if exist "build\portable\DiskDominator.exe" (
    echo [FOUND] DiskDominator.exe exists
    echo [FOUND] DiskDominator.exe exists >> %LOGFILE%
    dir build\portable\DiskDominator.exe >> %LOGFILE% 2>&1
) else if exist "build\portable\DiskDominator.bat" (
    echo [FOUND] DiskDominator.bat exists (fallback)
    echo [FOUND] DiskDominator.bat exists >> %LOGFILE%
    type build\portable\DiskDominator.bat >> %LOGFILE% 2>&1
) else (
    echo [FAIL] No executable found!
    echo [FAIL] No executable found >> %LOGFILE%
)
echo. >> %LOGFILE%

REM Test 3: Check server accessibility
echo [TEST 3] Testing server connection...
echo [TEST 3] Testing server connection... >> %LOGFILE%
curl -s http://localhost:3002 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Server is accessible
    echo [PASS] Server is accessible >> %LOGFILE%
) else (
    echo [INFO] Server not running (expected)
    echo [INFO] Server not running >> %LOGFILE%
)
echo. >> %LOGFILE%

REM Test 4: Check build output
echo [TEST 4] Checking build output structure...
echo [TEST 4] Checking build output structure... >> %LOGFILE%
echo Build directory contents: >> %LOGFILE%
dir /s /b build >> %LOGFILE% 2>&1
echo. >> %LOGFILE%

REM Test 5: Try running the portable version
echo [TEST 5] Testing portable execution...
echo [TEST 5] Testing portable execution... >> %LOGFILE%
if exist "build\portable\DiskDominator.bat" (
    echo Running batch file test...
    echo Running batch file test... >> %LOGFILE%
    
    REM Test the batch file without actually starting the server
    cd build\portable
    findstr /C:"Starting DiskDominator" DiskDominator.bat >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [PASS] Batch file appears valid
        echo [PASS] Batch file appears valid >> ..\..\%LOGFILE%
    ) else (
        echo [FAIL] Batch file may have issues
        echo [FAIL] Batch file may have issues >> ..\..\%LOGFILE%
    )
    cd ..\..
)
echo. >> %LOGFILE%

REM Test 6: Check package.json
echo [TEST 6] Checking package.json...
echo [TEST 6] Checking package.json... >> %LOGFILE%
if exist "package.json" (
    echo [PASS] package.json found
    echo [PASS] package.json found >> %LOGFILE%
    findstr /C:"disk-dominator" package.json >> %LOGFILE% 2>&1
) else (
    echo [FAIL] package.json not found
    echo [FAIL] package.json not found >> %LOGFILE%
)
echo. >> %LOGFILE%

REM Test 7: Check Next.js build
echo [TEST 7] Checking Next.js build output...
echo [TEST 7] Checking Next.js build output... >> %LOGFILE%
if exist ".next" (
    echo [PASS] .next directory found
    echo [PASS] .next directory found >> %LOGFILE%
    dir .next >> %LOGFILE% 2>&1
) else (
    echo [FAIL] .next directory not found
    echo [FAIL] .next directory not found >> %LOGFILE%
)
echo. >> %LOGFILE%

REM Test 8: Test npm commands
echo [TEST 8] Testing npm commands...
echo [TEST 8] Testing npm commands... >> %LOGFILE%
npm list --depth=0 >> %LOGFILE% 2>&1
echo. >> %LOGFILE%

REM Summary
echo.
echo ===================================
echo Test Summary
echo ===================================
type %LOGFILE% | findstr /C:"[PASS]" /C:"[FAIL]" /C:"[FOUND]"

echo.
echo Full log saved to: %LOGFILE%
echo.

REM Copy log to WSL accessible location
echo Copying log to WSL accessible location...
copy %LOGFILE% "\\wsl$\Ubuntu\home\lauta\glados\DiskDominator\%LOGFILE%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Log copied to WSL successfully
) else (
    echo Could not copy to WSL. Please copy %LOGFILE% manually.
)

echo.
echo Press any key to exit...
pause >nul
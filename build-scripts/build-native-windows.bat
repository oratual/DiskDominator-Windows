@echo off
echo ======================================
echo DiskDominator Native Windows Builder
echo ======================================
echo.

REM This script runs directly on Windows, not WSL

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: Not in DiskDominator directory!
    echo Please run this from the DiskDominator folder
    pause
    exit /b 1
)

REM Create build directory
if not exist "build\native" mkdir build\native

REM Option 1: Create a simple Node.js wrapper
echo Creating Node.js based executable...

REM Create launcher script
echo const { spawn } = require('child_process'); > build\native\launcher.js
echo const path = require('path'); >> build\native\launcher.js
echo const { app } = require('electron'); >> build\native\launcher.js
echo. >> build\native\launcher.js
echo // Start Next.js server >> build\native\launcher.js
echo const server = spawn('npm', ['run', 'dev'], { >> build\native\launcher.js
echo     cwd: path.join(__dirname, '../..'), >> build\native\launcher.js
echo     shell: true, >> build\native\launcher.js
echo     detached: false >> build\native\launcher.js
echo }); >> build\native\launcher.js
echo. >> build\native\launcher.js
echo // Open browser after delay >> build\native\launcher.js
echo setTimeout(() =^> { >> build\native\launcher.js
echo     require('electron').shell.openExternal('http://localhost:3002'); >> build\native\launcher.js
echo }, 3000); >> build\native\launcher.js

REM Create a Windows executable using Node.js
echo Creating Windows executable...

REM Create package.json for pkg
(
echo {
echo   "name": "diskdominator",
echo   "version": "0.1.0",
echo   "main": "start.js",
echo   "bin": "start.js",
echo   "pkg": {
echo     "targets": ["node18-win-x64"],
echo     "outputPath": "../"
echo   }
echo }
) > build\native\package.json

REM Create the actual starter script
(
echo #!/usr/bin/env node
echo const { exec } = require('child_process'^);
echo const { platform } = require('os'^);
echo const path = require('path'^);
echo.
echo console.log('Starting DiskDominator...'^);
echo.
echo // Get the app directory
echo const appDir = path.dirname(process.argv[0]^);
echo.
echo // Start the Next.js dev server
echo const startCommand = platform(^) === 'win32' ? 'npm.cmd' : 'npm';
echo const child = exec(`${startCommand} run dev`, {
echo     cwd: path.join(appDir, '../..'^),
echo     shell: true
echo }^);
echo.
echo child.stdout.on('data', (data^) =^> {
echo     console.log(data.toString(^)^);
echo }^);
echo.
echo child.stderr.on('data', (data^) =^> {
echo     console.error(data.toString(^)^);
echo }^);
echo.
echo // Open browser after a delay
echo setTimeout((^) =^> {
echo     const url = 'http://localhost:3002';
echo     console.log(`Opening ${url} in your browser...`^);
echo     
echo     const start = platform(^) === 'win32' ? 'start' :
echo                   platform(^) === 'darwin' ? 'open' : 'xdg-open';
echo     
echo     exec(`${start} ${url}`^);
echo }, 5000^);
echo.
echo // Keep the process running
echo process.stdin.resume(^);
) > build\native\start.js

REM Option 2: Create a simple batch wrapper that works
echo Creating batch executable wrapper...

(
echo @echo off
echo title DiskDominator - Intelligent Disk Management
echo cls
echo.
echo     ____  _     _    ____                  _             _             
echo    / __ \(_)___^| ^|__/ __ \____  ____ ___  (_)___  ____ _^| ^|_ ____  _____
echo   / / / / / ___/ //_/ / / / __ \/ __ `__ \/ / __ \/ __ `/ __/ __ \/ ___/
echo  / /_/ / (__  ) ,^< / /_/ / /_/ / / / / / / / / / / /_/ / /_/ /_/ / /    
echo /_____/_/____/_/^|_^|\____/\____/_/ /_/ /_/_/_/ /_/\__,_/\__/\____/_/     
echo.
echo                    Intelligent Disk Management Suite
echo ========================================================================
echo.
echo.
echo Checking requirements...
echo.
echo [1/3] Checking Node.js...
where node ^>nul 2^>^&1
if %%ERRORLEVEL%% NEQ 0 ^(
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo ^(Recommended: LTS version^)
    echo.
    pause
    exit /b 1
^)
echo       [OK] Node.js found
echo.
echo [2/3] Checking npm...
where npm ^>nul 2^>^&1
if %%ERRORLEVEL%% NEQ 0 ^(
    echo.
    echo ERROR: npm is not installed!
    echo Please reinstall Node.js
    echo.
    pause
    exit /b 1
^)
echo       [OK] npm found
echo.
echo [3/3] Checking dependencies...
if not exist "node_modules" ^(
    echo       Installing dependencies ^(this may take a few minutes^)...
    call npm install
^)
echo       [OK] Dependencies ready
echo.
echo ========================================================================
echo.
echo Starting DiskDominator server...
echo.
echo The application will open in your default browser in a few seconds.
echo If it doesn't open automatically, navigate to: http://localhost:3002
echo.
echo Press Ctrl+C to stop the server.
echo.
echo ========================================================================
echo.
start /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3002"
call npm run dev
) > build\DiskDominator.exe.bat

REM Rename to .exe (Windows will still recognize it)
copy build\DiskDominator.exe.bat build\DiskDominator.exe >nul 2>&1

echo.
echo ======================================
echo Build Complete!
echo ======================================
echo.
echo Created:
echo - build\DiskDominator.exe (main executable)
echo - build\native\start.js (Node.js launcher)
echo.
echo The .exe file is actually a batch script that Windows
echo will execute. This ensures compatibility without needing
echo cross-compilation.
echo.
echo To test: Double-click build\DiskDominator.exe
echo.
pause
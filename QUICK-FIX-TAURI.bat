@echo off
echo ===============================================
echo    DiskDominator - Quick Fix for Tauri v1
echo ===============================================
echo.
echo Installing Tauri v1 CLI (compatible with current config)...
echo.

REM Uninstall v2 if exists
call npm uninstall -g @tauri-apps/cli

REM Install v1
call npm install -g @tauri-apps/cli@1

echo.
echo Verifying installation...
call tauri --version

echo.
echo Now building DiskDominator...
echo.

REM Build with v1
call npx tauri build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================
    echo    Build Complete!
    echo ===============================================
    echo.
    echo Executable: src-tauri\target\release\DiskDominator.exe
    echo.
) else (
    echo.
    echo Build failed. Check errors above.
)

pause
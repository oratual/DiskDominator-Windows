@echo off
echo =====================================
echo   Solucionando ERR_NETWORK_ACCESS_DENIED
echo =====================================
echo.

REM Ejecutar el script PowerShell
powershell.exe -ExecutionPolicy Bypass -File "%~dp0fix-wsl-networking-clean.ps1"

echo.
pause
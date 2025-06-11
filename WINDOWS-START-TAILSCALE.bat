@echo off
echo ===============================================
echo     DiskDominator - Via Tailscale
echo ===============================================
echo.
echo Este script iniciara DiskDominator accesible desde Windows
echo usando la red Tailscale para evitar problemas de conectividad.
echo.
echo Requisitos:
echo - Tailscale instalado en Windows y WSL
echo - Ambos conectados a la misma cuenta
echo.
pause

echo.
echo Iniciando servidor en WSL...
echo.

REM Ejecutar el script en WSL
wsl.exe bash -c "cd /home/lauta/glados/DiskDominator && ./start-for-windows.sh"

echo.
echo Si el servidor inicio correctamente, abre tu navegador en:
echo.
echo     http://100.96.251.13:3002
echo.
echo (Esta es la IP de Tailscale de tu WSL)
echo.
pause
#!/bin/bash
# Script para actualizar la IP de WSL2 cuando cambie

echo "🔄 Actualizando port forwarding de WSL2..."

# Obtener la IP actual de WSL2
WSL_IP=$(hostname -I | awk '{print $1}')
echo "📍 IP de WSL2: $WSL_IP"

# Crear comando PowerShell
PS_CMD="
\$wslIP = '$WSL_IP'
\$ports = @(3000, 3001, 3006, 8080, 5000, 5173, 4200)

foreach (\$port in \$ports) {
    netsh interface portproxy delete v4tov4 listenport=\$port listenaddress=0.0.0.0 2>\$null
    netsh interface portproxy add v4tov4 listenport=\$port listenaddress=0.0.0.0 connectport=\$port connectaddress=\$wslIP
}

Write-Host 'Port forwarding actualizado'
netsh interface portproxy show all
"

# Ejecutar en PowerShell como admin
echo "⚡ Ejecutando en PowerShell (requiere permisos de administrador)..."
powershell.exe -Command "Start-Process PowerShell -Verb RunAs -ArgumentList '-Command', '$PS_CMD'"

echo "✅ Proceso iniciado. Revisa la ventana de PowerShell."
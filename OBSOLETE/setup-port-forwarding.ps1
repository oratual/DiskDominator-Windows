# Script para configurar port forwarding WSL2 -> Windows
# Requiere ejecutar PowerShell como Administrador

# Obtener IP de WSL2
$wslIP = (wsl hostname -I).Trim()
Write-Host "IP de WSL2: $wslIP"

# Puertos a redirigir
$ports = @(3000, 3001, 3006, 8080, 5000, 5173, 4200)

# Eliminar reglas existentes
Write-Host "`nEliminando reglas existentes..."
foreach ($port in $ports) {
    netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>$null
}

# Crear nuevas reglas
Write-Host "`nCreando reglas de port forwarding..."
foreach ($port in $ports) {
    netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIP
    Write-Host "  ✓ Puerto $port configurado"
}

# Mostrar configuración actual
Write-Host "`nConfiguración actual:"
netsh interface portproxy show all

# Configurar firewall (opcional)
Write-Host "`n¿Deseas configurar el firewall para permitir estos puertos? (S/N)"
$response = Read-Host
if ($response -eq 'S' -or $response -eq 's') {
    foreach ($port in $ports) {
        New-NetFirewallRule -DisplayName "WSL2 Port $port" -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
        Write-Host "  ✓ Regla de firewall para puerto $port creada"
    }
}

Write-Host "`n✅ Configuración completada!"
Write-Host "Ahora puedes acceder a los servicios WSL2 desde:"
Write-Host "  - Windows: http://localhost:puerto"
Write-Host "  - Red local: http://$((Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notmatch 'Loopback'}).IPAddress):puerto"
# 🔧 Solución para ERR_NETWORK_ACCESS_DENIED

## El Problema
No puedes acceder desde Windows a servicios corriendo en WSL2 (Next.js, Node.js, etc.)

## La Solución: networkingMode=mirrored

### Opción 1: Automática (Recomendada)
1. En Windows, navega a `K:\_Glados\DiskDominator\`
2. Ejecuta `FIX-NETWORK-ACCESS.bat`
3. Sigue las instrucciones

### Opción 2: Manual
Crea/edita `C:\Users\[tu-usuario]\.wslconfig`:
```ini
[wsl2]
memory=4GB
processors=2
networkingMode=mirrored
autoMemoryReclaim=gradual
sparseVhd=true
```

### Después de Aplicar:
```powershell
# En PowerShell (Windows)
wsl --shutdown

# Espera 10 segundos, luego abre WSL
```

### En WSL:
```bash
cd ~/glados/DiskDominator
npm run dev
```

### Desde Windows:
Abre el navegador y ve a: **http://localhost:3000**

## ¿Por qué funciona?
- `networkingMode=mirrored` hace que WSL2 use la misma IP que Windows
- No más problemas de NAT o firewall
- `localhost` funciona directamente

## Si aún no funciona:
1. Verifica que WSL esté actualizado: `wsl --update`
2. Reinicia Windows completamente
3. Desactiva temporalmente el firewall para probar
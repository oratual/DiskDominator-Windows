# Script para configurar WSL2 networkingMode=mirrored
# Esto resuelve ERR_NETWORK_ACCESS_DENIED

$wslConfigPath = "$env:USERPROFILE\.wslconfig"

Write-Host "🔍 Verificando configuración WSL2..." -ForegroundColor Cyan

# Verificar si existe el archivo
if (Test-Path $wslConfigPath) {
    Write-Host "✅ Archivo .wslconfig encontrado" -ForegroundColor Green
    $content = Get-Content $wslConfigPath -Raw
    
    if ($content -match "networkingMode\s*=\s*mirrored") {
        Write-Host "✅ networkingMode=mirrored ya está configurado" -ForegroundColor Green
        Write-Host "⚠️  Si sigue sin funcionar, reinicie WSL con: wsl --shutdown" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Falta networkingMode=mirrored" -ForegroundColor Yellow
        Write-Host "📝 Agregando configuración..." -ForegroundColor Cyan
        
        # Backup
        Copy-Item $wslConfigPath "$wslConfigPath.backup"
        
        # Agregar networkingMode si no existe
        if ($content -notmatch "\[wsl2\]") {
            $content = "[wsl2]`n$content"
        }
        
        # Insertar networkingMode después de [wsl2]
        $content = $content -replace "(\[wsl2\])", "`$1`nnetworkingMode=mirrored"
        
        Set-Content $wslConfigPath $content
        Write-Host "✅ Configuración actualizada" -ForegroundColor Green
    }
} else {
    Write-Host "❌ No existe .wslconfig" -ForegroundColor Red
    Write-Host "📝 Creando configuración óptima..." -ForegroundColor Cyan
    
    $config = @"
[wsl2]
memory=4GB
processors=2
networkingMode=mirrored
autoMemoryReclaim=gradual
sparseVhd=true
"@
    
    Set-Content $wslConfigPath $config
    Write-Host "✅ Archivo creado con configuración óptima" -ForegroundColor Green
}

Write-Host "`n🔄 Para aplicar cambios:" -ForegroundColor Yellow
Write-Host "1. Ejecute: wsl --shutdown" -ForegroundColor White
Write-Host "2. Espere 10 segundos" -ForegroundColor White
Write-Host "3. Abra WSL de nuevo" -ForegroundColor White
Write-Host "4. En WSL ejecute: npm run dev" -ForegroundColor White
Write-Host "5. Acceda desde Windows a: http://localhost:3000" -ForegroundColor White
Write-Host "`n💡 Con networkingMode=mirrored, localhost funciona directamente!" -ForegroundColor Cyan
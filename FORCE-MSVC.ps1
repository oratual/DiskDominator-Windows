# Forzar cambio a MSVC toolchain
Write-Host "Forzando cambio a MSVC toolchain..." -ForegroundColor Yellow

# Agregar Rust al PATH actual
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"

# Verificar que rustup esté disponible
$rustupPath = "$env:USERPROFILE\.cargo\bin\rustup.exe"
if (Test-Path $rustupPath) {
    Write-Host "[OK] Rustup encontrado" -ForegroundColor Green
    
    # Mostrar toolchains instalados
    Write-Host "Toolchains instalados:" -ForegroundColor Cyan
    & $rustupPath toolchain list
    
    # Forzar cambio a MSVC
    Write-Host ""
    Write-Host "Cambiando a MSVC..." -ForegroundColor Yellow
    & $rustupPath default stable-x86_64-pc-windows-msvc
    
    # Verificar cambio
    Write-Host ""
    Write-Host "Nuevo toolchain:" -ForegroundColor Green
    & $rustupPath show
    
    Write-Host ""
    Write-Host "Verificando rustc:" -ForegroundColor Cyan
    rustc --version --verbose
    
} else {
    Write-Host "[ERROR] Rustup no encontrado en $rustupPath" -ForegroundColor Red
    Write-Host "Verificando PATH..." -ForegroundColor Yellow
    Write-Host $env:PATH
}

Read-Host "Presiona Enter para continuar"
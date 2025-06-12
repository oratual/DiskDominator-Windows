# Actualizar dependencias de Cargo
Write-Host "Actualizando dependencias de Cargo..." -ForegroundColor Yellow

Set-Location "K:\_Glados\DiskDominator\src-tauri"

# Eliminar Cargo.lock para forzar regeneración
if (Test-Path "Cargo.lock") {
    Remove-Item "Cargo.lock" -Force
    Write-Host "[OK] Cargo.lock eliminado" -ForegroundColor Green
}

# Mostrar contenido actual de Cargo.toml
Write-Host ""
Write-Host "Contenido actual de Cargo.toml:" -ForegroundColor Cyan
Get-Content "Cargo.toml"

# Agregar dependencias necesarias
Write-Host ""
Write-Host "Agregando dependencias..." -ForegroundColor Yellow

# Usar cargo add para agregar las dependencias faltantes
$dependencies = @(
    "anyhow",
    "tokio",
    "chrono", 
    "blake3",
    "walkdir",
    "tracing",
    "tracing-subscriber"
)

foreach ($dep in $dependencies) {
    Write-Host "Agregando $dep..." -ForegroundColor Cyan
    cargo add $dep
}

# Agregar features específicos para tokio
Write-Host "Configurando tokio con features completos..." -ForegroundColor Cyan
cargo add tokio --features full

# Agregar features para chrono
Write-Host "Configurando chrono con serde..." -ForegroundColor Cyan
cargo add chrono --features serde

# Agregar features para tracing-subscriber
Write-Host "Configurando tracing-subscriber..." -ForegroundColor Cyan
cargo add tracing-subscriber --features env-filter

Write-Host ""
Write-Host "Nuevo contenido de Cargo.toml:" -ForegroundColor Green
Get-Content "Cargo.toml"

Write-Host ""
Write-Host "[OK] Dependencias actualizadas" -ForegroundColor Green
Write-Host "Ahora ejecuta: .\BUILD-DISKDOMINATOR.bat" -ForegroundColor Yellow

Read-Host "Presiona Enter para continuar"
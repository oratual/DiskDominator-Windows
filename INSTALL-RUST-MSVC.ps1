# Instalar Rust con MSVC toolchain para DiskDominator
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   Instalando Rust con MSVC Toolchain" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Descargar rustup-init
$rustupUrl = "https://win.rustup.rs/x86_64"
$rustupInit = "$env:TEMP\rustup-init.exe"

Write-Host "Descargando rustup..." -ForegroundColor Yellow
try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupInit -UseBasicParsing
    Write-Host "[OK] Descarga completa" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error al descargar rustup: $_" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Ejecutar rustup-init con MSVC por defecto
Write-Host ""
Write-Host "Instalando Rust con MSVC..." -ForegroundColor Yellow
Write-Host "Esto instalará:" -ForegroundColor Cyan
Write-Host "  - Rust con toolchain MSVC" -ForegroundColor White
Write-Host "  - Cargo" -ForegroundColor White
Write-Host "  - Rustup" -ForegroundColor White
Write-Host ""

# Instalar con configuración MSVC
& $rustupInit -y --default-toolchain stable-x86_64-pc-windows-msvc --no-modify-path

# Agregar al PATH de la sesión actual
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"

# Verificar instalación
Write-Host ""
Write-Host "Verificando instalación..." -ForegroundColor Yellow

$rustupPath = "$env:USERPROFILE\.cargo\bin\rustup.exe"
if (Test-Path $rustupPath) {
    Write-Host "[OK] Rustup instalado" -ForegroundColor Green
    & $rustupPath --version
    
    Write-Host ""
    Write-Host "Toolchain instalado:" -ForegroundColor Yellow
    & $rustupPath show
    
    # Verificar cargo
    $cargoPath = "$env:USERPROFILE\.cargo\bin\cargo.exe"
    if (Test-Path $cargoPath) {
        Write-Host ""
        Write-Host "[OK] Cargo instalado" -ForegroundColor Green
        & $cargoPath --version
    }
} else {
    Write-Host "[ERROR] Error al instalar Rust" -ForegroundColor Red
}

# Actualizar PATH permanentemente
Write-Host ""
Write-Host "Actualizando PATH del sistema..." -ForegroundColor Yellow
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$cargoDir = "$env:USERPROFILE\.cargo\bin"

if ($userPath -notlike "*$cargoDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$userPath;$cargoDir", "User")
    Write-Host "[OK] PATH actualizado permanentemente" -ForegroundColor Green
}

# Limpiar
Remove-Item $rustupInit -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   Instalación completada!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. Cierra y vuelve a abrir PowerShell/Terminal" -ForegroundColor White
Write-Host "2. Luego ejecuta: cd K:\_Glados\DiskDominator" -ForegroundColor White
Write-Host "3. Y finalmente: .\BUILD-DISKDOMINATOR.bat" -ForegroundColor White
Write-Host ""

Read-Host "Presiona Enter para salir"
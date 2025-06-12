# Script para configurar Rust toolchain correctamente
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   Configurando Rust Toolchain" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Buscar rustup en ubicaciones comunes
$rustupPaths = @(
    "$env:USERPROFILE\.cargo\bin\rustup.exe",
    "$env:USERPROFILE\.rustup\bin\rustup.exe",
    "C:\Users\$env:USERNAME\.cargo\bin\rustup.exe"
)

$rustupFound = $null
foreach ($path in $rustupPaths) {
    if (Test-Path $path) {
        $rustupFound = $path
        Write-Host "[OK] Rustup encontrado en: $rustupFound" -ForegroundColor Green
        break
    }
}

if (-not $rustupFound) {
    # Intentar con where
    try {
        $rustupFound = (Get-Command rustup -ErrorAction Stop).Path
        Write-Host "[OK] Rustup encontrado en PATH: $rustupFound" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Rustup no encontrado" -ForegroundColor Red
        Write-Host ""
        Write-Host "Parece que Rust no está instalado o no está en el PATH" -ForegroundColor Yellow
        Write-Host "Instala Rust desde: https://rustup.rs/" -ForegroundColor Cyan
        Write-Host ""
        
        # Verificar si cargo existe al menos
        $cargoPath = "$env:USERPROFILE\.cargo\bin\cargo.exe"
        if (Test-Path $cargoPath) {
            Write-Host "[INFO] Cargo encontrado pero rustup no" -ForegroundColor Yellow
            Write-Host "Puedes intentar compilar directamente con:" -ForegroundColor Yellow
            Write-Host "cd K:\_Glados\DiskDominator && cargo build --release" -ForegroundColor Cyan
        }
        
        Read-Host "Presiona Enter para salir"
        exit 1
    }
}

# Mostrar toolchain actual
Write-Host ""
Write-Host "Toolchain actual:" -ForegroundColor Yellow
& $rustupFound show

# Cambiar a MSVC
Write-Host ""
Write-Host "Cambiando a toolchain MSVC..." -ForegroundColor Yellow
& $rustupFound default stable-x86_64-pc-windows-msvc

# Instalar componentes necesarios
Write-Host ""
Write-Host "Instalando componentes necesarios..." -ForegroundColor Yellow
& $rustupFound component add rust-src

# Verificar cambio
Write-Host ""
Write-Host "Nueva configuración:" -ForegroundColor Green
& $rustupFound show

# Verificar que cargo esté disponible
$cargoPath = "$env:USERPROFILE\.cargo\bin\cargo.exe"
if (Test-Path $cargoPath) {
    Write-Host ""
    Write-Host "[OK] Cargo encontrado en: $cargoPath" -ForegroundColor Green
    
    # Agregar al PATH si no está
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    $cargoDir = "$env:USERPROFILE\.cargo\bin"
    
    if ($currentPath -notlike "*$cargoDir*") {
        Write-Host ""
        Write-Host "Agregando Cargo al PATH de usuario..." -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$cargoDir", "User")
        $env:PATH = "$env:PATH;$cargoDir"
        Write-Host "[OK] PATH actualizado" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   Configuración completada!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Yellow
Write-Host "cd K:\_Glados\DiskDominator" -ForegroundColor White
Write-Host ".\BUILD-DISKDOMINATOR.bat" -ForegroundColor White
Write-Host ""

Read-Host "Presiona Enter para salir"
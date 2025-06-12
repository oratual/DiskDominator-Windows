# Descargar MinGW sin necesidad de admin
Write-Host "===========================================" -ForegroundColor Green
Write-Host "   Descargando MinGW Portable (sin admin)" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

$mingwDir = "$env:USERPROFILE\mingw64"
$downloadUrl = "https://github.com/niXman/mingw-builds-binaries/releases/download/13.2.0-rt_v11-rev1/x86_64-13.2.0-release-posix-seh-msvcrt-rt_v11-rev1.7z"
$tempFile = "$env:TEMP\mingw64.7z"

# Verificar si ya existe
if (Test-Path "$mingwDir\bin\dlltool.exe") {
    Write-Host "[OK] MinGW ya instalado en: $mingwDir" -ForegroundColor Green
    Write-Host "[OK] dlltool.exe encontrado" -ForegroundColor Green
    
    # Agregar al PATH de la sesion actual
    $env:PATH = "$mingwDir\bin;$env:PATH"
    
    Write-Host ""
    Write-Host "Para hacer permanente, agrega esto a tu PATH de usuario:" -ForegroundColor Yellow
    Write-Host "$mingwDir\bin" -ForegroundColor Cyan
    
    Read-Host "Presiona Enter para salir"
    exit 0
}

Write-Host "Descargando MinGW..." -ForegroundColor Yellow
try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempFile -UseBasicParsing
    Write-Host "[OK] Descarga completa" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error al descargar: $_" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "Extrayendo MinGW a: $mingwDir" -ForegroundColor Yellow

# Usar 7z de Windows o descargar portable
$7zExe = "$env:ProgramFiles\7-Zip\7z.exe"
if (-not (Test-Path $7zExe)) {
    Write-Host "Descargando 7-Zip portable..." -ForegroundColor Yellow
    $7zUrl = "https://www.7-zip.org/a/7zr.exe"
    $7zExe = "$env:TEMP\7zr.exe"
    Invoke-WebRequest -Uri $7zUrl -OutFile $7zExe -UseBasicParsing
}

& $7zExe x $tempFile -o"$env:USERPROFILE" -y | Out-Null

if (Test-Path "$mingwDir\bin\dlltool.exe") {
    Write-Host "[OK] MinGW instalado correctamente" -ForegroundColor Green
    
    # Agregar al PATH de la sesion actual
    $env:PATH = "$mingwDir\bin;$env:PATH"
    
    # Verificar
    Write-Host ""
    Write-Host "Verificando instalacion:" -ForegroundColor Yellow
    & "$mingwDir\bin\dlltool.exe" --version
    
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "   Instalacion completa!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "MinGW instalado en: $mingwDir" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANTE: Para usar permanentemente, agrega al PATH de usuario:" -ForegroundColor Yellow
    Write-Host "$mingwDir\bin" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "O ejecuta este comando para la sesion actual:" -ForegroundColor Yellow
    Write-Host '$env:PATH = "' + "$mingwDir\bin" + ';$env:PATH"' -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Error al extraer MinGW" -ForegroundColor Red
}

# Limpiar
Remove-Item $tempFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Read-Host "Presiona Enter para salir"
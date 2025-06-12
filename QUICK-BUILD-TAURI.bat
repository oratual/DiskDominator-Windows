@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    DiskDominator - Quick Tauri Build
echo ========================================
echo.

REM Crear carpeta de logs
if not exist "build-logs" mkdir build-logs

REM Timestamp para el log
set datetime=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set datetime=%datetime: =0%
set logfile=build-logs\tauri-build-%datetime%.log

echo Log guardado en: %logfile%
echo.

echo ===== INICIO BUILD: %date% %time% ===== >> %logfile%

echo Paso 1: Verificando directorio...
cd >> %logfile%
echo.

echo Paso 2: Verificando tauri.conf.json...
if exist "src-tauri\tauri.conf.json" (
    echo ✓ tauri.conf.json encontrado
    echo === CONTENIDO TAURI.CONF.JSON === >> %logfile%
    type "src-tauri\tauri.conf.json" >> %logfile% 2>&1
    echo ================================= >> %logfile%
) else (
    echo ✗ ERROR: No se encuentra tauri.conf.json
    echo ✗ ERROR: No se encuentra tauri.conf.json >> %logfile%
    pause
    exit /b 1
)
echo.

echo Paso 3: Verificando package.json scripts...
powershell -Command "Get-Content package.json | Select-String -Pattern 'tauri' -Context 2,2" >> %logfile% 2>&1
echo.

echo Paso 4: Instalando Tauri CLI si no existe...
echo === VERIFICANDO TAURI CLI === >> %logfile%
call npx @tauri-apps/cli --version >> %logfile% 2>&1
if %errorlevel% neq 0 (
    echo Instalando @tauri-apps/cli@1...
    echo === INSTALANDO TAURI CLI === >> %logfile%
    call npm install -D @tauri-apps/cli@1 >> %logfile% 2>&1
)
echo.

echo Paso 5: Verificando estructura del proyecto...
echo === ESTRUCTURA DEL PROYECTO === >> %logfile%
dir /b >> %logfile%
echo.
echo === CONTENIDO DE SRC-TAURI === >> %logfile%
dir /b src-tauri >> %logfile%
echo.

echo ========================================
echo    EJECUTANDO BUILD
echo ========================================
echo Esto puede tardar 5-10 minutos...
echo.

echo === EJECUTANDO: npx tauri build === >> %logfile%
echo Comando: npx @tauri-apps/cli build >> %logfile%

REM Ejecutar build con output en tiempo real Y al log
npx @tauri-apps/cli build 2>&1 | powershell -Command "$input | Tee-Object -FilePath '%logfile%' -Append | Write-Host"

set build_result=%errorlevel%

echo.
echo === FIN BUILD con código: %build_result% === >> %logfile%

if %build_result% equ 0 (
    echo ========================================
    echo    VERIFICANDO RESULTADOS
    echo ========================================
    
    echo === BUSCANDO ARCHIVOS GENERADOS === >> %logfile%
    
    if exist "src-tauri\target\release\*.exe" (
        echo.
        echo ✓ Ejecutables encontrados:
        dir "src-tauri\target\release\*.exe" /b
        dir "src-tauri\target\release\*.exe" /b >> %logfile%
    ) else (
        echo ✗ No se encontraron ejecutables
        echo ✗ No se encontraron ejecutables >> %logfile%
    )
    
    if exist "src-tauri\target\release\bundle" (
        echo.
        echo ✓ Carpeta bundle encontrada:
        echo === CONTENIDO DE BUNDLE === >> %logfile%
        dir "src-tauri\target\release\bundle" /s /b >> %logfile%
        
        REM Mostrar solo resumen en pantalla
        dir "src-tauri\target\release\bundle\*" /b 2>nul
    ) else (
        echo.
        echo ✗ No se creó carpeta bundle
        echo ✗ No se creó carpeta bundle >> %logfile%
    )
) else (
    echo ========================================
    echo    ERROR EN BUILD
    echo ========================================
    echo.
    echo Mostrando últimas 50 líneas del log:
    echo ----------------------------------------
    powershell -Command "Get-Content '%logfile%' -Tail 50"
    echo ----------------------------------------
)

echo.
echo ========================================
echo Log completo guardado en: %logfile%
echo.
echo Para ver el log completo:
echo   type "%logfile%" | more
echo ========================================
echo.
pause
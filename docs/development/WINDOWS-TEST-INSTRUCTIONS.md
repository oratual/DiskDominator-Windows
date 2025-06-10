# 🧪 Instrucciones para Testear DiskDominator en Windows

## Opción 1: Script Batch (Más Simple)

1. **Abrir Explorador de Windows**
   - Presiona `Win + E`
   - Navega a: `\\wsl$\Ubuntu\home\lauta\glados\DiskDominator`

2. **Ejecutar el Test**
   - Doble clic en `test-windows.bat`
   - O abre CMD y ejecuta:
   ```cmd
   cd \\wsl$\Ubuntu\home\lauta\glados\DiskDominator
   test-windows.bat
   ```

3. **El script generará un log**
   - Nombre: `test-windows-YYYYMMDD-HHMM.log`
   - Se copiará automáticamente a WSL

## Opción 2: PowerShell (Más Detallado)

1. **Abrir PowerShell como Administrador**
   - Clic derecho en Inicio → Windows PowerShell (Admin)

2. **Navegar al directorio**
   ```powershell
   cd \\wsl$\Ubuntu\home\lauta\glados\DiskDominator
   ```

3. **Ejecutar el test**
   ```powershell
   powershell -ExecutionPolicy Bypass -File test-windows.ps1
   ```

4. **Archivos generados**:
   - `test-windows-TIMESTAMP.log` - Log completo
   - `test-error-report-TIMESTAMP.txt` - Resumen de errores

## Para Probar la Aplicación

### Ejecutable Portable:
```cmd
cd \\wsl$\Ubuntu\home\lauta\glados\DiskDominator\build\portable
DiskDominator.bat
```

### Verificar que funciona:
1. Debería abrir el navegador en `http://localhost:3002`
2. Si no abre, verificar que el servidor esté corriendo

## Ubicación de Logs

Los logs se guardan en:
- Windows: `\\wsl$\Ubuntu\home\lauta\glados\DiskDominator\test-*.log`
- WSL: `/home/lauta/glados/DiskDominator/test-*.log`

## Problemas Comunes

1. **"Node.js not found"**
   - Instalar Node.js desde https://nodejs.org/

2. **"Access denied"**
   - Ejecutar PowerShell como Administrador
   - O usar el script .bat en lugar de .ps1

3. **"Cannot find path \\wsl$"**
   - Asegurarse que WSL esté corriendo
   - Ejecutar `wsl` en CMD primero

## Enviar Resultados

Después de ejecutar los tests, los logs estarán disponibles en WSL.
Puedo leerlos con:
```bash
cat /home/lauta/glados/DiskDominator/test-*.log
```
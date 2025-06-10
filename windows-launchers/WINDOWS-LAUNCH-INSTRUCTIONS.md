# 🚀 Cómo Ejecutar DiskDominator en Windows

## ⚡ Solución Rápida (Recomendada)

### Opción 1: Usar el archivo .BAT
1. Abre el Explorador de Windows
2. Navega a: `\\wsl$\Ubuntu\home\lauta\glados\DiskDominator`
3. **Doble clic en: `DiskDominator.bat`**
4. Se abrirá una ventana de comando y luego el navegador

### Opción 2: Usar el HTA corregido
1. En la misma carpeta
2. **Doble clic en: `DiskDominator-Fixed.hta`**
3. Verás una ventana con el progreso de carga

## 🔧 Si Todavía No Funciona

### Método Manual:
1. Abre **PowerShell** o **CMD**
2. Ejecuta estos comandos:
```cmd
cd \\wsl$\Ubuntu\home\lauta\glados\DiskDominator
npm run dev
```
3. Abre el navegador en: http://localhost:3002

### Verificar Node.js:
```cmd
node --version
npm --version
```
Si no están instalados, descarga desde: https://nodejs.org/

## 📝 Explicación del Error

El error "DiskDominator files not found" ocurría porque:
- El HTA original no manejaba correctamente las rutas de WSL (`\\wsl$\`)
- Windows interpreta las rutas de forma diferente que Linux

## ✅ Archivos Disponibles

1. **`DiskDominator.bat`** - Script batch simple (MÁS CONFIABLE)
2. **`DiskDominator-Fixed.hta`** - HTA con rutas corregidas
3. **`DiskDominator.hta`** - Original (puede fallar con rutas WSL)

## 🎯 Recomendación

**Usa `DiskDominator.bat`** - Es el más simple y confiable para rutas WSL.

## 🐛 Troubleshooting

Si ves "npm is not recognized":
1. Instala Node.js en Windows (no solo en WSL)
2. O ejecuta desde WSL directamente:
```bash
cd ~/glados/DiskDominator
npm run dev
```

Si el puerto 3002 está ocupado:
```cmd
netstat -ano | findstr :3002
taskkill /F /PID [número_del_proceso]
```
# DiskDominator - Aplicación de Escritorio con Tauri

## ⚠️ IMPORTANTE: Esto NO es una aplicación web

DiskDominator es una **aplicación de escritorio nativa** construida con:
- **Frontend**: Next.js (compilado estáticamente)
- **Backend**: Rust + Tauri
- **Resultado**: Un archivo .exe nativo de Windows

## 📋 Requisitos para compilar en Windows

1. **Node.js** (v18+): https://nodejs.org/
2. **Rust**: https://rustup.rs/
3. **Visual Studio Build Tools**: https://visualstudio.microsoft.com/visual-cpp-build-tools/
4. **WebView2**: Viene con Windows 10/11 (o instalar desde Microsoft)

## 🔨 Cómo compilar

1. Abre una terminal en `K:\_Glados\DiskDominator\`
2. Ejecuta: `BUILD-TAURI-WINDOWS.bat`
3. Espera a que termine la compilación
4. El ejecutable estará en: `src-tauri\target\release\DiskDominator.exe`

## ❌ NO uses estos archivos:
- Los archivos .hta (son para aplicaciones web, no para Tauri)
- `npm run dev` (eso es para desarrollo web, no para Tauri)

## ✅ Proceso correcto:

### Para desarrollo:
```bash
npm run tauri dev
```

### Para compilar:
```bash
npm run tauri build
```

## 📦 Resultado esperado

Después de compilar tendrás:
- `DiskDominator.exe` - Aplicación ejecutable
- Instalador MSI (opcional) en `bundle/msi/`

## 🚫 Errores comunes

Si falla la compilación, verifica:
1. Que tengas Visual Studio Build Tools instalado
2. Que Rust esté actualizado: `rustup update`
3. Que las dependencias de Windows estén instaladas

## 📖 Documentación oficial

Para más información: https://tauri.app/v1/guides/building/windows
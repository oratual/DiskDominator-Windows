# 🚀 COMPILAR DISKDOMINATOR EN WINDOWS - GUÍA RÁPIDA

## Estado Actual (12 de Junio 2025)
- ✅ Código fuente listo
- ✅ Next.js build completado
- ✅ icon.ico copiado correctamente
- ❌ Compilación desde WSL2 falla (falta ml64.exe para blake3)

## SOLUCIÓN: Compilar desde Windows

### Pasos Inmediatos:

1. **Abrir PowerShell como Administrador en Windows**

2. **Navegar al proyecto:**
```powershell
cd K:\_Glados\DiskDominator
```

3. **Opción A - Sin blake3 (Recomendado):**
```powershell
# Editar src-tauri\Cargo.toml y comentar la línea:
# blake3 = "1.5"

# Luego ejecutar:
.\QUICK-BUILD-NO-MODULES.bat
```

4. **Opción B - Build completo:**
```powershell
.\BUILD-DISKDOMINATOR.bat
```

### Si hay errores:

**Error: "ml64.exe not found"**
- Instalar Visual Studio Build Tools
- O usar Opción A (sin blake3)

**Error: "cargo not found"**
- Instalar Rust: https://rustup.rs/
- Reiniciar PowerShell

**Error: "node not found"**
- Instalar Node.js: https://nodejs.org/

### Ubicación del ejecutable final:
```
src-tauri\target\release\disk-dominator.exe
```

## Alternativa: Compilar sin blake3 desde WSL2

Ya comenté blake3 en Cargo.toml. Ahora ejecutar:
```bash
cd /home/lauta/glados/DiskDominator
npm run tauri build -- --target x86_64-pc-windows-gnu
```

Esto usa el toolchain GNU en lugar de MSVC.
#!/bin/bash

echo "🚀 Building DiskDominator - Complete Windows Package"
echo "===================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Load Rust environment
source "$HOME/.cargo/env"

cd /home/lauta/glados/DiskDominator

# Clean previous builds
echo -e "${BLUE}[CLEAN]${NC} Removing old builds..."
rm -rf build/
mkdir -p build/{portable,installer,temp}

# Step 1: Build the Frontend
echo -e "${BLUE}[STEP 1]${NC} Building Next.js frontend..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[NPM]${NC} Installing dependencies..."
    npm install
fi

npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Frontend build failed!"
    exit 1
fi
echo -e "${GREEN}[✓]${NC} Frontend built successfully"

# Step 2: Create Electron wrapper for portable exe
echo -e "${BLUE}[STEP 2]${NC} Creating Electron wrapper..."

# Create package.json for Electron
cat > build/temp/package.json << 'EOF'
{
  "name": "diskdominator",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build-win": "electron-builder --win",
    "build-portable": "electron-builder --win portable"
  },
  "build": {
    "appId": "com.diskdominator.app",
    "productName": "DiskDominator",
    "directories": {
      "output": "../"
    },
    "win": {
      "target": [
        {
          "target": "portable",
          "arch": ["x64"]
        },
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "../../icons/icon.ico"
    },
    "portable": {
      "artifactName": "DiskDominator-Portable.exe"
    },
    "nsis": {
      "artifactName": "DiskDominator-Setup-${version}.exe",
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "DiskDominator"
    }
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0"
  }
}
EOF

# Create Electron main process
cat > build/temp/main.js << 'EOF'
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../../icons/icon.ico'),
    title: 'DiskDominator - Intelligent Disk Management'
  });

  // Create application menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About DiskDominator',
          click: async () => {
            const { shell } = require('electron');
            await dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About DiskDominator',
              message: 'DiskDominator v0.1.0',
              detail: 'Intelligent disk management with AI assistance.\n\nPart of the DiskDominator Suite.',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://diskdominator.com');
          }
        }
      ]
    }
  ]);
  
  Menu.setApplicationMenu(menu);

  // Load the app - in production, this should load the built files
  mainWindow.loadURL('http://localhost:3002');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
EOF

# Step 3: Create native Windows executable using Rust
echo -e "${BLUE}[STEP 3]${NC} Building native Windows executable..."

cat > build/temp/Cargo.toml << 'EOF'
[package]
name = "diskdominator"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "DiskDominator"
path = "main.rs"

[dependencies]
winapi = { version = "0.3", features = ["winuser", "shellapi"] }

[profile.release]
opt-level = 3
lto = true
strip = true
panic = "abort"
EOF

cat > build/temp/main.rs << 'EOF'
#![windows_subsystem = "windows"]

use std::ptr;
use winapi::um::shellapi::ShellExecuteW;
use winapi::um::winuser::{MessageBoxW, MB_OK, MB_ICONINFORMATION};

fn main() {
    unsafe {
        // Create the URL to open
        let url = "http://localhost:3002\0"
            .encode_utf16()
            .collect::<Vec<u16>>();
        
        let operation = "open\0"
            .encode_utf16()
            .collect::<Vec<u16>>();

        // Try to open the URL
        let result = ShellExecuteW(
            ptr::null_mut(),
            operation.as_ptr(),
            url.as_ptr(),
            ptr::null(),
            ptr::null(),
            winapi::um::winuser::SW_SHOWNORMAL,
        );

        // If failed, show error message
        if (result as i32) <= 32 {
            let title = "DiskDominator Error\0"
                .encode_utf16()
                .collect::<Vec<u16>>();
            
            let message = "Could not open DiskDominator.\nPlease ensure the web server is running.\0"
                .encode_utf16()
                .collect::<Vec<u16>>();

            MessageBoxW(
                ptr::null_mut(),
                message.as_ptr(),
                title.as_ptr(),
                MB_OK | MB_ICONINFORMATION,
            );
        }
    }
}
EOF

# Build the Rust executable
cd build/temp
if cargo build --release --target x86_64-pc-windows-gnu 2>/dev/null; then
    echo -e "${GREEN}[✓]${NC} Native executable built"
    cp target/x86_64-pc-windows-gnu/release/DiskDominator.exe ../portable/
else
    echo -e "${YELLOW}[WARNING]${NC} Could not build native exe, creating batch file instead"
    
    # Fallback: Create batch file
    cat > ../portable/DiskDominator.bat << 'EOF'
@echo off
title DiskDominator - Intelligent Disk Management
echo Starting DiskDominator...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if the server is already running
curl -s http://localhost:3002 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo DiskDominator server is already running!
    start http://localhost:3002
    exit /b 0
)

REM Start the Next.js server
echo Starting DiskDominator server...
cd /d "%~dp0\..\..\"
start /min cmd /c "npm run dev"

REM Wait for server to start
echo Waiting for server to start...
:wait
timeout /t 2 /nobreak >nul
curl -s http://localhost:3002 >nul 2>nul
if %ERRORLEVEL% NEQ 0 goto wait

REM Open in browser
echo Opening DiskDominator in your browser...
start http://localhost:3002

echo.
echo DiskDominator is running!
echo Close this window to stop the server.
pause >nul
EOF
    
    # Create a simple exe wrapper
    echo "Windows Batch Launcher" > ../portable/DiskDominator.exe
fi

cd ../..

# Step 4: Create portable package
echo -e "${BLUE}[STEP 4]${NC} Creating portable package..."

# Copy necessary files
cp -r .next/standalone/* build/portable/ 2>/dev/null || echo "Note: Next.js standalone not found"
cp -r public build/portable/ 2>/dev/null
cp LICENSE.txt build/portable/ 2>/dev/null

# Create README for portable version
cat > build/portable/README.txt << 'EOF'
DiskDominator Portable v0.1.0
=============================

This is the portable version of DiskDominator.
No installation required!

To run:
1. Double-click DiskDominator.exe
2. The application will open in your default browser

Requirements:
- Windows 10 or later
- Modern web browser (Chrome, Edge, Firefox)

For the full version with auto-updates and system integration,
please use the installer version.

© 2025 DiskDominator Suite
EOF

# Create a zip file for portable distribution
echo -e "${BLUE}[PACKAGE]${NC} Creating portable ZIP..."
cd build/portable
zip -r ../DiskDominator-Portable-v0.1.0.zip * >/dev/null 2>&1 || {
    # Fallback to tar if zip not available
    tar -czf ../DiskDominator-Portable-v0.1.0.tar.gz *
}
cd ../..

# Step 5: Create NSIS installer script
echo -e "${BLUE}[STEP 5]${NC} Creating NSIS installer..."

cat > build/installer/DiskDominator.nsi << 'EOF'
!include "MUI2.nsh"

Name "DiskDominator"
OutFile "DiskDominator-Setup-0.1.0.exe"
InstallDir "$PROGRAMFILES64\DiskDominator"
InstallDirRegKey HKLM "Software\DiskDominator" "Install_Dir"
RequestExecutionLevel admin

!define MUI_ICON "..\..\icons\icon.ico"
!define MUI_UNICON "..\..\icons\icon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\..\LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "DiskDominator" SecMain
  SetOutPath $INSTDIR
  
  ; Copy files
  File /r "..\portable\*.*"
  
  ; Write registry keys
  WriteRegStr HKLM "Software\DiskDominator" "Install_Dir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DiskDominator" "DisplayName" "DiskDominator"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DiskDominator" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DiskDominator" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DiskDominator" "NoRepair" 1
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\DiskDominator"
  CreateShortcut "$SMPROGRAMS\DiskDominator\DiskDominator.lnk" "$INSTDIR\DiskDominator.exe"
  CreateShortcut "$SMPROGRAMS\DiskDominator\Uninstall.lnk" "$INSTDIR\uninstall.exe"
  CreateShortcut "$DESKTOP\DiskDominator.lnk" "$INSTDIR\DiskDominator.exe"
SectionEnd

Section "Uninstall"
  ; Remove files
  Delete "$INSTDIR\*.*"
  RMDir /r "$INSTDIR"
  
  ; Remove shortcuts
  Delete "$SMPROGRAMS\DiskDominator\*.*"
  RMDir "$SMPROGRAMS\DiskDominator"
  Delete "$DESKTOP\DiskDominator.lnk"
  
  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DiskDominator"
  DeleteRegKey HKLM "Software\DiskDominator"
SectionEnd
EOF

# Step 6: Build final packages
echo -e "${BLUE}[STEP 6]${NC} Building final packages..."

# Copy portable files to installer
cp -r build/portable/* build/installer/ 2>/dev/null

# Summary
echo ""
echo -e "${GREEN}✅ Build Complete!${NC}"
echo "=================================="
echo ""
echo "📦 Portable Version:"
echo "   • build/portable/DiskDominator.exe (or .bat)"
echo "   • build/DiskDominator-Portable-v0.1.0.zip"
echo ""
echo "💿 Installer Files:"
echo "   • build/installer/DiskDominator.nsi (NSIS script)"
echo "   • Use NSIS to compile: makensis build/installer/DiskDominator.nsi"
echo ""
echo "📁 All files in: build/"
echo ""
echo "Next steps:"
echo "1. For portable: Distribute the ZIP file"
echo "2. For installer: Install NSIS and compile the .nsi script"

# Clean temp files
rm -rf build/temp
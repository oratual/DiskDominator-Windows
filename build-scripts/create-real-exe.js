#!/usr/bin/env node

/**
 * DiskDominator Windows Executable Creator
 * This creates a real .exe file using nexe
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create the launcher script
const launcherCode = `
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

console.log('');
console.log('    ____  _     _    ____                  _             _             ');
console.log('   / __ \\\\(_)___| |__/ __ \\\\____  ____ ___  (_)___  ____ _| |_ ____  _____');
console.log('  / / / / / ___/ //_/ / / / __ \\\\/ __ \`__ \\\\/ / __ \\\\/ __ \`/ __/ __ \\\\/ ___/');
console.log(' / /_/ / (__  ) ,< / /_/ / /_/ / / / / / / / / / / /_/ / /_/ /_/ / /    ');
console.log('/_____/_/____/_/|_|\\\\____/\\\\____/_/ /_/ /_/_/_/ /_/\\\\__,_/\\\\__/\\\\____/_/     ');
console.log('');
console.log('                   Intelligent Disk Management Suite v0.1.0');
console.log('========================================================================');
console.log('');

// Function to find the app directory
function findAppDirectory() {
    // Try common locations
    const possiblePaths = [
        process.cwd(),
        path.dirname(process.execPath),
        path.join(path.dirname(process.execPath), '..'),
        path.join(os.homedir(), 'DiskDominator'),
        'C:\\\\Program Files\\\\DiskDominator',
        'C:\\\\Program Files (x86)\\\\DiskDominator',
        path.join(process.env.LOCALAPPDATA || '', 'DiskDominator')
    ];
    
    for (const testPath of possiblePaths) {
        if (fs.existsSync(path.join(testPath, 'package.json'))) {
            const pkg = JSON.parse(fs.readFileSync(path.join(testPath, 'package.json'), 'utf8'));
            if (pkg.name === 'disk-dominator') {
                return testPath;
            }
        }
    }
    
    return null;
}

const appDir = findAppDirectory();

if (!appDir) {
    console.error('ERROR: Could not find DiskDominator installation!');
    console.error('Please ensure DiskDominator is properly installed.');
    console.error('');
    console.error('Press any key to exit...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(1));
    return;
}

console.log('Found DiskDominator at:', appDir);
console.log('');

// Check if Node.js is available
const checkNode = spawn('node', ['--version'], { shell: true });
checkNode.on('error', () => {
    console.error('ERROR: Node.js runtime not found!');
    console.error('This executable requires Node.js to be installed.');
    console.error('Download from: https://nodejs.org/');
    console.error('');
    console.error('Press any key to exit...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(1));
});

checkNode.on('close', (code) => {
    if (code === 0) {
        console.log('Starting DiskDominator server...');
        console.log('The application will open in your browser shortly.');
        console.log('');
        console.log('To stop: Press Ctrl+C or close this window');
        console.log('');
        
        // Start the dev server
        const server = spawn('npm', ['run', 'dev'], {
            cwd: appDir,
            shell: true,
            stdio: 'inherit'
        });
        
        // Open browser after delay
        setTimeout(() => {
            const url = 'http://localhost:3002';
            const start = process.platform === 'win32' ? 'start' :
                         process.platform === 'darwin' ? 'open' : 'xdg-open';
            
            spawn(start, [url], { shell: true });
        }, 5000);
        
        // Handle exit
        process.on('SIGINT', () => {
            server.kill();
            process.exit(0);
        });
    }
});
`;

// Save launcher script
fs.writeFileSync('build/launcher.js', launcherCode);

console.log('DiskDominator Executable Builder');
console.log('================================\n');

// Create build directory
if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
}

console.log('Installing nexe globally (this may take a moment)...');

// Install nexe
exec('npm install -g nexe', (error, stdout, stderr) => {
    if (error) {
        console.error('Failed to install nexe:', error);
        console.log('\nAlternative: Install manually with:');
        console.log('  npm install -g nexe');
        console.log('  Then run: nexe build/launcher.js -o build/DiskDominator.exe');
        return;
    }
    
    console.log('Building executable...');
    
    // Build the exe
    const nexe = spawn('nexe', [
        'build/launcher.js',
        '-o', 'build/DiskDominator.exe',
        '-t', 'windows-x64-14.15.3',
        '--verbose'
    ], { stdio: 'inherit' });
    
    nexe.on('close', (code) => {
        if (code === 0) {
            console.log('\n✅ Build successful!');
            console.log('Executable created: build/DiskDominator.exe');
            
            // Create a companion batch file for troubleshooting
            const batchContent = `@echo off
echo DiskDominator Launcher
echo ====================
echo.
echo If the .exe doesn't work, this batch file will start DiskDominator.
echo.
cd /d "%~dp0.."
call npm run dev
pause`;
            
            fs.writeFileSync('build/DiskDominator-fallback.bat', batchContent);
            console.log('Fallback created: build/DiskDominator-fallback.bat');
        } else {
            console.error('\n❌ Build failed!');
            console.log('Try building manually with:');
            console.log('  nexe build/launcher.js -o build/DiskDominator.exe');
        }
    });
});
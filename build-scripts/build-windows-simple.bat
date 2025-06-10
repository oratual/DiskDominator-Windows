@echo off
echo.
echo ===============================================
echo      DiskDominator Windows Build Script
echo ===============================================
echo.

:: Create a simple executable that launches the web interface
echo Creating Windows executable...

:: Create a Node.js script that serves the app
(
echo const express = require('express'^);
echo const path = require('path'^);
echo const { exec } = require('child_process'^);
echo.
echo const app = express(^);
echo const PORT = 3002;
echo.
echo app.use(express.static(path.join(__dirname, 'out'^)^)^);
echo.
echo app.get('*', (req, res^) =^> {
echo     res.sendFile(path.join(__dirname, 'out', 'index.html'^)^);
echo }^);
echo.
echo app.listen(PORT, (^) =^> {
echo     console.log(`DiskDominator running on http://localhost:${PORT}`^);
echo     exec(`start http://localhost:${PORT}`^);
echo }^);
) > diskdominator-server.js

:: Install necessary packages
echo Installing dependencies...
call npm install express

:: Create the executable using nexe
echo Building executable...
call npx nexe diskdominator-server.js -t windows-x64-14.15.3 -o DiskDominator.exe

:: Clean up
del diskdominator-server.js

echo.
echo Build complete! 
echo You can now run DiskDominator.exe
pause
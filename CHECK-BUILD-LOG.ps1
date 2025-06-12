# Check DiskDominator Build Log
$logsDir = "K:\_Glados\DiskDominator\build-logs"

# Get the most recent log file
$latestLog = Get-ChildItem $logsDir -Filter "build-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestLog) {
    Write-Host "Viewing log: $($latestLog.Name)" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host ""
    
    # Show the entire log content
    $content = Get-Content $latestLog.FullName
    
    # First, show any errors
    Write-Host "ERRORS FOUND:" -ForegroundColor Red
    Write-Host "-------------" -ForegroundColor Red
    $content | Select-String -Pattern "error:|Error:|failed|Error failed|WebView2Loader" | ForEach-Object {
        Write-Host $_.Line -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "FULL LOG OUTPUT:" -ForegroundColor Cyan
    Write-Host "----------------" -ForegroundColor Cyan
    $content | Select-Object -Last 100
    
} else {
    Write-Host "No log files found in $logsDir" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
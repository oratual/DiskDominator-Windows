# View DiskDominator Build Logs
$logsDir = "K:\_Glados\DiskDominator\build-logs"

if (Test-Path $logsDir) {
    Write-Host "Available log files:" -ForegroundColor Yellow
    Get-ChildItem $logsDir -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object {
        Write-Host "  $($_.Name)" -ForegroundColor Cyan
    }
    
    # Get most recent error log
    $latestErrorLog = Get-ChildItem $logsDir -Filter "build-errors-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($latestErrorLog) {
        Write-Host ""
        Write-Host "Most recent errors from: $($latestErrorLog.Name)" -ForegroundColor Red
        Write-Host "==========================================" -ForegroundColor Red
        Get-Content $latestErrorLog.FullName | Select-Object -Last 50
    }
    
    # Also check npm stderr
    $latestStderr = Get-ChildItem $logsDir -Filter "npm-stderr-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($latestStderr) {
        Write-Host ""
        Write-Host "NPM stderr from: $($latestStderr.Name)" -ForegroundColor Yellow
        Write-Host "==========================================" -ForegroundColor Yellow
        Get-Content $latestStderr.FullName | Select-Object -Last 30
    }
} else {
    Write-Host "No logs directory found. Run BUILD-WITH-LOG.ps1 first." -ForegroundColor Red
}

Read-Host "Press Enter to exit"
@echo off
title Inflero OmniBridge check
echo Checking http://127.0.0.1:18989/health ...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:18989/health' -UseBasicParsing -TimeoutSec 5; Write-Host 'OK' $r.Content -ForegroundColor Green; exit 0 } catch { Write-Host 'FAIL — bridge not running.' -ForegroundColor Red; Write-Host $_.Exception.Message; Write-Host ''; Write-Host 'Fix: run install.bat as Administrator, or reboot.'; Write-Host ('Log: ' + $env:ProgramData + '\Inflero\OmniBridge\bridge.log'); exit 1 }"

echo.
pause

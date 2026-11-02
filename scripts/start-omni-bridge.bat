@echo off
title Inflero OmniCashier Bridge
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed on this PC.
  echo Install LTS from https://nodejs.org then run this file again.
  echo.
  pause
  exit /b 1
)

echo Starting OmniCashier bridge on 127.0.0.1:18989 ...
echo Keep this window OPEN while using Inflero POS.
echo.
node "%~dp0omni-lan-bridge.mjs"
echo.
echo Bridge stopped.
pause

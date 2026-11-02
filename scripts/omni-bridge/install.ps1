# Inflero OmniCashier Bridge — silent install (auto-start, no console).
# Run as Administrator (install.bat elevates for you).

$ErrorActionPreference = "Stop"
$TaskName = "InfleroOmniBridge"
$InstallDir = Join-Path $env:ProgramFiles "Inflero\OmniBridge"
$ExeName = "InfleroOmniBridge.exe"
$SrcDir = $PSScriptRoot
$SrcExe = Join-Path $SrcDir $ExeName

function Assert-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  if (-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: Must run as Administrator. Use install.bat (it will prompt)." -ForegroundColor Red
    exit 1
  }
}

Assert-Admin

if (-not [Environment]::Is64BitOperatingSystem) {
  Write-Host "ERROR: 64-bit Windows is required." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $SrcExe)) {
  Write-Host "ERROR: $ExeName not found next to this installer." -ForegroundColor Red
  Write-Host "Copy the FULL OmniBridge folder (exe + install/uninstall scripts) to the POS PC."
  exit 1
}

# Clear Mark-of-the-Web from USB / email / zip downloads (otherwise SmartScreen blocks).
Get-ChildItem -Path $SrcDir -File | ForEach-Object {
  try { Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue } catch { }
}

Write-Host "Installing Inflero OmniCashier Bridge..."

# Stop previous install so the exe is not file-locked
Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Get-Process -Name "InfleroOmniBridge" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 800

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item -Force $SrcExe (Join-Path $InstallDir $ExeName)
try { Unblock-File -Path (Join-Path $InstallDir $ExeName) -ErrorAction SilentlyContinue } catch { }

$ExePath = Join-Path $InstallDir $ExeName

$action = New-ScheduledTaskAction -Execute $ExePath -WorkingDirectory $InstallDir
$triggerStartup = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -MultipleInstances IgnoreNew
try { $settings.Hidden = $true } catch { }
try { $settings.Priority = 4 } catch { }

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$desc = "Inflero localhost bridge so HTTPS POS can reach OmniCashier on the shop LAN."

# Prefer startup + logon; fall back to startup-only on older / locked-down Windows.
try {
  $triggerLogon = New-ScheduledTaskTrigger -AtLogOn
  Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger @($triggerStartup, $triggerLogon) `
    -Settings $settings `
    -Principal $principal `
    -Description $desc `
    -Force | Out-Null
} catch {
  Write-Host "Note: logon trigger not supported here; using At Startup only." -ForegroundColor Yellow
  Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $triggerStartup `
    -Settings $settings `
    -Principal $principal `
    -Description $desc `
    -Force | Out-Null
}

Start-ScheduledTask -TaskName $TaskName

# Cold start of packaged exe can take a few seconds
$ok = $false
for ($i = 1; $i -le 15; $i++) {
  Start-Sleep -Seconds 1
  try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:18989/health" -UseBasicParsing -TimeoutSec 2
    if ($health.StatusCode -eq 200) {
      $ok = $true
      Write-Host "OK — bridge is running (HTTP $($health.StatusCode))." -ForegroundColor Green
      break
    }
  } catch {
    # retry
  }
}

if (-not $ok) {
  Write-Host "Installed, but health check failed." -ForegroundColor Yellow
  Write-Host "  1) Reboot this PC"
  Write-Host "  2) If SmartScreen blocked the exe: allow InfleroOmniBridge.exe"
  Write-Host "  3) Check log: $env:ProgramData\Inflero\OmniBridge\bridge.log"
  Write-Host "  4) Run check.bat in this folder"
}

Write-Host ""
Write-Host "Done. Bridge starts automatically with Windows (no window)."
Write-Host "In Inflero: Device IP = cash register LAN IPv4 (same Wi-Fi), port 8989."
Write-Host "Install path: $InstallDir"
Write-Host ""
pause

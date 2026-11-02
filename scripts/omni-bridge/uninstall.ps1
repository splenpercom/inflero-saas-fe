# Remove Inflero OmniCashier Bridge auto-start + files.

$ErrorActionPreference = "Continue"
$TaskName = "InfleroOmniBridge"
$InstallDir = Join-Path $env:ProgramFiles "Inflero\OmniBridge"
$LogDir = Join-Path $env:ProgramData "Inflero\OmniBridge"

$id = [Security.Principal.WindowsIdentity]::GetCurrent()
$p = New-Object Security.Principal.WindowsPrincipal($id)
if (-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "ERROR: Must run as Administrator. Use uninstall.bat." -ForegroundColor Red
  pause
  exit 1
}

Write-Host "Uninstalling Inflero OmniCashier Bridge..."

Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Get-Process -Name "InfleroOmniBridge" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

if (Test-Path $InstallDir) {
  Remove-Item -Recurse -Force $InstallDir -ErrorAction SilentlyContinue
}
if (Test-Path $LogDir) {
  Remove-Item -Recurse -Force $LogDir -ErrorAction SilentlyContinue
}

Write-Host "Removed."
pause

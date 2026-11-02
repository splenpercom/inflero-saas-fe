# Build InfleroOmniBridge.exe for shop POS PCs (no Node required on client).
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$OutDir = Join-Path $Root "..\..\dist\omni-bridge"
$ExeOut = Join-Path $OutDir "InfleroOmniBridge.exe"
$Src = Join-Path $Root "omni-lan-bridge.cjs"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Write-Host "Building $ExeOut ..."
npx --yes @yao-pkg/pkg@5.16.1 $Src --targets node18-win-x64 --output $ExeOut

$copy = @(
  "install.bat",
  "uninstall.bat",
  "install.ps1",
  "uninstall.ps1",
  "check.bat",
  "README.txt"
)
foreach ($f in $copy) {
  Copy-Item -Force (Join-Path $Root $f) $OutDir
}

Write-Host ""
Write-Host "Shop kit ready: $((Resolve-Path $OutDir).Path)"
Write-Host "Give clients that entire folder. They run install.bat once as Admin."

Inflero OmniBridge — shop POS install
=====================================

WHAT THIS IS
  Small background program on the POS PC so the HTTPS Inflero website can
  talk to the OmniCashier cash register on the shop Wi‑Fi/LAN.
  After install it starts with Windows. No window to keep open. No Node.js.

REQUIREMENTS
  - Windows 10/11 64-bit (the POS PC that opens Inflero in the browser)
  - Same Wi‑Fi/LAN as the cash register
  - Administrator once (for install.bat)

INSTALL (once per POS PC)
  1. Copy this WHOLE folder to the POS PC (USB is fine). Do not copy only the .exe.
  2. Right‑click install.bat → Run as administrator.
  3. If Windows SmartScreen says "Windows protected your PC":
       More info → Run anyway
  4. Wait until you see: OK — bridge is running
  5. Open Inflero in the browser ON THIS SAME PC
       Settings → OmniCashier
       Device IP = cash register IPv4 (example 192.168.100.250)
       Port = 8989
       Enter API username/password → Save → Test OmniCashier login

CHECK / TROUBLESHOOT
  - Double‑click check.bat  (must say OK)
  - Log file: C:\ProgramData\Inflero\OmniBridge\bridge.log
  - Task Scheduler task name: InfleroOmniBridge
  - Install path: C:\Program Files\Inflero\OmniBridge\

COMMON ISSUES
  - Bridge OK but login fails → wrong device IP, device off, or not same Wi‑Fi
  - Browser asks to allow local network / private network → click Allow
  - Antivirus quarantined the exe → whitelist InfleroOmniBridge.exe and re‑run install.bat
  - Testing from a different laptop than the POS → will not work; install on the POS PC
  - Live Inflero must already include OmniCashier bridge support (deployed web app)

UNINSTALL
  Right‑click uninstall.bat → Run as administrator

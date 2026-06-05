@echo off
chcp 65001 >nul
cd /d "%~dp0"

set NODE_PATH=C:\Users\Ky\.workbuddy\binaries\node\versions\22.12.0
set PATH=%NODE_PATH%;%PATH%

%NODE_PATH%\pm2.cmd logs
pause

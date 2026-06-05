@echo off
chcp 65001 >nul
cd /d "%~dp0"

set NODE_PATH=C:\Users\Ky\.workbuddy\binaries\node\versions\22.12.0
set PATH=%NODE_PATH%;%PATH%

echo.
echo  [Bozone PM2 状态]
echo.
%NODE_PATH%\pm2.cmd status
echo.
echo  常用命令:
echo    pm2 logs      查看日志
echo    pm2 restart all   重启全部
echo    pm2 stop all      停止全部
echo.
pause

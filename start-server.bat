@echo off
echo ========================================
echo 心理学刷题宝典 - 本地服务器
echo ========================================
echo.
echo 正在启动服务器...
echo.
echo 请在浏览器中访问: http://localhost:8080
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.
cd /d "%~dp0"
python -m http.server 8080
pause

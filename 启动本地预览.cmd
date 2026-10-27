@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 请打开 http://127.0.0.1:8000
echo 检查 Excel 也可直接双击 manage.html；关闭此窗口可停止本地服务。
python -m http.server 8000 --bind 127.0.0.1
if errorlevel 1 (
  echo.
  echo 本地预览未启动。请确认已安装 Python，或直接打开 manage.html 预览 Excel。
  pause
)

@echo off
title Khoi dong Mo Hinh Store
echo ===================================================
echo   KHOI DONG HE THONG MO HINH STORE
echo ===================================================
echo.

:: 1. Giai phong cong 5000 neu bi ket
echo [1/3] Dang kiem tra va giai phong cong 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Dang giai phong process PID %%a dang chiem dung cong 5000...
    taskkill /f /pid %%a >nul 2>&1
)
echo Giai phong cong 5000 hoan tat!
echo.

:: 2. Kiem tra va khoi dong MongoDB
echo [2/3] Dang kiem tra va khoi dong MongoDB...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Dang chay voi quyen Administrator. Dang tu dong start service MongoDB neu chua chay...
    net start MongoDB >nul 2>&1
) else (
    echo [Luu y] De tu dong tu dong kich hoat MongoDB neu chua bat, ban nen chay file .bat nay bang quyen "Run as Administrator".
)
echo.

:: 3. Khoi dong Backend Server
echo [3/3] Dang chuan bi khoi dong Backend Server...
cd /d "%~dp0..\mohinhstore\backend"
if not exist node_modules (
    echo Khong tim thay node_modules, dang tu dong cai dat thu vien...
    npm install
)

:: 4. Khoi dong cong cu tu dong dong bo (File Watcher)
echo [Luu y] Dang khoi dong cong cu tu dong dong bo len website online...
start /b "" "%~dp0run_watcher.bat"

echo.
echo ===================================================
echo   KHOI DONG HOAN TAT! WEB DANG CHAY TAI:
echo   http://localhost:5000
echo ===================================================
echo.
npm run dev
pause

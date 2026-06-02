@echo off
title Dong Bo Nhanh - Baitaplon Store
echo ===================================================
echo   DONG BO DU LIEU LEN WEBSITE ONLINE
echo ===================================================
echo.

cd /d "%~dp0"
cd ..

echo [1/3] Kiem tra trang thai Git...
"C:\Program Files\Git\cmd\git.exe" status
echo.

echo [2/3] Chuan bi commit cac thay doi...
"C:\Program Files\Git\cmd\git.exe" add .

:: Kiem tra xem co thay doi nao de commit hay khong
"C:\Program Files\Git\cmd\git.exe" diff --cached --quiet
if %errorlevel% equ 0 (
    echo Khong co thay doi nao moi de dong bo!
    goto PUSH_PROCESS
)

echo Dang commit thay doi...
"C:\Program Files\Git\cmd\git.exe" commit -m "Manual sync: %date% %time%"

:PUSH_PROCESS
echo.
echo [3/3] Dang day du lieu len GitHub (Online)...
"C:\Program Files\Git\cmd\git.exe" push origin master

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   DONG BO THANH CONG!
    echo   Render dang tu dong deploy thay doi moi cua ban.
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo   [LOI] Khong the day du lieu len GitHub!
    echo   Kiem tra ket noi internet hoac Git credentials cua ban.
    echo ===================================================
)

echo.
echo Nhan phim bat ky de thoat...
pause >nul

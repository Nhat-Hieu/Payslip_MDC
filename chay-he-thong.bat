@echo off
title He Thong Phieu Luong - Moc Dong Chau
cd /d "%~dp0"

echo ====================================================
echo   DANG KHOI DONG HE THONG PHIEU LUONG MOC DONG CHAU
echo ====================================================
echo.
echo He thong dang chay tai: http://localhost:3000
echo Nhan Ctrl + C trong cua so nay neu muon dung he thong.
echo.

:: Tu dong mo trinh duyet
start "" "http://localhost:3000"

:: Chay server nodejs
node server.js

pause

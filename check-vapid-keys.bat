@echo off
echo ==========================================
echo    Checking VAPID Keys Configuration
echo ==========================================
echo.
cd backend
php check-vapid-keys.php
cd ..
echo.
echo.
echo Press any key to exit...
pause > nul


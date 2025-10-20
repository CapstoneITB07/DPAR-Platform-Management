@echo off
echo ============================================
echo    Restarting for Push Notifications
echo ============================================
echo.

echo Step 1: Instructions
echo -------------------
echo Please follow these steps:
echo.
echo 1. Stop your frontend dev server (Ctrl+C in the terminal)
echo 2. Stop your backend server (Ctrl+C in the terminal)
echo 3. Update backend/.env with VAPID keys
echo 4. Restart backend: php artisan serve
echo 5. Restart frontend: npm start
echo 6. Clear browser cache (Ctrl+Shift+R)
echo 7. Open DevTools (F12) and go to Application -^> Service Workers
echo 8. Click "Unregister" on all service workers
echo 9. Refresh the page
echo.
echo ============================================

pause


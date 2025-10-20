@echo off
echo ==========================================
echo    VAPID Key Update Helper
echo ==========================================
echo.
echo Step 1: Get New Keys
echo.
echo Open this website in your browser:
echo https://vapidkeys.com/
echo.
echo You will see TWO keys:
echo   - Public Key  (starts with B...)
echo   - Private Key (long random string)
echo.
echo COPY BOTH KEYS!
echo.
pause
echo.
echo ==========================================
echo Step 2: Update Backend
echo ==========================================
echo.
echo Opening your .env file...
echo.
echo Add or update these THREE lines:
echo.
echo VAPID_PUBLIC_KEY=paste_your_public_key_here
echo VAPID_PRIVATE_KEY=paste_your_private_key_here
echo VAPID_SUBJECT=mailto:admin@dpar.com
echo.
echo Replace the values with your keys from vapidkeys.com
echo.
notepad backend\.env
echo.
echo ==========================================
echo Step 3: Update Frontend
echo ==========================================
echo.
echo Opening frontend file...
echo.
echo Find this line:
echo const VAPID_PUBLIC_KEY = '...';
echo.
echo Replace with your NEW public key
echo.
notepad frontend\src\utils\pushNotifications.js
echo.
echo ==========================================
echo Step 4: Restart Backend
echo ==========================================
echo.
echo Now restart your backend server:
echo   1. Go to the terminal running "php artisan serve"
echo   2. Press Ctrl+C to stop it
echo   3. Run: cd backend
echo   4. Run: php artisan serve
echo.
echo Then refresh your browser with Ctrl+Shift+R
echo.
echo ==========================================
echo All Done!
echo ==========================================
echo.
echo After restarting:
echo   1. Press F12 in browser
echo   2. Go to Application -^> Service Workers -^> Unregister all
echo   3. Refresh page
echo   4. Click "Push Notifications OFF" button
echo   5. Allow when browser asks
echo   6. Test by creating a notification!
echo.
pause


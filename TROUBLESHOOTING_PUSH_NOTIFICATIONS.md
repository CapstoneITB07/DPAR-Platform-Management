# Push Notifications Troubleshooting Guide

## ⚠️ Button Not Working? Follow These Steps:

### 1. **Update Backend VAPID Keys**

Your frontend is now using this public key:
```
BO2O3tKl9nICMKOadqdXRDjSkZnUvn7PBUQabt1NZZ1j7FPGiSSfmzO-m2T2Prvr6OwIkPzJIGZTNXrJkZVW4oM
```

**⚠️ CRITICAL:** You need to add the MATCHING private key to your backend `.env` file!

Add these lines to `backend/.env`:
```env
VAPID_PUBLIC_KEY=BO2O3tKl9nICMKOadqdXRDjSkZnUvn7PBUQabt1NZZ1j7FPGiSSfmzO-m2T2Prvr6OwIkPzJIGZTNXrJkZVW4oM
VAPID_PRIVATE_KEY=YOUR_MATCHING_PRIVATE_KEY_HERE
VAPID_SUBJECT=mailto:admin@dpar.com
```

**How to get the private key:**
- If you generated this key pair, you should have the private key
- If you got this from vapidkeys.com, check your download/generated keys
- The private key should match the public key you're using

### 2. **Restart Your Development Server**

After updating the service worker, you need to:

**Frontend:**
```bash
# Stop the server (Ctrl+C)
# Start it again
npm start
```

**Backend:**
```bash
# If using Laravel's built-in server
php artisan serve

# Or restart your web server
```

### 3. **Clear Browser Cache & Service Worker**

**Method 1: Hard Refresh**
- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Method 2: Clear Service Worker (Recommended)**
1. Open browser DevTools (`F12`)
2. Go to **Application** tab
3. Click **Service Workers** (left sidebar)
4. Click **Unregister** on all service workers
5. Go to **Storage** → Click **Clear site data**
6. Refresh the page (`F5`)

### 4. **Check Browser Console**

Open browser console (`F12`) and look for errors:

**Good Signs (What you should see):**
```
✓ Service worker registered
✓ This web app is being served cache-first by a service worker
✓ Already subscribed to push notifications
✓ Push notification subscription saved successfully
```

**Bad Signs (Errors to fix):**
```
❌ Error during service worker registration
❌ Push notifications are not supported
❌ Notification permission denied
❌ Service Worker is not supported
❌ Failed to save subscription
```

### 5. **Test Step-by-Step**

**Step 1: Check if service worker is registered**
Open console and type:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => console.log('Registered:', regs.length))
```
Should show: `Registered: 1` or more

**Step 2: Check push notification support**
```javascript
console.log('Push supported:', 'PushManager' in window)
```
Should show: `Push supported: true`

**Step 3: Check current permission**
```javascript
console.log('Permission:', Notification.permission)
```
Should show: `Permission: granted` (or `default` if not asked yet)

**Step 4: Try subscribing manually**
Open console and paste:
```javascript
import('./utils/pushNotifications').then(module => {
  module.subscribeToPushNotifications()
    .then(() => console.log('✓ Subscribed successfully!'))
    .catch(err => console.error('✗ Subscription failed:', err))
});
```

### 6. **Common Issues & Solutions**

#### Issue: "Push notifications are not supported"
**Solution:** Use a modern browser (Chrome, Firefox, Edge, Safari 16.4+)

#### Issue: "Notification permission denied"
**Solution:** 
1. Go to browser settings
2. Search for "notifications" or "site settings"
3. Find your site URL
4. Change permission to "Allow"
5. Refresh the page

#### Issue: "Service worker not registered"
**Solution:**
1. Check if you're running the app on `localhost` or HTTPS
2. HTTP sites (non-localhost) won't work!
3. Check `serviceWorkerRegistration.js` was updated

#### Issue: "Failed to save subscription"
**Solution:**
1. Check backend is running
2. Check VAPID keys match (frontend & backend)
3. Check backend API routes are working: `/api/push/subscribe`

#### Issue: Button does nothing when clicked
**Solution:**
1. Check browser console for errors
2. Verify service worker is registered
3. Try the manual subscription test (Step 4 above)
4. Check if button has proper onClick handler

### 7. **Verify Backend Configuration**

Run this in your terminal:
```bash
cd backend
php artisan tinker
```

Then in tinker:
```php
echo env('VAPID_PUBLIC_KEY');
// Should show: BO2O3tKl9nICMKOadqdXRDjSkZnUvn7PBUQabt1NZZ1j7FPGiSSfmzO-m2T2Prvr6OwIkPzJIGZTNXrJkZVW4oM

echo env('VAPID_PRIVATE_KEY');
// Should show your private key

echo env('VAPID_SUBJECT');
// Should show: mailto:admin@dpar.com
```

### 8. **Network Check**

Open DevTools → Network tab:
1. Click the push notification button
2. Look for a request to `/api/push/subscribe`
3. Check the response:
   - ✓ Status 200 = Success
   - ❌ Status 401 = Authentication issue
   - ❌ Status 500 = Server error (check backend logs)

### 9. **Browser Permissions**

**Chrome/Edge:**
1. Click the lock icon in address bar
2. Click "Site settings"
3. Find "Notifications"
4. Set to "Allow"

**Firefox:**
1. Click the lock icon
2. Click arrow next to "Connection secure"
3. Click "More information"
4. Go to "Permissions" tab
5. Find "Show Notifications"
6. Uncheck "Use Default" and check "Allow"

**Safari:**
1. Safari → Preferences → Websites
2. Click "Notifications"
3. Find your site and set to "Allow"

### 10. **Final Checklist**

Before asking for more help, verify:
- [ ] Service worker registration code updated (removed production check)
- [ ] Browser cache cleared
- [ ] Service worker unregistered and re-registered
- [ ] VAPID keys added to backend `.env`
- [ ] VAPID public key in frontend matches backend
- [ ] Backend server restarted
- [ ] Frontend dev server restarted
- [ ] Browser permissions set to "Allow"
- [ ] Using HTTPS or localhost
- [ ] Using a supported browser

### 🆘 Still Not Working?

**Get Debug Info:**
Open browser console and run:
```javascript
console.log('=== DEBUG INFO ===');
console.log('Service Worker support:', 'serviceWorker' in navigator);
console.log('Push Manager support:', 'PushManager' in window);
console.log('Notification permission:', Notification.permission);
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service workers registered:', regs.length);
  regs.forEach((reg, i) => console.log(`  SW ${i}:`, reg.active?.scriptURL));
});
console.log('Protocol:', window.location.protocol);
console.log('Host:', window.location.host);
```

Share this output for further help!


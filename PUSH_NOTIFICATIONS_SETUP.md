# Push Notifications Setup Guide

## Overview
The DPAR Platform now includes a comprehensive push notification system that allows users to receive real-time notifications even when they're not actively using the application. This follows industry best practices using the Web Push API.

## Features Implemented

### For Admins
- **New Applications**: Receive push notifications when new associate group applications are submitted
- **New Reports**: Get notified when associates submit new reports
- **Notification Responses**: Receive alerts when associates respond to notifications

### For Associates
- **New Notifications**: Get notified when admin sends new notifications
- **New Announcements**: Receive push notifications for new announcements
- **Report Status**: Get notified when reports are approved or rejected

### For Citizens
- **New Announcements**: Receive notifications for new public announcements
- **Training Programs**: Get notified about new training programs

## Setup Instructions

### Backend Configuration

#### 1. VAPID Keys Configuration

VAPID keys are required for web push notifications. You need to add them to your `.env` file.

**Option A: Use the provided example keys (for testing only):**
```env
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib27SShWRLGySM8HCoeCdP0B8WEYvxqDrMW5n8HJLLjKC_3N9hG-mOE9uos
VAPID_PRIVATE_KEY=UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
VAPID_SUBJECT=mailto:admin@dpar.com
```

**Option B: Generate your own keys (recommended for production):**

1. Visit https://vapidkeys.com/ to generate new VAPID keys
2. Or use an online tool or library to generate ECDSA P-256 key pairs
3. Add them to your `.env` file:
```env
VAPID_PUBLIC_KEY=your_generated_public_key_here
VAPID_PRIVATE_KEY=your_generated_private_key_here
VAPID_SUBJECT=mailto:your_email@example.com
```

#### 2. Update Frontend VAPID Public Key

Open `frontend/src/utils/pushNotifications.js` and update the `VAPID_PUBLIC_KEY` constant with your public key:

```javascript
const VAPID_PUBLIC_KEY = 'your_vapid_public_key_here';
```

**Important:** The frontend and backend VAPID public keys must match!

#### 3. Database Migration

The database migration has already been run. It created a `push_subscriptions` table to store user subscriptions.

### Frontend Configuration

The frontend is already configured with:
- Service Worker with push notification handlers
- Push notification utility functions
- Toggle buttons in Admin and Associate sidebars
- Floating action button for Citizens

## How to Use

### For Admin Users

1. Login to the admin dashboard
2. Look at the left sidebar
3. You'll see a "Push Notifications" toggle button above the logout button
4. Click it to enable/disable push notifications
5. When enabled, you'll receive notifications for:
   - New associate group applications
   - New reports from associates
   - Responses to your notifications

### For Associate Users

1. Login to your associate account
2. Look at the left sidebar
3. You'll see a "Push Notifications" toggle button above the logout button
4. Click it to enable/disable push notifications
5. When enabled, you'll receive notifications for:
   - New notifications from admin
   - New announcements
   - Report approval/rejection status

### For Citizens (Public Users)

1. Visit the citizen page
2. Look for a floating bell icon button in the bottom-right corner
3. Click it to enable/disable push notifications
4. When enabled, you'll receive notifications for:
   - New public announcements
   - New training programs

## Browser Permission

When you first enable push notifications, your browser will ask for permission to show notifications:
- Click "Allow" to enable notifications
- Click "Block" to deny (you can change this in browser settings later)

## Technical Details

### Architecture

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Subscribe
       ├──────────────────┐
       │                  │
       │              ┌───▼────────────┐
       │              │ Service Worker │
       │              │ (Push Handler) │
       │              └───┬────────────┘
       │                  │
       │                  │ 2. Listen for push events
       │                  │
┌──────▼──────┐      ┌────▼─────────┐
│   Backend   │◄─────┤ Push Service │
│   (Laravel) │      │  (Browser)   │
└──────┬──────┘      └──────────────┘
       │
       │ 3. Send notification
       │
┌──────▼───────────┐
│ Push Subscription│
│   (Database)     │
└──────────────────┘
```

### Files Modified/Created

#### Backend
- `database/migrations/*_create_push_subscriptions_table.php` - Database schema
- `app/Models/PushSubscription.php` - Model for subscriptions
- `app/Http/Controllers/PushNotificationController.php` - API endpoints
- `app/Services/PushNotificationService.php` - Business logic
- `app/Console/Commands/GenerateVapidKeys.php` - VAPID key generator
- `routes/api.php` - API routes
- Modified controllers to send push notifications:
  - `AnnouncementController.php`
  - `NotificationController.php`
  - `ReportController.php`
  - `Auth/AuthController.php`

#### Frontend
- `frontend/public/service-worker.js` - Push event handlers
- `frontend/src/utils/pushNotifications.js` - Utility functions
- `frontend/src/components/AdminDashboard/js/AdminLayout.js` - Admin toggle
- `frontend/src/components/AssociateDashboard/js/AssociateLayout.js` - Associate toggle
- `frontend/src/components/CitizenPage/CitizenPage.js` - Citizen button

### API Endpoints

- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/unsubscribe` - Unsubscribe from push notifications
- `POST /api/push/toggle` - Toggle subscription status
- `GET /api/push/status` - Get subscription status (authenticated)
- `POST /api/push/test` - Send test notification (authenticated)

## Troubleshooting

### Notifications not appearing

1. **Check browser permission:**
   - Open browser settings
   - Find "Notifications" or "Site settings"
   - Ensure the website has permission to show notifications

2. **Check VAPID keys:**
   - Ensure frontend and backend keys match
   - Ensure keys are properly formatted in `.env`

3. **Check service worker registration:**
   - Open browser DevTools (F12)
   - Go to Application → Service Workers
   - Ensure service worker is active and running

4. **Check backend logs:**
   - Look at `storage/logs/laravel.log`
   - Check for push notification errors

### Cannot enable push notifications

1. **HTTPS Required:**
   - Push notifications require HTTPS (or localhost for development)
   - Ensure your site is served over HTTPS

2. **Browser compatibility:**
   - Ensure you're using a modern browser (Chrome, Firefox, Edge, Safari)
   - Check caniuse.com for browser support

3. **Service worker not registered:**
   - Check browser console for errors
   - Ensure service worker file is accessible at `/service-worker.js`

## Security Considerations

1. **VAPID Keys:**
   - Keep your private key secret
   - Never commit private keys to version control
   - Rotate keys periodically for production

2. **Subscription Data:**
   - Subscriptions are stored in the database
   - Each subscription is tied to an endpoint
   - Users can unsubscribe at any time

3. **User Privacy:**
   - Users control their notification preferences
   - Unsubscribing removes all subscription data
   - No personal data is included in push notifications

## Testing

### Test Push Notifications

1. Login to your account
2. Enable push notifications
3. Use the test endpoint (authenticated users):
   ```javascript
   fetch('/api/push/test', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN',
       'Content-Type': 'application/json'
     }
   });
   ```

### Manual Testing

- **Admin:** Create a test announcement or report
- **Associate:** Submit a test report
- **Citizen:** Wait for admin to post an announcement

## Best Practices

1. **User Control:**
   - Always provide clear enable/disable toggle
   - Respect user preferences
   - Don't spam users with notifications

2. **Content:**
   - Keep notification titles concise
   - Include relevant information in the body
   - Add appropriate action URLs

3. **Timing:**
   - Send notifications immediately when events occur
   - Don't batch notifications (real-time is key)
   - Handle timezone differences appropriately

4. **Error Handling:**
   - Handle invalid subscriptions gracefully
   - Remove expired/invalid subscriptions
   - Log errors for debugging

## Support

For issues or questions:
1. Check the logs: `storage/logs/laravel.log`
2. Review browser console for frontend errors
3. Test with different browsers/devices
4. Contact the development team

## License

This push notification implementation is part of the DPAR Platform Management System.


# 🏗️ Push Notification System Architecture

## 📋 Table of Contents
1. [Overview](#overview)
2. [Backend Files](#backend-files)
3. [Frontend Files](#frontend-files)
4. [How They Connect](#how-they-connect)
5. [Complete Flow](#complete-flow)

---

## Overview

The push notification system has **3 main parts**:

```
┌─────────────────────────────────────────────────────────┐
│                  PUSH NOTIFICATION SYSTEM                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. BACKEND (Laravel/PHP)                               │
│     - Stores subscriptions                              │
│     - Sends push notifications                          │
│     - Manages VAPID keys                                │
│                                                          │
│  2. FRONTEND (React)                                    │
│     - Subscribe/unsubscribe buttons                     │
│     - Communicates with backend API                     │
│                                                          │
│  3. SERVICE WORKER (JavaScript)                         │
│     - Runs in browser background                        │
│     - Receives push notifications                       │
│     - Shows notification popups                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Files

### 1. **Database Migration**
**File:** `backend/database/migrations/2025_10_19_063010_create_push_subscriptions_table.php`

**Purpose:** Creates a table to store user push notification subscriptions

**Contains:**
```php
- user_id (who subscribed)
- endpoint (browser's unique push URL)
- public_key (encryption key)
- auth_token (authentication token)
- is_enabled (on/off toggle)
```

**Why needed:** We need to remember who subscribed so we can send them notifications later.

---

### 2. **PushSubscription Model**
**File:** `backend/app/Models/PushSubscription.php`

**Purpose:** Eloquent model to interact with push_subscriptions table

**What it does:**
- Allows us to save/update/delete subscriptions
- Links subscriptions to users
- Defines what data can be filled

**Example usage:**
```php
// Save a subscription
PushSubscription::create([
    'user_id' => 1,
    'endpoint' => 'https://fcm.googleapis.com/...',
    'public_key' => '...',
    'auth_token' => '...'
]);

// Get all subscriptions for a user
$subs = PushSubscription::where('user_id', 1)->get();
```

---

### 3. **PushNotificationController**
**File:** `backend/app/Http/Controllers/PushNotificationController.php`

**Purpose:** Handles API requests from frontend (like subscribing, unsubscribing)

**Main methods:**
1. `subscribe()` - When user clicks "Enable Push Notifications"
2. `unsubscribe()` - When user clicks "Disable"
3. `toggleSubscription()` - Turn on/off without deleting
4. `getStatus()` - Check if user is subscribed
5. `sendNotification()` - Actually send push notifications (used by other parts)
6. `sendTest()` - Send a test notification

**Example flow:**
```
Frontend clicks "Enable" 
    ↓
Calls POST /api/push/subscribe
    ↓
PushNotificationController->subscribe()
    ↓
Saves to push_subscriptions table
    ↓
Returns success to frontend
```

---

### 4. **PushNotificationService**
**File:** `backend/app/Services/PushNotificationService.php`

**Purpose:** Business logic for WHEN to send notifications

**Main methods:**
```php
notifyAssociatesNewNotification()  // Admin creates notification
notifyAdminNotificationResponse()  // Associate responds
notifyAssociatesNewAnnouncement()  // Admin creates announcement
notifyCitizensNewAnnouncement()    // Admin creates announcement
notifyAdminNewReport()             // Associate submits report
notifyAssociateReportApproved()    // Admin approves report
notifyAssociateReportRejected()    // Admin rejects report
notifyAdminNewApplication()        // New associate applies
```

**Why separate service:** Keeps code organized. Controllers handle HTTP, Services handle business logic.

**Example:**
```php
// When admin creates notification
public static function notifyAssociatesNewNotification($notification, $associateIds)
{
    // Get the associates
    // Prepare notification data
    // Call PushNotificationController::sendNotification()
}
```

---

### 5. **Integration in Existing Controllers**

**Modified files:**
- `backend/app/Http/Controllers/NotificationController.php`
- `backend/app/Http/Controllers/AnnouncementController.php`
- `backend/app/Http/Controllers/ReportController.php`
- `backend/app/Http/Controllers/auth/AuthController.php`

**What changed:**
Added calls to `PushNotificationService` when events happen:

```php
// In NotificationController->store()
$notification = Notification::create([...]);

// NEW CODE: Send push notification
PushNotificationService::notifyAssociatesNewNotification(
    $notification, 
    $associateIds
);
```

**Wrapped in try-catch** so if push notifications fail, the main operation still succeeds.

---

### 6. **API Routes**
**File:** `backend/routes/api.php`

**Added routes:**
```php
// Public routes (anyone can use)
POST /api/push/subscribe      → Subscribe to notifications
POST /api/push/unsubscribe    → Unsubscribe
POST /api/push/toggle         → Toggle on/off

// Protected routes (need login)
GET  /api/push/status         → Check subscription status
POST /api/push/test           → Send test notification
```

---

### 7. **VAPID Keys Configuration**
**File:** `backend/.env`

**Contains:**
```env
VAPID_PUBLIC_KEY=B...    # Public encryption key
VAPID_PRIVATE_KEY=...    # Private signing key
VAPID_SUBJECT=mailto:... # Contact email
```

**Why needed:** Web Push API requires VAPID keys to authenticate the server sending notifications. It proves you own the website.

---

## Frontend Files

### 1. **Push Notification Utility**
**File:** `frontend/src/utils/pushNotifications.js`

**Purpose:** Helper functions to manage push notifications from React

**Main functions:**
```javascript
isPushNotificationSupported()        // Check if browser supports it
requestNotificationPermission()      // Ask user for permission
subscribeToPushNotifications()       // Subscribe to push
unsubscribeFromPushNotifications()   // Unsubscribe
isPushNotificationSubscribed()       // Check if subscribed
sendTestNotification()               // Send test
```

**Key constant:**
```javascript
const VAPID_PUBLIC_KEY = 'B...'; // Must match backend
```

**Example usage:**
```javascript
// When user clicks "Enable" button
const result = await subscribeToPushNotifications();
if (result.success) {
    console.log('Subscribed!');
}
```

---

### 2. **Service Worker**
**File:** `frontend/public/service-worker.js`

**Purpose:** Runs in browser background, receives push notifications

**Key event listeners:**

**a) `push` event** - When notification arrives
```javascript
self.addEventListener('push', event => {
    // Parse notification data
    const data = event.data.json();
    
    // Show notification popup
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon
    });
});
```

**b) `notificationclick` event** - When user clicks notification
```javascript
self.addEventListener('notificationclick', event => {
    // Close notification
    event.notification.close();
    
    // Open or focus the app window
    clients.openWindow(event.notification.data.url);
});
```

**Why separate file:** Service workers run independently of your web page. They can receive notifications even when the page is closed!

---

### 3. **Service Worker Registration**
**File:** `frontend/src/serviceWorkerRegistration.js`

**Purpose:** Registers the service worker when app starts

**What I changed:**
```javascript
// Before: Only in production
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {

// After: Always (needed for push notifications)
if ('serviceWorker' in navigator) {
```

**Called from:** `frontend/src/index.js`

---

### 4. **Admin Layout with Toggle Button**
**File:** `frontend/src/components/AdminDashboard/js/AdminLayout.js`

**Added:**
```javascript
// State to track if enabled
const [pushNotificationsEnabled, setEnabled] = useState(false);

// Check status on load
useEffect(() => {
    checkPushNotificationStatus();
}, []);

// Toggle function
const togglePushNotifications = async () => {
    if (pushNotificationsEnabled) {
        await unsubscribeFromPushNotifications();
    } else {
        await subscribeToPushNotifications();
    }
    checkPushNotificationStatus();
};

// Button in sidebar
<button onClick={togglePushNotifications}>
    {pushNotificationsEnabled ? 'ON' : 'OFF'}
</button>
```

---

### 5. **Associate Layout with Toggle Button**
**File:** `frontend/src/components/AssociateDashboard/js/AssociateLayout.js`

**Same as AdminLayout** - Added the same toggle button functionality

---

### 6. **Citizen Page with Floating Button**
**File:** `frontend/src/components/CitizenPage/CitizenPage.js`

**Added:**
```javascript
// Same toggle logic as above

// But button is a floating action button (FAB)
<button 
    className="citizen-push-notification-fab"
    style={{ 
        position: 'fixed', 
        bottom: '30px', 
        right: '30px' 
    }}
>
    <FaBell />
</button>
```

**Why different:** Citizens don't have a sidebar, so we use a floating button.

---

## How They Connect

### 🔄 **Subscription Flow (When User Enables Push)**

```
┌──────────────────────────────────────────────────────────────┐
│                     SUBSCRIPTION FLOW                         │
└──────────────────────────────────────────────────────────────┘

1. User clicks "Push Notifications OFF" button
         ↓
2. AdminLayout.js → togglePushNotifications()
         ↓
3. pushNotifications.js → subscribeToPushNotifications()
         ↓
4. Asks browser for permission
         ↓ (User clicks "Allow")
5. Service Worker registers
         ↓
6. Gets Push Subscription from browser
         ↓
7. Sends subscription to backend
   POST /api/push/subscribe
   {
       endpoint: 'https://fcm.googleapis.com/...',
       keys: { p256dh: '...', auth: '...' }
   }
         ↓
8. PushNotificationController->subscribe()
         ↓
9. PushSubscription::create() → Saves to database
         ↓
10. Returns success to frontend
         ↓
11. Button turns GREEN → "Push Notifications ON"
```

---

### 📤 **Sending Flow (When Admin Creates Notification)**

```
┌──────────────────────────────────────────────────────────────┐
│                     NOTIFICATION SEND FLOW                    │
└──────────────────────────────────────────────────────────────┘

1. Admin creates notification
   (Admin → Notifications → Add Notification)
         ↓
2. Frontend sends POST /api/notifications
         ↓
3. NotificationController->store()
         ↓
4. Saves notification to database
         ↓
5. Calls PushNotificationService::notifyAssociatesNewNotification()
         ↓
6. Service gets all subscribed associates
   PushSubscription::where('user_id', $associateIds)->get()
         ↓
7. For each subscription, calls:
   PushNotificationController::sendNotification()
         ↓
8. Uses minishlink/web-push library with VAPID keys
         ↓
9. Sends push to browser's push service (FCM/Mozilla/etc.)
         ↓
10. Browser push service → Associate's browser
         ↓
11. Service Worker receives 'push' event
         ↓
12. Service Worker shows notification popup
         ↓
13. 🔔 Associate sees notification!
```

---

### 🖱️ **Click Flow (When User Clicks Notification)**

```
┌──────────────────────────────────────────────────────────────┐
│                     NOTIFICATION CLICK FLOW                   │
└──────────────────────────────────────────────────────────────┘

1. User clicks notification popup
         ↓
2. Service Worker 'notificationclick' event fires
         ↓
3. Notification closes
         ↓
4. Service Worker checks for open windows
         ↓
5. If app is open → Focus that window
   If app is closed → Open new window
         ↓
6. Navigate to URL (from notification data)
   e.g., /associate/notification
         ↓
7. User sees the notification in the app
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM FLOW                          │
└─────────────────────────────────────────────────────────────────┘

INITIAL SETUP
═════════════
Admin generates VAPID keys
    ↓
Keys saved in backend/.env (public + private)
    ↓
Public key copied to frontend/src/utils/pushNotifications.js
    ↓
System ready!


USER SUBSCRIBES (ONE TIME)
═══════════════════════════
User clicks "Enable" button
    ↓
Frontend → Service Worker → Browser API
    ↓
Subscription object created
    ↓
Sent to backend /api/push/subscribe
    ↓
Saved in push_subscriptions table
    ↓
Button turns green


NOTIFICATION TRIGGERED
══════════════════════
Admin creates notification/announcement/etc.
    ↓
Controller saves to database
    ↓
Controller calls PushNotificationService
    ↓
Service determines who to notify
    ↓
Service gets subscriptions from database
    ↓
Service calls PushNotificationController::sendNotification()
    ↓
Uses VAPID keys + Web Push library
    ↓
Sends to browser push service (Google FCM, etc.)


NOTIFICATION DELIVERED
═══════════════════════
Browser push service → User's browser
    ↓
Service Worker 'push' event
    ↓
Service Worker shows notification popup
    ↓
User sees notification! 🔔


USER CLICKS NOTIFICATION
═════════════════════════
User clicks popup
    ↓
Service Worker 'notificationclick' event
    ↓
Opens/focuses app window
    ↓
Navigates to relevant page
```

---

## File Dependency Map

```
BACKEND DEPENDENCIES
═══════════════════

.env (VAPID keys)
    ↓ read by
PushNotificationController
    ↓ uses
minishlink/web-push library
    ↓ interacts with
PushSubscription model
    ↓ saves to
push_subscriptions table

PushNotificationService
    ↓ calls
PushNotificationController::sendNotification()

Existing Controllers (Notification, Announcement, Report, Auth)
    ↓ call
PushNotificationService methods


FRONTEND DEPENDENCIES
═════════════════════

VAPID_PUBLIC_KEY (in pushNotifications.js)
    ↓ used by
pushNotifications.js utility functions
    ↓ used by
Layout components (Admin, Associate, Citizen)
    ↓ communicate with
Service Worker
    ↓ communicates with
Backend API endpoints


RUNTIME FLOW
════════════

User opens app
    ↓
index.js loads
    ↓
Registers service worker (serviceWorkerRegistration.js)
    ↓
Service worker active (service-worker.js)
    ↓
User navigates to dashboard
    ↓
Layout component loads (AdminLayout/AssociateLayout/CitizenPage)
    ↓
Checks subscription status (calls backend /api/push/status)
    ↓
Shows button state (ON/OFF)
    ↓
User clicks button
    ↓
Calls pushNotifications.js functions
    ↓
Communicates with service worker
    ↓
Sends subscription to backend
    ↓
Backend saves to database
```

---

## Key Concepts Explained

### 1. **Why Service Worker?**
Service workers run **independently** of your web page. This means:
- Can receive notifications when page is closed
- Can run in background
- Can wake up when notification arrives

### 2. **Why VAPID Keys?**
VAPID = Voluntary Application Server Identification
- Proves you own the website
- Required by Web Push API
- Public key shared with browser, private key kept secret
- Keys must match for encryption to work

### 3. **Why Store Subscriptions?**
Each browser/device gets a unique "endpoint" URL:
```
https://fcm.googleapis.com/fcm/send/abc123...
```
We need to remember these URLs to send notifications later.

### 4. **Why minishlink/web-push?**
This PHP library:
- Handles Web Push protocol
- Manages VAPID authentication
- Encrypts notification payload
- Sends to browser push services

### 5. **Why Separate Service and Controller?**
**Controller:** Handles HTTP (subscribe, unsubscribe, etc.)
**Service:** Business logic (when to notify, who to notify)

Clean separation of concerns!

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    QUICK SUMMARY                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BACKEND:                                                    │
│  • Database stores subscriptions                            │
│  • Controller handles API requests                          │
│  • Service decides when to send notifications               │
│  • Existing controllers trigger notifications               │
│                                                              │
│  FRONTEND:                                                   │
│  • Layouts have toggle buttons                              │
│  • Utility functions manage subscriptions                   │
│  • Service worker receives & shows notifications            │
│                                                              │
│  CONNECTION:                                                 │
│  • VAPID keys (public in both, private in backend)          │
│  • API endpoints (frontend → backend)                       │
│  • Browser Push API (backend → service worker)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Documentation Files I Created

These are just **guides** to help you set up and troubleshoot:

1. `PUSH_NOTIFICATIONS_SETUP.md` - Initial setup instructions
2. `PUSH_NOTIFICATIONS_SUMMARY.md` - Feature summary
3. `QUICK_PUSH_NOTIFICATION_GUIDE.md` - Quick start guide
4. `PUSH_NOTIFICATION_TROUBLESHOOTING.md` - Debugging help
5. `VAPID_KEY_SOLUTION.md` - How to fix VAPID key issues
6. `FIX_PUSH_NOTIFICATIONS_NOW.md` - Quick fix guide
7. `DO_THIS_NOW.md` - Step-by-step current fix
8. `PUSH_NOTIFICATION_ARCHITECTURE.md` - This file!

**These are NOT part of the system** - just helpful documentation.

---

Hope this helps you understand how everything connects! 🎉


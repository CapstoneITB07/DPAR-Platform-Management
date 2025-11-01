import { API_BASE } from './url';

// VAPID public key - This should match the one in your backend .env file
const VAPID_PUBLIC_KEY = 'BEfs6iHJHFTDKdpBrV7HH08j7p-p2KAuFijurHHljtoBGq9vEcXQBvT7rKLk6mZSw8tgaEFDqO0eSaui2qZTYuo';

/**
 * Convert base64url VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  // Add padding if needed
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Convert ArrayBuffer to base64url string
 */
function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  // Convert to base64url format
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Check if push notifications are supported by the browser
 */
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check current notification permission
 */
export function getNotificationPermission() {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission() {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications() {
  try {
    // Check if push notifications are supported
    if (!isPushNotificationSupported()) {
      throw new Error('Push notifications are not supported');
    }

    // Request permission if not already granted
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Register service worker if not already registered
    let registration;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/service-worker.js');
        await navigator.serviceWorker.ready;
      } catch (error) {
        // Service Worker registration failed
        throw new Error('Service Worker registration failed');
      }
    } else {
      throw new Error('Service Worker is not supported');
    }

    // Check if already subscribed - if so, unsubscribe first to ensure fresh subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      subscription = null;
    }
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Send subscription to backend
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64Url(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64Url(subscription.getKey('auth'))
        }
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to save subscription');
    }

    return subscription;
  } catch (error) {
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications() {
  try {
    if (!isPushNotificationSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return false;
    }

    // Unsubscribe from push manager
    await subscription.unsubscribe();

    // Notify backend
    const response = await fetch(`${API_BASE}/api/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });

    const data = await response.json();
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isPushNotificationSubscribed() {
  try {
    if (!isPushNotificationSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return subscription !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Force unsubscribe and clear any old subscriptions
 * Use this if you changed VAPID keys
 */
export async function forceResubscribe() {
  try {
    if (!isPushNotificationSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        await fetch(`${API_BASE}/api/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });
      } catch (e) {
        // Silent fail
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Send test notification
 */
export async function sendTestNotification() {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE}/api/push/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to send test notification');
    }

    return true;
  } catch (error) {
    // Error sending test notification
    throw error;
  }
}


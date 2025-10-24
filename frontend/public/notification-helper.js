// Notification helper for DPAR Platform
// This provides browser notifications when users are on the site
// It works alongside the push notification system

class DPARNotificationHelper {
    constructor() {
        this.checkInterval = null;
        this.lastCheckTime = new Date();
        this.isEnabled = false;
        this.init();
    }

    async init() {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        // Request permission
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.isEnabled = true;
                this.startPolling();
            }
        } else if (Notification.permission === 'granted') {
            this.isEnabled = true;
            this.startPolling();
        }

        console.log('DPAR Notification Helper initialized');
    }

    startPolling() {
        // Check for new notifications every 30 seconds
        this.checkInterval = setInterval(() => {
            this.checkForNotifications();
        }, 30000);

        // Also check immediately
        this.checkForNotifications();
    }

    async checkForNotifications() {
        try {
            // Get the current page URL to determine the API base
            const apiBase = window.location.origin.includes('localhost') 
                ? 'http://localhost:8000' 
                : window.location.origin.replace(':3000', ':8000');

            // Check if user is logged in
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (!token) {
                return;
            }

            // Fetch recent notifications
            const response = await fetch(`${apiBase}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const notifications = await response.json();
                
                // Show notifications that are newer than our last check
                notifications.forEach(notification => {
                    const notificationDate = new Date(notification.created_at);
                    if (notificationDate > this.lastCheckTime) {
                        this.showNotification(notification);
                    }
                });

                this.lastCheckTime = new Date();
            }
        } catch (error) {
            console.log('Error checking for notifications:', error);
        }
    }

    showNotification(notification) {
        if (!this.isEnabled) return;

        // Determine the correct URL based on user role and notification type
        let redirectUrl = '/';
        
        // Check if user is admin or associate
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload.role;
                
                if (role === 'head_admin') {
                    redirectUrl = '/admin/notifications';
                } else if (role === 'associate_group_leader') {
                    redirectUrl = '/associate/notification';
                }
            } catch (e) {
                // If token parsing fails, use default
                redirectUrl = '/';
            }
        }

        const notificationOptions = {
            body: notification.title || 'You have a new notification',
            icon: '/Assets/disaster_logo.png',
            badge: '/Assets/disaster_logo.png',
            data: {
                url: redirectUrl,
                id: notification.id
            },
            tag: 'dpar-notification',
            requireInteraction: false
        };

        const browserNotification = new Notification(notification.title || 'DPAR Notification', notificationOptions);

        // Handle notification click
        browserNotification.onclick = () => {
            window.focus();
            window.location.href = notificationOptions.data.url;
            browserNotification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
            browserNotification.close();
        }, 5000);
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// Initialize the notification helper when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dparNotificationHelper = new DPARNotificationHelper();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dparNotificationHelper = new DPARNotificationHelper();
    });
} else {
    window.dparNotificationHelper = new DPARNotificationHelper();
}

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faInfoCircle, faExclamationTriangle, faBan } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosConfig';
import { useAuth } from '../../../contexts/AuthContext';
import '../css/SystemAlertBanner.css';

function SystemAlertBanner() {
  const { user } = useAuth();
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissedSystemAlerts') || '[]');
    } catch {
      return [];
    }
  });

  // Fetch active alerts from API
  const fetchAlerts = useCallback(async () => {
    // Always check fresh from localStorage to catch immediate changes
    const token = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('userRole');
    
    // Determine user role:
    // - If logged in: use user.role or storedRole
    // - If logged out (null): backend treats as 'citizen' automatically
    const userRole = user?.role || (token ? storedRole : null);
    
    // NEVER show alerts to superadmin (only when logged in)
    // Superadmin creates alerts, so they don't need to see them
    if (userRole === 'superadmin' && token) {
      setAlerts([]);
      return;
    }
    
    // For all other cases, fetch alerts:
    // - Logged out (null role) = treated as 'citizen' by backend
    // - Logged in as 'head_admin' = see alerts if configured
    // - Logged in as 'associate_group_leader' = see alerts if configured
    // - Logged in as 'citizen' = see alerts if configured
    // The backend automatically treats null/unauthenticated users as 'citizen'
    try {
      const response = await axiosInstance.get('api/system-alerts/active', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      const alertsData = response.data?.alerts || [];
      setAlerts(alertsData);
    } catch (error) {
      // Silently fail - don't show errors to users
      console.error('Failed to fetch system alerts:', error);
    }
  }, [user]);

  // Track previous role and token to detect login/logout
  const prevRoleRef = React.useRef(null);
  const prevTokenRef = React.useRef(null);
  
  // Initialize refs on mount
  React.useEffect(() => {
    const initialToken = localStorage.getItem('authToken');
    const initialRole = localStorage.getItem('userRole');
    prevRoleRef.current = user?.role || (initialToken ? initialRole : null);
    prevTokenRef.current = initialToken;
  }, []); // Only run on mount
  
  // Fetch alerts when user changes or route changes
  useEffect(() => {
    // Don't show on superadmin login page
    if (location.pathname === '/superadmin/login') {
      setAlerts([]);
      prevRoleRef.current = null;
      prevTokenRef.current = null;
      return;
    }

    // Check auth state - always read fresh from localStorage
    const token = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('userRole');
    
    // Determine current role:
    // - Logged in: user.role or storedRole (head_admin, associate_group_leader, citizen, superadmin)
    // - Logged out: null (backend treats null as 'citizen' automatically)
    const currentRole = user?.role || (token ? storedRole : null);
    
    // Detect role or token change (login/logout)
    const roleChanged = prevRoleRef.current !== currentRole;
    const tokenChanged = prevTokenRef.current !== token;
    const authChanged = roleChanged || tokenChanged;
    
    // Update refs for next comparison
    prevRoleRef.current = currentRole;
    prevTokenRef.current = token;
    
    // NEVER show alerts to superadmin (only when logged in)
    // Superadmin creates alerts, so they don't need to see them
    if (currentRole === 'superadmin' && token) {
      setAlerts([]);
      return;
    }
    
    // Fetch alerts immediately for all other cases:
    // - Logged out (null role) = backend treats as 'citizen' → see alerts if configured
    // - Logged in as 'head_admin' → see alerts if configured
    // - Logged in as 'associate_group_leader' → see alerts if configured
    // - Logged in as 'citizen' → see alerts if configured
    // This handles:
    // - Initial mount (when already on website, logged in or logged out)
    // - Login (role changes from null to head_admin/associate_group_leader/citizen)
    // - Logout (role changes from any role to null/citizen)
    // - Route changes (as long as user is on the website)
    fetchAlerts();
    
    // If auth changed (login/logout), fetch multiple times to catch timing issues
    if (authChanged) {
      // Fetch after short delay
      const quickFetch = setTimeout(() => {
        const freshToken = localStorage.getItem('authToken');
        const freshRole = user?.role || (freshToken ? localStorage.getItem('userRole') : null);
        // Skip only superadmin, all others (including null/citizen) should see alerts
        if (!(freshRole === 'superadmin' && freshToken)) {
          fetchAlerts();
        }
      }, 200);
      
      // Fetch after medium delay
      const mediumFetch = setTimeout(() => {
        const freshToken = localStorage.getItem('authToken');
        const freshRole = user?.role || (freshToken ? localStorage.getItem('userRole') : null);
        // Skip only superadmin, all others (including null/citizen) should see alerts
        if (!(freshRole === 'superadmin' && freshToken)) {
          fetchAlerts();
        }
      }, 800);
      
      // Fetch after longer delay to catch any async updates
      const longFetch = setTimeout(() => {
        const freshToken = localStorage.getItem('authToken');
        const freshRole = user?.role || (freshToken ? localStorage.getItem('userRole') : null);
        // Skip only superadmin, all others (including null/citizen) should see alerts
        if (!(freshRole === 'superadmin' && freshToken)) {
          fetchAlerts();
        }
      }, 1500);
      
      return () => {
        clearTimeout(quickFetch);
        clearTimeout(mediumFetch);
        clearTimeout(longFetch);
      };
    }
    
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('authToken');
      const currentStoredRole = localStorage.getItem('userRole');
      const currentRole = user?.role || (currentToken ? currentStoredRole : null);
      if (!(currentRole === 'superadmin' && currentToken)) {
        fetchAlerts();
      }
    }, 5 * 60 * 1000);
    
    // Listen for cross-tab changes (storage event only fires in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'userRole' || e.key === 'authToken') {
        setTimeout(() => {
          const newToken = localStorage.getItem('authToken');
          const newRole = newToken ? localStorage.getItem('userRole') : null;
          // Skip only superadmin, all others (including null/citizen when logged out) should see alerts
          if (!newToken || (newRole !== 'superadmin' && location.pathname !== '/superadmin/login')) {
            fetchAlerts();
      } else {
            setAlerts([]);
          }
        }, 100);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Poll localStorage every 500ms to catch logout events immediately
    // This is especially important when someone is already logged in and then logs out
    // The storage event only fires in other tabs, not the current tab
    const pollInterval = setInterval(() => {
      const currentToken = localStorage.getItem('authToken');
      const currentStoredRole = localStorage.getItem('userRole');
      const currentRole = user?.role || (currentToken ? currentStoredRole : null);
      
      // Check if auth state changed since last check
      const lastToken = prevTokenRef.current;
      const lastRole = prevRoleRef.current;
      
      // If token or role changed, update refs and fetch alerts
      if (lastToken !== currentToken || lastRole !== currentRole) {
        prevTokenRef.current = currentToken;
        prevRoleRef.current = currentRole;
        
        // NEVER show alerts to superadmin (only when logged in)
        if (currentRole === 'superadmin' && currentToken) {
          setAlerts([]);
          return;
        }
        
        // Fetch alerts immediately when auth state changes
        // This handles login/logout transitions:
        // - Logout: role changes from head_admin/associate_group_leader → null (citizen)
        // - Login: role changes from null (citizen) → head_admin/associate_group_leader
        fetchAlerts();
      }
    }, 500); // Check every 500ms
    
    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, fetchAlerts, location.pathname]);

  // Handle dismissing an alert
  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => {
      const updated = [...prev, alertId];
      localStorage.setItem('dismissedSystemAlerts', JSON.stringify(updated));
      return updated;
    });
  };

  // Get icon based on alert type
  const getTypeIcon = (type) => {
    switch(type) {
      case 'critical': return faBan;
      case 'warning': return faExclamationTriangle;
      case 'info': return faInfoCircle;
      default: return faInfoCircle;
    }
  };

  // Get color based on alert type
  const getTypeColor = (type) => {
    switch(type) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  // Filter visible alerts (not dismissed, active)
  const visibleAlerts = alerts.filter(alert => {
    if (!alert) return false;
    if (dismissedAlerts.includes(alert.id)) return false;
    if (alert.is_active === false) return false;
    return true;
  });

  // Add/remove body class for CSS adjustments
  useEffect(() => {
    if (visibleAlerts.length > 0) {
      document.body.classList.add('has-system-alert-banner');
    } else {
      document.body.classList.remove('has-system-alert-banner');
    }
    return () => {
      document.body.classList.remove('has-system-alert-banner');
    };
  }, [visibleAlerts.length]);

  // Don't render for superadmin or on superadmin login page
  const token = localStorage.getItem('authToken');
  const userRole = user?.role || (token ? localStorage.getItem('userRole') : null);
  if ((userRole === 'superadmin' && token) || location.pathname === '/superadmin/login') {
    return null;
  }

  // Don't render if no visible alerts
  if (visibleAlerts.length === 0) {
    return null;
  }

  // Render banner using portal to document.body to avoid any parent container clipping
  // This ensures the banner is always at the top level and not affected by parent CSS
  const bannerContent = (
    <div className="system-alert-banner-container">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className="system-alert-banner"
          style={{ borderLeftColor: getTypeColor(alert.type) }}
        >
          <div className="system-alert-banner-content">
            <FontAwesomeIcon
              icon={getTypeIcon(alert.type)}
              className="system-alert-banner-icon"
              style={{ color: getTypeColor(alert.type) }}
            />
            <div className="system-alert-banner-text">
              <strong>{alert.title}</strong>
              <span>{alert.message}</span>
            </div>
          </div>
          {alert.dismissible && (
            <button
              className="system-alert-banner-dismiss"
              onClick={() => handleDismiss(alert.id)}
              aria-label="Dismiss alert"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  // Use portal to render directly to document.body to avoid any parent container issues
  return createPortal(bannerContent, document.body);
}

export default SystemAlertBanner;


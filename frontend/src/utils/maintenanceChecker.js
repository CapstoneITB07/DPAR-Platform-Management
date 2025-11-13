/**
 * Maintenance Mode Checker
 * Periodically checks if maintenance mode is active for logged-in users
 * and redirects them appropriately
 */

import { API_BASE, isSuperAdminSubdomain } from './url';

let maintenanceCheckInterval = null;
let isChecking = false;

/**
 * Start periodic maintenance mode checking for logged-in users
 * @param {Function} onMaintenanceDetected - Callback when maintenance is detected
 */
export const startMaintenanceCheck = (onMaintenanceDetected) => {
  // Clear any existing interval
  stopMaintenanceCheck();
  
  // Don't check maintenance mode on superadmin subdomain - superadmin always has access
  if (isSuperAdminSubdomain()) {
    return;
  }
  
  // Check every 30 seconds
  maintenanceCheckInterval = setInterval(async () => {
    if (isChecking) return;
    
    isChecking = true;
    try {
      const userRole = localStorage.getItem('userRole');
      
      // Don't check for superadmin - they have access during maintenance
      if (userRole === 'superadmin') {
        isChecking = false;
        return;
      }
      
      // Don't check if we're on superadmin subdomain
      if (isSuperAdminSubdomain()) {
        isChecking = false;
        return;
      }
      
      // Don't check if we're on citizen routes - citizen pages should work offline
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/citizen') || currentPath.startsWith('/maintenance')) {
        isChecking = false;
        return;
      }
      
      // Check if maintenance mode is active by trying a non-excluded endpoint
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'OPTIONS',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status === 503) {
        // Maintenance mode detected
        if (onMaintenanceDetected) {
          onMaintenanceDetected();
        } else {
          // Default behavior: redirect to maintenance page
          if (!currentPath.includes('/maintenance')) {
            const redirectPath = currentPath + (window.location.search || '');
            window.location.href = `/maintenance?redirect=${encodeURIComponent(redirectPath)}`;
          }
        }
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.debug('Maintenance check failed:', error);
    } finally {
      isChecking = false;
    }
  }, 30000); // Check every 30 seconds
};

/**
 * Stop periodic maintenance mode checking
 */
export const stopMaintenanceCheck = () => {
  if (maintenanceCheckInterval) {
    clearInterval(maintenanceCheckInterval);
    maintenanceCheckInterval = null;
  }
};

/**
 * Check maintenance mode once (immediate check)
 * @returns {Promise<boolean>} True if maintenance mode is active
 */
export const checkMaintenanceMode = async () => {
  try {
    // Don't check maintenance mode on superadmin subdomain - superadmin always has access
    if (isSuperAdminSubdomain()) {
      return false;
    }
    
    // Don't check if we're on citizen routes - citizen pages should work offline
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/citizen') || currentPath.startsWith('/maintenance')) {
      return false;
    }
    
    const userRole = localStorage.getItem('userRole');
    
    // Superadmin always has access
    if (userRole === 'superadmin') {
      return false;
    }
    
    const response = await fetch(`${API_BASE}/api/login`, {
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' }
    });
    
    return response.status === 503;
  } catch (error) {
    // If we can't check, assume no maintenance (don't block user)
    return false;
  }
};


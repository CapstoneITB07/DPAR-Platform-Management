import axios from 'axios';
import { API_BASE } from './url';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
});

// Flag to prevent multiple simultaneous logouts
let isLoggingOut = false;

// Request interceptor to add auth token and maintenance secret
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // No secret handling needed - superadmin routes are excluded from maintenance mode
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      
      // Handle 503 Service Unavailable (Maintenance Mode)
      if (status === 503) {
        // Don't redirect superadmin pages - they should have access during maintenance
        const currentPath = window.location.pathname;
        const userRole = localStorage.getItem('userRole');
        
        if (currentPath.startsWith('/superadmin') || userRole === 'superadmin') {
          // Superadmin routes are excluded from maintenance - don't redirect
          // Let the component handle the error
          return Promise.reject(error);
        }
        
        // For logged-in users (head admin, associate, citizen), redirect to maintenance page
        // Save their current location so they can return after maintenance
        if (!currentPath.includes('/maintenance')) {
          // Store the current path before redirecting
          const redirectPath = currentPath + (window.location.search || '');
          window.location.href = `/maintenance?redirect=${encodeURIComponent(redirectPath)}`;
        }
      }
      
      // Handle 401 Unauthorized (token expired/revoked or invalid account)
      if (status === 401 && !isLoggingOut) {
        console.log('Received 401, token may be expired or revoked, logging out...');
        isLoggingOut = true;
        
        // Get current role before clearing
        const userRole = localStorage.getItem('userRole');
        
        // Clear all auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userOrganization');
        
        // Redirect to appropriate login page based on current path or role
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/superadmin') || userRole === 'superadmin') {
          window.location.href = '/superadmin/login';
        } else {
          window.location.href = '/';
        }
        
        return Promise.reject(new Error('Session expired or revoked. Please login again.'));
      }
      
      // Handle 403 Forbidden (invalid account)
      if (status === 403 && !isLoggingOut) {
        const errorData = error.response.data;
        if (errorData && (errorData.error === 'Invalid account' || 
            errorData.message?.includes('Invalid account'))) {
          console.log('Invalid account, logging out...');
          isLoggingOut = true;
          
          // Get current role before clearing
          const userRole = localStorage.getItem('userRole');
          
          // Clear all auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
          localStorage.removeItem('userOrganization');
          
          // Redirect to appropriate login page based on current path or role
          const currentPath = window.location.pathname;
          if (currentPath.startsWith('/superadmin') || userRole === 'superadmin') {
            window.location.href = '/superadmin/login';
          } else {
            window.location.href = '/';
          }
          
          return Promise.reject(new Error('Invalid account. Contact the administrator.'));
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;


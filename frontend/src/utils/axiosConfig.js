import axios from 'axios';
import { API_BASE } from './url';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
});

// Flag to prevent multiple simultaneous logouts
let isLoggingOut = false;

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
      
      // Handle 401 Unauthorized (token expired/revoked or invalid account)
      if (status === 401 && !isLoggingOut) {
        console.log('Received 401, token may be expired or revoked, logging out...');
        isLoggingOut = true;
        
        // Clear all auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userOrganization');
        
        // Redirect to login page
        window.location.href = '/';
        
        return Promise.reject(new Error('Session expired or revoked. Please login again.'));
      }
      
      // Handle 403 Forbidden (invalid account)
      if (status === 403 && !isLoggingOut) {
        const errorData = error.response.data;
        if (errorData && (errorData.error === 'Invalid account' || 
            errorData.message?.includes('Invalid account'))) {
          console.log('Invalid account, logging out...');
          isLoggingOut = true;
          
          // Clear all auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
          localStorage.removeItem('userOrganization');
          
          // Redirect to login page
          window.location.href = '/';
          
          return Promise.reject(new Error('Invalid account. Contact the administrator.'));
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;


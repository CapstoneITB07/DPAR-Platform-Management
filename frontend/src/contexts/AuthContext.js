import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../utils/url';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    // Laravel Sanctum tokens are not JWT tokens, so we can't decode them
    // Instead, we'll rely on the backend to validate the token
    // For now, we'll assume the token is valid if it exists
    return false;
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedRole = localStorage.getItem('userRole');
      const storedUserId = localStorage.getItem('userId');
      const storedOrganization = localStorage.getItem('userOrganization');

      if (storedToken && storedRole && storedUserId) {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.log('Token expired, logging out...');
          // Clear expired token data
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
          localStorage.removeItem('userOrganization');
          setUser(null);
          setToken(null);
        } else {
          setUser({
            id: storedUserId,
            role: storedRole,
            organization: storedOrganization
          });
          setToken(storedToken);
        }
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes (cross-tab logout)
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' && e.newValue === null) {
        // Token was removed in another tab, logout here too
        setUser(null);
        setToken(null);
      } else if (e.key === 'authToken' && e.newValue && e.oldValue === null) {
        // New token was set in another tab, update local state without reload
        setToken(e.newValue);
        // Update user data from localStorage
        const storedRole = localStorage.getItem('userRole');
        const storedUserId = localStorage.getItem('userId');
        const storedOrganization = localStorage.getItem('userOrganization');
        if (storedRole && storedUserId) {
          setUser({
            id: storedUserId,
            role: storedRole,
            organization: storedOrganization
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Set up periodic token validation (check every 5 minutes)
    const tokenValidationInterval = setInterval(() => {
      const currentToken = localStorage.getItem('authToken');
      if (currentToken && isTokenExpired(currentToken)) {
        console.log('Token expired during session, logging out...');
        logout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(tokenValidationInterval);
    };
  }, []);

  const login = async (userData, authToken) => {
    // Clear any existing authentication data first (including backend tokens)
    await logout();
    
    // Store new authentication data in localStorage for persistence
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userId', userData.id);
    if (userData.organization) {
      localStorage.setItem('userOrganization', userData.organization);
    }

    setUser(userData);
    setToken(authToken);
  };

  const logout = async () => {
    // Call backend logout API to invalidate tokens
    const currentToken = localStorage.getItem('authToken');
    if (currentToken) {
      try {
        await fetch(`${API_BASE}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error calling logout API:', error);
        // Continue with local logout even if API call fails
      }
    }
    
    // Clear all stored authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userOrganization');
    
    // Clear state
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = () => {
    return user !== null && token !== null;
  };

  const hasRole = (requiredRole) => {
    return user && user.role === requiredRole;
  };

  // Enhanced API call function with automatic token validation
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const currentToken = localStorage.getItem('authToken');
    
    // Check if token is expired before making request
    if (currentToken && isTokenExpired(currentToken)) {
      console.log('Token expired before API call, logging out...');
      await logout();
      throw new Error('Session expired. Please login again.');
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        console.log('Received 401, token may be expired or revoked, logging out...');
        await logout();
        throw new Error('Session expired or revoked. Please login again.');
      }
      
      // Handle 429 Too Many Requests (rate limiting)
      if (response.status === 429) {
        const errorText = await response.text();
        throw new Error(errorText || 'Too many requests. Please try again later.');
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    makeAuthenticatedRequest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedRole = localStorage.getItem('userRole');
      const storedUserId = localStorage.getItem('userId');
      const storedOrganization = localStorage.getItem('userOrganization');

      if (storedToken && storedRole && storedUserId) {
        setUser({
          id: storedUserId,
          role: storedRole,
          organization: storedOrganization
        });
        setToken(storedToken);
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
        // New token was set in another tab, reload to get the new auth state
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
        await fetch('http://localhost:8000/api/logout', {
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

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

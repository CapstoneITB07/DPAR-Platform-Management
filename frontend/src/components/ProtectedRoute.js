import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requireGuest = false }) => {
  const { isAuthenticated, hasRole, isLoading, user } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Handle guest-only routes (like login page)
  if (requireGuest) {
    if (isAuthenticated() && user) {
      // Redirect authenticated users to their appropriate dashboard
      if (user.role === 'head_admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (user.role === 'associate_group_leader') {
        return <Navigate to="/associate/announcements" replace />;
      } else if (user.role === 'citizen') {
        return <Navigate to="/citizen" replace />;
      }
    }
    return children;
  }

  // Handle protected routes (require authentication)
  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect to appropriate dashboard based on user's actual role
    if (user && user.role === 'head_admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user && user.role === 'associate_group_leader') {
      return <Navigate to="/associate/announcements" replace />;
    } else if (user && user.role === 'citizen') {
      return <Navigate to="/citizen" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

import React, { useState, useEffect } from 'react';
import './SuperAdminLoginPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { API_BASE } from '../../../utils/url';

function SuperAdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const navigate = useNavigate();
  const { login, logout, isAuthenticated, user, isLoading } = useAuth();

  // Superadmin login is always accessible (route is excluded from maintenance mode)
  // No need to check maintenance mode here

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated() && user) {
      if (user.role === 'superadmin') {
        navigate('/superadmin/dashboard');
      } else if (user.role) {
        // If logged in as different role, logout first
        logout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, isLoading]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSigningIn(true);

    try {
      // Superadmin login route is excluded from maintenance mode
      const loginUrl = `${API_BASE}/api/superadmin/login`;

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Important: include cookies for maintenance bypass
      });

      if (response.status === 429) {
        setMessage('Too many login attempts. Please try again later.');
        setSigningIn(false);
        return;
      }

      // Handle 503 Maintenance Mode (shouldn't happen since route is excluded, but handle just in case)
      if (response.status === 503) {
        setMessage('System is in maintenance mode. Please contact your system administrator for access.');
        setSigningIn(false);
        return;
      }

      // Check if response has JSON content
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, read as text for debugging
        const text = await response.text();
        console.error('Non-JSON response:', text);
        setMessage(`Server error (${response.status}). Please check if backend is running.`);
        setSigningIn(false);
        return;
      }

      if (response.ok) {
        // Superadmin login successful
        if (data.user && data.user.role === 'superadmin') {
          await login(data.user, data.token);
          navigate('/superadmin/dashboard');
        } else {
          setMessage('Access denied. This login is for Super Admin only.');
        }
      } else {
        setMessage(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setMessage('Network error. Could not connect to backend.');
      console.error('Network error:', error);
    } finally {
      setSigningIn(false);
    }
  };

  const bgStyle = {
    minHeight: '100vh',
    width: '100vw',
    position: 'relative',
    background: "url('/Assets/compiled_activities.jpg') no-repeat center center fixed",
    backgroundSize: 'cover',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // If authenticated as superadmin, redirect will happen via useEffect
  // Don't block rendering - let useEffect handle redirect

  // Always render the login form if not loading and not authenticated as superadmin
  return (
    <div className="superadminLoginPageWrapper" style={bgStyle}>
      <div className="container">
        <div className="welcomeSection superadminWelcomeSection">
          <div className="welcomeContent">
            <img src="/Assets/disaster_logo.png" alt="Disaster Logo" className="loginLogo" />
            <p className="coalitionText">DISASTER PREPAREDNESS AND RESPONSE VOLUNTEER COALITION</p>
            <h1 className="welcomeTitle">System Control</h1>
            <p className="welcomeSubtitle">Super Admin Access Portal</p>
          </div>
        </div>
        <div className="loginSection">
          <div className="superadminHeader">
            <FontAwesomeIcon icon={faShieldAlt} className="superadminIcon" />
            <h2 className="signInTitle">Super Admin Login</h2>
            <p className="superadminSubtitle">System Administration Portal</p>
          </div>
          <form onSubmit={handleSubmit} autoComplete="off">
            {message && <p className="errorMessage">{message}</p>}
            <div className="inputGroup">
              <label htmlFor="username" className="label">Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                required
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>
            
            <div className="inputGroup">
              <label htmlFor="password" className="label">Password:</label>
              <div className="passwordInputContainer">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="passwordInput"
                  required
                  placeholder="Enter your password"
                  aria-label="Password"
                  autoComplete="current-password"
                  data-ms-editor="false"
                />
                <span
                  onClick={togglePasswordVisibility}
                  className="passwordToggleIcon"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  role="button"
                >
                  {showPassword ? (
                    <FontAwesomeIcon icon={faEye} />
                  ) : (
                    <FontAwesomeIcon icon={faEyeSlash} />
                  )}
                </span>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="signInButton superadminButton"
              disabled={signingIn}
              style={{
                opacity: signingIn ? 0.7 : 1,
                cursor: signingIn ? 'not-allowed' : 'pointer',
                pointerEvents: signingIn ? 'none' : 'auto'
              }}
            >
              {signingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminLoginPage;


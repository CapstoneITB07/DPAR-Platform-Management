import React, { useState, useEffect } from 'react';
import './LoginPage.css'; // Import the CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faKey, faLock, faTimes, faInfoCircle, faUserPlus, faQuestionCircle, faArrowLeft, faFileText } from '@fortawesome/free-solid-svg-icons';
// You might need to import useHistory or useNavigate from react-router-dom for redirection
// import { useHistory } from 'react-router-dom'; // For react-router-dom v5
import { useNavigate } from 'react-router-dom'; // For react-router-dom v6
import { useAuth } from '../../contexts/AuthContext';
import RegistrationForm from '../Registration/RegistrationForm';
import { API_BASE, isSuperAdminSubdomain } from '../../utils/url';

// Password strength calculation functions
const getPasswordStrength = (password) => {
  if (password.length === 0) return { level: 'empty', text: '', percentage: 0 };
  
  let score = 0;
  let level = 'weak';
  let text = 'Weak';
  let percentage = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  // Determine strength level
  if (score <= 2) {
    level = 'weak';
    text = 'Weak';
    percentage = 25;
  } else if (score <= 4) {
    level = 'fair';
    text = 'Fair';
    percentage = 50;
  } else if (score <= 5) {
    level = 'good';
    text = 'Good';
    percentage = 75;
  } else {
    level = 'strong';
    text = 'Strong';
    percentage = 100;
  }
  
  return { level, text, percentage };
};

const getPasswordStrengthDetails = (password) => {
  return [
    {
      text: 'At least 8 characters',
      met: password.length >= 8
    },
    {
      text: 'Contains lowercase letter',
      met: /[a-z]/.test(password)
    },
    {
      text: 'Contains uppercase letter',
      met: /[A-Z]/.test(password)
    },
    {
      text: 'Contains number',
      met: /[0-9]/.test(password)
    },
    {
      text: 'Contains special character',
      met: /[^a-zA-Z0-9]/.test(password)
    }
  ];
};

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryPasscode, setRecoveryPasscode] = useState('');
  const [maskedRecoveryEmail, setMaskedRecoveryEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [showRA, setShowRA] = useState(false); // State for the pop-up
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [isRecoveryMode, setIsRecoveryMode] = useState(false); // State for recovery mode
  
  // New states for change password modal
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordMessage, setChangePasswordMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [recoveryLoginData, setRecoveryLoginData] = useState(null); // Store recovery login data
  const [isPasswordChangeSuccess, setIsPasswordChangeSuccess] = useState(false); // Track success state
  const [showRegistration, setShowRegistration] = useState(false); // Show registration form
  const [showOtpModal, setShowOtpModal] = useState(false); // Show OTP verification modal
  const [otpData, setOtpData] = useState(null); // Store OTP verification data
  const [otpCode, setOtpCode] = useState(''); // OTP input
  const [otpAttemptsRemaining, setOtpAttemptsRemaining] = useState(5); // OTP attempts remaining
  const [otpLockoutTime, setOtpLockoutTime] = useState(0); // OTP lockout time in seconds
  const [signingIn, setSigningIn] = useState(false); // Track signing in state
  const [verifyingOtp, setVerifyingOtp] = useState(false); // Track OTP verification state
  
  // const history = useHistory(); // For react-router-dom v5
  const navigate = useNavigate(); // For react-router-dom v6
  const { login, logout, isAuthenticated, user, isLoading } = useAuth();

  // Check for maintenance mode - redirect to maintenance page if active
  // Skip this check on superadmin subdomain, superadmin login path, or citizen routes
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      const currentPath = window.location.pathname;
      
      // Skip maintenance check if:
      // 1. On superadmin subdomain
      // 2. On superadmin login path (even on main domain)
      // 3. On citizen routes - citizen pages should work offline
      if (isSuperAdminSubdomain() || currentPath.startsWith('/superadmin/login') || currentPath.startsWith('/citizen')) {
        return;
      }
      
      try {
        // Try to access a regular API endpoint that's NOT excluded from maintenance
        // If maintenance is active, this will return 503
        const response = await fetch(`${API_BASE}/api/login`, {
          method: 'OPTIONS', // Use OPTIONS to avoid triggering actual login
          headers: { 'Content-Type': 'application/json' }
        });
        
        // If we get 503, maintenance mode is active
        if (response.status === 503) {
          window.location.href = '/maintenance?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          return;
        }
      } catch (error) {
        // Try alternative check - check if we can reach a non-excluded endpoint
        try {
          const checkResponse = await fetch(`${API_BASE}/api/register`, {
            method: 'OPTIONS',
            headers: { 'Content-Type': 'application/json' }
          });
          if (checkResponse.status === 503) {
            window.location.href = '/maintenance?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
            return;
          }
        } catch (e) {
          // If both fail, assume maintenance mode and redirect
          window.location.href = '/maintenance?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        }
      }
    };

    checkMaintenanceMode();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated() && user) {
      if (user.role === 'head_admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'associate_group_leader') {
        navigate('/associate/announcements');
      } else if (user.role === 'citizen') {
        navigate('/citizen');
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  // Countdown timer for OTP lockout
  useEffect(() => {
    let interval = null;
    if (otpLockoutTime > 0) {
      interval = setInterval(() => {
        setOtpLockoutTime(otpLockoutTime => {
          if (otpLockoutTime <= 1) {
            clearInterval(interval);
            return 0;
          }
          return otpLockoutTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpLockoutTime]);


  const toggleRA = () => {
    setShowRA(!showRA);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleRecoveryMode = () => {
    setIsRecoveryMode(!isRecoveryMode);
    setMessage(''); // Clear any existing messages
    setPassword(''); // Clear password when switching modes
    setRecoveryPasscode(''); // Clear recovery passcode when switching modes
  };

  // Function to handle change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordMessage('');
    setIsPasswordChangeSuccess(false);

    // Validate passwords
    if (newPassword.length < 8) {
      setChangePasswordMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordMessage('Passwords do not match.');
      return;
    }

    // Check password requirements - only special characters needed
    if (newPassword.length >= 8) {
      if (!/[0-9@#!$%^&*(),.?":{}|<>]/.test(newPassword)) {
        setChangePasswordMessage('Password must contain special characters (0-9, @, #, !, etc.).');
        return;
      }
    }

    setIsChangingPassword(true);

    try {
      // Get token from multiple sources as fallback
      let token = recoveryLoginData?.token;
      
      if (!token) {
        // Fallback to stored token
        token = localStorage.getItem('authToken');
      }
      
      if (!token) {
        setChangePasswordMessage('Authentication token not found. Please login again.');
        setIsChangingPassword(false);
        return;
      }

      console.log('Using token for password change:', token.substring(0, 20) + '...');

      const response = await fetch(`${API_BASE}/api/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          current_password: recoveryPasscode, // Use recovery passcode as current password
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      console.log('Change password response status:', response.status);
      console.log('Change password response headers:', response.headers);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        const textResponse = await response.text();
        console.error('Response text:', textResponse);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      // Change password response data logged for debugging (remove in production)

      if (response.ok) {
        setIsPasswordChangeSuccess(true);
        setChangePasswordMessage('Password changed successfully! Redirecting...');
        
        // Now call login to authenticate the user after password change
        await login(recoveryLoginData.user, recoveryLoginData.token);
        
        // Clear the modal and redirect after a short delay
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
          setChangePasswordMessage('');
          setIsPasswordChangeSuccess(false);
          
          // Redirect based on role
          const userRole = recoveryLoginData.user ? recoveryLoginData.user.role : null;
          if (userRole === 'head_admin') {
            navigate('/admin/dashboard');
          } else if (userRole === 'associate_group_leader') {
            navigate('/associate/dashboard');
          } else if (userRole === 'citizen') {
            navigate('/citizen/dashboard');
          } else {
            navigate('/');
          }
        }, 2000);
      } else {
        // Handle different types of errors
        let errorMessage = 'Failed to change password.';
        if (data.message) {
          if (data.message.includes('recovery passcode')) {
            errorMessage = 'Recovery passcode is invalid. Please check the code and try again.';
          } else if (data.message.includes('Current password')) {
            errorMessage = 'Recovery passcode is incorrect.';
          } else if (data.message.includes('not authenticated')) {
            errorMessage = 'Authentication failed. Please login again.';
          } else {
            errorMessage = data.message;
          }
        }
        setChangePasswordMessage(errorMessage);
      }
    } catch (error) {
      console.error('Change password error details:', error);
      if (error.message === 'Server returned non-JSON response') {
        setChangePasswordMessage('Server error occurred. Please try again or contact support.');
      } else {
        setChangePasswordMessage('Network error. Could not change password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Function to close change password modal
  const closeChangePasswordModal = async () => {
    setShowChangePasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordMessage('');
    setIsPasswordChangeSuccess(false);
    
    // Clear recovery login data since user is exiting without completing password change
    setRecoveryLoginData(null);
    
    // Call logout to properly clear authentication state and notify backend
    await logout();
    
    // Reset recovery mode to regular login
    setIsRecoveryMode(false);
    setRecoveryPasscode('');
    
    // Redirect to login page if user cancels
    navigate('/login');
  };

  // Function to handle OTP verification
  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setMessage('');

    // Check if user is in lockout period
    if (otpLockoutTime > 0) {
      setMessage(`Please wait ${otpLockoutTime} seconds before trying again.`);
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await fetch(`${API_BASE}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: otpData.user_id,
          otp_code: otpCode
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON (e.g., 429 from throttle middleware)
        if (response.status === 429) {
          setMessage('Too many failed attempts. Please wait 60 seconds before trying again.');
          setOtpAttemptsRemaining(0);
          setOtpLockoutTime(60);
          return;
        }
        throw parseError;
      }

      if (response.ok) {
        setMessage('OTP verified successfully! Welcome to the system!');
        
        // Reset attempt counter on success
        setOtpAttemptsRemaining(5);
        setOtpLockoutTime(0);
        
        // Use authentication context to handle login
        await login(data.user, data.token);

        // Close OTP modal
        setShowOtpModal(false);
        setOtpCode('');
        setOtpData(null);

        // Redirect based on role
        if (data.user.role === 'head_admin') {
          navigate('/admin/dashboard');
        } else if (data.user.role === 'associate_group_leader') {
          navigate('/associate/dashboard');
        } else if (data.user.role === 'citizen') {
          navigate('/citizen/dashboard');
        } else {
          navigate('/');
        }
      } else {
        // Handle different error responses
        if (response.status === 429) {
          // Too many attempts - lockout
          setOtpAttemptsRemaining(data.attempts_remaining || 0);
          setOtpLockoutTime(data.lockout_remaining || 60);
          setMessage(data.message || 'Too many failed attempts. Please wait before trying again.');
        } else if (response.status === 401) {
          // Invalid OTP
          setOtpAttemptsRemaining(data.attempts_remaining || 0);
          setMessage(data.message || 'Invalid OTP code. Please try again.');
        } else {
          // Other errors
          setMessage(data.message || 'An error occurred. Please try again.');
        }
      }
    } catch (error) {
      // Check if it's a rate limit error (429) that wasn't caught properly
      if (error.message && error.message.includes('429')) {
        setMessage('Too many failed attempts. Please wait 60 seconds before trying again.');
        setOtpAttemptsRemaining(0);
        setOtpLockoutTime(60);
      } else if (otpLockoutTime > 0) {
        // Show lockout message if user is already in lockout
        setMessage(`Please wait ${otpLockoutTime} seconds before trying again.`);
      } else {
        // Only show network error if it's not a lockout situation
        setMessage('Network error. Please check your connection and try again.');
      }
      console.error('OTP verification error:', error);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Function to close OTP modal
  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtpCode('');
    setOtpData(null);
    setMessage('');
    setOtpAttemptsRemaining(5);
    setOtpLockoutTime(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSigningIn(true);

    try {
      const endpoint = isRecoveryMode ? `${API_BASE}/api/recovery/verify-code` : `${API_BASE}/api/login`;
      const requestBody = isRecoveryMode 
        ? { username, code: recoveryPasscode }
        : { username, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Check for 429 status immediately, as it might not return valid JSON
      if (response.status === 429) {
        setMessage('Too many login attempts.');
        return; // Exit the function early
      }

      const data = await response.json();

      if (response.ok) {
        // Handle successful login
        setMessage(data.message || 'Login successful!');
        // Login successful - data logged for debugging (remove in production)

        // Check if OTP verification is required
        if (data.requires_otp) {
          if (data.application_status === 'pending') {
            setMessage('Your application is still under review. Please wait for admin approval. The OTP will be sent to your email once the admin approves your application.');
            return;
          } else {
            setOtpData({
              user_id: data.user_id,
              username: username
            });
            setShowOtpModal(true);
            setMessage('OTP verification required. Please check your email for the authentication code.');
            return;
          }
        }

        // TODO: Assuming your backend returns a token and user data with role
        const token = data.token; // Adjust based on actual backend response structure
        const userRole = data.user ? data.user.role : null; // Adjust based on actual backend response structure
        const userId = data.user ? data.user.id : null;

        // If this was a recovery verification, show change password modal BEFORE calling login
        if (isRecoveryMode) {
          setRecoveryLoginData({
            token,
            user: data.user,
            username,
            recoveryPasscode
          });
          setShowChangePasswordModal(true);
          return; // Don't call login yet, wait for password change
        }

        // Use authentication context to handle login (only for regular login)
        await login(data.user, token);

        // Redirect based on role or to a default dashboard
        // This requires react-router-dom setup
        if (userRole === 'head_admin') {
           navigate('/admin/dashboard'); // Example redirection for Head Admin (react-router-dom v6)
         } else if (userRole === 'associate_group_leader') {
           navigate('/associate/dashboard'); // Example redirection for Associate (react-router-dom v6)
         } else if (userRole === 'citizen') {
           navigate('/citizen/dashboard'); // Example redirection for Citizen (react-router-dom v6)
         } else {
        //   // Default redirection for other roles or if role is not available
           navigate('/'); // Redirect to home or a default page if role is unknown
         }

      } else {
        // Handle login errors
        let errorMessage = data.message || 'Login failed.';
        
        // Check if there are remaining attempts info
        if (data.remaining_attempts !== undefined) {
          errorMessage = `${data.message} (${data.remaining_attempts} attempts remaining)`;
        }
        
        setMessage(errorMessage);
        console.error('Login failed:', data);
      }
    } catch (error) {
      // Handle network errors and rate limiting
      if (error.message && error.message.includes('429')) {
        setMessage('Too many login attempts.');
      } else {
        setMessage('Network error. Could not connect to backend.');
      }
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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="loginPageWrapper" style={bgStyle}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontSize: '18px',
            color: 'white'
          }}>
            Checking authentication...
          </div>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated() && user) {
    return (
      <div className="loginPageWrapper" style={bgStyle}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontSize: '18px',
            color: 'white'
          }}>
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="loginPageWrapper" style={bgStyle}>
      <div className="container"> {/* Main container */}
        <div className="loginSection"> {/* Left (Login) section */}
          <h2 className="signInTitle">Sign In</h2>
          {isRecoveryMode && (
            <div className="recoveryModeIndicator align-items-center">
              {/* <FontAwesomeIcon icon={faLock} /> */}
              <span><strong>Recovery Mode: </strong>Click "Send code" to receive a verification code at your email, then enter it below. You'll be asked to change your password.</span>
            </div>
          )}
          <form onSubmit={handleSubmit} autoComplete="off">
            {message && <p className="errorMessage">{message}</p>} {/* Styled error message */}
            <div className="inputGroup">
              <label htmlFor="username" className="label">Username:</label>
              {!isRecoveryMode ? (
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
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input"
                    required
                    placeholder="Enter your username"
                    style={{ flex: '1 1 auto' }}
                    autoComplete="username"
                  />
                  <button
                    type="button"
                    className="signInButton"
                    disabled={isSendingCode || codeCooldown > 0 || !username}
                    style={{ 
                      backgroundColor: isSendingCode ? '#17a2b8' : (codeCooldown > 0 ? '#6c757d' : '#0d6efd'), 
                      cursor: (isSendingCode || codeCooldown > 0 || !username) ? 'not-allowed' : 'pointer',
                      opacity: (isSendingCode || codeCooldown > 0 || !username) ? 0.85 : 1,
                      whiteSpace: 'nowrap'
                    }}
                    onClick={async () => {
                      setMessage('');
                      if (!username) return;
                      setIsSendingCode(true);
                      try {
                        const resp = await fetch(`${API_BASE}/api/recovery/send-code`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ username })
                        });
                        const data = await resp.json().catch(() => ({}));
                        if (resp.ok) {
                          if (data.masked_email) setMaskedRecoveryEmail(data.masked_email);
                          setMessage('If the account exists, a verification code has been sent.' + (data.masked_email ? ` (${data.masked_email})` : ''));
                          // Start cooldown countdown
                          const initial = typeof data.cooldown_remaining === 'number' ? data.cooldown_remaining : 60;
                          setCodeCooldown(initial);
                          const start = Date.now();
                          const timer = setInterval(() => {
                            setCodeCooldown(prev => {
                              const next = Math.max(0, initial - Math.floor((Date.now() - start) / 1000));
                              if (next === 0) clearInterval(timer);
                              return next;
                            });
                          }, 500);
                        } else {
                          if (resp.status === 429 && typeof data.cooldown_remaining === 'number') {
                            setCodeCooldown(data.cooldown_remaining);
                            setMessage('Please wait before requesting another code.');
                          } else {
                            setMessage(data.message || 'Failed to send verification code.');
                          }
                        }
                      } catch (err) {
                        setMessage('Failed to send verification code.');
                      } finally {
                        setIsSendingCode(false);
                      }
                    }}
                  >
                    {isSendingCode ? 'Sending…' : (codeCooldown > 0 ? `Sent (${codeCooldown}s)` : 'Send code')}
                  </button>
                </div>
              )}
              {isRecoveryMode && maskedRecoveryEmail && (
                <div style={{ marginTop: '6px', color: '#ddd', fontSize: '12px' }}>
                  Code will be sent to: {maskedRecoveryEmail}
                </div>
              )}
            </div>
            
            {!isRecoveryMode ? (
            <div className="inputGroup"> {/* Password input group */}
              <label htmlFor="password" className="label">Password:</label>
              <div className="passwordInputContainer"> {/* Container for password input and icon */}
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="passwordInput"
                  required
                  placeholder="Enter your password"
                  aria-label="Password"
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
              <div className="recoveryToggle">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleRecoveryMode();
                  }}
                  className="recoveryToggleLink"
                >
                  <FontAwesomeIcon icon={faQuestionCircle} className="recoveryToggleIcon" />
                  Forgot Password?
                </a>
              </div>
            </div>
            ) : (
              <div className="inputGroup"> {/* Recovery code input group */}
                <label htmlFor="recoveryPasscode" className="label">Verification Code:</label>
                <div className="passwordInputContainer"> {/* Container for recovery passcode input and icon */}
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="recoveryPasscode"
                    value={recoveryPasscode}
                    onChange={(e) => setRecoveryPasscode(e.target.value)}
                    className="passwordInput"
                    required
                    placeholder="Enter the code sent to your email"
                    aria-label="Verification Code"
                    maxLength="10"
                  />
                  <span
                    onClick={togglePasswordVisibility}
                    className="passwordToggleIcon"
                    aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
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
                <div className="recoveryToggle">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleRecoveryMode();
                    }}
                    className="recoveryToggleLink"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="recoveryToggleIcon" />
                    Use Regular Password
                  </a>
                </div>
              </div>
            )}
            
            
            <button 
              type="submit" 
              className="signInButton"
              disabled={signingIn}
              style={{
                opacity: signingIn ? 0.7 : 1,
                cursor: signingIn ? 'not-allowed' : 'pointer',
                pointerEvents: signingIn ? 'none' : 'auto'
              }}
            >
              {signingIn ? 'Signing in...' : (isRecoveryMode ? 'Verify & Continue' : 'Sign In')}
            </button>
            
            <div className="registrationToggle">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowRegistration(true);
                }}
                className="registrationToggleLink"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                Don't have an account? Register your organization
              </a>
            </div>
          </form>
        </div>
        <div className="welcomeSection"> {/* Right (Welcome) section */}
          <div className="welcomeContent">
            <img src="/Assets/disaster_logo.png" alt="Disaster Logo" className="loginLogo" />
            <p className="coalitionText">DISASTER PREPAREDNESS AND RESPONSE VOLUNTEER COALITION</p>
            <h1 className="welcomeTitle">Welcome ,</h1>
            <p className="welcomeSubtitle">sign in to continue access pages.</p>
          </div>
        </div>
      </div>
      {/* Republic Act Pop-up Button - now outside the card */}
      <button
        onClick={toggleRA}
        className="raButton"
      >
        <div className="raButtonIconBox">
          <FontAwesomeIcon icon={faFileText} className="raButtonIcon" />
        </div>
      </button>
      {/* Republic Act Pop-up */}
      {showRA && (
        <div className="raPopup">
          <button onClick={toggleRA} className="raCloseButton">&times;</button>
          <h3>Republic Act (RA) 10121</h3>
          <p>
            Republic Act (RA) 10121 is also known as the Philippine Disaster Risk Reduction
            and Management Act of 2010. It's a law that aims to improve
            the country's disaster risk reduction and management system.
          </p>
          <h4>What does RA 10121 do?</h4>
          <ul>
            <li>Focuses on disaster risk reduction, preparedness, and mitigation</li>
            <li>Strengthens the National Disaster Risk Reduction and Management Council (NDRRMC)</li>
            <li>Institutionalizes disaster risk management at all levels of government</li>
            <li>Mainstreams disaster risk reduction and climate change into development processes</li>
            <li>Modifies the use and appropriation of the Local Calamity Fund</li>
            <li>Appropriates funds for disaster risk reduction and management</li>
          </ul>
          <h4>How does RA 10121 help?</h4>
          <ul>
            <li>Helps the country respond to its vulnerability to natural disasters and climate change</li>
            <li>Helps communities become more resilient and sustainable</li>
            <li>Helps communities address vulnerabilities and minimize the impact of disasters</li>
            <li>Helps communities adapt to climate change</li>
            <li>Helps communities prevent and mitigate disasters</li>
            <li>Helps communities rehabilitate and recover from disasters</li>
          </ul>
        </div>
      )}
      {showChangePasswordModal && (
        <div className="changePasswordModal">
          <div className="modalContent">
            <div className="passwordChangeHeader">
              <div className="securityIcon">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <h2>Change Your Password</h2>
            </div>
            
            <div className="passwordChangeWarning">
              <FontAwesomeIcon icon={faInfoCircle} className="warningIcon" />
              <p><strong>Required:</strong> You must change your password to continue. This recovery passcode can only be used once.</p>
            </div>
            

            <form onSubmit={handleChangePassword}>
               <div className="inputGroup">
                 <label htmlFor="newPassword">New Password:</label>
                 
                 {/* Password Requirements - Always visible at the top */}
                 <div className="passwordRequirements">
                   <h3>Password Requirements:</h3>
                   <div className="requirementsList">
                     {getPasswordStrengthDetails(newPassword).map((detail, index) => (
                       <div key={index} className={`requirementItem ${detail.met ? 'requirementMet' : 'requirementNotMet'}`}>
                         <span className="requirementIcon">{detail.met ? '✓' : '○'}</span>
                         <span className="requirementText">{detail.text}</span>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 <div className="passwordInputContainer">
                   <input
                     type={showNewPassword ? 'text' : 'password'}
                     id="newPassword"
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     className={`passwordInput newPasswordField ${
                       newPassword.length > 0 
                         ? (newPassword.length >= 8 && /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword))
                           ? 'valid' 
                           : 'invalid'
                         : ''
                     }`}
                     required
                     placeholder="Enter new password"
                     aria-label="New Password"
                   />
                   <span
                     onClick={() => setShowNewPassword(!showNewPassword)}
                     className="passwordToggleIcon"
                     aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                     tabIndex={0}
                     role="button"
                   >
                     {showNewPassword ? (
                       <FontAwesomeIcon icon={faEye} />
                     ) : (
                       <FontAwesomeIcon icon={faEyeSlash} />
                     )}
                   </span>
                 </div>
                 
                 {/* Password Strength Indicator - Only show when user starts typing */}
                 {newPassword.length > 0 && (
                   <div className="passwordStrengthIndicator">
                     <div className="strengthHeader">
                       <span className="strengthLabel">Password Strength:</span>
                       <span className={`strengthText ${getPasswordStrength(newPassword).level}`}>
                         {getPasswordStrength(newPassword).text}
                       </span>
                     </div>
                     <div className="strengthProgressBar">
                       <div 
                         className={`strengthFill ${getPasswordStrength(newPassword).level}`}
                         style={{ width: `${getPasswordStrength(newPassword).percentage}%` }}
                       ></div>
                     </div>
                   </div>
                 )}
               </div>
              <div className="inputGroup">
                <label htmlFor="confirmPassword">Confirm New Password:</label>
                 <div className="passwordInputContainer">
                   <input
                     type={showConfirmPassword ? 'text' : 'password'}
                     id="confirmPassword"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     className={`passwordInput confirmPasswordField ${
                       confirmPassword.length > 0 
                         ? (newPassword === confirmPassword && newPassword !== '')
                           ? 'matching' 
                           : 'notMatching'
                         : ''
                     }`}
                     required
                     placeholder="Confirm new password"
                     aria-label="Confirm New Password"
                   />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="passwordToggleIcon"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    tabIndex={0}
                    role="button"
                  >
                    {showConfirmPassword ? (
                      <FontAwesomeIcon icon={faEye} />
                    ) : (
                      <FontAwesomeIcon icon={faEyeSlash} />
                    )}
                  </span>
                </div>
                {(newPassword.length > 0 || confirmPassword.length > 0) && (
                  <div className="passwordMatchIndicator">
                    <span className={`passwordMatchText ${newPassword === confirmPassword && newPassword !== '' ? 'passwordMatch' : 'passwordNoMatch'}`}>
                      {newPassword === confirmPassword && newPassword !== '' ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>
              <div className="inputGroup">
                <label htmlFor="recoveryPasscode">Recovery Passcode (Auto-filled):</label>
                <div className="passwordInputContainer">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="recoveryPasscode"
                    value={recoveryPasscode}
                    onChange={(e) => setRecoveryPasscode(e.target.value)}
                    className="passwordInput recoveryPasscodeField"
                    required
                    placeholder="Enter your recovery passcode"
                    aria-label="Recovery Passcode"
                    maxLength="10"
                    readOnly
                  />
                  <span
                    onClick={togglePasswordVisibility}
                    className="passwordToggleIcon"
                    aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
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
                <div className="recoveryPasscodeInfo">
                  <FontAwesomeIcon icon={faInfoCircle} className="infoIcon" />
                  <span>This recovery passcode will be automatically consumed and cannot be reused after password change.</span>
                </div>
              </div>
              

              <button 
                type="submit" 
                className="signInButton" 
                disabled={isChangingPassword || newPassword.length < 8 || newPassword !== confirmPassword || (newPassword.length >= 8 && !/[0-9@#!$%^&*(),.?":{}|<>]/.test(newPassword))}
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password & Continue'}
              </button>
              {changePasswordMessage && (
                <p className={`changePasswordMessage ${isPasswordChangeSuccess ? 'success' : 'error'}`}>
                  {changePasswordMessage}
                </p>
              )}
            </form>
            <button onClick={closeChangePasswordModal} className="closeModalButton">X</button>
          </div>
        </div>
      )}

      {/* Registration Form Modal */}
      {showRegistration && (
        <div className="registration-modal-overlay">
          <div className="registration-modal-content">
            <button 
              onClick={() => setShowRegistration(false)} 
              className="closeModalButton"
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
            >
              ×
            </button>
            <RegistrationForm 
              onSuccess={() => setShowRegistration(false)}
              onCancel={() => setShowRegistration(false)}
            />
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="changePasswordModal">
          <div className="modalContent">
            <div className="passwordChangeHeader">
              <div className="securityIcon">
                <FontAwesomeIcon icon={faKey} />
              </div>
              <h2>OTP Verification Required</h2>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                An authentication code has been sent to your email address.
                <br />
                <strong>Note:</strong> The OTP will be sent once the admin approves your application.
                <br />
                If the admin has not approved your application yet, you cannot log in.
              </p>
              
              {/* Attempt Counter Display - Only show when NOT in lockout */}
              {otpLockoutTime === 0 && (
                <div style={{ 
                  marginBottom: '16px', 
                  padding: '10px', 
                  backgroundColor: otpAttemptsRemaining <= 2 ? '#fff3cd' : '#d1ecf1', 
                  border: `1px solid ${otpAttemptsRemaining <= 2 ? '#ffeaa7' : '#bee5eb'}`, 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  <p style={{ color: otpAttemptsRemaining <= 2 ? '#856404' : '#0c5460', margin: 0 }}>
                    🔐 Attempts remaining: <strong>{otpAttemptsRemaining}</strong> out of 5
                  </p>
                </div>
              )}
            </div>

            {/* Lockout Warning */}
            {otpLockoutTime > 0 && (
              <div style={{
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                color: '#721c24',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '20px',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                ⚠️ Account temporarily locked due to too many failed attempts
                <br />
                Please wait <strong>{otpLockoutTime} seconds</strong> before trying again
              </div>
            )}

            <form onSubmit={handleOtpVerification}>
              <div className="inputGroup">
                <label htmlFor="otpCode">Enter OTP Code:</label>
                <input
                  type="text"
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="passwordInput"
                  required
                  placeholder="Enter 6-digit OTP code"
                  maxLength="6"
                  style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
                  disabled={otpLockoutTime > 0}
                />
              </div>
              
              <button 
                type="submit" 
                className="signInButton" 
                disabled={otpCode.length !== 6 || otpLockoutTime > 0 || verifyingOtp}
                style={{
                  opacity: verifyingOtp ? 0.7 : 1,
                  cursor: (otpCode.length !== 6 || otpLockoutTime > 0 || verifyingOtp) ? 'not-allowed' : 'pointer',
                  pointerEvents: verifyingOtp ? 'none' : 'auto'
                }}
              >
                {verifyingOtp ? 'Verifying OTP...' : (otpLockoutTime > 0 ? `Wait ${otpLockoutTime}s` : 'Verify OTP & Continue')}
              </button>
              {message && !message.includes('wait') && !message.includes('locked') && (
                <p className={`changePasswordMessage ${message.includes('successfully') ? 'success' : 'error'}`}>
                  {message}
                </p>
              )}
            </form>
            <button onClick={closeOtpModal} className="closeModalButton">X</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage; 
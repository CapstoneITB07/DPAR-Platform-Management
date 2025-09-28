import React, { useState, useEffect } from 'react';
import './LoginPage.css'; // Import the CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faKey, faLock, faTimes, faInfoCircle, faUserPlus, faQuestionCircle, faArrowLeft, faFileText } from '@fortawesome/free-solid-svg-icons';
// You might need to import useHistory or useNavigate from react-router-dom for redirection
// import { useHistory } from 'react-router-dom'; // For react-router-dom v5
import { useNavigate } from 'react-router-dom'; // For react-router-dom v6
import { useAuth } from '../../contexts/AuthContext';
import RegistrationForm from '../Registration/RegistrationForm';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryPasscode, setRecoveryPasscode] = useState('');
  const [message, setMessage] = useState('');
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
  
  // const history = useHistory(); // For react-router-dom v5
  const navigate = useNavigate(); // For react-router-dom v6
  const { login, isAuthenticated, user, isLoading } = useAuth();

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

      const response = await fetch('http://localhost:8000/api/change-password', {
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
      console.log('Change password response data:', data);

      if (response.ok) {
        setIsPasswordChangeSuccess(true);
        setChangePasswordMessage('Password changed successfully! Redirecting...');
        
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
  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordMessage('');
    setIsPasswordChangeSuccess(false);
    // Redirect to login page if user cancels
    navigate('/login');
  };

  // Function to handle OTP verification
  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: otpData.user_id,
          otp_code: otpCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('OTP verified successfully! Welcome to the system!');
        
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
        setMessage(data.message || 'Invalid OTP code. Please try again.');
      }
    } catch (error) {
      setMessage('Network error. Please check your connection and try again.');
      console.error('OTP verification error:', error);
    }
  };

  // Function to close OTP modal
  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtpCode('');
    setOtpData(null);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const endpoint = isRecoveryMode ? 'http://localhost:8000/api/login/recovery' : 'http://localhost:8000/api/login';
      const requestBody = isRecoveryMode 
        ? { email, recovery_passcode: recoveryPasscode }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle successful login
        setMessage(data.message || 'Login successful!');
        console.log('Login successful:', data);

        // Check if OTP verification is required
        if (data.requires_otp) {
          if (data.application_status === 'pending') {
            setMessage('Your application is still under review. Please wait for admin approval. The OTP will be sent to your email once the admin approves your application.');
            return;
          } else {
            setOtpData({
              user_id: data.user_id,
              email: email
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

        // Use authentication context to handle login
        await login(data.user, token);

        // If this was a recovery login, show change password modal
        if (isRecoveryMode) {
          setRecoveryLoginData({
            token,
            user: data.user,
            email,
            recoveryPasscode
          });
          setShowChangePasswordModal(true);
          return; // Don't redirect yet
        }

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
      // Handle network errors
      setMessage('Network error. Could not connect to backend.');
      console.error('Network error:', error);
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
              <span><strong>Recovery Mode: </strong>You will need to change your password after entering the recovery passcode.</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {message && <p className="errorMessage">{message}</p>} {/* Styled error message */}
            <div className="inputGroup">
              <label htmlFor="email" className="label">Email:</label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                placeholder="Enter your email"
              />
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
              <div className="inputGroup"> {/* Recovery passcode input group */}
                <label htmlFor="recoveryPasscode" className="label">Recovery Passcode:</label>
                <div className="passwordInputContainer"> {/* Container for recovery passcode input and icon */}
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="recoveryPasscode"
                    value={recoveryPasscode}
                    onChange={(e) => setRecoveryPasscode(e.target.value)}
                    className="passwordInput"
                    required
                    placeholder="Enter your recovery passcode"
                    aria-label="Recovery Passcode"
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
            
            
            <button type="submit" className="signInButton">
              {isRecoveryMode ? 'Continue with Recovery Passcode' : 'Sign In'}
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
            
            <div className="passwordRequirements">
              <h3>Password Requirements:</h3>
              <ul className="requirementsList">
                <li className={newPassword.length >= 8 ? 'requirementMet' : 'requirementNotMet'}>
                  <span className="requirementIcon">{newPassword.length >= 8 ? '✓' : '○'}</span>
                  At least 8 characters long
                </li>
                <li className={newPassword !== '' && /[0-9@#!$%^&*(),.?":{}|<>]/.test(newPassword) ? 'requirementMet' : 'requirementNotMet'}>
                  <span className="requirementIcon">{newPassword !== '' && /[0-9@#!$%^&*(),.?":{}|<>]/.test(newPassword) ? '✓' : '○'}</span>
                  With special characters (0-9, @, #, !, etc.)
                </li>
              </ul>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="inputGroup">
                <label htmlFor="newPassword">New Password:</label>
                <div className="passwordInputContainer">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="passwordInput"
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
                <div className="passwordStrengthText">
                  <span><strong>Password Strength: </strong></span>
                  {newPassword.length < 8 ? 'Weak' : 
                   (newPassword.length >= 8 && /[0-9@#!$%^&*(),.?":{}|<>]/.test(newPassword)) ? 'Strong' : 'Weak'}
                </div>
              </div>
              <div className="inputGroup">
                <label htmlFor="confirmPassword">Confirm New Password:</label>
                <div className="passwordInputContainer">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="passwordInput"
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
                <div className="passwordMatchIndicator">
                  <span className={`passwordMatchText ${newPassword === confirmPassword && newPassword !== '' ? 'passwordMatch' : 'passwordNoMatch'}`}>
                    {newPassword === confirmPassword && newPassword !== '' ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </span>
                </div>
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
            </div>

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
                />
              </div>
              
              <button 
                type="submit" 
                className="signInButton" 
                disabled={otpCode.length !== 6}
              >
                Verify OTP & Continue
              </button>
              {message && (
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
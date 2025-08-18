import React, { useState, useEffect } from 'react';
import './LoginPage.css'; // Import the CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faKey } from '@fortawesome/free-solid-svg-icons';
// You might need to import useHistory or useNavigate from react-router-dom for redirection
// import { useHistory } from 'react-router-dom'; // For react-router-dom v5
import { useNavigate } from 'react-router-dom'; // For react-router-dom v6

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryPasscode, setRecoveryPasscode] = useState('');
  const [message, setMessage] = useState('');
  const [showRA, setShowRA] = useState(false); // State for the pop-up
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [rememberMe, setRememberMe] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false); // State for recovery mode
  // const history = useHistory(); // For react-router-dom v5
  const navigate = useNavigate(); // For react-router-dom v6

  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

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

        // TODO: Assuming your backend returns a token and user data with role
        const token = data.token; // Adjust based on actual backend response structure
        const userRole = data.user ? data.user.role : null; // Adjust based on actual backend response structure
        const userId = data.user ? data.user.id : null;

        // Store token and email based on rememberMe
        if (rememberMe) {
          localStorage.setItem('authToken', token);
          localStorage.setItem('rememberedEmail', email);
        } else {
          sessionStorage.setItem('authToken', token);
          localStorage.removeItem('rememberedEmail');
        }
        // You might also want to save user details like role
        localStorage.setItem('userRole', userRole);
        if (userId) localStorage.setItem('userId', userId);
        if (data.user && data.user.organization) {
          localStorage.setItem('userOrganization', data.user.organization);
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
        setMessage(data.message || 'Login failed.');
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

  return (
    <div className="loginPageWrapper" style={bgStyle}>
      <div className="container"> {/* Main container */}
        <div className="loginSection"> {/* Left (Login) section */}
          <h2 className="signInTitle">Sign In</h2>
          <form onSubmit={handleSubmit}>
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
              </div>
            )}
            
            <div className="rememberMe">
              <input
                type="checkbox"
                id="rememberMe"
                className="rememberMeCheckbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe" className="rememberMeLabel">Remember me?</label>
            </div>
            
            <button type="submit" className="signInButton">
              {isRecoveryMode ? 'Sign In with Recovery Passcode' : 'Sign In'}
            </button>
            
            <div className="recoveryToggle">
              <button
                type="button"
                onClick={toggleRecoveryMode}
                className="recoveryToggleButton"
              >
                <FontAwesomeIcon icon={faKey} />
                {isRecoveryMode ? ' Use Regular Password' : ' Forgot Password? Use Recovery Passcode'}
              </button>
            </div>
          </form>
          {message && <p className="errorMessage">{message}</p>} {/* Styled error message */}
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
        <div className="raButtonIconBox">📄</div>
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
    </div>
  );
}

export default LoginPage; 
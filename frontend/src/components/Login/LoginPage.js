import React, { useState } from 'react';
import './LoginPage.css'; // Import the CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
// You might need to import useHistory or useNavigate from react-router-dom for redirection
// import { useHistory } from 'react-router-dom'; // For react-router-dom v5
import { useNavigate } from 'react-router-dom'; // For react-router-dom v6

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showRA, setShowRA] = useState(false); // State for the pop-up
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  // const history = useHistory(); // For react-router-dom v5
  const navigate = useNavigate(); // For react-router-dom v6

  const toggleRA = () => {
    setShowRA(!showRA);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle successful login
        setMessage('Login successful!');
        console.log('Login successful:', data);

        // TODO: Assuming your backend returns a token and user data with role
        const token = data.token; // Adjust based on actual backend response structure
        const userRole = data.user ? data.user.role : null; // Adjust based on actual backend response structure

        // Save the token (e.g., in localStorage)
        localStorage.setItem('authToken', token); // Use a secure storage method in production
        // You might also want to save user details like role
        localStorage.setItem('userRole', userRole);

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

  return (
    <div className="container"> {/* Main container */}
      <div className="loginSection"> {/* Left (Login) section */}
        <h2 className="signInTitle">Sign In</h2>
        <form onSubmit={handleSubmit}>
          <div className="inputGroup">
            <label htmlFor="email" className="label">Username</label>
            <input
              type="text" // Changed type to text based on screenshot
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="inputGroup"> {/* Password input group */}
            <label htmlFor="password" className="label">Password</label>
            <div className="passwordInputContainer"> {/* Container for password input and icon */}
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="passwordInput"
                required
              />
              <span
                onClick={togglePasswordVisibility}
                className="passwordToggleIcon"
              >
                {showPassword ? (
                  <FontAwesomeIcon icon={faEye} />
                ) : (
                  <FontAwesomeIcon icon={faEyeSlash} />
                )} {/* Eye icons from Font Awesome */}
              </span>
            </div>
          </div>
          <div className="rememberMe">
            <input type="checkbox" id="rememberMe" className="rememberMeCheckbox" />
            <label htmlFor="rememberMe" className="rememberMeLabel">Remember me?</label>
          </div>
          <button type="submit" className="signInButton">Sign In</button>
        </form>
        {message && <p className="errorMessage">{message}</p>} {/* Styled error message */}

        {/* Button to toggle the Republic Act pop-up */}
        <button
          onClick={toggleRA}
          className="raButton"
        >
          <div className="raButtonIconBox">📄</div>
        </button>
      </div>

      <div className="welcomeSection"> {/* Right (Welcome) section */}
        <div className="welcomeContent">
          <p className="coalitionText">DISASTER PREPAREDNESS AND RESPONSE VOLUNTEER COALITION</p>
          <h1 className="welcomeTitle">Welcome ,</h1>
          <p className="welcomeSubtitle">sign in to continue access pages.</p>
        </div>
      </div>

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
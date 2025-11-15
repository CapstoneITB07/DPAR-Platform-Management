import React, { useState, useEffect } from 'react';
import '../css/SuperAdminLayout.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, faUsers, faUserShield, faDatabase, 
  faFileAlt, faCog, faSignOutAlt, faBars, faTimes,
  faShieldAlt, faChartLine, faHistory, faExclamationTriangle,
  faEdit, faUser, faEnvelope, faLock, faEye, faEyeSlash,
  faBell, faBullhorn, faGraduationCap, faGlobe, faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Modal from 'react-modal';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';

// Set the app element for React Modal
Modal.setAppElement('#root');

function SuperAdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState('/Assets/disaster_logo.png');
  const [imagePreview, setImagePreview] = useState(null);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    username: ''
  });
  const [userDisplayName, setUserDisplayName] = useState('Super Admin');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordSuggestions, setPasswordSuggestions] = useState([]);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [originalProfileValues, setOriginalProfileValues] = useState({
    name: '',
    email: '',
    username: ''
  });
  const [editProfileHover, setEditProfileHover] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  useEffect(() => {
    if (user) {
      setUserDisplayName(user.name || 'Super Admin');
    }
    fetchProfile();
  }, [user]);

  const toggleSidebar = () => setSidebarOpen(open => !open);
  const closeSidebar = () => setSidebarOpen(false);

  const isActive = (route) => location.pathname === route;

  const handleLogout = async () => {
    await logout();
    navigate('/superadmin/login');
  };

  // Common passwords list
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon',
    'master', 'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1'
  ];

  const checkPasswordStrength = (password) => {
    let strength = 0;
    const suggestions = [];

    if (password.length >= 8) strength += 1;
    else suggestions.push('Use at least 8 characters');
    if (password.length >= 12) strength += 1;

    if (/[a-z]/.test(password)) strength += 1;
    else suggestions.push('Include lowercase letters');
    if (/[A-Z]/.test(password)) strength += 1;
    else suggestions.push('Include uppercase letters');
    if (/\d/.test(password)) strength += 1;
    else suggestions.push('Include numbers');
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
    else suggestions.push('Include special characters (!@#$%^&*)');

    if (commonPasswords.includes(password.toLowerCase())) {
      suggestions.push('Avoid common passwords');
      strength = Math.max(0, strength - 2);
    }

    setPasswordStrength(strength);
    setPasswordSuggestions(suggestions);
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/profile`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const profileData = {
        name: response.data.name || 'Super Admin',
        email: response.data.email || '',
        username: response.data.username || ''
      };
      setProfileForm(profileData);
      setOriginalProfileValues(profileData);
      setUserDisplayName(response.data.name || 'Super Admin');
      
      if (response.data.profile_picture_url) {
        setProfileImage(response.data.profile_picture_url);
      } else {
        setProfileImage('/Assets/disaster_logo.png');
      }
      
      setHasFormChanges(false);
      setImagePreview(null);
      setNewProfileImage(null);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setProfileError('Please upload a valid image file (JPEG, PNG, JPG, or GIF)');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setProfileError('File size should not exceed 2MB');
        return;
      }
      setNewProfileImage(file);
      setProfileError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      const usernameChanged = profileForm.username !== originalProfileValues.username;
      setHasFormChanges(true);
    } else {
      setImagePreview(null);
      setNewProfileImage(null);
      const usernameChanged = profileForm.username !== originalProfileValues.username;
      setHasFormChanges(usernameChanged);
    }
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    const updatedForm = { ...profileForm, [name]: value };
    const hasChanges = updatedForm.username !== originalProfileValues.username || newProfileImage !== null;
    setHasFormChanges(hasChanges);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const usernameChanged = profileForm.username !== originalProfileValues.username;
      const hasChanges = usernameChanged || newProfileImage !== null;
      
      if (hasChanges) {
        const formData = new FormData();
        
        if (usernameChanged) {
          formData.append('name', profileForm.name);
          formData.append('email', profileForm.email);
          formData.append('username', profileForm.username);
          
          if (newProfileImage) {
            formData.append('profile_image', newProfileImage);
          }
          
          const response = await axiosInstance.post(`${API_BASE}/api/profile/update`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data.profile_picture_url) {
            setProfileImage(response.data.profile_picture_url);
          }
          setNewProfileImage(null);
          setImagePreview(null);
          setProfileSuccess(newProfileImage 
            ? 'Profile updated successfully' 
            : 'Username updated successfully');
        } else if (newProfileImage) {
          formData.append('profile_picture', newProfileImage);
          
          const response = await axiosInstance.post(`${API_BASE}/api/profile/update-picture`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data.profile_picture_url) {
            setProfileImage(response.data.profile_picture_url);
          } else if (imagePreview) {
            setProfileImage(imagePreview);
          }
          setNewProfileImage(null);
          setImagePreview(null);
          setProfileSuccess('Profile picture updated successfully');
        }
        
        await fetchProfile();
        setHasFormChanges(false);
      }
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'new_password') {
      checkPasswordStrength(value);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setIsLoading(true);

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setPasswordError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (passwordForm.current_password === passwordForm.new_password) {
      setPasswordError('New password must be different from current password');
      setIsLoading(false);
      return;
    }

    if (commonPasswords.includes(passwordForm.new_password.toLowerCase())) {
      setPasswordError('Password is too common. Please choose a more secure password.');
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setPasswordError('Password is too weak. Please include uppercase, lowercase, numbers, and special characters.');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axiosInstance.post(`${API_BASE}/api/change-password`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      if (errorMessage.includes('current password') || errorMessage.includes('Current password')) {
        setPasswordError('Current password is incorrect');
      } else if (errorMessage.includes('validation') || errorMessage.includes('Validation')) {
        setPasswordError('Please check your password requirements');
      } else {
        setPasswordError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomModalStyles = () => {
    const width = window.innerWidth;
    let contentWidth = '90%';
    let contentMaxWidth = '600px';
    let contentMaxHeight = '90vh';
    let contentMargin = 'auto';
    let overlayPadding = '20px';
    let contentTop = '50%';
    let contentLeft = '50%';
    let contentTransform = 'translate(-50%, -50%)';
    let contentRight = 'auto';
    let contentBottom = 'auto';

    if (width <= 480) {
      contentWidth = '95%';
      contentMaxWidth = '95%';
      contentMaxHeight = '85vh';
      contentMargin = '20px auto';
      overlayPadding = '10px';
      contentTop = '50%';
      contentLeft = '50%';
      contentRight = 'auto';
      contentBottom = 'auto';
      contentTransform = 'translate(-50%, -50%)';
    } else if (width >= 481 && width <= 768) {
      contentWidth = '90%';
      contentMaxWidth = '500px';
      overlayPadding = '15px';
    } else if (width >= 769 && width <= 1024) {
      contentWidth = '85%';
      contentMaxWidth = '550px';
      overlayPadding = '20px';
    } else if (width >= 1025) {
      contentWidth = '80%';
      contentMaxWidth = '600px';
      overlayPadding = '20px';
    }

    return {
      content: {
        top: contentTop,
        left: contentLeft,
        right: contentRight,
        bottom: contentBottom,
        transform: contentTransform,
        width: contentWidth,
        maxWidth: contentMaxWidth,
        minWidth: '320px',
        maxHeight: contentMaxHeight,
        margin: contentMargin,
        padding: '0',
        borderRadius: '12px',
        border: 'none',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        zIndex: 1001,
        overflowY: 'auto',
        overscrollBehavior: 'contain'
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 1000,
        padding: overlayPadding,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        overscrollBehavior: 'contain'
      }
    };
  };

  const [customModalStyles, setCustomModalStyles] = useState(getCustomModalStyles());

  useEffect(() => {
    const handleResize = () => {
      setCustomModalStyles(getCustomModalStyles());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showProfileModal) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalTop = document.body.style.top;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        const scrollY = document.body.style.top;
        document.body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      };
    }
  }, [showProfileModal]);

  return (
    <div className="superadmin-dashboard-container">
      {/* Header */}
      <header className="superadmin-header">
        <div className="sa-header-left">
          <button className="sa-burger-icon" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          <span className="sa-dpar-text">DPAR - Super Admin</span>
        </div>
        <div className="sa-header-right">
          <span className="sa-user-name">{userDisplayName}</span>
          <button className="sa-logout-button" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Logout
          </button>
        </div>
      </header>

      {/* Sidebar Drawer */}
      {sidebarOpen && (
        <>
          <div className="sa-sidebar-overlay" onClick={closeSidebar}></div>
          <div className={`sa-sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
            <button className="sa-sidebar-close-btn" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <div className="sa-sidebar-header">
              <div className="sa-user-info">
                <img 
                  src={profileImage}
                  alt="Profile"
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    backgroundColor: '#f0f0f0',
                    boxShadow: '0 4px 12px rgba(26,26,46,0.12)',
                    border: '3px solid #fff',
                  }}
                  onError={e => { e.target.src = '/Assets/disaster_logo.png'; }}
                />
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <p className="sa-user-name-text" style={{
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    color: '#1a1a2e',
                    margin: 0,
                    marginBottom: '6px',
                    letterSpacing: '0.5px',
                  }}>{userDisplayName}</p>
                  <p
                    className="edit-profile"
                    onClick={() => {
                      setShowProfileModal(true);
                      setActiveTab('profile');
                      setImagePreview(null);
                      setNewProfileImage(null);
                      setProfileError('');
                      setProfileSuccess('');
                      setPasswordError('');
                      setPasswordSuccess('');
                      setHasFormChanges(false);
                      fetchProfile();
                    }}
                    style={{
                      cursor: 'pointer',
                      margin: 0,
                      marginTop: '8px',
                      color: editProfileHover ? '#1a1a2e' : '#007bff',
                      fontSize: '14.5px',
                      fontWeight: 600,
                      display: 'inline-block',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={() => setEditProfileHover(true)}
                    onMouseLeave={() => setEditProfileHover(false)}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit Profile
                  </p>
                </div>
              </div>
            </div>
            <nav className="sa-sidebar-nav">
              <ul>
                <li className={isActive('/superadmin/dashboard') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/dashboard'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faTachometerAlt} /> DASHBOARD
                </li>
                <li className={isActive('/superadmin/head-admins') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/head-admins'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faUserShield} /> HEAD ADMINS
                </li>
                <li className={isActive('/superadmin/associate-groups') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/associate-groups'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faUsers} /> ASSOCIATE GROUPS
                </li>
                <li className={isActive('/superadmin/users') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/users'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faUsers} /> ALL USERS
                </li>
                <li className={isActive('/superadmin/pending-applications') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/pending-applications'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faFileAlt} /> APPLICATIONS
                </li>
                <li className={isActive('/superadmin/reports') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/reports'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faClipboardList} /> REPORTS
                </li>
                <li className={isActive('/superadmin/system-logs') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/system-logs'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faHistory} /> SYSTEM LOGS
                </li>
                <li className={isActive('/superadmin/database') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/database'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faDatabase} /> DATABASE
                </li>
                <li className={isActive('/superadmin/system-health') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/system-health'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} /> SYSTEM HEALTH
                </li>
                <li className={isActive('/superadmin/notifications') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/notifications'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faBell} /> NOTIFICATIONS
                </li>
                <li className={isActive('/superadmin/announcements') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/announcements'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faBullhorn} /> ANNOUNCEMENTS
                </li>
                <li className={isActive('/superadmin/training-programs') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/training-programs'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faGraduationCap} /> TRAINING PROGRAMS
                </li>
                <li className={isActive('/superadmin/citizen-monitoring') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/citizen-monitoring'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faGlobe} /> CITIZEN MONITORING
                </li>
                <li className={isActive('/superadmin/settings') ? 'active' : ''} 
                    onClick={() => { navigate('/superadmin/settings'); closeSidebar(); }}>
                  <FontAwesomeIcon icon={faCog} /> SETTINGS
                </li>
              </ul>
            </nav>
            <div className="sa-sidebar-footer">
              <button className="sa-logout-button-icon-only" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="superadmin-main-content">
        {children}
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
        style={customModalStyles}
        contentLabel="Edit Profile"
      >
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white',
            padding: window.innerWidth <= 480 ? '15px 20px' : '20px 30px',
            textAlign: 'center',
            position: 'relative',
            flexShrink: 0
          }}>
            <button 
              onClick={() => setShowProfileModal(false)}
              style={{
                position: 'absolute',
                top: window.innerWidth <= 480 ? '10px' : '15px',
                right: window.innerWidth <= 480 ? '15px' : '20px',
                background: 'transparent',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 480 ? '20px' : '24px',
                fontWeight: 'bold',
                padding: '5px',
                borderRadius: '50%',
                width: window.innerWidth <= 480 ? '30px' : '35px',
                height: window.innerWidth <= 480 ? '30px' : '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h2 style={{ 
              margin: 0, 
              fontSize: window.innerWidth <= 480 ? '20px' : '24px', 
              fontWeight: '600' 
            }}>Edit Profile</h2>
            <p style={{ 
              margin: '5px 0 0 0', 
              opacity: 0.9, 
              fontSize: window.innerWidth <= 480 ? '12px' : '14px' 
            }}>Update your profile information and picture</p>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            background: '#f8f9fa',
            borderBottom: '1px solid #dee2e6',
            padding: '0',
            flexShrink: 0
          }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: window.innerWidth <= 480 ? '15px 10px' : '20px 15px',
                background: activeTab === 'profile' ? 'white' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                fontWeight: '600',
                color: activeTab === 'profile' ? '#1a1a2e' : '#666',
                borderBottom: activeTab === 'profile' ? '3px solid #1a1a2e' : '3px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: activeTab === 'profile' ? '#1a1a2e' : '#6c757d',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                1
              </div>
              <FontAwesomeIcon icon={faUser} />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: window.innerWidth <= 480 ? '15px 10px' : '20px 15px',
                background: activeTab === 'password' ? 'white' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                fontWeight: '600',
                color: activeTab === 'password' ? '#1a1a2e' : '#666',
                borderBottom: activeTab === 'password' ? '3px solid #1a1a2e' : '3px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: activeTab === 'password' ? '#1a1a2e' : '#6c757d',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                2
              </div>
              <FontAwesomeIcon icon={faLock} />
              <span>Password</span>
            </button>
          </div>

          {/* Content */}
          <div style={{ 
            padding: window.innerWidth <= 480 ? '20px' : '30px',
            paddingBottom: window.innerWidth <= 480 ? '40px' : '50px',
            overflowY: 'auto', 
            flex: 1,
            minHeight: 0,
            maxHeight: 'calc(90vh - 180px)',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* Profile Tab Error and Success Messages */}
            {activeTab === 'profile' && profileError && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ffcdd2',
                fontSize: window.innerWidth <= 480 ? '12px' : '14px'
              }}>
                {profileError}
              </div>
            )}
            {activeTab === 'profile' && profileSuccess && (
              <div style={{
                background: '#e8f5e8',
                color: '#2e7d32',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #c8e6c9',
                fontSize: window.innerWidth <= 480 ? '12px' : '14px'
              }}>
                {profileSuccess}
              </div>
            )}

            {/* Password Tab Error and Success Messages */}
            {activeTab === 'password' && passwordError && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ffcdd2',
                fontSize: window.innerWidth <= 480 ? '12px' : '14px'
              }}>
                {passwordError}
              </div>
            )}
            {activeTab === 'password' && passwordSuccess && (
              <div style={{
                background: '#e8f5e8',
                color: '#2e7d32',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #c8e6c9',
                fontSize: window.innerWidth <= 480 ? '12px' : '14px'
              }}>
                {passwordSuccess}
              </div>
            )}

            {/* Profile Tab Content */}
            {activeTab === 'profile' && (
              <>
                {/* Profile Picture Section */}
                <div style={{ marginBottom: window.innerWidth <= 480 ? '20px' : '30px' }}>
                  <h3 style={{ 
                    margin: '0 0 15px 0', 
                    fontSize: window.innerWidth <= 480 ? '16px' : '18px', 
                    fontWeight: '600',
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FontAwesomeIcon icon={faUser} style={{ color: '#1a1a2e' }} />
                    Super Admin Profile Picture
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                    alignItems: 'center',
                    gap: window.innerWidth <= 480 ? '15px' : '20px',
                    padding: window.innerWidth <= 480 ? '15px' : '20px',
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    border: '2px dashed #dee2e6'
                  }}>
                    <img 
                      src={imagePreview || profileImage}
                      alt="Profile Preview" 
                      style={{
                        width: window.innerWidth <= 480 ? '80px' : '100px',
                        height: window.innerWidth <= 480 ? '80px' : '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      onError={(e) => {
                        e.target.src = '/Assets/disaster_logo.png';
                      }}
                    />
                    
                    <div style={{ 
                      flex: 1,
                      width: window.innerWidth <= 480 ? '100%' : 'auto',
                      textAlign: window.innerWidth <= 480 ? 'center' : 'left'
                    }}>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg,image/gif"
                        onChange={handleProfileImageChange}
                        style={{ 
                          marginBottom: '10px',
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          width: window.innerWidth <= 480 ? '100%' : 'auto'
                        }}
                      />
                      <div style={{ 
                        fontSize: window.innerWidth <= 480 ? '10px' : '12px', 
                        color: '#666', 
                        marginBottom: '15px' 
                      }}>
                        Accepted formats: JPEG, PNG, JPG, GIF (max 2MB)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Information Section */}
                <div style={{ marginBottom: window.innerWidth <= 480 ? '20px' : '30px' }}>
                  <h3 style={{ 
                    margin: '0 0 15px 0', 
                    fontSize: window.innerWidth <= 480 ? '16px' : '18px', 
                    fontWeight: '600',
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FontAwesomeIcon icon={faUser} style={{ color: '#1a1a2e' }} />
                    Profile Information
                  </h3>
                  
                  <form onSubmit={handleProfileUpdate}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: '500',
                        color: '#333',
                        fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                      }}>
                        <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#666' }} />
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={profileForm.name}
                        readOnly
                        style={{
                          width: '100%',
                          padding: window.innerWidth <= 480 ? '10px 12px' : '12px 16px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          boxSizing: 'border-box',
                          backgroundColor: '#f8f9fa',
                          color: '#666',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: '500',
                        color: '#333',
                        fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                      }}>
                        <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#666' }} />
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={profileForm.username}
                        onChange={handleProfileFormChange}
                        placeholder="Enter your username"
                        style={{
                          width: '100%',
                          padding: window.innerWidth <= 480 ? '10px 12px' : '12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: '500',
                        color: '#333',
                        fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                      }}>
                        <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '8px', color: '#666' }} />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        readOnly
                        style={{
                          width: '100%',
                          padding: window.innerWidth <= 480 ? '10px 12px' : '12px 16px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          boxSizing: 'border-box',
                          backgroundColor: '#f8f9fa',
                          color: '#666',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading || !hasFormChanges}
                      style={{
                        background: hasFormChanges ? '#1a1a2e' : '#ccc',
                        color: 'white',
                        border: 'none',
                        padding: window.innerWidth <= 480 ? '10px 20px' : '12px 24px',
                        borderRadius: '6px',
                        cursor: (isLoading || !hasFormChanges) ? 'not-allowed' : 'pointer',
                        fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                        fontWeight: '500',
                        opacity: (isLoading || !hasFormChanges) ? 0.6 : 1,
                        width: window.innerWidth <= 480 ? '100%' : 'auto'
                      }}
                    >
                      {isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* Password Tab Content */}
            {activeTab === 'password' && (
              <div>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  fontSize: window.innerWidth <= 480 ? '16px' : '18px', 
                  fontWeight: '600',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FontAwesomeIcon icon={faLock} style={{ color: '#1a1a2e' }} />
                  Change Password
                </h3>
                
                <form onSubmit={handlePasswordChange}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: '500',
                      color: '#333',
                      fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                    }}>
                      Current Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="current_password"
                        value={passwordForm.current_password}
                        onChange={handlePasswordFormChange}
                        style={{
                          width: '100%',
                          padding: window.innerWidth <= 480 ? '10px 45px 10px 12px' : '12px 50px 12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666',
                          padding: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: '500',
                      color: '#333',
                      fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                    }}>
                      New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="new_password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordFormChange}
                        style={{
                          width: '100%',
                          padding: window.innerWidth <= 480 ? '10px 45px 10px 12px' : '12px 50px 12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          boxSizing: 'border-box'
                        }}
                        required
                        minLength="8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666',
                          padding: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordForm.new_password && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          fontWeight: '500',
                          color: '#333',
                          marginRight: '10px'
                        }}>
                          Password Strength:
                        </span>
                        <div style={{
                          display: 'flex',
                          gap: '4px'
                        }}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              style={{
                                width: '20px',
                                height: '4px',
                                borderRadius: '2px',
                                backgroundColor: level <= passwordStrength 
                                  ? passwordStrength <= 2 
                                    ? '#ff4444' 
                                    : passwordStrength <= 3 
                                      ? '#ffaa00' 
                                      : '#00aa00'
                                  : '#e0e0e0'
                              }}
                            />
                          ))}
                        </div>
                        <span style={{
                          marginLeft: '8px',
                          fontSize: window.innerWidth <= 480 ? '11px' : '12px',
                          fontWeight: '600',
                          color: passwordStrength <= 2 
                            ? '#ff4444' 
                            : passwordStrength <= 3 
                              ? '#ffaa00' 
                              : '#00aa00'
                        }}>
                          {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Fair' : 'Strong'}
                        </span>
                      </div>
                      {passwordSuggestions.length > 0 && (
                        <div style={{
                          fontSize: window.innerWidth <= 480 ? '11px' : '12px',
                          color: '#666',
                          marginTop: '5px'
                        }}>
                          Suggestions: {passwordSuggestions.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: '500',
                      color: '#333',
                      fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                    }}>
                      Confirm New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="new_password_confirmation"
                        value={passwordForm.new_password_confirmation}
                        onChange={handlePasswordFormChange}
                        style={{
                          width: '100%',
                          padding: window.innerWidth <= 480 ? '10px 45px 10px 12px' : '12px 50px 12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          boxSizing: 'border-box'
                        }}
                        required
                        minLength="8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666',
                          padding: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    style={{
                      background: '#1a1a2e',
                      color: 'white',
                      border: 'none',
                      padding: window.innerWidth <= 480 ? '10px 20px' : '12px 24px',
                      borderRadius: '6px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                      fontWeight: '500',
                      opacity: isLoading ? 0.6 : 1,
                      width: window.innerWidth <= 480 ? '100%' : 'auto'
                    }}
                  >
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SuperAdminLayout;


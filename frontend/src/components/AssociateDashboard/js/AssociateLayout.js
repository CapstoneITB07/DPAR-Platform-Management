import React, { useState, useEffect } from 'react';
import '../css/AssociateDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faBullhorn, faUsers, faEnvelope, faChartBar, faSignOutAlt, faBars, faKey, faTimes, faUser, faBuilding, faEye, faEyeSlash, faLock, faBell, faBellSlash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from '../../../utils/axiosConfig';
import Modal from 'react-modal';

import { API_BASE } from '../../../utils/url';
import { 
  isPushNotificationSupported, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed 
} from '../../../utils/pushNotifications';

function AssociateLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // New state for tab management
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    director: '',
    type: '',
    username: '',
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    director: '',
    type: '',
    username: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState('/Assets/disaster_logo.png');
  const [imagePreview, setImagePreview] = useState(null);
  const [userDisplayName, setUserDisplayName] = useState('Associate');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordSuggestions, setPasswordSuggestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = Number(localStorage.getItem('userId'));
  const userOrganization = localStorage.getItem('userOrganization');
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Director change warning states
  const [showDirectorWarning, setShowDirectorWarning] = useState(false);
  const [originalDirectorValues, setOriginalDirectorValues] = useState({
    director: '',
    email: '',
    username: ''
  });
  const [pendingChanges, setPendingChanges] = useState({});
  const [warningModalUsername, setWarningModalUsername] = useState('');
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const NOTIF_READ_KEY = `associateNotifRead_${userId}`;
  const [editProfileHover, setEditProfileHover] = useState(false);
  
  // Passcode regeneration states
  const [showPasscodeRegenModal, setShowPasscodeRegenModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState('');
  const [isGeneratingPasscodes, setIsGeneratingPasscodes] = useState(false);
  const [recoveryPasscodes, setRecoveryPasscodes] = useState([]);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [pushNotificationsSupported, setPushNotificationsSupported] = useState(false);

  const toggleSidebar = () => {
    console.log('Toggle sidebar called');
    setSidebarOpen(open => !open);
  };
  
  const closeSidebar = () => {
    console.log('Close sidebar called');
    setSidebarOpen(false);
  };

  const isActive = (route) => location.pathname === route;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  };


  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setIsLoading(true);

    // Client-side validation
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

    // Check for common passwords
    if (commonPasswords.includes(passwordForm.new_password.toLowerCase())) {
      setPasswordError('Password is too common. Please choose a more secure password.');
      setIsLoading(false);
      return;
    }

    // Check password strength
    if (passwordStrength < 3) {
      setPasswordError('Password is too weak. Please include uppercase, lowercase, numbers, and special characters.');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axios.post(`${API_BASE}/api/change-password`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });
      fetchProfile();
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

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength when new password changes
    if (name === 'new_password') {
      checkPasswordStrength(value);
    }
  };

  // Common passwords list
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon',
    'master', 'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1',
    'jordan23', 'harley', 'password1', '1234', 'robert', 'matthew',
    'jordan', 'asshole', 'daniel', 'andrew', 'joshua', 'michael',
    'charlie', 'michelle', 'jessica', 'pepper', '12345', 'mickey',
    'secret', 'dallas', 'jennifer', 'josh', 'amanda', 'summer',
    'love', 'ashley', 'nicole', 'chelsea', 'biteme', 'matthew',
    'access', 'yankees', '987654321', 'dallas', 'austin', 'thunder',
    'taylor', 'matrix', 'william', 'corvette', 'hello', 'martin',
    'heather', 'secret', 'fucker', 'merlin', 'diamond', '1234qwer',
    'gfhjkm', 'hammer', 'silver', '222222', 'bigdick', '888888',
    'anthony', 'justin', 'test', 'bailey', 'q1w2e3r4t5', 'patrick',
    'internet', 'scooter', 'orange', '11111', 'q1w2e3r4', 'merlin',
    'jordan23', 'harley', 'password1', '1234', 'robert', 'matthew'
  ];

  const checkPasswordStrength = (password) => {
    let strength = 0;
    const suggestions = [];

    // Length check
    if (password.length >= 8) {
      strength += 1;
    } else {
      suggestions.push('Use at least 8 characters');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      strength += 1;
    } else {
      suggestions.push('Include uppercase letters');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      strength += 1;
    } else {
      suggestions.push('Include lowercase letters');
    }

    // Number check
    if (/\d/.test(password)) {
      strength += 1;
    } else {
      suggestions.push('Include numbers');
    }

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      strength += 1;
    } else {
      suggestions.push('Include special characters (!@#$%^&*)');
    }

    // Common password check
    if (commonPasswords.includes(password.toLowerCase())) {
      suggestions.push('Avoid common passwords');
      strength = Math.max(0, strength - 2); // Penalize for common passwords
    }

    // Sequential characters check
    if (/(.)\1{2,}/.test(password)) {
      suggestions.push('Avoid repeating characters');
      strength = Math.max(0, strength - 1);
    }

    // Sequential numbers check
    if (/123|234|345|456|567|678|789|890|012/.test(password)) {
      suggestions.push('Avoid sequential numbers');
      strength = Math.max(0, strength - 1);
    }

    setPasswordStrength(strength);
    setPasswordSuggestions(suggestions);
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Check if any form field has changed from original values
    const hasChanges = Object.keys(profileForm).some(key => {
      if (key === 'email') return false; // Email is read-only, don't track changes
      return profileForm[key] !== profileData[key];
    });
    setHasFormChanges(hasChanges);
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
      
      setProfileForm(prev => ({
        ...prev,
        profileImage: file
      }));
      setProfileError('');
      
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Mark as having changes when image is selected
      setHasFormChanges(true);
    } else {
      // Clear preview if no file selected
      setImagePreview(null);
      setProfileForm(prev => ({ ...prev, profileImage: null }));
    }
  };


  const handleProfileInfoUpdate = async (e) => {
    e.preventDefault();
    
    // Check if director name has changed (email is read-only, so no need to check)
    const directorChanged = profileForm.director !== originalDirectorValues.director;
    
    if (directorChanged) {
      // Store pending changes and show warning
      setPendingChanges(profileForm);
      // Initialize warning modal username as empty (user must enter new one)
      setWarningModalUsername('');
      setProfileError(''); // Clear any previous errors
      setShowDirectorWarning(true);
      return;
    }
    
    // Proceed with normal update if no director changes
    await performProfileUpdate();
  };

  const performProfileUpdate = async (overrideFormData = null) => {
    setIsLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Use overrideFormData if provided, otherwise use profileForm
      const formDataToUse = overrideFormData || profileForm;
      
      // Create FormData to handle both form fields and file upload
      const formData = new FormData();
      formData.append('name', formDataToUse.name);
      formData.append('director', formDataToUse.director);
      formData.append('type', formDataToUse.type);
      formData.append('email', formDataToUse.email); // Include email even though it's read-only
      formData.append('username', formDataToUse.username);
      
      // Add image if selected
      if (profileForm.profileImage) {
        formData.append('profile_image', profileForm.profileImage);
      }
      
      const response = await axios.post(`${API_BASE}/api/profile/update`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProfileSuccess('Profile updated successfully');
      
      // Update profile image immediately if provided in response
      if (response.data.profile_picture_url) {
        setProfileImage(response.data.profile_picture_url);
      }
      // Update the sidebar name immediately
      setUserDisplayName(formDataToUse.name);
      // Update profile form state first with the updated values
      setProfileForm({
        ...formDataToUse,
        profileImage: null
      });
      // Refresh profile data to update UI (this will also update originalDirectorValues)
      await fetchProfile();
      // Reset form changes state
      setHasFormChanges(false);
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectorChangeConfirm = async () => {
    // Validate that username is provided and different from original
    if (!warningModalUsername || warningModalUsername.trim() === '') {
      setProfileError('Username is required when changing director. Please enter a new username.');
      return;
    }
    
    if (warningModalUsername === originalDirectorValues.username) {
      setProfileError('Username must be different from the current username when changing director.');
      return;
    }
    
    // Update pendingChanges with the new username from the modal
    const updatedPendingChanges = {
      ...pendingChanges,
      username: warningModalUsername.trim()
    };
    
    setShowDirectorWarning(false);
    // Update profile form state
    setProfileForm(updatedPendingChanges);
    // Pass the updated changes directly to performProfileUpdate to avoid async state issues
    await performProfileUpdate(updatedPendingChanges);
  };

  const handleDirectorChangeCancel = () => {
    setShowDirectorWarning(false);
    setPendingChanges({});
    setWarningModalUsername('');
    setProfileError(''); // Clear any errors
    // Reset form to original values
    setProfileForm(prev => ({
      ...prev,
      director: originalDirectorValues.director,
      email: originalDirectorValues.email,
      username: originalDirectorValues.username
    }));
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Profile response logged for debugging (remove in production)
      
      // Update profile form with current data
      setProfileForm({
        name: response.data.name || '',
        email: response.data.email || '',
        director: response.data.director || '',
        type: response.data.type || '',
        username: response.data.username || '',
      });
      
      // Update profile data
      setProfileData({
        name: response.data.name || '',
        email: response.data.email || '',
        director: response.data.director || '',
        type: response.data.type || '',
        username: response.data.username || '',
      });
      
      // Update user display name for sidebar
      setUserDisplayName(response.data.name || 'Associate');
      
      // Update profile image if provided
      if (response.data.profile_picture_url) {
        setProfileImage(response.data.profile_picture_url);
      } else if (response.data.profile_image_url) {
        setProfileImage(response.data.profile_image_url);
      } else if (response.data.logo_url) {
        setProfileImage(response.data.logo_url);
      }
      
      // Reset form changes state when loading fresh data
      setHasFormChanges(false);
      // Clear image preview when loading fresh data
      setImagePreview(null);
      
      // Store original director values for change detection
      setOriginalDirectorValues({
        director: response.data.director || '',
        email: response.data.email || '',
        username: response.data.username || ''
      });
      
      // Update profile image
      if (response.data.profile_picture_url) {
        setProfileImage(response.data.profile_picture_url);
      } else if (response.data.logo) {
        setProfileImage(getLogoUrl(response.data.logo));
      } else {
        setProfileImage(`${window.location.origin}/Assets/disaster_logo.png`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileImage(`${window.location.origin}/Assets/disaster_logo.png`);
    }
  };

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return `${window.location.origin}/Assets/disaster_logo.png`;
    if (logoPath.startsWith('logos/')) {
      return `${API_BASE}/storage/${logoPath}`;
    }
    if (logoPath.startsWith('/storage/')) {
      return `${API_BASE}${logoPath}`;
    }
    if (logoPath.startsWith('/Assets/')) {
      return `${window.location.origin}${logoPath}`;
    }
    return logoPath;
  };

  // Function to get responsive modal styles based on window width
  const getCustomModalStyles = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    let contentWidth = '90%';
    let contentMaxWidth = '600px';
    let contentMaxHeight = '90vh';
    let contentMargin = 'auto';
    let overlayPadding = '10px';
    let contentTop = '50%';
    let contentLeft = '50%';
    let contentTransform = 'translate(-50%, -50%)';
    let contentRight = 'auto';
    let contentBottom = 'auto';

    if (width <= 480) {
      contentWidth = '95%';
      contentMaxHeight = '85vh'; // Slightly smaller to ensure it fits and centers better
      contentMargin = '20px auto'; // Vertical margin for better centering
      overlayPadding = '10px';
      // For mobile, keep transform but ensure proper centering
      contentTop = '50%';
      contentLeft = '50%';
      contentRight = 'auto';
      contentBottom = 'auto';
      contentTransform = 'translate(-50%, -50%)';
    } else if (width >= 481 && width <= 768) {
      contentWidth = '90%';
      contentMaxWidth = '500px';
    } else if (width >= 769 && width <= 1024) {
      contentWidth = '85%';
      contentMaxWidth = '550px';
    } else if (width >= 1025) {
      contentWidth = '80%';
      contentMaxWidth = '600px';
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
        overscrollBehavior: 'contain', // Prevent scroll chaining
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 1000,
        padding: overlayPadding,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        overscrollBehavior: 'contain', // Prevent scroll chaining
      }
    };
  };

  const [customModalStyles, setCustomModalStyles] = useState(getCustomModalStyles());

  // Update modal styles on window resize
  useEffect(() => {
    const handleResize = () => {
      setCustomModalStyles(getCustomModalStyles());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when modal is open and prevent scroll chaining
  useEffect(() => {
    if (isProfileModalOpen) {
      // Store original body styles
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalTop = document.body.style.top;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;

      // Cleanup function to restore body scroll
      return () => {
        const scrollY = document.body.style.top;
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.top = originalTop;
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      };
    }
  }, [isProfileModalOpen]);

  useEffect(() => {
    // Set up periodic refresh of unread count
    const interval = setInterval(() => {
      const calculateUnreadCount = async () => {
        try {
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          const response = await axios.get(`${API_BASE}/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (Array.isArray(response.data)) {
            const readIds = JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || '[]');
            const unreadNotifications = response.data.filter(notification => !readIds.includes(notification.id));
            setUnreadCount(unreadNotifications.length);
          }
        } catch (error) {
          console.error('Failed to refresh unread count:', error);
        }
      };
      
      calculateUnreadCount();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const calculateUnreadCount = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await axios.get(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (Array.isArray(response.data)) {
          const readIds = JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || '[]');
          const unreadNotifications = response.data.filter(notification => !readIds.includes(notification.id));
          setUnreadCount(unreadNotifications.length);
          
          // If we're on the notification page, mark all as read
          if (location.pathname === '/associate/notification') {
            const allIds = response.data.map(n => n.id);
            localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(allIds));
            setUnreadCount(0);
          }
        }
      } catch (error) {
        console.error('Failed to fetch notifications for unread count:', error);
        setUnreadCount(0);
      }
    };

    calculateUnreadCount();
  }, [location.pathname, NOTIF_READ_KEY]);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSidebar();
    };
    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Check if user has recovery passcodes
  const checkRecoveryPasscodes = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/user/recovery-passcodes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecoveryPasscodes(response.data.recovery_passcodes || []);
    } catch (error) {
      console.error('Error checking recovery passcodes:', error);
    }
  };

  // Check if passcodes are exhausted (less than 1 remaining)
  const arePasscodesExhausted = () => {
    return recoveryPasscodes.length < 1;
  };

  // Send OTP for passcode regeneration
  const sendOtpForPasscodeRegen = async () => {
    try {
      setPasscodeError('');
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.post(`${API_BASE}/api/user/send-otp-passcode-regen`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOtpSent(true);
      setPasscodeSuccess('OTP sent to your email. Please check your inbox.');
    } catch (error) {
      setPasscodeError(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  // Verify OTP and generate new passcodes
  const verifyOtpAndGeneratePasscodes = async () => {
    try {
      setIsGeneratingPasscodes(true);
      setPasscodeError('');
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.post(`${API_BASE}/api/user/regenerate-passcodes`, {
        otp_code: otpCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Download the passcodes file
      const blob = new Blob([response.data.passcodes_content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recovery_passcodes_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setPasscodeSuccess('New recovery passcodes generated and downloaded successfully!');
      setShowPasscodeRegenModal(false);
      setOtpCode('');
      setOtpSent(false);
      await checkRecoveryPasscodes(); // Refresh passcode count
    } catch (error) {
      setPasscodeError(error.response?.data?.message || 'Failed to generate new passcodes');
    } finally {
      setIsGeneratingPasscodes(false);
    }
  };

  // Load recovery passcodes on component mount
  useEffect(() => {
    checkRecoveryPasscodes();
    checkPushNotificationStatus();
  }, []);

  const checkPushNotificationStatus = async () => {
    const supported = isPushNotificationSupported();
    setPushNotificationsSupported(supported);
    
    if (supported) {
      const subscribed = await isPushNotificationSubscribed();
      setPushNotificationsEnabled(subscribed);
    }
  };

  const togglePushNotifications = async () => {
    try {
      if (pushNotificationsEnabled) {
        await unsubscribeFromPushNotifications();
        setPushNotificationsEnabled(false);
        alert('Push notifications disabled successfully');
      } else {
        await subscribeToPushNotifications();
        setPushNotificationsEnabled(true);
        alert('Push notifications enabled successfully! You will receive notifications even when not using the app.');
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      alert('Failed to toggle push notifications. ' + error.message);
    }
  };

  return (
    <div className={`associate-dashboard-fixed-layout${sidebarOpen ? ' sidebar-open' : ''}`} style={{ minHeight: '100vh', height: '100vh' }}>
      <div>
        {sidebarOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={(e) => {
              e.preventDefault();
              console.log('Overlay clicked');
              closeSidebar();
            }} 
          />
        )}
        <nav className={`sidebar-drawer${sidebarOpen ? ' open' : ''}`} tabIndex="-1">
          <button 
            className="sidebar-close-btn" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Close button clicked');
              closeSidebar();
            }} 
            aria-label="Close Sidebar"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <div className="sidebar-header" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 0 18px 0',
            background: 'linear-gradient(180deg, #f7f7f7 60%, #fff 100%)',
            position: 'relative',
            borderBottom: '1.5px solid #f0f0f0',
          }}>
            <img
              src={profileImage}
              alt="Profile"
              className="profile-icon"
              loading="eager"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover',
                backgroundColor: '#f0f0f0',
                boxShadow: '0 2px 8px rgba(161,28,34,0.08)',
                border: '2.5px solid #fff',
                marginBottom: '10px',
              }}
              onError={e => { e.target.src = '/Assets/disaster_logo.png'; }}
            />
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p className="user-name" style={{
                fontWeight: 800,
                fontSize: '1.15rem',
                color: '#A11C22',
                margin: 0,
                marginBottom: '2px',
                letterSpacing: '0.5px',
              }}>{userDisplayName}</p>
              <p
                className="edit-profile"
                onClick={() => { 
                  setIsProfileModalOpen(true); 
                  setActiveTab('profile'); // Reset to profile tab when opening modal
                  setImagePreview(null);
                  setProfileForm(prev => ({ ...prev, profileImage: null }));
                  setProfileError('');
                  setProfileSuccess('');
                  setPasswordError('');
                  setPasswordSuccess('');
                  fetchProfile(); // Refresh profile data when opening modal
                }}
                style={{
                  cursor: 'pointer',
                  margin: 0,
                  marginTop: '4px',
                  color: editProfileHover ? '#A11C22' : '#007bff',
                  fontSize: '14px',
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
          <nav className="sidebar-nav">
            <ul>
              <li className={isActive('/associate/announcements') ? 'active' : ''} onClick={() => { navigate('/associate/announcements'); closeSidebar(); }}><FontAwesomeIcon icon={faBullhorn} /> ANNOUNCEMENTS</li>
              <li className={isActive('/associate/volunteer-list') ? 'active' : ''} onClick={() => { navigate('/associate/volunteer-list'); closeSidebar(); }}><FontAwesomeIcon icon={faUsers} /> VOLUNTEER LIST</li>
              <li className={isActive('/associate/notification') ? 'active' : ''} onClick={() => { navigate('/associate/notification'); closeSidebar(); }} style={{ position: 'relative' }}>
                <span><FontAwesomeIcon icon={faEnvelope} /> NOTIFICATION</span>
                {unreadCount > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: 2, 
                    right: 0, 
                    background: '#ff0000', 
                    color: 'white', 
                    borderRadius: '50%', 
                    padding: '4px 8px', 
                    fontSize: 12, 
                    fontWeight: '900',
                    minWidth: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 8px rgba(255,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.8)',
                    border: '2px solid #ffffff',
                    zIndex: 10,
                    animation: 'pulse 1.5s infinite',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>{unreadCount}</span>
                )}
              </li>
              <li className={isActive('/associate/reports') ? 'active' : ''} onClick={() => { navigate('/associate/reports'); closeSidebar(); }}><FontAwesomeIcon icon={faChartBar} /> REPORTS</li>
            </ul>
          </nav>
          <div className="sidebar-footer" style={{ marginTop: 'auto', marginBottom: 24 }}>
              {pushNotificationsSupported && (
                <button 
                  className="push-notification-toggle" 
                  onClick={togglePushNotifications}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    marginBottom: '12px',
                    background: pushNotificationsEnabled ? '#28a745' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <FontAwesomeIcon icon={pushNotificationsEnabled ? faBell : faBellSlash} />
                  {pushNotificationsEnabled ? 'Notifications ON' : 'Notifications OFF'}
                </button>
              )}
            <button 
              className="logout-button" 
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                opacity: loggingOut ? 0.7 : 1,
                cursor: loggingOut ? 'not-allowed' : 'pointer',
                pointerEvents: loggingOut ? 'none' : 'auto'
              }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} /> {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </nav>
      </div>
      <div className="header">
        <div className="header-left">
          <button className="burger-icon" onClick={toggleSidebar} aria-label="Open Sidebar">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <span className="dpar-text">DPAR</span>
        </div>
        <div className="header-right">
          <div className="notification-icon" onClick={() => navigate('/associate/notification')} style={{ cursor: 'pointer', position: 'relative', overflow: 'visible' }}>
            <FontAwesomeIcon icon={faEnvelope} />
            {unreadCount > 0 && (
              <span className="notification-badge" style={{ 
                position: 'absolute', 
                top: 3, 
                right: -9, 
                background: '#ff0000', 
                color: 'white', 
                borderRadius: '50%', 
                padding: unreadCount > 99 ? '3px 5px' : '3px 7px', 
                fontSize: 12, 
                fontWeight: '900',
                minWidth: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(255,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.8)',
                border: '2px solid #ffffff',
                zIndex: 10,
                animation: 'pulse 1.5s infinite',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap',
                lineHeight: 1
              }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>
        </div>
      </div>
      <div className={`main-content${sidebarOpen ? ' sidebar-open' : ''}`} style={{ minHeight: 'calc(100vh - 56px)', background: 'transparent' }}>
        {/* Welcome Banner - Only show on dashboard (announcements page) */}
        {location.pathname === '/associate/announcements' && (
          <div className="welcome-banner">
            <div className="welcome-banner-content">
              <div className="welcome-banner-left">
                <div className="welcome-banner-icon">
                  <FontAwesomeIcon icon={faBuilding} />
                </div>
                <div className="welcome-banner-text">
                  <h3>Welcome, {userDisplayName}</h3>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
      
      {/* Enhanced Profile Modal with Tabs */}
      <Modal
        isOpen={isProfileModalOpen}
        onRequestClose={() => setIsProfileModalOpen(false)}
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
            background: 'linear-gradient(135deg, #A11C22 0%, #C62828 100%)',
            color: 'white',
            padding: window.innerWidth <= 480 ? '15px 20px' : '20px 30px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsProfileModalOpen(false)}
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
            padding: '0'
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
                color: activeTab === 'profile' ? '#A11C22' : '#666',
                borderBottom: activeTab === 'profile' ? '3px solid #A11C22' : '3px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: activeTab === 'profile' ? '#A11C22' : '#6c757d',
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
                color: activeTab === 'password' ? '#A11C22' : '#666',
                borderBottom: activeTab === 'password' ? '3px solid #A11C22' : '3px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: activeTab === 'password' ? '#A11C22' : '#6c757d',
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
          <div 
            style={{ 
              padding: window.innerWidth <= 480 ? '20px' : '30px', 
              overflowY: 'auto', 
              flex: 1,
              maxHeight: 'calc(90vh - 120px)',
              overscrollBehavior: 'contain', // Prevent scroll chaining
              WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
            }}
            onWheel={(e) => {
              const target = e.currentTarget;
              const { scrollTop, scrollHeight, clientHeight } = target;
              const isAtTop = scrollTop === 0;
              const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
              
              // Prevent scroll propagation when at boundaries
              if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                e.stopPropagation();
              }
            }}
            onTouchStart={(e) => {
              const target = e.currentTarget;
              const touch = e.touches[0];
              target._touchStartY = touch.clientY;
              target._touchStartScrollTop = target.scrollTop;
            }}
            onTouchMove={(e) => {
              const target = e.currentTarget;
              const touch = e.touches[0];
              const { scrollTop, scrollHeight, clientHeight } = target;
              const isAtTop = scrollTop === 0;
              const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
              const deltaY = touch.clientY - (target._touchStartY || touch.clientY);
              
              // Prevent scroll propagation when at boundaries on touch devices
              if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
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
                    <FontAwesomeIcon icon={faBuilding} style={{ color: '#A11C22' }} />
                    Organization Profile Picture
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                    alignItems: window.innerWidth <= 480 ? 'center' : 'center',
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
                    <FontAwesomeIcon icon={faUser} style={{ color: '#A11C22' }} />
                    Organization Information
                  </h3>
                  
                  <form onSubmit={handleProfileInfoUpdate}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: '500',
                        color: '#333',
                        fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                      }}>
                        <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#666' }} />
                        Organization Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileFormChange}
                        placeholder="Enter your organization name"
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
                        <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '8px', color: '#666' }} />
                        Organization Type
                      </label>
                      <input
                        type="text"
                        name="type"
                        value={profileForm.type}
                        readOnly
                        style={{
                          width: '100%',
                          padding: window.innerWidth <= 480 ? '10px 12px' : '12px 16px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          boxSizing: 'border-box',
                          backgroundColor: '#f5f5f5',
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
                        Director Name
                      </label>
                      <input
                        type="text"
                        name="director"
                        value={profileForm.director}
                        onChange={handleProfileFormChange}
                        placeholder="Enter the director's name"
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
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          boxSizing: 'border-box',
                          backgroundColor: '#f5f5f5',
                          cursor: 'not-allowed'
                        }}
                        title="Email address cannot be changed"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading || !hasFormChanges}
                      style={{
                        background: hasFormChanges ? '#A11C22' : '#ccc',
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
                      {isLoading ? 'Updating...' : 'Update Profile Information'}
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
                  <FontAwesomeIcon icon={faLock} style={{ color: '#A11C22' }} />
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
                          {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong'}
                        </span>
                      </div>

                      {/* Password Suggestions */}
                      {passwordSuggestions.length > 0 && (
                        <div style={{
                          background: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            fontSize: window.innerWidth <= 480 ? '11px' : '12px',
                            fontWeight: '600',
                            color: '#856404',
                            marginBottom: '5px'
                          }}>
                            Suggestions to improve your password:
                          </div>
                          <ul style={{
                            margin: 0,
                            paddingLeft: '15px',
                            fontSize: window.innerWidth <= 480 ? '10px' : '11px',
                            color: '#856404'
                          }}>
                            {passwordSuggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '20px' }}>
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
                      background: '#A11C22',
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

                {/* Recovery Passcodes Section */}
                {arePasscodesExhausted() && (
                  <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    background: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '8px',
                    borderLeft: '4px solid #ffc107'
                  }}>
                    <h4 style={{
                      margin: '0 0 10px 0',
                      color: '#856404',
                      fontSize: window.innerWidth <= 480 ? '14px' : '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FontAwesomeIcon icon={faKey} />
                      Recovery Passcodes
                    </h4>
                    <p style={{
                      margin: '0 0 15px 0',
                      color: '#856404',
                      fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                    }}>
                      You have no recovery passcodes remaining. Generate new ones to secure your account.
                    </p>
                    <button
                      onClick={() => {
                        setShowPasscodeRegenModal(true);
                        setOtpCode('');
                        setOtpSent(false);
                        setPasscodeError('');
                        setPasscodeSuccess('');
                      }}
                      style={{
                        background: '#ffc107',
                        color: '#212529',
                        border: 'none',
                        padding: window.innerWidth <= 480 ? '10px 16px' : '12px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <FontAwesomeIcon icon={faKey} />
                      Generate New Recovery Passcodes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: window.innerWidth <= 480 ? '15px 20px' : '20px 30px',
            background: '#f8f9fa',
            borderTop: '1px solid #dee2e6'
          }}>
          </div>
        </div>
      </Modal>

      {/* Director Change Warning Modal */}
      <Modal
        isOpen={showDirectorWarning}
        onRequestClose={handleDirectorChangeCancel}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          },
          content: {
            position: 'relative',
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            border: 'none',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        <div style={{
          padding: '30px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            color: '#ffc107',
            marginBottom: '20px'
          }}>
            ⚠️
          </div>
          
          <h3 style={{
            color: '#333',
            marginBottom: '15px',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Director Change Warning
          </h3>
          
          <p style={{
            color: '#666',
            marginBottom: '25px',
            lineHeight: '1.5',
            fontSize: '14px'
          }}>
            You are about to change the director information. This will create a new director history record 
            and end the current director's tenure. <strong style={{ color: '#dc3545' }}>When changing the director, 
            you must also change your username.</strong> This action cannot be undone.
          </p>
          
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '25px',
            textAlign: 'left'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>Changes to be made:</h4>
            {pendingChanges.director !== originalDirectorValues.director && (
              <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                <strong>Director Name:</strong> "{originalDirectorValues.director}" → "{pendingChanges.director}"
              </p>
            )}
            {pendingChanges.email !== originalDirectorValues.email && (
              <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                <strong>Email Address:</strong> "{originalDirectorValues.email}" → "{pendingChanges.email}"
              </p>
            )}
            <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
              <strong>Username:</strong> Must be changed (see field below)
            </p>
          </div>
          
          <div style={{
            marginBottom: '25px',
            textAlign: 'left'
          }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333',
              fontSize: '14px'
            }}>
              <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#666' }} />
              New Username <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              value={warningModalUsername}
              onChange={(e) => {
                setWarningModalUsername(e.target.value);
                // Clear error when user starts typing
                if (profileError) {
                  setProfileError('');
                }
              }}
              placeholder="Enter new username"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: profileError ? '1px solid #dc3545' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              required
            />
            <p style={{
              margin: '5px 0 0 0',
              fontSize: '12px',
              color: '#666',
              fontStyle: 'italic'
            }}>
              Current username: <strong>{originalDirectorValues.username}</strong>
            </p>
            {profileError && (
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: '#dc3545',
                fontWeight: '500'
              }}>
                {profileError}
              </p>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleDirectorChangeCancel}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '120px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDirectorChangeConfirm}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '120px'
              }}
            >
              Confirm Change
            </button>
          </div>
        </div>
      </Modal>

      {/* Passcode Regeneration Modal */}
      <Modal
        isOpen={showPasscodeRegenModal}
        onRequestClose={() => setShowPasscodeRegenModal(false)}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          },
          content: {
            position: 'relative',
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            border: 'none',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        <div style={{
          padding: '30px',
          textAlign: 'center'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#333'
          }}>
            Generate New Recovery Passcodes
          </h3>
          
          <p style={{
            color: '#666',
            marginBottom: '25px',
            lineHeight: '1.5',
            fontSize: '14px'
          }}>
            For security, we'll send an OTP to your email to verify your identity before generating new recovery passcodes.
          </p>

          {/* Error and Success Messages */}
          {passcodeError && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ffcdd2',
              fontSize: '14px'
            }}>
              {passcodeError}
            </div>
          )}
          {passcodeSuccess && (
            <div style={{
              background: '#e8f5e8',
              color: '#2e7d32',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #c8e6c9',
              fontSize: '14px'
            }}>
              {passcodeSuccess}
            </div>
          )}

          {!otpSent ? (
            <div>
              <button
                onClick={sendOtpForPasscodeRegen}
                style={{
                  background: '#A11C22',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
              >
                <FontAwesomeIcon icon={faKey} />
                Send OTP to Email
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit OTP code"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    fontFamily: 'monospace'
                  }}
                  maxLength="6"
                />
              </div>
              
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => {
                    setShowPasscodeRegenModal(false);
                    setOtpCode('');
                    setOtpSent(false);
                    setPasscodeError('');
                    setPasscodeSuccess('');
                  }}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={verifyOtpAndGeneratePasscodes}
                  disabled={!otpCode || otpCode.length !== 6 || isGeneratingPasscodes}
                  style={{
                    background: isGeneratingPasscodes ? '#ccc' : '#A11C22',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: isGeneratingPasscodes ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: isGeneratingPasscodes ? 0.6 : 1
                  }}
                >
                  {isGeneratingPasscodes ? 'Generating...' : 'Generate Passcodes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default AssociateLayout; 
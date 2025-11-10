import React, { useState, useEffect } from 'react';
import '../css/AdminDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTachometerAlt, faUsers, faBell, faCheckCircle, faBullhorn, faGraduationCap, faChartBar, faSignOutAlt, faBars, faTimes, faUser, faEnvelope, faBuilding, faLock, faEye, faEyeSlash, faBellSlash, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Modal from 'react-modal';
import axiosInstance from '../../../utils/axiosConfig';

import { API_BASE } from '../../../utils/url';
import { 
  isPushNotificationSupported, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed 
} from '../../../utils/pushNotifications';

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [announcementSubmenuOpen, setAnnouncementSubmenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // New state for tab management
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
  const [userDisplayName, setUserDisplayName] = useState('Admin');
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
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const ADMIN_NOTIF_RESPONSE_KEY = 'adminNotifResponseViewed';
  const ADMIN_APPLICATIONS_VIEWED_KEY = 'adminApplicationsViewed';
  const [editProfileHover, setEditProfileHover] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [pushNotificationsSupported, setPushNotificationsSupported] = useState(false);

  const toggleSidebar = () => setSidebarOpen(open => !open);
  const closeSidebar = () => setSidebarOpen(false);

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
    
    // Check if any form field has changed (excluding read-only fields)
    const updatedForm = { ...profileForm, [name]: value };
    const hasChanges = updatedForm.username !== originalProfileValues.username || newProfileImage !== null;
    setHasFormChanges(hasChanges);
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setProfileError('Please upload a valid image file (JPEG, PNG, JPG, or GIF)');
        return;
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setProfileError('File size should not exceed 2MB');
        return;
      }
      setNewProfileImage(file);
      setProfileError('');
      
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        console.log('Image preview set:', reader.result.substring(0, 50) + '...');
      };
      reader.readAsDataURL(file);
      
      // Mark as having changes when image is selected
      // Also check if username has changed
      const usernameChanged = profileForm.username !== originalProfileValues.username;
      setHasFormChanges(true);
    } else {
      // Clear preview if no file selected
      setImagePreview(null);
      setNewProfileImage(null);
      
      // Check if username has changed
      const usernameChanged = profileForm.username !== originalProfileValues.username;
      setHasFormChanges(usernameChanged);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Check if username has changed or if there's a new profile image
      const usernameChanged = profileForm.username !== originalProfileValues.username;
      const hasChanges = usernameChanged || newProfileImage !== null;
      
      if (hasChanges) {
        const formData = new FormData();
        
        // If username changed, use the update endpoint (requires all fields)
        if (usernameChanged) {
          // Include all required fields for the update endpoint
          formData.append('name', profileForm.name);
          formData.append('email', profileForm.email);
          formData.append('username', profileForm.username);
          
          // Add profile picture if selected
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
          // Only updating picture, use the simpler endpoint
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
      }
      
      // Refresh profile data to update UI
      await fetchProfile();
      // Reset form changes state
      setHasFormChanges(false);
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
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
    if (showProfileModal) {
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
  }, [showProfileModal]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
      
      // Update profile form with current data
      const profileData = {
        name: response.data.name || 'Mark Carlo Garcia',
        email: response.data.email || '',
        username: response.data.username || ''
      };
      setProfileForm(profileData);
      
      // Store original values for change detection
      setOriginalProfileValues(profileData);
      
      // Update user display name for sidebar with actual user name
      setUserDisplayName(response.data.name || 'Head Admin');
      
      // Update profile image
      if (response.data.profile_picture_url) {
        setProfileImage(response.data.profile_picture_url);
      } else {
        setProfileImage('/Assets/disaster_logo.png');
      }
      
      // Reset form changes state when loading fresh data
      setHasFormChanges(false);
      // Clear image preview when loading fresh data
      setImagePreview(null);
      setNewProfileImage(null);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const fetchNotifications = async () => {
    const res = await fetch(`${API_BASE}/api/notifications`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}` } });
    const data = await res.json();
    const viewed = JSON.parse(localStorage.getItem(ADMIN_NOTIF_RESPONSE_KEY) || '{}');
    let unread = 0;
    if (Array.isArray(data)) {
      data.forEach(n => {
        if (!n.recipients) return;
        n.recipients.forEach(r => {
          if (r.response && r.responded_at) {
            if (!viewed[n.id] || viewed[n.id][r.user_id] !== r.responded_at) {
              unread++;
            }
          }
        });
      });
    }
    setUnreadCount(unread);
  };

  const fetchPendingApplicationsCount = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/pending-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const applications = response.data || [];
      const viewed = JSON.parse(localStorage.getItem(ADMIN_APPLICATIONS_VIEWED_KEY) || '{}');
      
      // Clean up viewed applications that no longer exist
      const currentAppIds = applications.map(app => app.id);
      const cleanedViewed = {};
      Object.keys(viewed).forEach(appId => {
        if (currentAppIds.includes(parseInt(appId))) {
          cleanedViewed[appId] = viewed[appId];
        }
      });
      localStorage.setItem(ADMIN_APPLICATIONS_VIEWED_KEY, JSON.stringify(cleanedViewed));
      
      // Count only applications that haven't been viewed
      let unviewedCount = 0;
      applications.forEach(app => {
        if (!cleanedViewed[app.id]) {
          unviewedCount++;
        }
      });
      
      setPendingApplicationsCount(unviewedCount);
    } catch (error) {
      console.error('Error fetching pending applications count:', error);
      setPendingApplicationsCount(0);
    }
  };

  useEffect(() => {
    fetchProfile(); // Fetch profile on initial load
    fetchNotifications();
    fetchPendingApplicationsCount();
    checkPushNotificationStatus();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPendingApplicationsCount();
    }, 15000); // Poll every 15 seconds for notifications and pending applications
    return () => clearInterval(interval);
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

  useEffect(() => {
    if (location.pathname === '/admin/notifications') {
      fetch(`${API_BASE}/api/notifications`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const viewed = JSON.parse(localStorage.getItem(ADMIN_NOTIF_RESPONSE_KEY) || '{}');
            data.forEach(n => {
              if (!n.recipients) return;
              n.recipients.forEach(r => {
                if (r.response && r.responded_at) {
                  if (!viewed[n.id]) viewed[n.id] = {};
                  viewed[n.id][r.user_id] = r.responded_at;
                }
              });
            });
            localStorage.setItem(ADMIN_NOTIF_RESPONSE_KEY, JSON.stringify(viewed));
            setUnreadCount(0);
          }
        });
    }
  }, [location.pathname]);

  useEffect(() => {
    // Auto-expand announcement submenu if Announcement or Training Program is active
    if (location.pathname === '/admin/announcement' || location.pathname === '/admin/training-program') {
      setAnnouncementSubmenuOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/admin/associate-groups') {
      fetch(`${API_BASE}/api/pending-applications`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const viewed = JSON.parse(localStorage.getItem(ADMIN_APPLICATIONS_VIEWED_KEY) || '{}');
            data.forEach(app => {
              viewed[app.id] = true; // Mark as viewed
            });
            localStorage.setItem(ADMIN_APPLICATIONS_VIEWED_KEY, JSON.stringify(viewed));
            setPendingApplicationsCount(0);
          }
        })
        .catch(error => {
          console.error('Error marking applications as viewed:', error);
        });
    }
  }, [location.pathname]);

  // Add event listener to close sidebar on Escape key
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

  return (
    <div className="admin-dashboard-fixed-layout" style={{ minHeight: '100vh', background: '#f4f4f4', height: '100vh' }}>
      {/* Sidebar Overlay and Drawer */}
      <div>
        {/* Overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={closeSidebar} />
        )}
        {/* Sidebar Drawer */}
        <nav className={`sidebar-drawer${sidebarOpen ? ' open' : ''}`} tabIndex="-1">
          <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close Sidebar">
            <FontAwesomeIcon icon={faTimes} />
          </button>
          {/* Sidebar content here */}
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
                  setShowProfileModal(true);
                  setActiveTab('profile'); // Reset to profile tab when opening modal
                  setImagePreview(null);
                  setNewProfileImage(null);
                  setProfileError('');
                  setProfileSuccess('');
                  setPasswordError('');
                  setPasswordSuccess('');
                  setHasFormChanges(false);
                  // Only fetch profile if we don't have a recent image update
                  // This prevents overriding a recently updated profile image
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
              <li className={isActive('/admin/dashboard') ? 'active' : ''} onClick={() => { navigate('/admin/dashboard'); closeSidebar(); }}><FontAwesomeIcon icon={faTachometerAlt} /> DASHBOARD</li>
              <li className={isActive('/admin/associate-groups') ? 'active' : ''} onClick={() => { navigate('/admin/associate-groups'); closeSidebar(); }} style={{ position: 'relative' }}>
                <span><FontAwesomeIcon icon={faUsers} /> ASSOCIATE GROUPS</span>
                {pendingApplicationsCount > 0 && (
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
                  }}>{pendingApplicationsCount}</span>
                )}
              </li>
              <li className={isActive('/admin/notifications') ? 'active' : ''} onClick={() => { navigate('/admin/notifications'); closeSidebar(); }} style={{ position: 'relative' }}>
                <span><FontAwesomeIcon icon={faBell} /> NOTIFICATIONS</span>
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
              <li className={isActive('/admin/approval-aor') ? 'active' : ''} onClick={() => { navigate('/admin/approval-aor'); closeSidebar(); }}><FontAwesomeIcon icon={faCheckCircle} /> APPROVAL/AOR</li>
              <li className={`nav-parent ${isActive('/admin/announcement') || isActive('/admin/training-program') ? 'parent-active' : ''}`}>
                <div 
                  className="nav-parent-trigger" 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setAnnouncementSubmenuOpen(!announcementSubmenuOpen);
                  }}
                >
                  <FontAwesomeIcon icon={faBullhorn} /> POSTING
                  <FontAwesomeIcon 
                    icon={announcementSubmenuOpen ? faChevronDown : faChevronRight} 
                    className="nav-chevron"
                  />
                </div>
                {announcementSubmenuOpen && (
                  <ul className="nav-submenu">
                    <li className={isActive('/admin/announcement') ? 'active' : ''} onClick={() => { navigate('/admin/announcement'); closeSidebar(); }}>
                      <FontAwesomeIcon icon={faBullhorn} /> ANNOUNCEMENT
                    </li>
                    <li className={isActive('/admin/training-program') ? 'active' : ''} onClick={() => { navigate('/admin/training-program'); closeSidebar(); }}>
                      <FontAwesomeIcon icon={faGraduationCap} /> TRAINING PROGRAM
                    </li>
                  </ul>
                )}
              </li>
              <li className={isActive('/admin/evaluation') ? 'active' : ''} onClick={() => { navigate('/admin/evaluation'); closeSidebar(); }}><FontAwesomeIcon icon={faChartBar} /> EVALUATION</li>
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
      {/* Hamburger Button (always visible in header) */}
      <div className="header">
        <div className="header-left">
          <button className="burger-icon" onClick={toggleSidebar} aria-label="Open Sidebar">
            <FontAwesomeIcon icon={faBars} />
              </button>
          <span className="dpar-text">DPAR</span>
        </div>
        <div className="header-right">
          <div className="notification-icon" onClick={() => navigate('/admin/notifications')} style={{ cursor: 'pointer', position: 'relative', overflow: 'visible' }}>
            <FontAwesomeIcon icon={faBell} />
            {unreadCount > 0 && (
              <span className="notification-badge" style={{ 
                position: 'absolute', 
                top: 3, 
                right: -11, 
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
      {/* Main content (dimmed when sidebar is open) */}
      <div className={`main-content${sidebarOpen ? ' sidebar-open' : ''}`} style={{ minHeight: 'calc(100vh - 56px)', background: 'transparent' }}>
          {children}
      </div>
      {/* Enhanced Profile Modal */}
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
            background: 'linear-gradient(135deg, #A11C22 0%, #C62828 100%)',
            color: 'white',
            padding: window.innerWidth <= 480 ? '15px 20px' : '20px 30px',
            textAlign: 'center',
            position: 'relative'
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
                    <FontAwesomeIcon icon={faUser} style={{ color: '#A11C22' }} />
                    Admin Profile Picture
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
    </div>
  );
}

export default AdminLayout; 
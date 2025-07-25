import React, { useState, useEffect } from 'react';
import '../css/AssociateDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faBullhorn, faUsers, faEnvelope, faChartBar, faSignOutAlt, faBars, faKey, faTimes, faUser, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';

const API_BASE = 'http://localhost:8000';

function AssociateLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    organization: '',
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    organization: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState('/Assets/disaster_logo.png');
  const [imagePreview, setImagePreview] = useState(null);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [userDisplayName, setUserDisplayName] = useState('Associate');
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = Number(localStorage.getItem('userId'));
  const userOrganization = localStorage.getItem('userOrganization');
  const NOTIF_READ_KEY = `associateNotifRead_${userId}`;
  const [notifications, setNotifications] = useState([]);
  const [editProfileHover, setEditProfileHover] = useState(false);

  const toggleSidebar = () => {
    console.log('Toggle sidebar called');
    setSidebarOpen(open => !open);
  };
  
  const closeSidebar = () => {
    console.log('Close sidebar called');
    setSidebarOpen(false);
  };

  const isActive = (route) => location.pathname === route;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get('http://localhost:8000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axios.post(`${API_BASE}/api/change-password`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Password changed successfully');
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });
      fetchProfile();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to change password');
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
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, JPG, or GIF)');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('File size should not exceed 2MB');
        return;
      }
      setNewProfileImage(file);
      setError('');
      
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (newProfileImage) {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('profile_picture', newProfileImage);
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await axios.post(`${API_BASE}/api/profile/update-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        setSuccess('Profile picture updated successfully');
        setNewProfileImage(null);
        // Update the profile image in the UI
        if (response.data.profile_picture_url) {
          setProfileImage(response.data.profile_picture_url);
        }
        setImagePreview(null); // Clear preview
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to update profile picture');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleProfileInfoUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axios.post(`${API_BASE}/api/profile/update`, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Profile information updated successfully');
      // Refresh profile data to update UI
      await fetchProfile();
      // Force a re-render by updating the profile data
      setProfileForm(prev => ({ ...prev }));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update profile form with current data
      setProfileForm({
        name: response.data.name || '',
        email: response.data.email || '',
        organization: response.data.organization || ''
      });
      
      // Update profile data
      setProfileData({
        name: response.data.name || '',
        email: response.data.email || '',
        organization: response.data.organization || '',
      });
      
      // Update user display name for sidebar
      setUserDisplayName(response.data.name || 'Associate');
      
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

  const customModalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      width: '90%', // Responsive width
      maxWidth: '600px', // Maximum width for larger screens
      minWidth: '320px', // Minimum width for mobile
      maxHeight: '90vh', // Responsive height
      padding: '0',
      borderRadius: '12px',
      border: 'none',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      zIndex: 1001,
      // Mobile-first responsive design
      '@media (max-width: 480px)': {
        width: '95%',
        maxHeight: '95vh',
        margin: '10px',
      },
      '@media (min-width: 481px) and (max-width: 768px)': {
        width: '90%',
        maxWidth: '500px',
      },
      '@media (min-width: 769px) and (max-width: 1024px)': {
        width: '85%',
        maxWidth: '550px',
      },
      '@media (min-width: 1025px)': {
        width: '80%',
        maxWidth: '600px',
      }
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
      padding: '10px', // Add padding for mobile
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '@media (max-width: 480px)': {
        padding: '5px',
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up periodic refresh of unread count
    const interval = setInterval(() => {
      const calculateUnreadCount = async () => {
        try {
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          const response = await axios.get('http://localhost:8000/api/notifications', {
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
        const response = await axios.get('http://localhost:8000/api/notifications', {
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

  return (
    <div className={`associate-dashboard-fixed-layout${sidebarOpen ? ' sidebar-open' : ''}`} style={{ minHeight: '100vh', background: '#f4f4f4', height: '100vh' }}>
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
                  setError(''); 
                  setSuccess(''); 
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
            <button className="logout-button" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
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
          <div className="notification-icon" onClick={() => navigate('/associate/notification')} style={{ cursor: 'pointer', position: 'relative' }}>
            <FontAwesomeIcon icon={faEnvelope} />
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: 6, 
                right: -20, 
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
          </div>
        </div>
      </div>
      <div className={`main-content${sidebarOpen ? ' sidebar-open' : ''}`} style={{ minHeight: 'calc(100vh - 56px)', background: 'transparent' }}>
        {children}
      </div>
      
      {/* Enhanced Profile Modal */}
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
            textAlign: 'center'
          }}>
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

          {/* Content */}
          <div style={{ 
            padding: window.innerWidth <= 480 ? '20px' : '30px', 
            overflowY: 'auto', 
            flex: 1,
            maxHeight: 'calc(90vh - 120px)'
          }}>
            {/* Error and Success Messages */}
            {error && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ffcdd2',
                fontSize: window.innerWidth <= 480 ? '12px' : '14px'
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{
                background: '#e8f5e8',
                color: '#2e7d32',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #c8e6c9',
                fontSize: window.innerWidth <= 480 ? '12px' : '14px'
              }}>
                {success}
              </div>
            )}

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
                Profile Picture
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
                  {newProfileImage && (
                    <button 
                      onClick={handleProfileUpdate} 
                      disabled={isLoading}
                      style={{
                        background: '#A11C22',
                        color: 'white',
                        border: 'none',
                        padding: window.innerWidth <= 480 ? '8px 16px' : '10px 20px',
                        borderRadius: '6px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                        fontWeight: '500',
                        opacity: isLoading ? 0.6 : 1,
                        width: window.innerWidth <= 480 ? '100%' : 'auto'
                      }}
                    >
                      {isLoading ? 'Updating...' : 'Update Profile Picture'}
                    </button>
                  )}
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
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileFormChange}
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
                    onChange={handleProfileFormChange}
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

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333',
                    fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                  }}>
                    <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '8px', color: '#666' }} />
                    Organization
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={profileForm.organization}
                    onChange={handleProfileFormChange}
                    style={{
                      width: '100%',
                      padding: window.innerWidth <= 480 ? '10px 12px' : '12px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                      boxSizing: 'border-box'
                    }}
                  />
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
                    marginRight: '10px',
                    width: window.innerWidth <= 480 ? '100%' : 'auto'
                  }}
                >
                  {isLoading ? 'Updating...' : 'Update Profile Information'}
                </button>
              </form>
            </div>

            {/* Change Password Section */}
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
                <FontAwesomeIcon icon={faKey} style={{ color: '#A11C22' }} />
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
                  <input
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordFormChange}
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
                    New Password
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordFormChange}
                    style={{
                      width: '100%',
                      padding: window.innerWidth <= 480 ? '10px 12px' : '12px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                      boxSizing: 'border-box'
                    }}
                    required
                    minLength="8"
                  />
                </div>
                
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
                  <input
                    type="password"
                    name="new_password_confirmation"
                    value={passwordForm.new_password_confirmation}
                    onChange={handlePasswordFormChange}
                    style={{
                      width: '100%',
                      padding: window.innerWidth <= 480 ? '10px 12px' : '12px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                      boxSizing: 'border-box'
                    }}
                    required
                    minLength="8"
                  />
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
                    marginRight: '10px',
                    width: window.innerWidth <= 480 ? '100%' : 'auto'
                  }}
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: window.innerWidth <= 480 ? '15px 20px' : '20px 30px',
            background: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
            textAlign: 'right'
          }}>
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: window.innerWidth <= 480 ? '8px 16px' : '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                fontWeight: '500',
                width: window.innerWidth <= 480 ? '100%' : 'auto'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AssociateLayout; 
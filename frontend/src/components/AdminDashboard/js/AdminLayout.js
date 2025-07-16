import React, { useState, useEffect } from 'react';
import '../css/AdminDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTachometerAlt, faUsers, faBell, faCheckCircle, faBullhorn, faGraduationCap, faChartBar, faSignOutAlt, faBars, faTimes, faUser, faEnvelope, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
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
    organization: ''
  });
  const [userDisplayName, setUserDisplayName] = useState('Admin');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const ADMIN_NOTIF_RESPONSE_KEY = 'adminNotifResponseViewed';
  const [editProfileHover, setEditProfileHover] = useState(false);

  const toggleSidebar = () => setSidebarOpen(open => !open);
  const closeSidebar = () => setSidebarOpen(false);

  const isActive = (route) => location.pathname === route;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
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
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, JPG, or GIF)');
        return;
      }
      // Validate file size (2MB)
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

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
      
      // Update profile form with current data
      setProfileForm({
        name: response.data.name || '',
        email: response.data.email || '',
        organization: response.data.organization || ''
      });
      
      // Update user display name for sidebar
      setUserDisplayName(response.data.name || 'Admin');
      
      // Update profile image
      if (response.data.profile_picture_url) {
        setProfileImage(response.data.profile_picture_url);
      } else {
        setProfileImage('/Assets/disaster_logo.png');
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const fetchNotifications = async () => {
    const res = await fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}` } });
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

  useEffect(() => {
    fetchProfile(); // Fetch profile on initial load
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15 seconds for notifications
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin/notifications') {
      fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}` } })
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
                  setImagePreview(null);
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
              <li className={isActive('/admin/dashboard') ? 'active' : ''} onClick={() => { navigate('/admin/dashboard'); closeSidebar(); }}><FontAwesomeIcon icon={faTachometerAlt} /> DASHBOARD</li>
              <li className={isActive('/admin/associate-groups') ? 'active' : ''} onClick={() => { navigate('/admin/associate-groups'); closeSidebar(); }}><FontAwesomeIcon icon={faUsers} /> ASSOCIATE GROUPS</li>
              <li className={isActive('/admin/notifications') ? 'active' : ''} onClick={() => { navigate('/admin/notifications'); closeSidebar(); }} style={{ position: 'relative' }}>
                <span><FontAwesomeIcon icon={faBell} /> NOTIFICATIONS</span>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: 2, right: 0, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
                    )}
                  </li>
              <li className={isActive('/admin/approval-aor') ? 'active' : ''} onClick={() => { navigate('/admin/approval-aor'); closeSidebar(); }}><FontAwesomeIcon icon={faCheckCircle} /> APPROVAL/AOR</li>
              <li className={isActive('/admin/announcement') ? 'active' : ''} onClick={() => { navigate('/admin/announcement'); closeSidebar(); }}><FontAwesomeIcon icon={faBullhorn} /> ANNOUNCEMENT</li>
              <li className={isActive('/admin/training-program') ? 'active' : ''} onClick={() => { navigate('/admin/training-program'); closeSidebar(); }}><FontAwesomeIcon icon={faGraduationCap} /> TRAINING PROGRAM</li>
              <li className={isActive('/admin/evaluation') ? 'active' : ''} onClick={() => { navigate('/admin/evaluation'); closeSidebar(); }}><FontAwesomeIcon icon={faChartBar} /> EVALUATION</li>
            </ul>
          </nav>
          <div className="sidebar-footer" style={{ marginTop: 'auto', marginBottom: 24 }}>
              <button className="logout-button" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Logout
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
          <div className="notification-icon" onClick={() => navigate('/admin/notifications')} style={{ cursor: 'pointer', position: 'relative' }}>
            <FontAwesomeIcon icon={faBell} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
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
                <FontAwesomeIcon icon={faUser} style={{ color: '#A11C22' }} />
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
              onClick={() => setShowProfileModal(false)}
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

export default AdminLayout; 
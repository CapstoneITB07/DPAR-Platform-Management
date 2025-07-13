import React, { useState, useEffect } from 'react';
import '../css/AssociateDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faBullhorn, faUsers, faEnvelope, faChartBar, faSignOutAlt, faBars, faKey, faTimes } from '@fortawesome/free-solid-svg-icons';
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
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileImage, setProfileImage] = useState('/Assets/disaster_logo.png');
  const [newProfileImage, setNewProfileImage] = useState(null);
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
    }
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (newProfileImage) {
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
        if (response.data.logo) {
          setProfileImage(`${API_BASE}/storage/${response.data.logo}`);
        }
        fetchProfile();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to update profile picture');
      }
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = response.data;
      if (user.logo) {
        setProfileImage(getLogoUrl(user.logo));
      } else {
        setProfileImage(`${window.location.origin}/Assets/disaster_logo.png`);
      }
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        organization: user.organization || '',
      });
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

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (location.pathname === '/associate/notification') {
      fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const readIds = data.map(n => n.id);
            localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(readIds));
            setUnreadCount(0);
          }
        });
    }
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

  const customModalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      width: '500px',
      maxHeight: '80vh',
      padding: '20px',
      borderRadius: '8px',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)'
    }
  };

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
              }}>{profileData.name || 'Associate'}</p>
              <p
                className="edit-profile"
                onClick={() => { setIsProfileModalOpen(true); setError(''); setSuccess(''); }}
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
              <li className={isActive('/associate/notification') ? 'active' : ''} onClick={() => { navigate('/associate/notification'); closeSidebar(); }}><FontAwesomeIcon icon={faEnvelope} /> NOTIFICATION</li>
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
              <span style={{ position: 'absolute', top: -6, right: -6, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
            )}
          </div>
        </div>
      </div>
      <div className={`main-content${sidebarOpen ? ' sidebar-open' : ''}`} style={{ minHeight: 'calc(100vh - 56px)', background: 'transparent' }}>
        {children}
      </div>
      <Modal
        isOpen={isProfileModalOpen}
        onRequestClose={() => setIsProfileModalOpen(false)}
        style={customModalStyles}
        contentLabel="Edit Profile"
      >
        <div className="profile-modal">
          <h2>Edit Profile</h2>
          <div className="profile-image-section">
            <img
              src={profileImage}
              alt="Profile"
              className="profile-modal-image"
              style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '20px' }}
            />
            <div className="profile-image-upload">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/gif"
                onChange={handleProfileImageChange}
                style={{ marginBottom: '10px' }}
              />
              <small>Accepted formats: JPEG, PNG, JPG, GIF (max 2MB)</small>
              {newProfileImage && (
                <button onClick={handleProfileUpdate} className="save-button" style={{ marginTop: '10px' }}>
                  Update Profile Picture
                </button>
              )}
            </div>
          </div>

          <div className="password-change-section">
            <h3>Change Password</h3>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordFormChange}
                  required
                  minLength="8"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="new_password_confirmation"
                  value={passwordForm.new_password_confirmation}
                  onChange={handlePasswordFormChange}
                  required
                  minLength="8"
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="save-button">Change Password</button>
                <button type="button" className="cancel-button" onClick={() => setIsProfileModalOpen(false)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AssociateLayout; 
import React, { useState, useEffect } from 'react';
import '../css/AssociateDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faBullhorn, faUsers, faEnvelope, faChartBar, faSignOutAlt, faBars, faKey, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';

function AssociateLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
  const [showNotifications, setShowNotifications] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const isActive = (route) => location.pathname === route;

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
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
      const token = localStorage.getItem('authToken');
      await axios.post(`${API_BASE}/api/change-password`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Password changed successfully');
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });

      // Fetch updated profile data
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
        
        const token = localStorage.getItem('authToken');
        const response = await axios.post(`${API_BASE}/api/profile/update-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        
        setSuccess('Profile picture updated successfully');
        setNewProfileImage(null);

        // Update the profile image with the new URL from the response
        if (response.data.logo) {
          setProfileImage(`${API_BASE}/storage/${response.data.logo}`);
        }

        // Fetch updated profile data
        fetchProfile();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to update profile picture');
      }
    }
  };

  // Move fetchProfile to a separate function so it can be reused
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
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

  const API_BASE = 'http://localhost:8000';

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
    fetchProfile();
  }, []);

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
    <div className="associate-dashboard-fixed-layout">
      {/* Header Bar */}
      <header className="header">
        <div className="header-left">
          <div className="burger-icon" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBars} />
          </div>
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
      </header>
      <div style={{ display: 'flex' }}>
        <div
          className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
          style={{
            position: 'fixed',
            top: 48,
            left: 0,
            height: 'calc(100vh - 48px)',
            width: isSidebarOpen ? 240 : 60,
            zIndex: 100,
            background: '#fff',
            boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'width 0.2s',
          }}
        >
          <div className="sidebar-header">
            {isSidebarOpen && (
              <div className="user-profile">
                <img 
                  src={profileImage}
                  alt="Profile"
                  className="profile-icon"
                  loading="eager"
                  onError={(e) => {
                    e.target.src = '/Assets/disaster_logo.png';
                  }}
                />
                <div className="user-info">
                  <p className="user-name">{profileData.name || 'Associate'}</p>
                  <p className="edit-profile" onClick={() => setIsProfileModalOpen(true)} style={{ cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={faEdit} /> Edit Profile
                  </p>
                </div>
              </div>
            )}
          </div>
          <nav className="sidebar-nav">
            <ul>
              {isSidebarOpen && (
                <>
                  <li className={isActive('/associate/announcements') ? 'active' : ''} onClick={() => navigate('/associate/announcements')}><FontAwesomeIcon icon={faBullhorn} /> ANNOUNCEMENTS</li>
                  <li className={isActive('/associate/volunteer-list') ? 'active' : ''} onClick={() => navigate('/associate/volunteer-list')}><FontAwesomeIcon icon={faUsers} /> VOLUNTEER LIST</li>
                  <li className={isActive('/associate/notification') ? 'active' : ''} onClick={() => navigate('/associate/notification')}><FontAwesomeIcon icon={faEnvelope} /> NOTIFICATION</li>
                  <li className={isActive('/associate/reports') ? 'active' : ''} onClick={() => navigate('/associate/reports')}><FontAwesomeIcon icon={faChartBar} /> REPORTS</li>
                </>
              )}
              {!isSidebarOpen && (
                <>
                  <li className={isActive('/associate/announcements') ? 'active' : ''} onClick={() => navigate('/associate/announcements')}><FontAwesomeIcon icon={faBullhorn} /></li>
                  <li className={isActive('/associate/volunteer-list') ? 'active' : ''} onClick={() => navigate('/associate/volunteer-list')}><FontAwesomeIcon icon={faUsers} /></li>
                  <li className={isActive('/associate/notification') ? 'active' : ''} onClick={() => navigate('/associate/notification')}><FontAwesomeIcon icon={faEnvelope} /></li>
                  <li className={isActive('/associate/reports') ? 'active' : ''} onClick={() => navigate('/associate/reports')}><FontAwesomeIcon icon={faChartBar} /></li>
                </>
              )}
            </ul>
          </nav>
          <div className="sidebar-footer">
            {isSidebarOpen && (
              <button className="logout-button" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Logout
              </button>
            )}
            {!isSidebarOpen && (
              <button className="logout-button-icon-only" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            )}
          </div>
        </div>
        <main className="main-content" style={{ marginLeft: isSidebarOpen ? 240 : 60, width: isSidebarOpen ? 'calc(100% - 240px)' : 'calc(100% - 60px)', transition: 'margin-left 0.2s, width 0.2s', minHeight: 'calc(100vh - 56px)', background: 'transparent' }}>
          {children}
        </main>
      </div>

      {/* Profile Modal */}
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
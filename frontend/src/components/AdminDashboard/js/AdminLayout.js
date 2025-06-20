import React, { useState, useEffect } from 'react';
import '../css/AdminDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTachometerAlt, faUsers, faBell, faCheckCircle, faBullhorn, faGraduationCap, faChartBar, faSignOutAlt, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImage, setProfileImage] = useState('/Assets/disaster_logo.png');
  const [imagePreview, setImagePreview] = useState(null);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const ADMIN_NOTIF_RESPONSE_KEY = 'adminNotifResponseViewed';

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const isActive = (route) => location.pathname === route;

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
        setImagePreview(reader.result);
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
        await axios.post(`${API_BASE}/api/profile/update-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        
        setSuccess('Profile picture updated successfully');
        setNewProfileImage(null);
        // Fetch the new profile image to update the UI
        const response = await axios.get(`${API_BASE}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.profile_picture_url) {
          setProfileImage(`${API_BASE}/storage/${response.data.profile_picture_url}`);
        }
        setImagePreview(null); // Clear preview
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to update profile picture');
      }
    }
  };

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
      zIndex: 1001 // Ensure modal is on top
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.profile_picture_url) {
        setProfileImage(`${API_BASE}/storage/${response.data.profile_picture_url}`);
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const fetchNotifications = async () => {
    const res = await fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
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
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin/notifications') {
      fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
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

  return (
    <div className="admin-dashboard-fixed-layout" style={{ minHeight: '100vh', background: '#f4f4f4', height: '100vh' }}>
      {/* Header Bar */}
      <header className="header">
        <div className="header-left">
          <div className="burger-icon" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBars} />
          </div>
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
      </header>
      <div style={{ display: 'flex' }}>
        <div
          className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
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
                  <p className="user-name">Admin</p>
                  <p className="edit-profile" onClick={() => {
                    setShowProfileModal(true);
                    setImagePreview(null); // Reset preview when opening modal
                    setError('');
                    setSuccess('');
                  }} style={{ cursor: 'pointer' }}>
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
                  <li className={isActive('/admin/dashboard') ? 'active' : ''} onClick={() => navigate('/admin/dashboard')}><FontAwesomeIcon icon={faTachometerAlt} /> DASHBOARD</li>
                  <li className={isActive('/admin/associate-groups') ? 'active' : ''} onClick={() => navigate('/admin/associate-groups')}><FontAwesomeIcon icon={faUsers} /> ASSOCIATE GROUPS</li>
                  <li className={isActive('/admin/notifications') ? 'active' : ''} onClick={() => navigate('/admin/notifications')} style={{ position: 'relative' }}>
                    <span onClick={() => navigate('/admin/notifications')}><FontAwesomeIcon icon={faBell} /> NOTIFICATIONS</span>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: 2, right: 0, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
                    )}
                  </li>
                  <li className={isActive('/admin/approval-aor') ? 'active' : ''} onClick={() => navigate('/admin/approval-aor')}><FontAwesomeIcon icon={faCheckCircle} /> APPROVAL/AOR</li>
                  <li className={isActive('/admin/announcement') ? 'active' : ''} onClick={() => navigate('/admin/announcement')}><FontAwesomeIcon icon={faBullhorn} /> ANNOUNCEMENT</li>
                  <li className={isActive('/admin/training-program') ? 'active' : ''} onClick={() => navigate('/admin/training-program')}><FontAwesomeIcon icon={faGraduationCap} /> TRAINING PROGRAM</li>
                  <li className={isActive('/admin/evaluation') ? 'active' : ''} onClick={() => navigate('/admin/evaluation')}><FontAwesomeIcon icon={faChartBar} /> EVALUATION</li>
                </>
              )}
              {!isSidebarOpen && (
                <>
                  <li className={isActive('/admin/dashboard') ? 'active' : ''} onClick={() => navigate('/admin/dashboard')}><FontAwesomeIcon icon={faTachometerAlt} /></li>
                  <li className={isActive('/admin/associate-groups') ? 'active' : ''} onClick={() => navigate('/admin/associate-groups')}><FontAwesomeIcon icon={faUsers} /></li>
                  <li className={isActive('/admin/notifications') ? 'active' : ''} onClick={() => navigate('/admin/notifications')} style={{ position: 'relative' }}>
                    <span onClick={() => navigate('/admin/notifications')}><FontAwesomeIcon icon={faBell} /></span>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: 2, right: 0, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
                    )}
                  </li>
                  <li className={isActive('/admin/approval-aor') ? 'active' : ''} onClick={() => navigate('/admin/approval-aor')}><FontAwesomeIcon icon={faCheckCircle} /></li>
                  <li className={isActive('/admin/announcement') ? 'active' : ''} onClick={() => navigate('/admin/announcement')}><FontAwesomeIcon icon={faBullhorn} /></li>
                  <li className={isActive('/admin/training-program') ? 'active' : ''} onClick={() => navigate('/admin/training-program')}><FontAwesomeIcon icon={faGraduationCap} /></li>
                  <li className={isActive('/admin/evaluation') ? 'active' : ''} onClick={() => navigate('/admin/evaluation')}><FontAwesomeIcon icon={faChartBar} /></li>
                </>
              )}
            </ul>
          </nav>
          <div className="sidebar-footer" style={{ marginTop: 'auto', marginBottom: 24 }}>
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
        isOpen={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
        style={customModalStyles}
        contentLabel="Edit Profile"
      >
        <h2>Edit Profile</h2>
        <div className="profile-image-section">
          <img 
            src={imagePreview || profileImage}
            alt="Profile Preview" 
            className="profile-modal-image"
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
              <button type="button" className="cancel-button" onClick={() => setShowProfileModal(false)}>Close</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export default AdminLayout; 
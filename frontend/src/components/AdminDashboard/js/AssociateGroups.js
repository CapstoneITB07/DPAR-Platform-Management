import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import '../css/AssociateGroups.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBell, faChartBar, faTimes, faTrash, faUser, faCheck, faEnvelope, faPhone, faKey, faTrophy, faStar, faFileAlt, faSignInAlt, faUserCheck, faCalendarAlt, faChevronDown, faChevronUp, faIdCard } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import Modal from 'react-modal';
import { API_BASE } from '../../../utils/url';

// Notification component
function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="associate-groups-success-notification">
      {message}
    </div>
  );
}

// Set the app element for React Modal
Modal.setAppElement('#root');

function AssociateGroups() {
  const [selectedAssociate, setSelectedAssociate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editListMode, setEditListMode] = useState(false);
  const [associates, setAssociates] = useState([]);
  const [form, setForm] = useState({ 
    name: '', 
    type: '', 
    director: '', 
    description: '', 
    logo: '', 
    email: '', 
    phone: '',
    date_joined: new Date().toISOString().split('T')[0]
  });
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [popupError, setPopupError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [notification, setNotification] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [associateToDelete, setAssociateToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null); // Track which application is being approved
  const [rejectingId, setRejectingId] = useState(null); // Track which application is being rejected
  const [expandedDirectors, setExpandedDirectors] = useState(new Set()); // Track which directors are expanded

  const fetchAssociates = async (showNotification = false, isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/associate-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAssociates(response.data);
      if (showNotification) {
        setNotification('Associate groups data refreshed successfully!');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (error) {
      console.error('Error fetching associate groups:', error);
      setError('Failed to fetch associate groups. Please try again later.');
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  // Fetch associate groups from the backend
  useEffect(() => {
    fetchAssociates(false, true); // Initial load with loading state
    fetchPendingApplications(); // Also fetch pending applications for counter
    
    // Refresh data every 5 seconds to catch profile updates
    const interval = setInterval(() => {
      fetchAssociates();
      fetchPendingApplications(); // Also refresh pending applications
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);


  // Set up polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssociates();
    }, 10000); // Poll every 10 seconds to catch profile updates
    return () => clearInterval(interval);
  }, []);



  // --- 1. Reset error modal state when opening/closing add modal and after successful submission ---
  const closeAddModal = () => {
    setShowAddModal(false);
    setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '' });
    setLogoFile(null);
    setError('');
    setShowPopup(false); // Reset error modal
    setPopupError('');
  };

  const openApplicationModal = () => {
    setShowApplicationModal(true);
    fetchPendingApplications();
  };

  const closeApplicationModal = () => {
    setShowApplicationModal(false);
  };

  const fetchPendingApplications = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/pending-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingApplications(response.data);
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      setError('Failed to fetch pending applications. Please try again later.');
    }
  };

  const approveApplication = async (applicationId) => {
    setApprovingId(applicationId);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axiosInstance.post(`${API_BASE}/api/pending-applications/${applicationId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotification('Application approved successfully! OTP sent to user email.');
      fetchPendingApplications(); // Refresh the list
      fetchAssociates(); // Refresh associate groups
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error approving application:', error);
      setError('Failed to approve application. Please try again.');
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectionModal = (applicationId) => {
    setSelectedApplicationId(applicationId);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const closeRejectionModal = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
    setSelectedApplicationId(null);
  };

  const rejectApplication = async () => {
    if (!rejectionReason || rejectionReason.trim() === '') {
      setError('Rejection reason is required.');
      return;
    }

    setRejectingId(selectedApplicationId);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axiosInstance.post(`${API_BASE}/api/pending-applications/${selectedApplicationId}/reject`, {
        rejection_reason: rejectionReason.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotification('Application rejected successfully! Rejection email sent to user.');
      fetchPendingApplications(); // Refresh the list
      closeRejectionModal();
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error rejecting application:', error);
      setError('Failed to reject application. Please try again.');
    } finally {
      setRejectingId(null);
    }
  };

  const openEditListMode = () => {
    setEditListMode(true);
  };

  const closeEditListMode = () => {
    setEditListMode(false);
  };

  const handleEditAssociate = (associate) => {
    // Directly set the form with the associate data
    const formData = {
      id: associate.id,
      name: associate.name || '',
      type: associate.type || '',
      director: associate.director || '',
      description: associate.description || '',
      logo: associate.logo || '',
      email: associate.email || '',
      phone: associate.phone || '',
      date_joined: associate.date_joined || new Date().toISOString().split('T')[0]
    };
    
    setForm(formData);
    setLogoFile(null);
    setEditMode(true);
    setError('');
    setShowEditModal(true);
    setEditListMode(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditMode(false); // Reset edit mode when closing
    setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '', date_joined: new Date().toISOString().split('T')[0] });
    setLogoFile(null);
    setError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, JPG, or GIF)');
        e.target.value = '';
        return;
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('File size should not exceed 2MB');
        e.target.value = '';
        return;
      }
      setLogoFile(file);
      setError('');
    }
  };

  const validateForm = () => {
    if (!form.name || !form.type || !form.director || !form.description || !form.email || !form.phone) {
      setError('Please fill in all required fields');
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate phone number (must start with 09, 11 digits, only numbers)
    const phoneRegex = /^09[0-9]{9}$/;
    if (!phoneRegex.test(form.phone)) {
      if (!form.phone.startsWith('09')) {
        setError('Phone number must start with 09');
      } else if (form.phone.length !== 11) {
        setError('Phone number must be exactly 11 digits');
      } else {
        setError('Phone number must contain only numbers and start with 09');
      }
      return false;
    }

    // Validate logo for new associates (not for editing)
    if (!editMode && !logoFile) {
      setError('Please upload a logo');
      return false;
    }

    setError('');
    return true;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('type', form.type);
      formData.append('director', form.director);
      formData.append('description', form.description);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('date_joined', form.date_joined);
      if (logoFile) formData.append('logo', logoFile);
      
      const response = await axiosInstance.post(`${API_BASE}/api/associate-groups`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.status === 201 || response.status === 200) {
        setNotification(`Associate group added successfully!`);
        setPopupError(`Associate created successfully!`);
        setShowPopup(true);
        
        setShowAddModal(false);
        setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '' });
        setLogoFile(null);
        setError('');
        fetchAssociates();
        setTimeout(() => setNotification(''), 3000); // Show notification for shorter time since password is in modal
      }
    } catch (error) {
      const backendMsg = error.response?.data?.errors?.email?.[0] || error.response?.data?.message || 'Failed to add associate. Please try again.';
      let friendlyMsg = '';
      if (backendMsg.toLowerCase().includes('already used')) {
        friendlyMsg = "The email address you entered is already used by another associate group. Please use a different email address.";
      } else {
        friendlyMsg = backendMsg;
      }
      setPopupError(friendlyMsg);
      setShowPopup(true);
      setError('');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check if form has required data
    if (!form.name || !form.type || !form.director || !form.description || !form.email || !form.phone) {
      setError('Please ensure all required fields are filled before submitting.');
      return;
    }
    
    if (!validateForm()) return;
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const formData = new FormData();
      formData.append('_method', 'PUT'); // Laravel method spoofing
      formData.append('name', form.name);
      formData.append('type', form.type);
      formData.append('director', form.director);
      formData.append('description', form.description);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('date_joined', form.date_joined);
      if (logoFile) formData.append('logo', logoFile);
      
      const response = await axiosInstance.post(`${API_BASE}/api/associate-groups/${form.id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.status === 200) {
        setNotification('Associate group updated successfully!');
        setShowEditModal(false);
        setLogoFile(null);
        setError('');
        fetchAssociates();
        
        // Update selectedGroup if it's currently being viewed
        if (selectedGroup && selectedGroup.id === form.id) {
          setSelectedGroup(response.data);
        }
        
        setTimeout(() => setNotification(''), 2000);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const errorMessages = Object.values(error.response.data.errors).flat();
        setError(errorMessages.join(', '));
      } else {
        setError(error.response?.data?.message || 'Failed to update associate. Please try again.');
      }
    }
  };

  const handleRemoveAssociate = (associateId) => {
    setAssociateToDelete(associateId);
    setShowDeleteModal(true);
  };

  const cancelDeleteAssociate = () => {
    setShowDeleteModal(false);
    setAssociateToDelete(null);
  };


  const confirmDeleteAssociate = async () => {
    if (!associateToDelete) return;
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/associate-groups/${associateToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssociates(prev => prev.filter(a => a.id !== associateToDelete));
      if (selectedAssociate && selectedAssociate.id === associateToDelete) {
        setSelectedAssociate(null);
        setShowModal(false);
      }
      setNotification('Associate group removed successfully!');
      setTimeout(() => setNotification(''), 2000);
      setShowDeleteModal(false);
      setAssociateToDelete(null);
    } catch (error) {
      setError('Failed to remove associate group.');
    } finally {
      setShowDeleteModal(false);
      setAssociateToDelete(null);
    }
  };



  const getLogoUrl = (logoPath) => {
    if (!logoPath) return `${window.location.origin}/Assets/disaster_logo.png`;
    
    // Handle full URLs (already processed by backend)
    if (logoPath.startsWith('http')) {
      return logoPath;
    }
    
    // Handle storage URLs
    if (logoPath.startsWith('logos/')) {
      return `${API_BASE}/storage/${logoPath}`;
    }
    
    // Handle storage paths
    if (logoPath.startsWith('/storage/')) {
      return `${API_BASE}${logoPath}`;
    }
    
    // Handle asset paths
    if (logoPath.startsWith('/Assets/')) {
      return `${window.location.origin}${logoPath}`;
    }
    
    // If it's just a filename, assume it's in storage
    if (!logoPath.includes('/')) {
      return `${API_BASE}/storage/logos/${logoPath}`;
    }
    
    return logoPath;
  };

  const handleGroupClick = async (group) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/associate-groups/${group.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedGroup(response.data);
      setShowModal(true);
      setExpandedDirectors(new Set()); // Reset expanded directors when opening modal
    } catch (error) {
      console.error('Error fetching group details:', error);
      setError('Failed to fetch group details');
    }
  };

  const toggleDirectorExpansion = (directorId) => {
    setExpandedDirectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(directorId)) {
        newSet.delete(directorId);
      } else {
        newSet.add(directorId);
      }
      return newSet;
    });
  };




  if (loading) return (
    <AdminLayout>
      <div className="dashboard-loading-container">
        <div className="loading-content">
          <div className="simple-loader">
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
          </div>
          <h3>Loading Associate Groups</h3>
          <p>Fetching associate group data and applications...</p>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <Notification message={notification} onClose={() => setNotification('')} />
      <div className="associate-groups-header">
        <h2 className="main-header">ASSOCIATE GROUPS:</h2>
        <div>
          {!editListMode && (
            <>
              <button className="add-associate-btn" onClick={openApplicationModal}>
                Application {pendingApplications.length > 0 && `(${pendingApplications.length})`}
              </button>
              <button className="edit-associate-btn" onClick={openEditListMode}>Edit</button>
            </>
          )}
          {editListMode && (
            <button className="edit-associate-btn" style={{ background: '#dc3545', color: '#fff' }} onClick={closeEditListMode}>Done</button>
          )}
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="associate-logos-grid">
        {associates.length > 0 ? (
          associates.map(associate => (
          <div key={associate.id} className="associate-logo-circle" style={{ position: 'relative' }}>
            <img
              src={getLogoUrl(associate.logo)}
              alt={associate.name}
              onClick={() => !editListMode && handleGroupClick(associate)}
              style={{ cursor: editListMode ? 'default' : 'pointer' }}
              onError={(e) => {
                console.error('Error loading image:', e.target.src);
                e.target.src = `${window.location.origin}/Assets/disaster_logo.png`;
              }}
            />
            {editListMode && (
                <FontAwesomeIcon
                  icon={faTrash}
                  className="remove-icon"
                  style={{ position: 'absolute', top: 8, right: 8, color: '#dc3545', background: '#fff', borderRadius: '50%', padding: 6, cursor: 'pointer', fontSize: 18, zIndex: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAssociate(associate.id);
                  }}
                />
            )}
          </div>
        ))
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#6c757d', 
            fontSize: '18px', 
            fontWeight: '500',
            width: '100%',
            gridColumn: '1 / -1'
          }}>
            No Associate Groups found. Click "Add Associate" to create your first associate group.
          </div>
        )}
      </div>
      {/* Profile Modal */}
      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        className="profile-modal-card enhanced-profile-modal"
        overlayClassName="profile-modal-overlay"
      >
        {selectedGroup && (
          <>
            <button onClick={() => setShowModal(false)} className="enhanced-close-icon">✕</button>
          <div className="profile-modal-content enhanced-profile-content">
            <div className="enhanced-profile-header">
              <img
                src={getLogoUrl(selectedGroup.logo)}
                alt={selectedGroup.name}
                className="enhanced-profile-logo"
                onError={(e) => {
                  e.target.src = '/Assets/disaster_logo.png';
                }}
              />
            </div>
            <h3 className="enhanced-profile-title">{selectedGroup.name}</h3>
            <div className="enhanced-profile-info">
              <div className="enhanced-profile-info-row"><FontAwesomeIcon icon={faUser} className="enhanced-profile-icon" /> <span><b>Director:</b> {selectedGroup.director}</span></div>
              {selectedGroup.user && selectedGroup.user.username && (
                <div className="enhanced-profile-info-row"><FontAwesomeIcon icon={faIdCard} className="enhanced-profile-icon" /> <span><b>Username:</b> {selectedGroup.user.username}</span></div>
              )}
              <div className="enhanced-profile-info-row"><FontAwesomeIcon icon={faEnvelope} className="enhanced-profile-icon" /> <span><b>Email:</b> {selectedGroup.email}</span></div>
              <div className="enhanced-profile-info-row"><FontAwesomeIcon icon={faPhone} className="enhanced-profile-icon" /> <span><b>Phone:</b> {selectedGroup.phone || 'N/A'}</span></div>
              <div className="enhanced-profile-info-row"><FontAwesomeIcon icon={faCalendarAlt} className="enhanced-profile-icon" /> <span><b>Date Joined:</b> {selectedGroup.date_joined ? new Date(selectedGroup.date_joined).toLocaleDateString() : 'N/A'}</span></div>
            </div>
            <div className="enhanced-profile-description">{selectedGroup.description}</div>
            <div className="enhanced-profile-stats-grid">
              <div className="enhanced-profile-stat"><span className="enhanced-profile-stat-label">Members</span><span className="enhanced-profile-stat-pill">{selectedGroup.members_count || 0}</span></div>
              <div className="enhanced-profile-stat"><span className="enhanced-profile-stat-label">Type</span><span className="enhanced-profile-stat-pill">{selectedGroup.type}</span></div>
            </div>
            
            {/* Director History Section */}
            <div className="director-history-section">
              <h4 className="director-history-title">
                <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px' }} />
                Director History
                {selectedGroup.director_histories_with_activities && selectedGroup.director_histories_with_activities.length > 0 && (
                  <span className="director-count-badge">({selectedGroup.director_histories_with_activities.length})</span>
                )}
              </h4>
              {selectedGroup.director_histories_with_activities && selectedGroup.director_histories_with_activities.length > 0 ? (
                <div className="director-history-list">
                  {selectedGroup.director_histories_with_activities.map((history, index) => {
                    const isExpanded = expandedDirectors.has(history.id);
                    return (
                    <div key={history.id} className={`director-history-item ${history.is_current ? 'current' : 'former'}`}>
                      <div className="director-history-header">
                        <div className="director-header-info">
                        <span className="director-name">{history.director_name}</span>
                        <span className={`director-status ${history.is_current ? 'current' : 'former'}`}>
                          {history.is_current ? 'Current Director' : 'Former Director'}
                        </span>
                        </div>
                        <button 
                          className="director-toggle-btn"
                          onClick={() => toggleDirectorExpansion(history.id)}
                          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                        >
                          <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                        </button>
                      </div>
                      <div className="director-history-details">
                        <div className="director-period">
                          <strong>Period:</strong> {new Date(history.start_date).toLocaleDateString()} 
                          {history.end_date && ` - ${new Date(history.end_date).toLocaleDateString()}`}
                        </div>
                        {history.contributions && (
                          <div className="director-contributions">
                            <strong>Contributions:</strong> {history.contributions}
                          </div>
                        )}
                        <div className="director-stats">
                          <span className="stat-item">
                            <FontAwesomeIcon icon={faUsers} /> {history.volunteers_recruited} Volunteers
                          </span>
                        </div>
                        
                        {/* Director Activity Summary - Collapsible */}
                        {isExpanded && (
                        <div className="director-activity-summary">
                          <h5 className="activity-summary-title">
                            <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '8px' }} />
                            Activity Summary
                          </h5>
                          <div className="activity-stats-grid">
                            <div className="activity-stat">
                              <FontAwesomeIcon icon={faBell} />
                              <span className="stat-label">Notifications:</span>
                              <span className="stat-value">{history.notifications_created || 0}</span>
                            </div>
                            <div className="activity-stat">
                              <FontAwesomeIcon icon={faFileAlt} />
                              <span className="stat-label">Reports:</span>
                              <span className="stat-value">{history.reports_submitted_count || 0}</span>
                            </div>
                            <div className="activity-stat">
                              <FontAwesomeIcon icon={faSignInAlt} />
                              <span className="stat-label">System Logins:</span>
                              <span className="stat-value">{history.login_activities_count || 0}</span>
                            </div>
                            <div className="activity-stat">
                              <FontAwesomeIcon icon={faStar} />
                              <span className="stat-label">Engagement Score:</span>
                              <span className="stat-value">{history.system_engagement_score || 0}%</span>
                            </div>
                          </div>
                            
                            {/* Recent Activities */}
                            {history.activity_logs && history.activity_logs.length > 0 && (
                              <div className="recent-activities">
                                <h6 className="recent-activities-title">Recent Activities</h6>
                                <div className="activities-list">
                                  {history.activity_logs.slice(0, 5).map((activity, actIndex) => (
                                    <div key={actIndex} className="activity-item">
                                      <div className="activity-icon">
                                        <FontAwesomeIcon icon={
                                          activity.activity_type === 'login' ? faSignInAlt :
                                          activity.activity_type === 'notification' ? faBell :
                                          activity.activity_type === 'report' ? faFileAlt :
                                          activity.activity_type === 'member' ? faUsers :
                                          faChartBar
                                        } />
                                      </div>
                                      <div className="activity-content">
                                        <div className="activity-description">{activity.description}</div>
                                        <div className="activity-date">
                                          {new Date(activity.activity_at).toLocaleDateString()} at {new Date(activity.activity_at).toLocaleTimeString()}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Achievements */}
                            {history.achievements && history.achievements.length > 0 && (
                              <div className="director-achievements">
                                <h6 className="achievements-title">
                                  <FontAwesomeIcon icon={faTrophy} style={{ marginRight: '8px' }} />
                                  Achievements ({history.achievements.length})
                                </h6>
                                <div className="achievements-list">
                                  {history.achievements.slice(0, 3).map((achievement, achIndex) => (
                                    <div key={achIndex} className="achievement-item">
                                      <div className="achievement-badge" style={{ backgroundColor: achievement.badge_color }}>
                                        <FontAwesomeIcon icon={faTrophy} />
                                      </div>
                                      <div className="achievement-details">
                                        <div className="achievement-title">{achievement.title}</div>
                                        <div className="achievement-points">{achievement.points_earned} points</div>
                                      </div>
                                    </div>
                                  ))}
                                  {history.achievements.length > 3 && (
                                    <div className="more-achievements">
                                      +{history.achievements.length - 3} more achievements
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
              ) : (
                <div className="no-director-history">
                  <div className="no-history-content">
                    <FontAwesomeIcon icon={faUsers} className="no-history-icon" />
                    <p className="no-history-message">No director history available</p>
                    <p className="no-history-submessage">
                      Director history will appear here once the director starts performing activities 
                      such as logging in, creating reports, recruiting volunteers, or organizing events.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </Modal>
      {/* Add Associate Modal */}
      {showAddModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-card enhanced-modal">
            <div className="profile-modal-header">
              <h3>Add Associate</h3>
              <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={closeAddModal} />
            </div>
            <form className="add-edit-form enhanced-form" onSubmit={handleAddSubmit}>
              <div className="step-content">
                <div className="step-header">
                  <FontAwesomeIcon icon={faUser} className="step-icon" />
                  <h4>Basic Information</h4>
                  <p>Please provide the basic details for the associate organization. A secure password will be auto-generated.</p>
                </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Organization Name *</label>
                      <input 
                        name="name" 
                        value={form.name} 
                        onChange={handleFormChange} 
                        placeholder="Enter organization name"
                        required 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Organization Type *</label>
                      <input 
                        name="type" 
                        value={form.type} 
                        onChange={handleFormChange} 
                        placeholder="e.g., Emergency Response, Medical, etc."
                        required 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Director Name *</label>
                      <input 
                        name="director" 
                        value={form.director} 
                        onChange={handleFormChange} 
                        placeholder="Enter director's full name"
                        required 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input 
                        name="email" 
                        type="email" 
                        value={form.email} 
                        onChange={handleFormChange} 
                        placeholder="Enter email address"
                        required 
                        pattern="[^@\s]+@[^\s@]+\.[^\s@]+" 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input 
                        name="phone" 
                        value={form.phone} 
                        onChange={handleFormChange} 
                        onInput={e => {
                          let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                          if (val.length === 1 && val !== '0') val = '';
                          if (val.length === 2 && val !== '09') val = val[0] === '0' ? '0' : '';
                          e.target.value = val;
                          // Update form state with the validated value
                          setForm(prev => ({ ...prev, phone: val }));
                        }}
                        placeholder="Enter 11-digit phone number" 
                        required 
                        pattern="[0-9]{11}" 
                        title="Phone number must start with 09 and be exactly 11 digits" 
                        maxLength="11"
                        inputMode="numeric"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Date Joined *</label>
                      <input 
                        name="date_joined" 
                        type="date" 
                        value={form.date_joined || ''} 
                        onChange={handleFormChange} 
                        required 
                        max={new Date().toISOString().split('T')[0]}
                        title="Select the date when this group joined"
                      />
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Description *</label>
                      <textarea 
                        name="description" 
                        value={form.description} 
                        onChange={handleFormChange} 
                        placeholder="Describe the organization's mission and activities"
                        required 
                        rows="4"
                      />
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Organization Logo *</label>
                      <div className="file-upload-container">
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/jpg,image/gif" 
                          onChange={handleLogoChange} 
                          required={!editMode} 
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className="file-upload-label">
                          <FontAwesomeIcon icon={faUser} />
                          <span>{logoFile ? logoFile.name : 'Choose Logo File'}</span>
                        </label>
                      </div>
                      <small>Accepted formats: JPEG, PNG, JPG, GIF (max 2MB)</small>
                    </div>
                  </div>
                </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  <FontAwesomeIcon icon={faCheck} /> Add Associate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Associate Modal */}
      {showEditModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-card enhanced-modal">
            <div className="profile-modal-header">
              <h3>Edit Associate</h3>
              <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={closeEditModal} />
            </div>
            <form className="add-edit-form enhanced-form" onSubmit={handleEditSubmit}>
              <div className="step-content">
                <div className="step-header">
                  <FontAwesomeIcon icon={faUser} className="step-icon" />
                  <h4>Basic Information</h4>
                  <p>Please provide the basic details for the associate organization.</p>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Organization Name *</label>
                    <input 
                      name="name" 
                      value={form.name || ''} 
                      onChange={handleFormChange} 
                      placeholder="Enter organization name"
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Organization Type *</label>
                    <select 
                      name="type" 
                      value={form.type || ''} 
                      onChange={handleFormChange} 
                      required 
                    >
                      <option value="">Select organization type</option>
                      <option value="Educational Institution">Educational Institution</option>
                      <option value="Private Company">Private Company</option>
                      <option value="Religious Organization">Religious Organization</option>
                      <option value="Community Group">Community Group</option>
                      <option value="Government Agency">Government Agency</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Director Name *</label>
                    <input 
                      name="director" 
                      value={form.director || ''} 
                      onChange={handleFormChange} 
                      placeholder="Enter director's full name"
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input 
                      name="email" 
                      type="email" 
                      value={form.email || ''} 
                      onChange={handleFormChange} 
                      placeholder="Enter email address"
                      required 
                      pattern="[^@\s]+@[^\s@]+\.[^\s@]+" 
                      readOnly
                      style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input 
                      name="phone" 
                      value={form.phone || ''} 
                      onChange={handleFormChange} 
                      onInput={e => {
                        let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                        if (val.length === 1 && val !== '0') val = '';
                        if (val.length === 2 && val !== '09') val = val[0] === '0' ? '0' : '';
                        e.target.value = val;
                        // Update form state with the validated value
                        setForm(prev => ({ ...prev, phone: val }));
                      }}
                      placeholder="Enter 11-digit phone number"
                      required 
                      pattern="[0-9]{11}" 
                      title="Phone number must start with 09 and be exactly 11 digits"
                      maxLength="11"
                      inputMode="numeric"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Date Joined</label>
                    <input 
                      name="date_joined" 
                      type="date" 
                      value={form.date_joined || ''} 
                      readOnly
                      style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      title="Date joined cannot be changed"
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Description *</label>
                    <textarea 
                      name="description" 
                      value={form.description || ''} 
                      onChange={handleFormChange} 
                      placeholder="Describe the organization's mission and activities"
                      required 
                      rows="4"
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Organization Logo {!editMode ? '*' : '(Optional)'}</label>
                    {/* Logo Preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                      {logoFile ? (
                        <img
                          src={URL.createObjectURL(logoFile)}
                          alt="New Logo Preview"
                          style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'contain', border: '1.5px solid #eee', background: '#f8f8f8' }}
                        />
                      ) : (
                        <img
                          src={getLogoUrl(form.logo)}
                          alt="Current Logo"
                          style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'contain', border: '1.5px solid #eee', background: '#f8f8f8' }}
                        />
                      )}
                    </div>
                    <div className="file-upload-container">
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg,image/gif" 
                        onChange={handleLogoChange} 
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="file-upload-label">
                        <FontAwesomeIcon icon={faUser} />
                        <span>{logoFile ? logoFile.name : 'Choose Logo File'}</span>
                      </label>
                    </div>
                    <small>Accepted formats: JPEG, PNG, JPG, GIF (max 2MB)</small>
                    {editMode && (
                      <small style={{ display: 'block', marginTop: '4px', color: '#666', fontStyle: 'italic' }}>
                        Logo upload is optional when editing. Leave unchanged to keep the current logo.
                      </small>
                    )}
                  </div>
                </div>
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  <FontAwesomeIcon icon={faCheck} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showPopup && (
        <Modal
          isOpen={showPopup}
          onRequestClose={() => setShowPopup(false)}
          className="enhanced-error-modal"
          overlayClassName="enhanced-error-overlay"
          shouldCloseOnOverlayClick={true}
        >
          <div className="enhanced-error-header">
            {popupError.includes('Associate created successfully!') ? (
              <>
                <span className="enhanced-error-icon" role="img" aria-label="Success">✅</span>
                <h2>Associate Created Successfully!</h2>
              </>
            ) : popupError.includes('Associate Recovery Passcodes:') ? (
              <>
                <span className="enhanced-error-icon" role="img" aria-label="Recovery Codes">🔑</span>
                <h2>Recovery Passcodes</h2>
              </>
            ) : (
              <>
                <span className="enhanced-error-icon" role="img" aria-label="Error">⚠️</span>
                <h2>Error</h2>
              </>
            )}
            <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={() => setShowPopup(false)} />
          </div>
          <div className="enhanced-error-body">
            {popupError.includes('Associate created successfully!') ? (
              <>
                <p style={{ color: '#28a745', marginBottom: 16, fontWeight: 500 }}>
                  The associate group has been created successfully!
                </p>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '2px solid #28a745' }}>
                  {/* Recovery Passcodes Section */}
                  {popupError.includes('Recovery Passcodes:') && (
                    <>
                      <p style={{ fontWeight: 600, color: '#28a745', marginBottom: '8px' }}>Recovery Passcodes:</p>
                      <div style={{ marginBottom: '8px' }}>
                        {popupError.split('Recovery Passcodes:')[1]?.split('\n\n')[0]?.split('\n').filter(line => line.trim() && line.includes('.'))?.map((line, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <code style={{ 
                              background: '#fff', 
                              padding: '6px 10px', 
                              borderRadius: '4px', 
                              border: '1px solid #ddd',
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              flex: 1
                            }}>
                              {line.split('. ')[1]}
                            </code>
                            <button 
                              onClick={(e) => {
                                navigator.clipboard.writeText(line.split('. ')[1]);
                                // Show temporary feedback
                                const btn = e.target;
                                const originalText = btn.textContent;
                                btn.textContent = 'Copied!';
                                btn.style.background = '#28a745';
                                setTimeout(() => {
                                  btn.textContent = originalText;
                                  btn.style.background = '#007bff';
                                }, 2000);
                              }}
                              style={{ 
                                background: '#007bff', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '6px 10px', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: '11px'
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', marginBottom: 0 }}>
                    ⚠️ Please copy these recovery passcodes and provide them to the associate group leader. They will not be shown again.
                  </p>
                </div>
                <p style={{ color: '#555', fontSize: '0.95rem' }}>
                  The associate can now log in using their email and a temporary password, or use any of the recovery passcodes if they forget their password.
                </p>
              </>
            ) : popupError.includes('Associate Password:') ? (
              <>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '2px solid #007bff' }}>
                  <p style={{ fontWeight: 600, color: '#007bff', marginBottom: '8px' }}>Password:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ 
                      background: '#fff', 
                      padding: '8px 12px', 
                      borderRadius: '4px', 
                      border: '1px solid #ddd',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      flex: 1
                    }}>
                      {popupError.split('Associate Password: ')[1]}
                    </code>
                    <button 
                      onClick={(e) => {
                        navigator.clipboard.writeText(popupError.split('Associate Password: ')[1]);
                        // Show temporary feedback
                        const btn = e.target;
                        const originalText = btn.textContent;
                        btn.textContent = 'Copied!';
                        btn.style.background = '#28a745';
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.style.background = '#007bff';
                        }, 2000);
                      }}
                      style={{ 
                        background: '#007bff', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '8px 12px', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Copy Password
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', marginBottom: 0 }}>
                    ⚠️ This password is stored temporarily and may be cleared for security.
                  </p>
                </div>
                <p style={{ color: '#555', fontSize: '0.95rem' }}>
                  Copy this password to provide to the associate group leader.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 500, color: '#b00020', marginBottom: 8 }}>
                  {popupError}
                </p>
                <p style={{ color: '#555', fontSize: '0.95rem' }}>
                  If you need help, please check the form fields or contact support.
                </p>
              </>
            )}
          </div>
          <button className="enhanced-error-btn" onClick={() => setShowPopup(false)}>Close</button>
        </Modal>
      )}

      {/* Application Modal */}
      {showApplicationModal && (
        <Modal
          isOpen={showApplicationModal}
          onRequestClose={closeApplicationModal}
          className="profile-modal-overlay"
          overlayClassName="profile-modal-overlay"
        >
          <div className="profile-modal-card enhanced-modal" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="profile-modal-header">
              <h3>Pending Applications</h3>
              <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={closeApplicationModal} />
            </div>
            
            <div className="profile-modal-body">
              {pendingApplications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <FontAwesomeIcon icon={faUserCheck} size="3x" style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No pending applications at the moment.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingApplications.map((application) => (
                    <div key={application.id} style={{ 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      padding: '16px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <img 
                          src={getLogoUrl(application.logo)} 
                          alt={application.organization_name}
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            border: '2px solid #ddd'
                          }}
                          onError={(e) => {
                            e.target.src = '/Assets/disaster_logo.png';
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>{application.organization_name}</h4>
                          <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>
                            <strong>Type:</strong> {application.organization_type}
                          </p>
                          <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>
                            <strong>Director:</strong> {application.director_name}
                          </p>
                          <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>
                            <strong>Email:</strong> {application.email}
                          </p>
                          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                            <strong>Phone:</strong> {application.phone}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => openRejectionModal(application.id)}
                          disabled={approvingId === application.id || rejectingId === application.id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: (approvingId === application.id || rejectingId === application.id) ? 'not-allowed' : 'pointer',
                            opacity: (approvingId === application.id || rejectingId === application.id) ? 0.7 : 1,
                            fontSize: '14px',
                            pointerEvents: (approvingId === application.id || rejectingId === application.id) ? 'none' : 'auto'
                          }}
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => approveApplication(application.id)}
                          disabled={approvingId === application.id || rejectingId === application.id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: (approvingId === application.id || rejectingId === application.id) ? 'not-allowed' : 'pointer',
                            opacity: (approvingId === application.id || rejectingId === application.id) ? 0.7 : 1,
                            fontSize: '14px',
                            pointerEvents: (approvingId === application.id || rejectingId === application.id) ? 'none' : 'auto'
                          }}
                        >
                          {approvingId === application.id ? 'Approving...' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <Modal
          isOpen={showRejectionModal}
          onRequestClose={closeRejectionModal}
          className="reject-modal-overlay"
          overlayClassName="reject-modal-overlay"
          style={{
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            },
            content: {
              position: 'relative',
              top: 'auto',
              left: 'auto',
              right: 'auto',
              bottom: 'auto',
              margin: '0',
              transform: 'none',
              width: '450px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '0',
              color: '#1f2937',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden'
            }
          }}
        >
          <div className="reject-modal-container">
            {/* Header */}
            <div className="reject-modal-header">
              <h2 className="reject-modal-title">
                Reject Application
              </h2>
              <button
                onClick={closeRejectionModal}
                className="reject-modal-close"
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            {/* Body */}
            <div className="reject-modal-body">
              <p className="reject-modal-description">
                Please provide a reason for rejecting this application:
              </p>
              
              <div className="reject-modal-textarea-container">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="reject-modal-textarea"
                  rows="4"
                />
              </div>
              
              {error && (
                <div className="reject-modal-error">
                  <FontAwesomeIcon icon={faTimes} />
                  {error}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="reject-modal-footer">
              <button
                onClick={closeRejectionModal}
                className="reject-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={rejectApplication}
                className="reject-modal-submit-btn"
                disabled={rejectingId !== null}
                style={{
                  opacity: rejectingId !== null ? 0.7 : 1,
                  cursor: rejectingId !== null ? 'not-allowed' : 'pointer',
                  pointerEvents: rejectingId !== null ? 'none' : 'auto'
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
                {rejectingId !== null ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" style={{zIndex: 10000}}>
          <div className="confirm-modal">
            <button className="modal-close confirm-close" onClick={cancelDeleteAssociate}>&times;</button>
            <div className="confirm-icon">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="28" stroke="#e53935" strokeWidth="4" fill="#fff"/>
                <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="32" fill="#e53935">!</text>
              </svg>
            </div>
            <div className="confirm-message">Are you sure you want to delete this volunteer?</div>
            <div className="modal-actions confirm-actions">
              <button className="delete-btn" onClick={confirmDeleteAssociate}>Yes, I'm sure</button>
              <button className="cancel-btn" onClick={cancelDeleteAssociate}>No, cancel</button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

export default AssociateGroups;

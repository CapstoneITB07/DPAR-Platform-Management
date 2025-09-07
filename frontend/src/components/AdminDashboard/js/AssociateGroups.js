import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import '../css/AssociateGroups.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEdit, faTachometerAlt, faUsers, faBell, faCheckCircle, faBullhorn, faGraduationCap, faChartBar, faSignOutAlt, faBars, faTimes, faTrash, faPen, faUser, faLock, faArrowLeft, faArrowRight, faCheck, faEnvelope, faPhone, faKey } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';

// Notification component
function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="associate-groups-success-notification">
      {message}
    </div>
  );
}

const API_BASE = 'http://localhost:8000';

// Set the app element for React Modal
Modal.setAppElement('#root');

function AssociateGroups() {
  const [selectedAssociate, setSelectedAssociate] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editListMode, setEditListMode] = useState(false);
  const [associates, setAssociates] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [message, setMessage] = useState('');
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [popupError, setPopupError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [notification, setNotification] = useState('');
  const [showDirectorManagementModal, setShowDirectorManagementModal] = useState(false);
  const [showAddDirectorModal, setShowAddDirectorModal] = useState(false);
  const [newDirectorForm, setNewDirectorForm] = useState({
    director_name: '',
    director_email: '',
    contributions: '',
    volunteers_recruited: 0,
    events_organized: 0,
    start_date: new Date().toISOString().split('T')[0],
    reason_for_leaving: ''
  });

  const fetchAssociates = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/associate-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAssociates(response.data);
    } catch (error) {
      console.error('Error fetching associate groups:', error);
      setError('Failed to fetch associate groups. Please try again later.');
    }
  };

  // Fetch associate groups from the backend
  useEffect(() => {
    fetchAssociates();
  }, []);

  // Simulate fetching member count (replace with API call if available)
  useEffect(() => {
    if (selectedAssociate) {
      setMemberCount(selectedAssociate.members_count || 0);
    }
  }, [selectedAssociate]);

  // Set up polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssociates();
    }, 30000); // Poll every 30 seconds (associate data doesn't change frequently)
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const openProfileModal = (associate) => {
    setSelectedAssociate(associate);
    setShowProfileModal(true);
    setEditMode(false);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedAssociate(null);
    setMessage('');
  };

  // --- 1. Reset error modal state when opening/closing add modal and after successful submission ---
  const openAddModal = () => {
    setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '' });
    setLogoFile(null);
    setShowAddModal(true);
    setShowPopup(false); // Reset error modal
    setPopupError('');
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '' });
    setLogoFile(null);
    setError('');
    setShowPopup(false); // Reset error modal
    setPopupError('');
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
      
      const response = await axios.post(`${API_BASE}/api/associate-groups`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.status === 201 || response.status === 200) {
        // Show success message with generated password and recovery passcodes
        const generatedPassword = response.data.generated_password;
        const recoveryPasscodes = response.data.recovery_passcodes || [];
        
        setNotification(`Associate group added successfully!`);
        
        // Show password and recovery passcodes in a modal for admin to copy
        const recoveryPasscodesText = recoveryPasscodes.length > 0 
          ? `\n\nRecovery Passcodes:\n${recoveryPasscodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nPlease copy these codes and provide them to the associate group leader.`
          : '';
        
        setPopupError(`Associate created successfully!\n\nGenerated Password: ${generatedPassword}${recoveryPasscodesText}\n\nPlease copy this password and recovery passcodes and provide them to the associate group leader.`);
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
      
      const response = await axios.post(`${API_BASE}/api/associate-groups/${form.id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.status === 200) {
        setNotification('Associate group updated successfully!');
        setShowEditModal(false);
        setLogoFile(null);
        setError('');
        fetchAssociates();
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

  const handleRemoveAssociate = async (associateId) => {
    if (!window.confirm('Are you sure you want to remove this associate group?')) return;
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axios.delete(`${API_BASE}/api/associate-groups/${associateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssociates(prev => prev.filter(a => a.id !== associateId));
      if (selectedAssociate && selectedAssociate.id === associateId) {
        setSelectedAssociate(null);
        setShowProfileModal(false);
      }
      setNotification('Associate group removed successfully!');
      setTimeout(() => setNotification(''), 2000);
    } catch (error) {
      setError('Failed to remove associate group.');
    }
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return `${window.location.origin}/Assets/disaster_logo.png`;
    
    // Handle storage URLs
    if (logoPath.startsWith('logos/')) {
      return `${API_BASE}/storage/${logoPath}`;
    }
    
    // Handle full URLs
    if (logoPath.startsWith('http')) {
      return logoPath;
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
      const response = await axios.get(`${API_BASE}/api/associate-groups/${group.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedGroup(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching group details:', error);
      setError('Failed to fetch group details');
    }
  };

  const handleViewPassword = async (associateId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/associate-groups/${associateId}/password`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPopupError(`Associate Password: ${response.data.password}`);
      setShowPopup(true);
    } catch (error) {
      setError('Failed to fetch password.');
    }
  };

  const handleViewRecoveryPasscodes = async (associateId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/associate-groups/${associateId}/recovery-passcodes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const recoveryPasscodes = response.data.recovery_passcodes || [];
      if (recoveryPasscodes.length > 0) {
        const recoveryPasscodesText = `\n\nCurrent Recovery Passcodes:\n${recoveryPasscodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nThese are the current recovery passcodes for this associate.`;
        setPopupError(`Associate Recovery Passcodes:${recoveryPasscodesText}`);
      } else {
        setPopupError('No recovery passcodes available for this associate.');
      }
      setShowPopup(true);
    } catch (error) {
      setError('Failed to fetch recovery passcodes.');
    }
  };

  const handleManageDirectors = async (groupId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/associate-groups/${groupId}/director-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Set the director history data and show the director management modal
      setSelectedGroup({ id: groupId, director_histories: response.data });
      setShowDirectorManagementModal(true);
    } catch (error) {
      console.error('Error fetching director history:', error);
      setError('Failed to fetch director history data.');
    }
  };

  const handleAddNewDirector = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.post(`${API_BASE}/api/associate-groups/${selectedGroup.id}/director-history`, {
        ...newDirectorForm,
        is_new_director: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh director history
      const historyResponse = await axios.get(`${API_BASE}/api/associate-groups/${selectedGroup.id}/director-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedGroup(prev => ({ ...prev, director_histories: historyResponse.data }));
      setShowAddDirectorModal(false);
      setNewDirectorForm({
        director_name: '',
        director_email: '',
        contributions: '',
        volunteers_recruited: 0,
        events_organized: 0,
        start_date: new Date().toISOString().split('T')[0],
        reason_for_leaving: ''
      });
      
      setNotification('New director added successfully!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error adding new director:', error);
      setError('Failed to add new director. Please try again.');
    }
  };

  const handleNewDirectorFormChange = (e) => {
    const { name, value } = e.target;
    setNewDirectorForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <AdminLayout>
      <Notification message={notification} onClose={() => setNotification('')} />
      <div className="associate-groups-header">
        <h2 className="main-header">ASSOCIATE GROUPS:</h2>
        <div>
          {!editListMode && (
            <>
              <button className="add-associate-btn" onClick={openAddModal}>Add Associate</button>
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
              <>
                <FontAwesomeIcon
                  icon={faPen}
                  className="edit-icon"
                  style={{ position: 'absolute', top: 8, left: 8, color: '#ffc107', background: '#fff', borderRadius: '50%', padding: 6, cursor: 'pointer', fontSize: 18, zIndex: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditAssociate(associate);
                  }}
                />
                <FontAwesomeIcon
                  icon={faLock}
                  className="password-icon"
                  style={{ position: 'absolute', top: 8, left: 40, color: '#007bff', background: '#fff', borderRadius: '50%', padding: 6, cursor: 'pointer', fontSize: 18, zIndex: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewPassword(associate.id);
                  }}
                  title="View Password"
                />
                <FontAwesomeIcon
                  icon={faKey}
                  className="recovery-passcode-icon"
                  style={{ position: 'absolute', top: 8, left: 72, color: '#28a745', background: '#fff', borderRadius: '50%', padding: 6, cursor: 'pointer', fontSize: 18, zIndex: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewRecoveryPasscodes(associate.id);
                  }}
                  title="View Recovery Passcodes"
                />
                <FontAwesomeIcon
                  icon={faTrash}
                  className="remove-icon"
                  style={{ position: 'absolute', top: 8, right: 8, color: '#dc3545', background: '#fff', borderRadius: '50%', padding: 6, cursor: 'pointer', fontSize: 18, zIndex: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAssociate(associate.id);
                  }}
                />
              </>
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
              <button onClick={() => setShowModal(false)} className="enhanced-close-icon">&times;</button>
            </div>
            <h3 className="enhanced-profile-title">{selectedGroup.name}</h3>
            <div className="enhanced-profile-info">
              <div className="enhanced-profile-info-row"><FontAwesomeIcon icon={faUser} className="enhanced-profile-icon" /> <span><b>Director:</b> {selectedGroup.director}</span></div>
              <div className="enhanced-profile-info-row"><FontAwesomeIcon icon={faEnvelope} className="enhanced-profile-icon" /> <span><b>Email:</b> {selectedGroup.email}</span></div>
              <div className="enhanced-profile-info-row"><FontAwesomeIcon icon={faPhone} className="enhanced-profile-icon" /> <span><b>Phone:</b> {selectedGroup.phone || 'N/A'}</span></div>
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
              </h4>
              {selectedGroup.director_histories && selectedGroup.director_histories.length > 0 ? (
                <div className="director-history-list">
                  {selectedGroup.director_histories.map((history, index) => (
                    <div key={history.id} className={`director-history-item ${history.is_current ? 'current' : 'former'}`}>
                      <div className="director-history-header">
                        <span className="director-name">{history.director_name}</span>
                        <span className={`director-status ${history.is_current ? 'current' : 'former'}`}>
                          {history.is_current ? 'Current Director' : 'Former Director'}
                        </span>
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
                          <span className="stat-item">
                            <FontAwesomeIcon icon={faBullhorn} /> {history.events_organized} Events
                          </span>
                        </div>
                        {history.reason_for_leaving && !history.is_current && (
                          <div className="reason-for-leaving">
                            <strong>Reason for leaving:</strong> {history.reason_for_leaving}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-director-history">
                  <p>No director history available.</p>
                </div>
              )}
            </div>
          </div>
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
                    <input 
                      name="type" 
                      value={form.type || ''} 
                      onChange={handleFormChange} 
                      placeholder="e.g., Emergency Response, Medical, etc."
                      required 
                    />
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
                <button 
                  type="button" 
                  className="btn-manage-directors"
                  onClick={() => handleManageDirectors(form.id)}
                  style={{
                    background: '#17a2b8',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginRight: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px' }} />
                  Manage Director History
                </button>
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
            {popupError.includes('Generated Password:') ? (
              <>
                <span className="enhanced-error-icon" role="img" aria-label="Success">✅</span>
                <h2>Associate Created Successfully!</h2>
              </>
            ) : popupError.includes('Associate Password:') ? (
              <>
                <span className="enhanced-error-icon" role="img" aria-label="Password">🔐</span>
                <h2>Associate Password</h2>
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
            {popupError.includes('Generated Password:') ? (
              <>
                <p style={{ color: '#28a745', marginBottom: 16, fontWeight: 500 }}>
                  The associate group has been created successfully!
                </p>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '2px solid #28a745' }}>
                  <p style={{ fontWeight: 600, color: '#28a745', marginBottom: '8px' }}>Generated Password:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <code style={{ 
                      background: '#fff', 
                      padding: '8px 12px', 
                      borderRadius: '4px', 
                      border: '1px solid #ddd',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      flex: 1
                    }}>
                      {popupError.split('Generated Password: ')[1]?.split('\n')[0]}
                    </code>
                    <button 
                      onClick={(e) => {
                        navigator.clipboard.writeText(popupError.split('Generated Password: ')[1]?.split('\n')[0]);
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
                    ⚠️ Please copy this password and recovery passcodes and provide them to the associate group leader. They will not be shown again.
                  </p>
                </div>
                <p style={{ color: '#555', fontSize: '0.95rem' }}>
                  The associate can now log in using their email and the generated password above, or use any of the recovery passcodes if they forget their password.
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
            ) : popupError.includes('Associate Recovery Passcodes:') ? (
              <>
                <p style={{ color: '#28a745', marginBottom: 16, fontWeight: 500 }}>
                  Current Recovery Passcodes
                </p>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '2px solid #28a745' }}>
                  <p style={{ fontWeight: 600, color: '#28a745', marginBottom: '8px' }}>Recovery Passcodes:</p>
                  <div style={{ marginBottom: '8px' }}>
                    {popupError.split('Current Recovery Passcodes:')[1]?.split('\n\n')[0]?.split('\n').filter(line => line.trim() && line.includes('.'))?.map((line, index) => (
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
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', marginBottom: 0 }}>
                    ⚠️ These are the current recovery passcodes for this associate. They can be used for password recovery.
                  </p>
                </div>
                <p style={{ color: '#555', fontSize: '0.95rem' }}>
                  These recovery passcodes can be used by the associate if they forget their password.
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

      {/* Director Management Modal */}
      {showDirectorManagementModal && (
        <Modal
          isOpen={showDirectorManagementModal}
          onRequestClose={() => setShowDirectorManagementModal(false)}
          className="enhanced-error-modal"
          overlayClassName="enhanced-error-overlay"
          shouldCloseOnOverlayClick={true}
        >
          <div className="enhanced-error-header">
            <span className="enhanced-error-icon" role="img" aria-label="Directors">👥</span>
            <h2>Manage Director History</h2>
            <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={() => setShowDirectorManagementModal(false)} />
          </div>
          <div className="enhanced-error-body">
            <div className="director-management-content">
              {selectedGroup.director_histories && selectedGroup.director_histories.length > 0 ? (
                <div className="director-history-list">
                  {selectedGroup.director_histories.map((history, index) => (
                    <div key={history.id} className={`director-history-item ${history.is_current ? 'current' : 'former'}`}>
                      <div className="director-history-header">
                        <span className="director-name">{history.director_name}</span>
                        <span className={`director-status ${history.is_current ? 'current' : 'former'}`}>
                          {history.is_current ? 'Current Director' : 'Former Director'}
                        </span>
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
                          <span className="stat-item">
                            <FontAwesomeIcon icon={faBullhorn} /> {history.events_organized} Events
                          </span>
                        </div>
                        {history.reason_for_leaving && !history.is_current && (
                          <div className="reason-for-leaving">
                            <strong>Reason for leaving:</strong> {history.reason_for_leaving}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-director-history">
                  <p>No director history available.</p>
                </div>
              )}
              
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  className="enhanced-error-btn" 
                  style={{ background: '#17a2b8', marginRight: '10px' }}
                  onClick={() => setShowAddDirectorModal(true)}
                >
                  Add New Director
                </button>
                <button className="enhanced-error-btn" onClick={() => setShowDirectorManagementModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Director Modal */}
      {showAddDirectorModal && (
        <Modal
          isOpen={showAddDirectorModal}
          onRequestClose={() => setShowAddDirectorModal(false)}
          className="enhanced-error-modal"
          overlayClassName="enhanced-error-overlay"
          shouldCloseOnOverlayClick={true}
        >
          <div className="enhanced-error-header">
            <span className="enhanced-error-icon" role="img" aria-label="Add Director">➕</span>
            <h2>Add New Director</h2>
            <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={() => setShowAddDirectorModal(false)} />
          </div>
          <div className="enhanced-error-body">
            <form onSubmit={handleAddNewDirector} className="add-director-form">
              <div className="form-group">
                <label>Director Name *</label>
                <input
                  type="text"
                  name="director_name"
                  value={newDirectorForm.director_name}
                  onChange={handleNewDirectorFormChange}
                  placeholder="Enter director's full name"
                  required
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div className="form-group">
                <label>Director Email</label>
                <input
                  type="email"
                  name="director_email"
                  value={newDirectorForm.director_email}
                  onChange={handleNewDirectorFormChange}
                  placeholder="Enter director's email"
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div className="form-group">
                <label>Contributions & Works *</label>
                <textarea
                  name="contributions"
                  value={newDirectorForm.contributions}
                  onChange={handleNewDirectorFormChange}
                  placeholder="Describe the director's contributions, works, and achievements..."
                  required
                  rows="4"
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Volunteers Recruited</label>
                  <input
                    type="number"
                    name="volunteers_recruited"
                    value={newDirectorForm.volunteers_recruited}
                    onChange={handleNewDirectorFormChange}
                    min="0"
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Events Organized</label>
                  <input
                    type="number"
                    name="events_organized"
                    value={newDirectorForm.events_organized}
                    onChange={handleNewDirectorFormChange}
                    min="0"
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={newDirectorForm.start_date}
                  onChange={handleNewDirectorFormChange}
                  required
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div className="form-group">
                <label>Reason for Previous Director Leaving</label>
                <input
                  type="text"
                  name="reason_for_leaving"
                  value={newDirectorForm.reason_for_leaving}
                  onChange={handleNewDirectorFormChange}
                  placeholder="e.g., Passed to new director, Resigned, etc."
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  type="submit" 
                  className="enhanced-error-btn" 
                  style={{ background: '#28a745', marginRight: '10px' }}
                >
                  Add Director
                </button>
                <button 
                  type="button" 
                  className="enhanced-error-btn" 
                  onClick={() => setShowAddDirectorModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

export default AssociateGroups;
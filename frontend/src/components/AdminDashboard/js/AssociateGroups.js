import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import '../css/AssociateGroups.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEdit, faTachometerAlt, faUsers, faBell, faCheckCircle, faBullhorn, faGraduationCap, faChartBar, faSignOutAlt, faBars, faTimes, faTrash, faPen, faUser, faLock, faArrowLeft, faArrowRight, faCheck, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({ 
    name: '', 
    type: '', 
    director: '', 
    description: '', 
    logo: '', 
    email: '', 
    phone: '',
    password: '',
    password_confirmation: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [popupError, setPopupError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [notification, setNotification] = useState('');

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
    setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '', password: '', password_confirmation: '' });
    setLogoFile(null);
    setCurrentStep(1);
    setShowAddModal(true);
    setShowPopup(false); // Reset error modal
    setPopupError('');
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setCurrentStep(1);
    setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '', password: '', password_confirmation: '' });
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
      password: '',
      password_confirmation: ''
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
    setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '', password: '', password_confirmation: '' });
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

  const handlePasswordChange = async (userId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axios.post(`${API_BASE}/api/admin/change-password`, {
        user_id: userId,
        new_password: form.password,
        new_password_confirmation: form.password_confirmation
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Password changed successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to change password');
    }
  };

  const validateForm = () => {
    if (!form.name || !form.email || !form.phone) {
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

    // Validate password for new associates
    if (!editMode) {
      if (!form.password || !form.password_confirmation) {
        setError('Please enter a password and confirmation');
        return false;
      }
      if (form.password !== form.password_confirmation) {
        setError('Passwords do not match');
        return false;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
    }

    // Validate password change if provided in edit mode
    if (editMode && (form.password || form.password_confirmation)) {
      if (!form.password || !form.password_confirmation) {
        setError('Please enter both password and confirmation');
        return false;
      }
      if (form.password !== form.password_confirmation) {
        setError('Passwords do not match');
        return false;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!validateStep2()) return;
    }
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('type', form.type);
      formData.append('director', form.director);
      formData.append('description', form.description);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      if (logoFile) formData.append('logo', logoFile);
      if (form.password) {
        formData.append('password', form.password);
        formData.append('password_confirmation', form.password_confirmation);
      }
      const response = await axios.post(`${API_BASE}/api/associate-groups`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      // --- 4. After successful submission, reset error modal state ---
      if (response.status === 201 || response.status === 200) {
        setNotification('Associate group added successfully!');
        setShowAddModal(false);
        setCurrentStep(1);
        setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '', password: '', password_confirmation: '' });
        setLogoFile(null);
        setError('');
        setShowPopup(false); // Reset error modal
        setPopupError('');
        fetchAssociates();
        setTimeout(() => setNotification(''), 2000);
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
    
    if (!validateStep1()) return;
    
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

  const nextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setError('');
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
    setError('');
  };

  const validateStep1 = () => {
    if (!form.name || !form.type || !form.director || !form.description || !form.email || !form.phone) {
      setError('Please fill in all required fields in Step 1');
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
    
    // Validate logo only for new associates (not for editing)
    if (!editMode && !logoFile) {
      setError('Please upload a logo');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!editMode) {
      if (!form.password || !form.password_confirmation) {
        setError('Please enter a password and confirmation');
        return false;
      }
      if (form.password !== form.password_confirmation) {
        setError('Passwords do not match');
        return false;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
    } else if (form.password || form.password_confirmation) {
      if (!form.password || !form.password_confirmation) {
        setError('Please enter both password and confirmation');
        return false;
      }
      if (form.password !== form.password_confirmation) {
        setError('Passwords do not match');
        return false;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
    }
    return true;
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
        {associates.map(associate => (
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
        ))}
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
            {/* Progress Steps */}
            <div className="step-progress">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}> <div className="step-number">1</div> <div className="step-label">Basic Information</div> </div>
              <div className="step-connector"></div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}> <div className="step-number">2</div> <div className="step-label">Password Setup</div> </div>
            </div>
            <form className="add-edit-form enhanced-form" onSubmit={handleAddSubmit}>
              {currentStep === 1 && (
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
              )}

              {currentStep === 2 && (
                <div className="step-content">
                  <div className="step-header">
                    <FontAwesomeIcon icon={faLock} className="step-icon" />
                    <h4>Password Setup</h4>
                    <p>{editMode ? 'Optionally update the password for this associate.' : 'Set up the initial password for the associate account.'}</p>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label>{editMode ? 'New Password' : 'Password'} *</label>
                      <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleFormChange}
                        placeholder="Enter password"
                        required={!editMode}
                        minLength="8"
                      />
                      <small>Password must be at least 8 characters long</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Confirm Password *</label>
                      <input
                        name="password_confirmation"
                        type="password"
                        value={form.password_confirmation}
                        onChange={handleFormChange}
                        placeholder="Confirm password"
                        required={!editMode}
                        minLength="8"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-actions">
                {currentStep === 1 ? (
                  <>
                    <div></div>
                    <button type="button" className="btn-next" onClick={() => setCurrentStep(2)}>
                      Next Step <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn-prev" onClick={() => setCurrentStep(1)}>
                      <FontAwesomeIcon icon={faArrowLeft} /> Previous Step
                    </button>
                    <button type="submit" className="btn-submit">
                      <FontAwesomeIcon icon={faCheck} /> Add Associate
                    </button>
                  </>
                )}
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
            <span className="enhanced-error-icon" role="img" aria-label="Error">⚠️</span>
            <h2>Error</h2>
            <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={() => setShowPopup(false)} />
          </div>
          <div className="enhanced-error-body">
            <p style={{ fontWeight: 500, color: '#b00020', marginBottom: 8 }}>
              {popupError}
            </p>
            <p style={{ color: '#555', fontSize: '0.95rem' }}>
              If you need help, please check the form fields or contact support.
            </p>
          </div>
          <button className="enhanced-error-btn" onClick={() => setShowPopup(false)}>Close</button>
        </Modal>
      )}
    </AdminLayout>
  );
}

export default AssociateGroups;
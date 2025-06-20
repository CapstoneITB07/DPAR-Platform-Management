import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import '../css/AssociateGroups.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEdit, faTachometerAlt, faUsers, faBell, faCheckCircle, faBullhorn, faGraduationCap, faChartBar, faSignOutAlt, faBars, faTimes, faTrash, faPen } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';

const API_BASE = 'http://localhost:8000';

// Set the app element for React Modal
Modal.setAppElement('#root');

function AssociateGroups() {
  const [selectedAssociate, setSelectedAssociate] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
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
    password: '',
    password_confirmation: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchAssociates = async () => {
    try {
      const token = localStorage.getItem('authToken');
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
    }, 5000); // Poll every 5 seconds
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

  const openAddModal = () => {
    setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '' });
    setLogoFile(null);
    setEditMode(false);
    setShowAddEditModal(true);
  };

  const openEditListMode = () => {
    setEditListMode(true);
  };

  const closeEditListMode = () => {
    setEditListMode(false);
  };

  const handleEditAssociate = (associate) => {
    setForm(associate);
    setLogoFile(null);
    setEditMode(true);
    setShowAddEditModal(true);
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
      const token = localStorage.getItem('authToken');
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

    // Validate phone number (11 digits)
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(form.phone)) {
      setError('Phone number must be exactly 11 digits');
      return false;
    }

    // Validate logo for new associates
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

  const handleAddEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      
      // Add all form fields to formData
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== undefined && key !== 'password' && key !== 'password_confirmation') {
          formData.append(key, form[key]);
        }
      });

      // For new associates, append password fields
      if (!editMode) {
        formData.append('password', form.password);
        formData.append('password_confirmation', form.password_confirmation);
      }

      // Add logo if selected
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      let response;
      if (editMode) {
        try {
          response = await axios.post(`${API_BASE}/api/associate-groups/${form.id}?_method=PUT`, formData, {
            headers: { 
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          });

          // Handle password change if provided
          if (form.password && form.password_confirmation) {
            await handlePasswordChange(response.data.user_id);
          }

          // Update the associates list with the new data
          setAssociates(prev => prev.map(a => a.id === form.id ? response.data : a));
          setSelectedAssociate(response.data);
          setShowAddEditModal(false);
          setError('');
          setMessage('Associate updated successfully');
        } catch (error) {
          console.error('Error updating associate:', error.response?.data);
          if (error.response?.data?.errors) {
            // Handle validation errors
            const errorMessages = Object.values(error.response.data.errors).flat();
            setError(errorMessages.join('\n'));
          } else {
            setError(error.response?.data?.message || 'Failed to update associate. Please try again.');
          }
          return;
        }
      } else {
        try {
          response = await axios.post(`${API_BASE}/api/associate-groups`, formData, {
            headers: { 
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          });
          
          // Update the associates list with the new data
          setAssociates(prev => [...prev, response.data]);
          setShowAddEditModal(false);
          setError('');
          setMessage('Associate added successfully');
        } catch (error) {
          console.error('Error creating associate:', error.response?.data);
          if (error.response?.data?.errors) {
            // Handle validation errors
            const errorMessages = Object.values(error.response.data.errors).flat();
            setError(errorMessages.join('\n'));
          } else {
            setError(error.response?.data?.message || 'Failed to create associate. Please try again.');
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleRemoveAssociate = async (associateId) => {
    if (!window.confirm('Are you sure you want to remove this associate group?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_BASE}/api/associate-groups/${associateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssociates(prev => prev.filter(a => a.id !== associateId));
      if (selectedAssociate && selectedAssociate.id === associateId) {
        setSelectedAssociate(null);
        setShowProfileModal(false);
      }
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

  const closeAddEditModal = () => {
    setShowAddEditModal(false);
    setForm({ name: '', type: '', director: '', description: '', logo: '', email: '', phone: '' });
    setLogoFile(null);
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
      const token = localStorage.getItem('authToken');
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
      <div className="associate-groups-header">
        <h2>ASSOCIATE GROUPS:</h2>
        <div>
          <button className="add-associate-btn" onClick={openAddModal}>Add Associate</button>
          <button className="edit-associate-btn" onClick={openEditListMode}>Edit</button>
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
        className="profile-modal-card"
        overlayClassName="profile-modal-overlay"
      >
        {selectedGroup && (
          <div className="profile-modal-content">
            <div className="profile-modal-header">
              <img
                src={getLogoUrl(selectedGroup.logo)}
                alt={selectedGroup.name}
                className="profile-modal-logo"
                onError={(e) => {
                  e.target.src = '/Assets/disaster_logo.png';
                }}
              />
              <button onClick={() => setShowModal(false)} className="close-icon">&times;</button>
            </div>
            <h3>{selectedGroup.name}</h3>
            <p>Director: {selectedGroup.director}</p>
            <p>Email: {selectedGroup.email}</p>
            <p>Phone: {selectedGroup.phone}</p>
            <div className="profile-description-section">
              <p>{selectedGroup.description}</p>
            </div>
            <div className="profile-stats-contact-message">
              <div className="profile-stats">
                <p><strong>Members:</strong> {selectedGroup.members_count || 0}</p>
                <p><strong>Type:</strong> {selectedGroup.type}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* Add/Edit Associate Modal */}
      {showAddEditModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3>{editMode ? 'Edit Associate' : 'Add Associate'}</h3>
              <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={closeAddEditModal} />
            </div>
            <form className="add-edit-form" onSubmit={handleAddEditSubmit}>
              <label>Name:<input name="name" value={form.name} onChange={handleFormChange} required /></label>
              <label>Type:<input name="type" value={form.type} onChange={handleFormChange} required /></label>
              <label>Director:<input name="director" value={form.director} onChange={handleFormChange} required /></label>
              <label>Description:<textarea name="description" value={form.description} onChange={handleFormChange} required /></label>
              <label>
                Logo:
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg,image/gif" 
                  onChange={handleLogoChange} 
                  required={!editMode} 
                />
                <small>Accepted formats: JPEG, PNG, JPG, GIF (max 2MB)</small>
              </label>
              <label>
                Email:
                <input 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={handleFormChange} 
                  required 
                  pattern="[^@\s]+@[^@\s]+\.[^@\s]+" 
                />
              </label>
              <label>
                Phone:
                <input 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleFormChange} 
                  required 
                  pattern="[0-9]{11}" 
                  title="Phone number must be exactly 11 digits"
                  maxLength="11"
                />
              </label>
              
              {/* Password fields */}
              <div className="password-section">
                <h4>{editMode ? 'Change Password (optional)' : 'Set Password'}</h4>
                <label>
                  {editMode ? 'New Password' : 'Password'}:
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleFormChange}
                    required={!editMode}
                    minLength="8"
                  />
                </label>
                <label>
                  Confirm Password:
                  <input
                    name="password_confirmation"
                    type="password"
                    value={form.password_confirmation}
                    onChange={handleFormChange}
                    required={!editMode}
                    minLength="8"
                  />
                </label>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="save-btn">{editMode ? 'Save Changes' : 'Add Associate'}</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AssociateGroups; 
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/HeadAdmins.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faPlus, faEdit, faTrash, faEye, faCheckCircle, faTimesCircle, faUndo, faBan, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';
import Modal from 'react-modal';

Modal.setAppElement('#root');

function HeadAdmins() {
  const [headAdmins, setHeadAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('soft'); // 'soft' or 'permanent'
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchHeadAdmins();
  }, []);

  const fetchHeadAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/head-admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHeadAdmins(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch head admins');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalError('');
    setPasswordError('');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setModalError('Please enter a valid email address');
      return;
    }
    
    // Password validation
    if (formData.password !== formData.password_confirmation) {
      setPasswordError('Password and confirmation do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      await axiosInstance.post(`${API_BASE}/api/superadmin/head-admins`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Head admin created successfully!');
      closeCreateModal();
      fetchHeadAdmins();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to create head admin';
      if (errorMsg.toLowerCase().includes('password')) {
        setPasswordError(errorMsg);
      } else {
        setModalError(errorMsg);
      }
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setModalError('');
    setPasswordError('');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setModalError('Please enter a valid email address');
      return;
    }
    
    // Handle password fields - only include if password is provided and matches confirmation
    const updateData = { ...formData };
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
      delete updateData.password_confirmation;
    } else {
      // Validate password confirmation
      if (updateData.password !== updateData.password_confirmation) {
        setPasswordError('Password and confirmation do not match');
        return;
      }
      if (updateData.password.length < 8) {
        setPasswordError('Password must be at least 8 characters long');
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('authToken');
      await axiosInstance.put(`${API_BASE}/api/superadmin/head-admins/${selectedAdmin.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Head admin updated successfully!');
      setShowEditModal(false);
      setModalError('');
      setPasswordError('');
      setSelectedAdmin(null);
      setOriginalFormData(null);
      setFormData({ name: '', username: '', email: '', password: '', password_confirmation: '' });
      fetchHeadAdmins();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to update head admin';
      if (errorMsg.toLowerCase().includes('password')) {
        setPasswordError(errorMsg);
      } else {
        setModalError(errorMsg);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/head-admins/${selectedAdmin.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Head admin deleted successfully!');
      fetchHeadAdmins();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to delete head admin');
    } finally {
      setShowDeleteModal(false);
      setSelectedAdmin(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedAdmin) return;
    
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/head-admins/${selectedAdmin.id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Head admin permanently deleted!');
      fetchHeadAdmins();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to permanently delete head admin');
    } finally {
      setShowPermanentDeleteModal(false);
      setSelectedAdmin(null);
    }
  };

  const openDeleteModal = (admin, type = 'soft') => {
    setSelectedAdmin(admin);
    setDeleteType(type);
    if (type === 'permanent') {
      setShowPermanentDeleteModal(true);
    } else {
      setShowDeleteModal(true);
    }
  };

  const handleRestore = async (adminId) => {
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      await axiosInstance.post(`${API_BASE}/api/superadmin/head-admins/${adminId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Head admin restored successfully!');
      fetchHeadAdmins();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to restore head admin');
    }
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    const initialData = {
      name: admin.name,
      username: admin.username,
      email: admin.email,
      password: '',
      password_confirmation: ''
    };
    setFormData(initialData);
    setOriginalFormData(initialData);
    setModalError('');
    setPasswordError('');
    setShowEditModal(true);
  };
  
  // Check if form has been modified
  const hasChanges = () => {
    if (!originalFormData) return false;
    
    // Check if any field has changed
    if (formData.name !== originalFormData.name) return true;
    if (formData.username !== originalFormData.username) return true;
    if (formData.email !== originalFormData.email) return true;
    if (formData.password && formData.password.trim() !== '') return true;
    
    return false;
  };


  const openCreateModal = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      password_confirmation: ''
    });
    setModalError('');
    setPasswordError('');
    setSelectedAdmin(null);
    setOriginalFormData(null);
    setShowModal(true);
  };

  const closeCreateModal = () => {
    setShowModal(false);
    setModalError('');
    setPasswordError('');
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      password_confirmation: ''
    });
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="sa-headadmin-container">
          <div className="loading">Loading head admins...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-headadmin-container">
        <div className="sa-headadmin-page-header">
          <h1><FontAwesomeIcon icon={faUserShield} /> Head Admins Management</h1>
          <button className="sa-headadmin-btn-primary" onClick={openCreateModal}>
            <FontAwesomeIcon icon={faPlus} /> Create Head Admin
          </button>
        </div>

        {successMessage && (
          <div className="success-message">
            <FontAwesomeIcon icon={faCheckCircle} /> {successMessage}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="sa-headadmin-grid">
          {headAdmins.map((admin) => (
            <div key={admin.id} className={`admin-card ${admin.deleted_at ? 'admin-card-deleted' : ''}`}>
              <div className="admin-header">
                <div className="admin-avatar">
                  <FontAwesomeIcon icon={faUserShield} />
                </div>
                <div className="admin-info">
                  <h3>{admin.name}</h3>
                  <p className="admin-email">{admin.email}</p>
                  <p className="admin-username">@{admin.username}</p>
                  {admin.deleted_at && (
                    <p className="admin-deleted-badge">Deleted</p>
                  )}
                </div>
              </div>
              <div className="admin-actions">
                {admin.deleted_at ? (
                  <button 
                    className="sa-headadmin-btn-restore" 
                    onClick={() => handleRestore(admin.id)}
                    style={{ width: '100%' }}
                  >
                    <FontAwesomeIcon icon={faUndo} /> Restore
                  </button>
                ) : (
                  <>
                    <button className="sa-headadmin-btn-edit" onClick={() => openEditModal(admin)}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button className="sa-headadmin-btn-delete" onClick={() => openDeleteModal(admin, 'soft')}>
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                    <button 
                      className="sa-headadmin-btn-permanent-delete" 
                      onClick={() => openDeleteModal(admin, 'permanent')}
                      title="Permanently delete (cannot be restored)"
                    >
                      <FontAwesomeIcon icon={faExclamationTriangle} className="sa-headadmin-permanent-icon" />
                      <FontAwesomeIcon icon={faBan} />
                      <span className="sa-headadmin-permanent-delete-text">Permanent Delete</span>
                    </button>
                  </>
                )}
              </div>
              <div className="admin-meta">
                <p>Created: {new Date(admin.created_at).toLocaleDateString()}</p>
                {admin.deleted_at && (
                  <p>Deleted: {new Date(admin.deleted_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {headAdmins.length === 0 && (
          <div className="empty-state">
            <FontAwesomeIcon icon={faUserShield} />
            <p>No head admins found</p>
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showModal}
          onRequestClose={closeCreateModal}
          className="sa-headadmin-modal"
          overlayClassName="sa-headadmin-modal-overlay"
        >
          <div className="sa-headadmin-modal-header">
            <h2>Create Head Admin</h2>
            <button onClick={closeCreateModal} className="sa-headadmin-close-btn">
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="sa-headadmin-modal-form">
            {modalError && (
              <div className="sa-headadmin-modal-error">
                {modalError}
              </div>
            )}
            <div className="sa-headadmin-form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setModalError('');
                }}
                required
              />
            </div>
            <div className="sa-headadmin-form-group">
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setModalError('');
                }}
                required
              />
            </div>
            <div className="sa-headadmin-form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setModalError('');
                }}
                required
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              />
            </div>
            <div className="sa-headadmin-form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setPasswordError('');
                  setModalError('');
                }}
                required
                minLength={8}
              />
            </div>
            <div className="sa-headadmin-form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={formData.password_confirmation}
                onChange={(e) => {
                  setFormData({ ...formData, password_confirmation: e.target.value });
                  setPasswordError('');
                  setModalError('');
                }}
                required
                minLength={8}
              />
              {passwordError && (
                <div className="sa-headadmin-form-group-error">
                  {passwordError}
                </div>
              )}
            </div>
            <div className="sa-headadmin-modal-actions">
              <button type="button" onClick={closeCreateModal} className="sa-headadmin-btn-cancel">
                Cancel
              </button>
              <button type="submit" className="sa-headadmin-btn-submit">Create</button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
          className="sa-headadmin-modal"
          overlayClassName="sa-headadmin-modal-overlay"
        >
          <div className="sa-headadmin-modal-header">
            <h2>Edit Head Admin</h2>
            <button onClick={() => setShowEditModal(false)} className="sa-headadmin-close-btn">
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </div>
          <form onSubmit={handleEdit} className="sa-headadmin-modal-form">
            {modalError && (
              <div className="sa-headadmin-modal-error">
                {modalError}
              </div>
            )}
            <div className="sa-headadmin-form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setModalError('');
                }}
                required
              />
            </div>
            <div className="sa-headadmin-form-group">
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setModalError('');
                }}
                required
              />
            </div>
            <div className="sa-headadmin-form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setModalError('');
                }}
                required
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              />
            </div>
            <div className="sa-headadmin-form-group">
              <label>New Password (leave blank to keep current)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setPasswordError('');
                  setModalError('');
                }}
                minLength={8}
              />
            </div>
            <div className="sa-headadmin-form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={formData.password_confirmation}
                onChange={(e) => {
                  setFormData({ ...formData, password_confirmation: e.target.value });
                  setPasswordError('');
                  setModalError('');
                }}
                minLength={8}
              />
              {passwordError && (
                <div className="sa-headadmin-form-group-error">
                  {passwordError}
                </div>
              )}
            </div>
            <div className="sa-headadmin-modal-actions">
              <button type="button" onClick={() => {
                setShowEditModal(false);
                setModalError('');
                setPasswordError('');
                setOriginalFormData(null);
              }} className="sa-headadmin-btn-cancel">
                Cancel
              </button>
              <button type="submit" className="sa-headadmin-btn-submit" disabled={!hasChanges()}>
                Update
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="sa-headadmin-delete-overlay">
            <div className="sa-headadmin-confirm-modal">
              <button className="sa-headadmin-confirm-close" onClick={() => setShowDeleteModal(false)}>&times;</button>
              <div className="sa-headadmin-confirm-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="28" stroke="#e53935" strokeWidth="4" fill="#fff"/>
                  <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="32" fill="#e53935">!</text>
                </svg>
              </div>
              <div className="sa-headadmin-confirm-message">
                Are you sure you want to delete <strong>{selectedAdmin?.name}</strong>?
                <p className="sa-headadmin-info-text">This head admin can be restored later if needed.</p>
              </div>
              <div className="sa-headadmin-confirm-actions">
                <button className="sa-headadmin-delete-btn" onClick={handleDelete}>Yes, delete</button>
                <button className="sa-headadmin-cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Permanent Delete Confirmation Modal */}
        {showPermanentDeleteModal && (
          <div className="sa-headadmin-delete-overlay">
            <div className="sa-headadmin-confirm-modal sa-headadmin-permanent-delete-modal">
              <button className="sa-headadmin-confirm-close" onClick={() => setShowPermanentDeleteModal(false)}>&times;</button>
              <div className="sa-headadmin-confirm-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="28" stroke="#dc3545" strokeWidth="5" fill="#fff"/>
                  <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="32" fill="#dc3545">!</text>
                </svg>
              </div>
              <div className="sa-headadmin-confirm-message">
                Are you sure you want to <strong>permanently delete</strong> <strong>{selectedAdmin?.name}</strong>?
                <p className="sa-headadmin-warning-text">⚠️ This action cannot be undone. All data will be permanently removed.</p>
                <p className="sa-headadmin-info-text">Consider using regular delete if you might need to restore this account later.</p>
              </div>
              <div className="sa-headadmin-confirm-actions">
                <button className="sa-headadmin-permanent-delete-btn" onClick={handlePermanentDelete}>Yes, permanently delete</button>
                <button className="sa-headadmin-cancel-btn" onClick={() => setShowPermanentDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export default HeadAdmins;


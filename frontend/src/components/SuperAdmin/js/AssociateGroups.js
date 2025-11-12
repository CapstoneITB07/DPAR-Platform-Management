import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/AssociateGroups.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faEdit, faTrash, faBuilding, faSearch, faTimesCircle, faCheckCircle, faUndo, faBan, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';
import Modal from 'react-modal';

Modal.setAppElement('#root');

function AssociateGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('soft');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    director: '',
    description: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [currentPage, searchTerm, ageFilter]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 15,
        ...(searchTerm && { search: searchTerm }),
        ...(ageFilter && { age_filter: ageFilter })
      });
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/associate-groups?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setError('');
    } catch (err) {
      setError('Failed to fetch associate groups');
      console.error('Error:', err);
    } finally {
      setLoading(false);
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

  const openEditModal = (group) => {
    setSelectedGroup(group);
    const initialData = {
      name: group.name || '',
      type: group.type || '',
      director: group.director || '',
      description: group.description || '',
      email: group.email || '',
      phone: group.phone || '',
      password: '',
      password_confirmation: ''
    };
    setFormData(initialData);
    setOriginalFormData(initialData);
    setModalError('');
    setPasswordError('');
    setShowEditModal(true);
  };

  const hasChanges = () => {
    if (!originalFormData) return false;
    
    if (formData.name !== originalFormData.name) return true;
    if (formData.type !== originalFormData.type) return true;
    if (formData.director !== originalFormData.director) return true;
    if (formData.description !== originalFormData.description) return true;
    if (formData.email !== originalFormData.email) return true;
    if (formData.phone !== originalFormData.phone) return true;
    if (formData.password && formData.password.trim() !== '') return true;
    
    return false;
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
      await axiosInstance.put(`${API_BASE}/api/superadmin/associate-groups/${selectedGroup.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Associate group updated successfully!');
      setShowEditModal(false);
      setModalError('');
      setPasswordError('');
      setSelectedGroup(null);
      setOriginalFormData(null);
      setFormData({ name: '', type: '', director: '', description: '', email: '', phone: '', password: '', password_confirmation: '' });
      fetchGroups();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to update associate group';
      if (err.response?.data?.errors) {
        const errors = Object.values(err.response.data.errors).flat();
        const errorString = errors.join(', ');
        if (errorString.toLowerCase().includes('password')) {
          setPasswordError(errorString);
        } else {
          setModalError(errorString);
        }
      } else {
        if (errorMsg.toLowerCase().includes('password')) {
          setPasswordError(errorMsg);
        } else {
          setModalError(errorMsg);
        }
      }
    }
  };

  const openDeleteModal = (group, type) => {
    setSelectedGroup(group);
    setDeleteType(type);
    if (type === 'permanent') {
      setShowPermanentDeleteModal(true);
    } else {
      setShowDeleteModal(true);
    }
  };

  const handleDelete = async () => {
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/associate-groups/${selectedGroup.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Associate group deleted successfully!');
      setShowDeleteModal(false);
      setSelectedGroup(null);
      fetchGroups();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to delete associate group');
      setShowDeleteModal(false);
    }
  };

  const handlePermanentDelete = async () => {
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/associate-groups/${selectedGroup.id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Associate group permanently deleted!');
      setShowPermanentDeleteModal(false);
      setSelectedGroup(null);
      fetchGroups();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to permanently delete associate group');
      setShowPermanentDeleteModal(false);
    }
  };

  const handleRestore = async (groupId) => {
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      await axiosInstance.post(`${API_BASE}/api/superadmin/associate-groups/${groupId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Associate group restored successfully!');
      fetchGroups();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to restore associate group');
    }
  };

  if (loading && groups.length === 0) {
    return (
      <SuperAdminLayout>
        <div className="sa-associategroups-container">
          <div className="sa-associategroups-loading">Loading associate groups...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-associategroups-container">
        <div className="sa-associategroups-page-header">
          <h1><FontAwesomeIcon icon={faUsers} /> Associate Groups</h1>
        </div>

        <div className="sa-associategroups-filters-section">
          <div className="sa-associategroups-search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search associate groups..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <select
            className="sa-associategroups-age-filter"
            value={ageFilter}
            onChange={(e) => {
              setAgeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Groups</option>
            <option value="new">New</option>
            <option value="old">Old</option>
          </select>
        </div>

        {successMessage && (
          <div className="sa-associategroups-success-message">
            <FontAwesomeIcon icon={faCheckCircle} /> {successMessage}
          </div>
        )}

        {error && <div className="sa-associategroups-error-message">{error}</div>}

        <div className="sa-associategroups-grid">
          {groups.map((group) => (
            <div key={group.id} className={`sa-associategroups-card ${group.deleted_at ? 'sa-associategroups-card-deleted' : ''}`}>
              <div className="sa-associategroups-header">
                <img 
                  src={getLogoUrl(group.logo)} 
                  alt={group.name} 
                  className="sa-associategroups-logo"
                  onError={(e) => {
                    e.target.src = `${window.location.origin}/Assets/disaster_logo.png`;
                  }}
                />
                <div className="sa-associategroups-info">
                  <h3>{group.name}</h3>
                  <p className="sa-associategroups-type">{group.type}</p>
                  {group.director && <p className="sa-associategroups-director">Director: {group.director}</p>}
                  {group.deleted_at && (
                    <p className="sa-associategroups-deleted-badge">Deleted</p>
                  )}
                </div>
              </div>
              {group.description && (
                <p className="sa-associategroups-description">{group.description.substring(0, 100)}...</p>
              )}
              <div className="sa-associategroups-meta">
                <p><FontAwesomeIcon icon={faBuilding} /> {group.email || 'No email'}</p>
                <p>Joined: {new Date(group.created_at).toLocaleDateString()}</p>
                {group.deleted_at && (
                  <p>Deleted: {new Date(group.deleted_at).toLocaleDateString()}</p>
                )}
              </div>
              <div className="sa-associategroups-actions">
                {group.deleted_at ? (
                  <button 
                    className="sa-associategroups-btn-restore" 
                    onClick={() => handleRestore(group.id)}
                    style={{ width: '100%' }}
                  >
                    <FontAwesomeIcon icon={faUndo} /> Restore
                  </button>
                ) : (
                  <>
                    <button className="sa-associategroups-btn-edit" onClick={() => openEditModal(group)}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button className="sa-associategroups-btn-delete" onClick={() => openDeleteModal(group, 'soft')}>
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                    <button 
                      className="sa-associategroups-btn-permanent-delete" 
                      onClick={() => openDeleteModal(group, 'permanent')}
                      title="Permanently delete (cannot be restored)"
                    >
                      <FontAwesomeIcon icon={faExclamationTriangle} className="sa-associategroups-permanent-icon" />
                      <FontAwesomeIcon icon={faBan} />
                      <span className="sa-associategroups-permanent-delete-text">Permanent Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {groups.length === 0 && !loading && (
          <div className="sa-associategroups-empty-state">
            <FontAwesomeIcon icon={faUsers} />
            <p>No associate groups found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="sa-associategroups-pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="sa-associategroups-page-btn"
            >
              Previous
            </button>
            <span className="sa-associategroups-page-info">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="sa-associategroups-page-btn"
            >
              Next
            </button>
          </div>
        )}

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onRequestClose={() => {
            setShowEditModal(false);
            setModalError('');
            setPasswordError('');
            setOriginalFormData(null);
          }}
          className="sa-associategroups-modal"
          overlayClassName="sa-associategroups-modal-overlay"
        >
          <div className="sa-associategroups-modal-header">
            <h2>Edit Associate Group</h2>
            <button onClick={() => {
              setShowEditModal(false);
              setModalError('');
              setPasswordError('');
              setOriginalFormData(null);
            }} className="sa-associategroups-close-btn">
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </div>
          <form onSubmit={handleEdit} className="sa-associategroups-modal-form">
            {modalError && (
              <div className="sa-associategroups-modal-error">
                {modalError}
              </div>
            )}
            <div className="sa-associategroups-form-group">
              <label>Organization Name</label>
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
            <div className="sa-associategroups-form-group">
              <label>Type</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  setFormData({ ...formData, type: e.target.value });
                  setModalError('');
                }}
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
            <div className="sa-associategroups-form-group">
              <label>Director Name</label>
              <input
                type="text"
                value={formData.director}
                onChange={(e) => {
                  setFormData({ ...formData, director: e.target.value });
                  setModalError('');
                }}
                required
              />
              <small>Changing the director name will end the current director's term and start a new term for the new director.</small>
            </div>
            <div className="sa-associategroups-form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setModalError('');
                }}
                rows="4"
              />
            </div>
            <div className="sa-associategroups-form-group">
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
            <div className="sa-associategroups-form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  setModalError('');
                }}
                placeholder="09XXXXXXXXX"
                pattern="^09\d{9}$"
                required
              />
            </div>
            <div className="sa-associategroups-form-group">
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
            <div className="sa-associategroups-form-group">
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
                <div className="sa-associategroups-form-group-error">
                  {passwordError}
                </div>
              )}
            </div>
            <div className="sa-associategroups-modal-actions">
              <button type="button" onClick={() => {
                setShowEditModal(false);
                setModalError('');
                setPasswordError('');
                setOriginalFormData(null);
              }} className="sa-associategroups-btn-cancel">
                Cancel
              </button>
              <button type="submit" className="sa-associategroups-btn-submit" disabled={!hasChanges()}>
                Update
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="sa-associategroups-delete-overlay">
            <div className="sa-associategroups-confirm-modal">
              <button className="sa-associategroups-confirm-close" onClick={() => setShowDeleteModal(false)}>&times;</button>
              <div className="sa-associategroups-confirm-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="28" stroke="#e53935" strokeWidth="4" fill="#fff"/>
                  <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="32" fill="#e53935">!</text>
                </svg>
              </div>
              <div className="sa-associategroups-confirm-message">
                Are you sure you want to delete <strong>{selectedGroup?.name}</strong>?
                <p className="sa-associategroups-info-text">This associate group can be restored later if needed.</p>
              </div>
              <div className="sa-associategroups-confirm-actions">
                <button className="sa-associategroups-delete-btn" onClick={handleDelete}>Yes, delete</button>
                <button className="sa-associategroups-cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Permanent Delete Confirmation Modal */}
        {showPermanentDeleteModal && (
          <div className="sa-associategroups-delete-overlay">
            <div className="sa-associategroups-confirm-modal sa-associategroups-permanent-delete-modal">
              <button className="sa-associategroups-confirm-close" onClick={() => setShowPermanentDeleteModal(false)}>&times;</button>
              <div className="sa-associategroups-confirm-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="28" stroke="#dc3545" strokeWidth="5" fill="#fff"/>
                  <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="32" fill="#dc3545">!</text>
                </svg>
              </div>
              <div className="sa-associategroups-confirm-message">
                Are you sure you want to <strong>permanently delete</strong> <strong>{selectedGroup?.name}</strong>?
                <p className="sa-associategroups-warning-text">⚠️ This action cannot be undone. All data will be permanently removed.</p>
                <p className="sa-associategroups-info-text">Consider using regular delete if you might need to restore this group later.</p>
              </div>
              <div className="sa-associategroups-confirm-actions">
                <button className="sa-associategroups-permanent-delete-btn" onClick={handlePermanentDelete}>Yes, permanently delete</button>
                <button className="sa-associategroups-cancel-btn" onClick={() => setShowPermanentDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export default AssociateGroups;

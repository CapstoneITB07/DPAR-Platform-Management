import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/SystemAlerts.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faSearch, faTrash, faEdit, faPlus, faSync, faUndo, faBan, faInfoCircle, faTimes, faCalendar, faUser, faEye, faEyeSlash, faBell } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';

function SystemAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [permanentDeletingId, setPermanentDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    is_active: true,
    show_to_roles: [],
    dismissible: true,
    send_push_notification: false,
    expires_at: ''
  });

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 15,
        ...(searchTerm && { search: searchTerm })
      });
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/system-alerts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setError('');
    } catch (err) {
      setError('Failed to fetch system alerts');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAlerts(false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchAlerts]);

  const handleRefresh = () => {
    fetchAlerts(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      // If all roles are selected, send null (show to all)
      const allRoles = ['head_admin', 'associate_group_leader', 'citizen'];
      const allSelected = allRoles.every(role => formData.show_to_roles.includes(role));
      
      const payload = {
        ...formData,
        expires_at: formData.expires_at || null,
        show_to_roles: allSelected || formData.show_to_roles.length === 0 ? null : formData.show_to_roles
      };
      await axiosInstance.post(`${API_BASE}/api/superadmin/system-alerts`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('System alert created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchAlerts(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create alert');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      // If all roles are selected, send null (show to all)
      const allRoles = ['head_admin', 'associate_group_leader', 'citizen'];
      const allSelected = allRoles.every(role => formData.show_to_roles.includes(role));
      
      const payload = {
        ...formData,
        expires_at: formData.expires_at || null,
        show_to_roles: allSelected || formData.show_to_roles.length === 0 ? null : formData.show_to_roles
      };
      await axiosInstance.put(`${API_BASE}/api/superadmin/system-alerts/${selectedAlert.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('System alert updated successfully!');
      setShowModal(false);
      fetchAlerts(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update alert');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this alert? It can be restored later.')) return;
    try {
      setDeletingId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/system-alerts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(alerts.map(a => a.id === id ? { ...a, deleted_at: new Date().toISOString() } : a));
      if (selectedAlert && selectedAlert.id === id) setSelectedAlert({ ...selectedAlert, deleted_at: new Date().toISOString() });
      setSuccess('Alert deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete alert');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      setRestoringId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.post(`${API_BASE}/api/superadmin/system-alerts/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(alerts.map(a => a.id === id ? { ...a, deleted_at: null } : a));
      setSuccess('Alert restored successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to restore alert');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure? This cannot be undone!')) return;
    try {
      setPermanentDeletingId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/system-alerts/${id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(alerts.filter(a => a.id !== id));
      if (selectedAlert && selectedAlert.id === id) setShowModal(false);
      setSuccess('Alert permanently deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to permanently delete alert');
    } finally {
      setPermanentDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      is_active: true,
      show_to_roles: [],
      dismissible: true,
      send_push_notification: false,
      expires_at: ''
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (alert) => {
    setSelectedAlert(alert);
    // If show_to_roles is null, it means "show to all", so set all roles
    const allRoles = ['head_admin', 'associate_group_leader', 'citizen'];
    const showToRoles = alert.show_to_roles === null || alert.show_to_roles.length === 0 
      ? [...allRoles] 
      : alert.show_to_roles;
    
    setFormData({
      title: alert.title,
      message: alert.message,
      type: alert.type,
      is_active: alert.is_active,
      show_to_roles: showToRoles,
      dismissible: alert.dismissible,
      send_push_notification: alert.send_push_notification,
      expires_at: alert.expires_at ? new Date(alert.expires_at).toISOString().slice(0, 16) : ''
    });
    setShowModal(true);
  };

  const toggleRole = (role) => {
    setFormData(prev => ({
      ...prev,
      show_to_roles: prev.show_to_roles.includes(role)
        ? prev.show_to_roles.filter(r => r !== role)
        : [...prev.show_to_roles, role]
    }));
  };

  const toggleAllRoles = () => {
    setFormData(prev => {
      const allRoles = ['head_admin', 'associate_group_leader', 'citizen'];
      const allSelected = allRoles.every(role => prev.show_to_roles.includes(role));
      
      return {
        ...prev,
        show_to_roles: allSelected ? [] : [...allRoles]
      };
    });
  };

  const allRolesSelected = () => {
    const allRoles = ['head_admin', 'associate_group_leader', 'citizen'];
    return allRoles.every(role => formData.show_to_roles.includes(role));
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading && alerts.length === 0) {
    return (
      <SuperAdminLayout>
        <div className="sa-systemalerts-container">
          <div className="sa-systemalerts-loading">Loading system alerts...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-systemalerts-container">
        <div className="sa-systemalerts-page-header">
          <div>
            <h1><FontAwesomeIcon icon={faExclamationTriangle} /> System Alerts Management</h1>
            <p>Create and manage system-wide alerts to notify users about maintenance, updates, or important announcements</p>
          </div>
          <div className="sa-systemalerts-header-actions">
            <button className="sa-systemalerts-btn-refresh" onClick={handleRefresh} disabled={refreshing || loading}>
              <FontAwesomeIcon icon={faSync} spin={refreshing} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="sa-systemalerts-btn-create" onClick={openCreateModal}>
              <FontAwesomeIcon icon={faPlus} /> Create Alert
            </button>
          </div>
        </div>

        {error && <div className="sa-systemalerts-error-message">{error}</div>}
        {success && <div className="sa-systemalerts-success-message">{success}</div>}

        <div className="sa-systemalerts-filters-section">
          <div className="sa-systemalerts-search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search alerts by title or message..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="sa-systemalerts-list">
          {alerts.length === 0 ? (
            <div className="sa-systemalerts-empty-state">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <p>No system alerts found</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isDeleted = alert.deleted_at !== null && alert.deleted_at !== undefined;
              return (
                <div
                  key={alert.id}
                  className={`sa-systemalerts-card ${isDeleted ? 'sa-systemalerts-card-deleted' : ''}`}
                  onClick={() => !isDeleted && openEditModal(alert)}
                  style={{ borderLeftColor: getTypeColor(alert.type) }}
                >
                  <div className="sa-systemalerts-card-header">
                    <div className="sa-systemalerts-title-section">
                      <div className="sa-systemalerts-title-wrapper">
                        <h3>{alert.title}</h3>
                        {isDeleted && (
                          <span className="sa-systemalerts-deleted-badge">
                            <FontAwesomeIcon icon={faExclamationTriangle} /> Deleted
                          </span>
                        )}
                      </div>
                      <div className="sa-systemalerts-badges">
                        <span className="sa-systemalerts-badge" style={{ backgroundColor: getTypeColor(alert.type) }}>
                          {alert.type.toUpperCase()}
                        </span>
                        {!alert.is_active && (
                          <span className="sa-systemalerts-badge sa-systemalerts-badge-inactive">
                            <FontAwesomeIcon icon={faEyeSlash} /> Inactive
                          </span>
                        )}
                        {alert.send_push_notification && (
                          <span className="sa-systemalerts-badge sa-systemalerts-badge-push">
                            <FontAwesomeIcon icon={faBell} /> Push
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="sa-systemalerts-actions" onClick={(e) => e.stopPropagation()}>
                      {isDeleted ? (
                        <>
                          <button className="sa-systemalerts-btn-restore" onClick={(e) => handleRestore(alert.id, e)} disabled={restoringId === alert.id}>
                            <FontAwesomeIcon icon={faUndo} /> {restoringId === alert.id ? 'Restoring...' : 'Restore'}
                          </button>
                          <button className="sa-systemalerts-btn-permanent-delete" onClick={(e) => handlePermanentDelete(alert.id, e)} disabled={permanentDeletingId === alert.id}>
                            <FontAwesomeIcon icon={faBan} /> {permanentDeletingId === alert.id ? 'Deleting...' : 'Permanent Delete'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="sa-systemalerts-btn-edit" onClick={(e) => { e.stopPropagation(); openEditModal(alert); }}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="sa-systemalerts-btn-delete" onClick={(e) => handleDelete(alert.id, e)} disabled={deletingId === alert.id}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="sa-systemalerts-card-body">
                    <p>{alert.message}</p>
                    <div className="sa-systemalerts-meta">
                      <span><FontAwesomeIcon icon={faUser} /> {alert.creator?.name || 'Unknown'}</span>
                      <span><FontAwesomeIcon icon={faCalendar} /> {formatDate(alert.created_at)}</span>
                      {alert.expires_at && (
                        <span>Expires: {formatDate(alert.expires_at)}</span>
                      )}
                      {alert.show_to_roles && alert.show_to_roles.length > 0 && (
                        <span>Roles: {alert.show_to_roles.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="sa-systemalerts-pagination">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Next</button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="sa-systemalerts-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="sa-systemalerts-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="sa-systemalerts-modal-header">
                <h2>Create System Alert</h2>
                <button className="sa-systemalerts-modal-close" onClick={() => setShowCreateModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="sa-systemalerts-form">
                <div className="sa-systemalerts-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Scheduled Maintenance"
                  />
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows="4"
                    placeholder="Enter the alert message..."
                  />
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Active (show to users)
                  </label>
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>Show to Roles</label>
                  <div className="sa-systemalerts-roles-checkboxes">
                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                      <input
                        type="checkbox"
                        checked={allRolesSelected()}
                        onChange={toggleAllRoles}
                      />
                      All Roles (show to everyone)
                    </label>
                    {['head_admin', 'associate_group_leader', 'citizen'].map(role => (
                      <label key={role} style={{ marginLeft: '20px' }}>
                        <input
                          type="checkbox"
                          checked={formData.show_to_roles.includes(role)}
                          onChange={() => toggleRole(role)}
                          disabled={allRolesSelected()}
                        />
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.dismissible}
                      onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                    />
                    Dismissible (users can close it)
                  </label>
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.send_push_notification}
                      onChange={(e) => setFormData({ ...formData, send_push_notification: e.target.checked })}
                    />
                    Send Push Notification
                  </label>
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
                <div className="sa-systemalerts-modal-footer">
                  <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Alert'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showModal && selectedAlert && (
          <div className="sa-systemalerts-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="sa-systemalerts-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="sa-systemalerts-modal-header">
                <h2>Edit System Alert</h2>
                <button className="sa-systemalerts-modal-close" onClick={() => setShowModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="sa-systemalerts-form">
                <div className="sa-systemalerts-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows="4"
                  />
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>Show to Roles</label>
                  <div className="sa-systemalerts-roles-checkboxes">
                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                      <input
                        type="checkbox"
                        checked={allRolesSelected()}
                        onChange={toggleAllRoles}
                      />
                      All Roles (show to everyone)
                    </label>
                    {['head_admin', 'associate_group_leader', 'citizen'].map(role => (
                      <label key={role} style={{ marginLeft: '20px' }}>
                        <input
                          type="checkbox"
                          checked={formData.show_to_roles.includes(role)}
                          onChange={() => toggleRole(role)}
                          disabled={allRolesSelected()}
                        />
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.dismissible}
                      onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                    />
                    Dismissible
                  </label>
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.send_push_notification}
                      onChange={(e) => setFormData({ ...formData, send_push_notification: e.target.checked })}
                    />
                    Send Push Notification
                  </label>
                </div>
                <div className="sa-systemalerts-form-group">
                  <label>Expires At</label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
                <div className="sa-systemalerts-modal-footer">
                  <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export default SystemAlerts;


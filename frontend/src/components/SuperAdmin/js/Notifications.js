import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/Notifications.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faSearch, faTrash, faUser, faCalendar, faEye, faTimes, faUsers, faTag, faSync, faUndo, faBan, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [permanentDeletingId, setPermanentDeletingId] = useState(null);

  const fetchNotifications = React.useCallback(async (isRefresh = false) => {
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
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setError('');
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchNotifications(false);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [fetchNotifications]);

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent modal from opening
    if (!window.confirm('Are you sure you want to delete this notification? It can be restored later.')) {
      return;
    }

    try {
      setDeletingId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update the notification to show as deleted
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, deleted_at: new Date().toISOString() } : n
      ));
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification({ ...selectedNotification, deleted_at: new Date().toISOString() });
      }
      setSuccess('Notification deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      setRestoringId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.post(`${API_BASE}/api/superadmin/notifications/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update the notification to remove deleted_at
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, deleted_at: null } : n
      ));
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification({ ...selectedNotification, deleted_at: null });
      }
      setSuccess('Notification restored successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to restore notification');
      console.error('Error:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this notification? This action cannot be undone!')) {
      return;
    }

    try {
      setPermanentDeletingId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/notifications/${id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove from list
      setNotifications(notifications.filter(n => n.id !== id));
      if (selectedNotification && selectedNotification.id === id) {
        setShowModal(false);
        setSelectedNotification(null);
      }
      setSuccess('Notification permanently deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to permanently delete notification');
      console.error('Error:', err);
    } finally {
      setPermanentDeletingId(null);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && notifications.length === 0) {
    return (
      <SuperAdminLayout>
        <div className="sa-notifications-container">
          <div className="sa-notifications-loading">Loading notifications...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-notifications-container">
        <div className="sa-notifications-page-header">
          <div>
            <h1><FontAwesomeIcon icon={faBell} /> Notifications Management</h1>
            <p>Monitor and view all system notifications sent to associate groups</p>
          </div>
          <button 
            className="sa-notifications-btn-refresh" 
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <FontAwesomeIcon icon={faSync} spin={refreshing} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <div className="sa-notifications-error-message">{error}</div>}
        {success && <div className="sa-notifications-success-message">{success}</div>}

        <div className="sa-notifications-filters-section">
          <div className="sa-notifications-search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search notifications by title or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="sa-notifications-list">
          {notifications.length === 0 ? (
            <div className="sa-notifications-empty-state">
              <FontAwesomeIcon icon={faBell} />
              <p>No notifications found</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isDeleted = notification.deleted_at !== null && notification.deleted_at !== undefined;
              return (
              <div 
                key={notification.id} 
                className={`sa-notifications-card ${isDeleted ? 'sa-notifications-card-deleted' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="sa-notifications-card-header">
                  <div className="sa-notifications-title-wrapper">
                    <h3>{notification.title || 'Untitled Notification'}</h3>
                    {isDeleted && (
                      <span className="sa-notifications-deleted-badge">
                        <FontAwesomeIcon icon={faExclamationTriangle} /> Deleted
                      </span>
                    )}
                  </div>
                  <div className="sa-notifications-actions" onClick={(e) => e.stopPropagation()}>
                    {isDeleted ? (
                      <>
                        <button
                          className="sa-notifications-btn-restore"
                          onClick={(e) => handleRestore(notification.id, e)}
                          disabled={restoringId === notification.id}
                          title="Restore notification"
                        >
                          <FontAwesomeIcon icon={faUndo} />
                          {restoringId === notification.id ? 'Restoring...' : 'Restore'}
                        </button>
                        <button
                          className="sa-notifications-btn-permanent-delete"
                          onClick={(e) => handlePermanentDelete(notification.id, e)}
                          disabled={permanentDeletingId === notification.id}
                          title="Permanently delete (cannot be restored)"
                        >
                          <FontAwesomeIcon icon={faBan} />
                          {permanentDeletingId === notification.id ? 'Deleting...' : 'Permanent Delete'}
                        </button>
                      </>
                    ) : (
                      <button
                        className="sa-notifications-btn-delete"
                        onClick={(e) => handleDelete(notification.id, e)}
                        disabled={deletingId === notification.id}
                        title="Delete notification"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="sa-notifications-card-body">
                  <p className="sa-notifications-description">
                    {notification.description || 'No description'}
                  </p>
                  <div className="sa-notifications-meta">
                    <span>
                      <FontAwesomeIcon icon={faUser} />
                      {notification.creator?.name || 'Unknown'}
                    </span>
                    <span>
                      <FontAwesomeIcon icon={faCalendar} />
                      {formatDate(notification.created_at)}
                    </span>
                    {notification.recipients && notification.recipients.length > 0 && (
                      <span>
                        <FontAwesomeIcon icon={faUsers} />
                        {notification.recipients.length} recipient{notification.recipients.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {notification.expertise_requirements && notification.expertise_requirements.length > 0 && (
                    <div className="sa-notifications-expertise-tags">
                      {notification.expertise_requirements.map((exp, idx) => (
                        <span key={idx} className="sa-notifications-tag">
                          <FontAwesomeIcon icon={faTag} />
                          {typeof exp === 'object' ? `${exp.expertise} (${exp.count})` : exp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="sa-notifications-card-footer">
                  <span className={`sa-notifications-status-badge sa-notifications-status-${notification.status || 'pending'}`}>
                    {notification.status || 'pending'}
                  </span>
                  <span className="sa-notifications-view-details">Click to view details →</span>
                </div>
              </div>
            );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="sa-notifications-pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Modal for viewing full notification details */}
        {showModal && selectedNotification && (
          <div className="sa-notifications-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="sa-notifications-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="sa-notifications-modal-header">
                <h2>{selectedNotification.title || 'Untitled Notification'}</h2>
                <button 
                  className="sa-notifications-modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="sa-notifications-modal-body">
                <div className="sa-notifications-modal-section">
                  <h3>Description</h3>
                  <p>{selectedNotification.description || 'No description provided'}</p>
                </div>
                
                <div className="sa-notifications-modal-section">
                  <h3>Details</h3>
                  <div className="sa-notifications-modal-details">
                    <div>
                      <strong>Created by:</strong> {selectedNotification.creator?.name || 'Unknown'}
                    </div>
                    <div>
                      <strong>Created at:</strong> {formatDate(selectedNotification.created_at)}
                    </div>
                    <div>
                      <strong>Status:</strong> 
                      <span className={`sa-notifications-status-badge sa-notifications-status-${selectedNotification.status || 'pending'}`}>
                        {selectedNotification.status || 'pending'}
                      </span>
                    </div>
                    {selectedNotification.recipients && selectedNotification.recipients.length > 0 && (
                      <div>
                        <strong>Recipients:</strong> {selectedNotification.recipients.length}
                      </div>
                    )}
                  </div>
                </div>

                {selectedNotification.recipients && selectedNotification.recipients.length > 0 && (
                  <div className="sa-notifications-modal-section">
                    <h3>Recipients ({selectedNotification.recipients.length})</h3>
                    <div className="sa-notifications-recipients-list">
                      {selectedNotification.recipients.map((recipient, idx) => (
                        <div key={idx} className="sa-notifications-recipient-item">
                          <FontAwesomeIcon icon={faUser} />
                          <span>{recipient.user?.name || 'Unknown User'}</span>
                          {recipient.response && (
                            <span className="sa-notifications-response-badge">
                              {recipient.response}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNotification.expertise_requirements && selectedNotification.expertise_requirements.length > 0 && (
                  <div className="sa-notifications-modal-section">
                    <h3>Volunteer Requirements</h3>
                    <div className="sa-notifications-expertise-tags">
                      {selectedNotification.expertise_requirements.map((exp, idx) => (
                        <span key={idx} className="sa-notifications-tag">
                          <FontAwesomeIcon icon={faTag} />
                          {typeof exp === 'object' ? `${exp.expertise} (${exp.count} needed)` : exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="sa-notifications-modal-footer">
                {selectedNotification.deleted_at ? (
                  <>
                    <button
                      className="sa-notifications-modal-btn sa-notifications-modal-restore-btn"
                      onClick={(e) => {
                        handleRestore(selectedNotification.id, e);
                        setShowModal(false);
                      }}
                      disabled={restoringId === selectedNotification.id}
                    >
                      <FontAwesomeIcon icon={faUndo} />
                      {restoringId === selectedNotification.id ? 'Restoring...' : 'Restore Notification'}
                    </button>
                    <button
                      className="sa-notifications-modal-btn sa-notifications-modal-permanent-delete-btn"
                      onClick={(e) => {
                        handlePermanentDelete(selectedNotification.id, e);
                        setShowModal(false);
                      }}
                      disabled={permanentDeletingId === selectedNotification.id}
                    >
                      <FontAwesomeIcon icon={faBan} />
                      {permanentDeletingId === selectedNotification.id ? 'Deleting...' : 'Permanent Delete'}
                    </button>
                  </>
                ) : (
                  <button
                    className="sa-notifications-modal-btn-delete"
                    onClick={(e) => {
                      handleDelete(selectedNotification.id, e);
                      setShowModal(false);
                    }}
                    disabled={deletingId === selectedNotification.id}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    {deletingId === selectedNotification.id ? 'Deleting...' : 'Delete Notification'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export default Notifications;

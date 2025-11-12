import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/SystemLogs.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faSearch, faFilter, faTrash, faCalendar } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';
import Modal from 'react-modal';

Modal.setAppElement('#root');

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [activityTypes, setActivityTypes] = useState([]);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [daysToKeep, setDaysToKeep] = useState(90);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [currentPage, typeFilter, userIdFilter, startDate, endDate, perPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: currentPage,
        per_page: perPage,
        ...(typeFilter && { type: typeFilter }),
        ...(userIdFilter && { user_id: userIdFilter }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/system-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalLogs(response.data.total || 0);
      // Set activity types from backend response
      if (response.data.activity_types) {
        setActivityTypes(response.data.activity_types);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch system logs');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setCleanupLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.post(
        `${API_BASE}/api/superadmin/system-logs/cleanup`,
        { days_to_keep: daysToKeep },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(response.data.message || 'Logs cleaned up successfully');
      setShowCleanupModal(false);
      setCurrentPage(1);
      fetchLogs();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cleanup logs');
      console.error('Error:', err);
    } finally {
      setCleanupLoading(false);
    }
  };

  const resetFilters = () => {
    setTypeFilter('');
    setUserIdFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const getActivityIcon = (type) => {
    const icons = {
      'login': '🔐',
      'logout': '🚪',
      'create': '➕',
      'update': '✏️',
      'delete': '🗑️',
      'approve': '✅',
      'reject': '❌',
      'notification_accepted': '✅',
      'notification_declined': '❌',
      'report_submitted': '📄',
      'volunteer_recruited': '👥',
      'evaluation_created': '⭐',
      'evaluation_updated': '📊',
      'profile_updated': '👤',
      'password_changed': '🔑'
    };
    return icons[type] || '📝';
  };

  const formatActivityType = (type) => {
    // Special formatting for specific types
    const typeLabels = {
      'notification_accepted': 'Notification Accepted',
      'notification_declined': 'Notification Declined',
      'report_submitted': 'Report Submitted',
      'volunteer_recruited': 'Volunteer Recruited',
      'evaluation_created': 'Evaluation Created',
      'evaluation_updated': 'Evaluation Updated',
      'profile_updated': 'Profile Updated',
      'password_changed': 'Password Changed'
    };

    if (typeLabels[type]) {
      return typeLabels[type];
    }

    // Default formatting: capitalize each word
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading && logs.length === 0) {
    return (
      <SuperAdminLayout>
        <div className="sa-systemlogs-container">
          <div className="sa-systemlogs-loading">Loading system logs...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-systemlogs-container">
        <div className="sa-systemlogs-page-header">
          <h1><FontAwesomeIcon icon={faHistory} /> System Logs</h1>
          <div className="sa-systemlogs-header-actions">
            <button
              className="sa-systemlogs-cleanup-btn"
              onClick={() => setShowCleanupModal(true)}
              title="Cleanup old logs"
            >
              <FontAwesomeIcon icon={faTrash} /> Cleanup Logs
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="sa-systemlogs-success-message">{successMessage}</div>
        )}

        <div className="sa-systemlogs-filters-section">
          <div className="sa-systemlogs-filter-group">
            <label>Activity Type</label>
            <select
              className="sa-systemlogs-filter-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Types</option>
              {activityTypes.map((type) => (
                <option key={type} value={type}>
                  {formatActivityType(type)}
                </option>
              ))}
            </select>
          </div>
          <div className="sa-systemlogs-filter-group">
            <label>User ID</label>
            <input
              type="number"
              className="sa-systemlogs-filter-input"
              placeholder="Filter by User ID"
              value={userIdFilter}
              onChange={(e) => {
                setUserIdFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="sa-systemlogs-filter-group">
            <label><FontAwesomeIcon icon={faCalendar} /> Start Date</label>
            <input
              type="date"
              className="sa-systemlogs-filter-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="sa-systemlogs-filter-group">
            <label><FontAwesomeIcon icon={faCalendar} /> End Date</label>
            <input
              type="date"
              className="sa-systemlogs-filter-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="sa-systemlogs-filter-group">
            <label>Per Page</label>
            <select
              className="sa-systemlogs-filter-select"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="sa-systemlogs-filter-group">
            <button
              className="sa-systemlogs-reset-btn"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {totalLogs > 0 && (
          <div className="sa-systemlogs-total-info">
            Total Logs: <strong>{totalLogs.toLocaleString()}</strong>
          </div>
        )}

        {error && <div className="sa-systemlogs-error-message">{error}</div>}

        <div className="sa-systemlogs-table-container">
          <table className="sa-systemlogs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Activity</th>
                <th>Type</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.activity_at || log.created_at).toLocaleString()}</td>
                  <td>
                    {log.user ? (
                      <div className="sa-systemlogs-user-cell">
                        <span>{log.user.name || log.user.email}</span>
                        <span className="sa-systemlogs-user-id">ID: {log.user_id}</span>
                      </div>
                    ) : (
                      `User ID: ${log.user_id}`
                    )}
                  </td>
                  <td>
                    <span className="sa-systemlogs-activity-icon">{getActivityIcon(log.activity_type)}</span>
                    {log.description}
                  </td>
                  <td>
                    <span className={`sa-systemlogs-type-badge sa-systemlogs-type-${log.activity_type}`}>
                      {formatActivityType(log.activity_type)}
                    </span>
                  </td>
                  <td>
                    {log.metadata && typeof log.metadata === 'object' ? (
                      <details className="sa-systemlogs-details">
                        <summary>View Details</summary>
                        <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                      </details>
                    ) : (
                      log.metadata || '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && !loading && (
          <div className="sa-systemlogs-empty-state">
            <FontAwesomeIcon icon={faHistory} />
            <p>No logs found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="sa-systemlogs-pagination">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="sa-systemlogs-page-btn"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="sa-systemlogs-page-btn"
            >
              Previous
            </button>
            {generatePageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`sa-systemlogs-page-btn ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="sa-systemlogs-page-btn"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="sa-systemlogs-page-btn"
            >
              Last
            </button>
            <span className="sa-systemlogs-page-info">Page {currentPage} of {totalPages}</span>
          </div>
        )}

        {/* Cleanup Modal */}
        <Modal
          isOpen={showCleanupModal}
          onRequestClose={() => setShowCleanupModal(false)}
          className="sa-systemlogs-modal"
          overlayClassName="sa-systemlogs-modal-overlay"
        >
          <div className="sa-systemlogs-modal-header">
            <h2>Cleanup Old System Logs</h2>
            <button
              className="sa-systemlogs-modal-close"
              onClick={() => setShowCleanupModal(false)}
            >
              ×
            </button>
          </div>
          <div className="sa-systemlogs-modal-content">
            <p>This will permanently delete all system logs older than the specified number of days.</p>
            <div className="sa-systemlogs-modal-form-group">
              <label>Keep logs from the last (days):</label>
              <input
                type="number"
                min="1"
                max="3650"
                value={daysToKeep}
                onChange={(e) => setDaysToKeep(Number(e.target.value))}
                className="sa-systemlogs-modal-input"
              />
              <small>Logs older than {daysToKeep} days will be deleted. Maximum: 3650 days (10 years)</small>
            </div>
            <div className="sa-systemlogs-modal-actions">
              <button
                className="sa-systemlogs-modal-cancel"
                onClick={() => setShowCleanupModal(false)}
                disabled={cleanupLoading}
              >
                Cancel
              </button>
              <button
                className="sa-systemlogs-modal-confirm"
                onClick={handleCleanup}
                disabled={cleanupLoading}
              >
                {cleanupLoading ? 'Cleaning up...' : 'Delete Old Logs'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </SuperAdminLayout>
  );
}

export default SystemLogs;


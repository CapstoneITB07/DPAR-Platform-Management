import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/Applications.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faCheckCircle, faTimesCircle, faEye, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';
import Modal from 'react-modal';

Modal.setAppElement('#root');

function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAppId, setProcessingAppId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 15,
        status: statusFilter,
        ...(searchTerm && { search: searchTerm })
      });
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/pending-applications?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const apps = response.data.data || [];
      setApplications(apps);
      setTotalPages(response.data.last_page || 1);
      setError('');
    } catch (err) {
      setError('Failed to fetch applications');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewApplication = (app) => {
    setSelectedApp(app);
    setShowModal(true);
  };

  const handleApprove = async (appId) => {
    if (!window.confirm('Are you sure you want to approve this application?')) {
      return;
    }

    setProcessingAppId(appId);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.post(
        `${API_BASE}/api/superadmin/pending-applications/${appId}/override`,
        { action: 'approve' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage(response.data.message || 'Application approved successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchApplications();
      if (selectedApp && selectedApp.id === appId) {
        setShowModal(false);
        setSelectedApp(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve application');
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingAppId(null);
    }
  };

  const openRejectionModal = (appId) => {
    const app = applications.find(app => app.id === appId) || selectedApp;
    if (app) {
      setSelectedApp(app);
      setRejectionReason('');
      setShowRejectionModal(true);
    }
  };

  const closeRejectionModal = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
    // Don't clear selectedApp here as it might be used by view modal
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!selectedApp) return;

    setProcessingAppId(selectedApp.id);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.post(
        `${API_BASE}/api/superadmin/pending-applications/${selectedApp.id}/override`,
        { 
          action: 'reject',
          reason: rejectionReason.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage(response.data.message || 'Application rejected successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      closeRejectionModal();
      if (showModal) {
        setShowModal(false);
      }
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject application');
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleDelete = async (appId) => {
    const app = applications.find(app => app.id === appId) || selectedApp;
    if (!app) return;

    if (!window.confirm(`Are you sure you want to permanently delete the rejected application for "${app.organization_name}"? This action cannot be undone.`)) {
      return;
    }

    setProcessingAppId(appId);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.delete(
        `${API_BASE}/api/superadmin/pending-applications/${appId}/permanent`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage(response.data.message || 'Application permanently deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      if (selectedApp && selectedApp.id === appId) {
        setShowModal(false);
        setSelectedApp(null);
      }
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete application');
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingAppId(null);
    }
  };

  const getLogoUrl = (logoPath, status = 'pending') => {
    if (!logoPath) return `${window.location.origin}/Assets/disaster_logo.png`;
    
    // Handle full URLs (already processed by backend)
    if (logoPath.startsWith('http')) {
      return logoPath;
    }
    
    // Handle pending_logos/ paths (for pending/rejected applications) - check before logos/
    if (logoPath.startsWith('pending_logos/')) {
      // For approved apps, logo was moved to logos/, so redirect there
      if (status === 'approved') {
        const filename = logoPath.replace('pending_logos/', '');
        return `${API_BASE}/storage/logos/${filename}`;
      }
      return `${API_BASE}/storage/${logoPath}`;
    }
    
    // Handle /storage/pending_logos/ paths (backend processed)
    if (logoPath.startsWith('/storage/pending_logos/')) {
      const filename = logoPath.replace('/storage/pending_logos/', '');
      // For approved apps, logo was moved to logos/
      if (status === 'approved') {
        return `${API_BASE}/storage/logos/${filename}`;
      }
      // For pending/rejected, use pending_logos/
      return `${API_BASE}/storage/pending_logos/${filename}`;
    }
    
    // Handle storage URLs (for approved apps - logos/)
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
    
    // If it's just a filename, choose location based on status
    if (!logoPath.includes('/')) {
      // Approved apps: logo is in logos/
      if (status === 'approved') {
        return `${API_BASE}/storage/logos/${logoPath}`;
      }
      // Pending/Rejected apps: logo is in pending_logos/
      return `${API_BASE}/storage/pending_logos/${logoPath}`;
    }
    
    return logoPath;
  };

  if (loading && applications.length === 0) {
    return (
      <SuperAdminLayout>
        <div className="sa-applications-container">
          <div className="sa-applications-loading">Loading applications...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-applications-container">
        <div className="sa-applications-page-header">
          <h1><FontAwesomeIcon icon={faFileAlt} /> Applications</h1>
        </div>

        <div className="sa-applications-filters-section">
          <div className="sa-applications-search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <select
            className="sa-applications-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {error && <div className="sa-applications-error-message">{error}</div>}
        {successMessage && <div className="sa-applications-success-message">{successMessage}</div>}

        <div className="sa-applications-grid">
          {applications.map((app) => (
            <div key={app.id} className={`sa-applications-card sa-applications-status-${app.status}`}>
              <div className="sa-applications-card-header">
                <img 
                  src={getLogoUrl(app.logo, app.status)} 
                  alt={app.organization_name} 
                  className="sa-applications-logo"
                  onError={(e) => {
                    // If logo failed to load, try alternative location based on status
                    const originalSrc = e.target.src;
                    if (app.status === 'approved' && originalSrc.includes('/storage/pending_logos/')) {
                      // Approved apps: logo was moved to logos/, try that location
                      const filename = originalSrc.split('/pending_logos/')[1];
                      e.target.src = `${API_BASE}/storage/logos/${filename}`;
                    } else if ((app.status === 'pending' || app.status === 'rejected') && originalSrc.includes('/storage/logos/')) {
                      // Pending/Rejected apps: try pending_logos/ location
                      const filename = originalSrc.split('/logos/')[1];
                      e.target.src = `${API_BASE}/storage/pending_logos/${filename}`;
                    } else {
                      // Final fallback to default logo
                      e.target.src = `${window.location.origin}/Assets/disaster_logo.png`;
                    }
                  }}
                />
                <div className="sa-applications-card-info">
                  <h3>{app.organization_name}</h3>
                  <p className="sa-applications-type">{app.organization_type}</p>
                  <span className={`sa-applications-badge sa-applications-badge-${app.status}`}>
                    {app.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="sa-applications-details">
                <p><strong>Director:</strong> {app.director_name}</p>
                <p><strong>Email:</strong> {app.email}</p>
                <p><strong>Phone:</strong> {app.phone}</p>
                <p><strong>Submitted:</strong> {new Date(app.created_at).toLocaleDateString()}</p>
              </div>
              <div className="sa-applications-card-actions">
                <button className="sa-applications-btn-view" onClick={() => viewApplication(app)}>
                  <FontAwesomeIcon icon={faEye} /> View Details
                </button>
                {app.status === 'pending' && (
                  <div className="sa-applications-action-buttons">
                    <button 
                      className="sa-applications-btn-approve" 
                      onClick={() => handleApprove(app.id)}
                      disabled={processingAppId === app.id}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} /> 
                      {processingAppId === app.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button 
                      className="sa-applications-btn-reject" 
                      onClick={() => openRejectionModal(app.id)}
                      disabled={processingAppId === app.id}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} /> Reject
                    </button>
                  </div>
                )}
                {app.status === 'rejected' && (
                  <button 
                    className="sa-applications-btn-delete" 
                    onClick={() => handleDelete(app.id)}
                    disabled={processingAppId === app.id}
                  >
                    <FontAwesomeIcon icon={faTrash} /> 
                    {processingAppId === app.id ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {applications.length === 0 && !loading && (
          <div className="sa-applications-empty-state">
            <FontAwesomeIcon icon={faFileAlt} />
            <p>No applications found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="sa-applications-pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="sa-applications-page-btn"
            >
              Previous
            </button>
            <span className="sa-applications-page-info">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="sa-applications-page-btn"
            >
              Next
            </button>
          </div>
        )}

        {/* View Application Modal */}
        <Modal
          isOpen={showModal}
          onRequestClose={() => setShowModal(false)}
          className="sa-applications-modal"
          overlayClassName="sa-applications-modal-overlay"
        >
          {selectedApp && (
            <>
              <div className="sa-applications-modal-header">
                <h2>Application Details</h2>
                <button onClick={() => setShowModal(false)} className="sa-applications-close-btn">
                  <FontAwesomeIcon icon={faTimesCircle} />
                </button>
              </div>
              <div className="sa-applications-modal-content">
                <img 
                  src={getLogoUrl(selectedApp.logo, selectedApp.status)} 
                  alt={selectedApp.organization_name} 
                  className="sa-applications-modal-logo"
                  onError={(e) => {
                    // If logo failed to load, try alternative location based on status
                    const originalSrc = e.target.src;
                    if (selectedApp.status === 'approved' && originalSrc.includes('/storage/pending_logos/')) {
                      // Approved apps: logo was moved to logos/, try that location
                      const filename = originalSrc.split('/pending_logos/')[1];
                      e.target.src = `${API_BASE}/storage/logos/${filename}`;
                    } else if ((selectedApp.status === 'pending' || selectedApp.status === 'rejected') && originalSrc.includes('/storage/logos/')) {
                      // Pending/Rejected apps: try pending_logos/ location
                      const filename = originalSrc.split('/logos/')[1];
                      e.target.src = `${API_BASE}/storage/pending_logos/${filename}`;
                    } else {
                      // Final fallback to default logo
                      e.target.src = `${window.location.origin}/Assets/disaster_logo.png`;
                    }
                  }}
                />
                <div className="sa-applications-detail-group">
                  <h3>Organization Information</h3>
                  <p><strong>Name:</strong> {selectedApp.organization_name}</p>
                  <p><strong>Type:</strong> {selectedApp.organization_type}</p>
                  <p><strong>Description:</strong> {selectedApp.description}</p>
                </div>
                <div className="sa-applications-detail-group">
                  <h3>Director Information</h3>
                  <p><strong>Name:</strong> {selectedApp.director_name}</p>
                  <p><strong>Email:</strong> {selectedApp.email}</p>
                  <p><strong>Phone:</strong> {selectedApp.phone}</p>
                  <p><strong>Username:</strong> {selectedApp.username}</p>
                </div>
                <div className="sa-applications-detail-group">
                  <h3>Application Status</h3>
                  <p><strong>Status:</strong> <span className={`sa-applications-badge sa-applications-badge-${selectedApp.status}`}>
                    {selectedApp.status.toUpperCase()}
                  </span></p>
                  <p><strong>Submitted:</strong> {new Date(selectedApp.created_at).toLocaleString()}</p>
                  {selectedApp.rejection_reason && (
                    <p><strong>Rejection Reason:</strong> {selectedApp.rejection_reason}</p>
                  )}
                </div>
                {selectedApp.status === 'pending' && (
                  <div className="sa-applications-modal-actions">
                    <button 
                      className="sa-applications-btn-approve" 
                      onClick={() => handleApprove(selectedApp.id)}
                      disabled={processingAppId === selectedApp.id}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} /> 
                      {processingAppId === selectedApp.id ? 'Processing...' : 'Approve Application'}
                    </button>
                    <button 
                      className="sa-applications-btn-reject" 
                      onClick={() => {
                        setShowModal(false);
                        openRejectionModal(selectedApp.id);
                      }}
                      disabled={processingAppId === selectedApp.id}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} /> Reject Application
                    </button>
                  </div>
                )}
                {selectedApp.status === 'rejected' && (
                  <div className="sa-applications-modal-actions">
                    <button 
                      className="sa-applications-btn-delete" 
                      onClick={() => handleDelete(selectedApp.id)}
                      disabled={processingAppId === selectedApp.id}
                    >
                      <FontAwesomeIcon icon={faTrash} /> 
                      {processingAppId === selectedApp.id ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal>

        {/* Rejection Reason Modal */}
        <Modal
          isOpen={showRejectionModal}
          onRequestClose={closeRejectionModal}
          className="sa-applications-modal"
          overlayClassName="sa-applications-modal-overlay"
        >
          <div className="sa-applications-modal-header">
            <h2>Reject Application</h2>
            <button onClick={closeRejectionModal} className="sa-applications-close-btn">
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </div>
          <div className="sa-applications-modal-content">
            {selectedApp && (
              <>
                <p><strong>Organization:</strong> {selectedApp.organization_name}</p>
                <div className="sa-applications-rejection-form">
                  <label htmlFor="rejection-reason">
                    <strong>Rejection Reason <span style={{color: '#dc3545'}}>*</span></strong>
                  </label>
                  <textarea
                    id="rejection-reason"
                    className="sa-applications-rejection-textarea"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this application..."
                    rows={6}
                    maxLength={1000}
                  />
                  <div className="sa-applications-char-count">
                    {rejectionReason.length} / 1000 characters
                  </div>
                </div>
                <div className="sa-applications-modal-actions">
                  <button 
                    className="sa-applications-btn-cancel" 
                    onClick={closeRejectionModal}
                    disabled={processingAppId === selectedApp.id}
                  >
                    Cancel
                  </button>
                  <button 
                    className="sa-applications-btn-reject" 
                    onClick={handleReject}
                    disabled={processingAppId === selectedApp.id || !rejectionReason.trim()}
                  >
                    <FontAwesomeIcon icon={faTimesCircle} /> 
                    {processingAppId === selectedApp.id ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </SuperAdminLayout>
  );
}

export default Applications;


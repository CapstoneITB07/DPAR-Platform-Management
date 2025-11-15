import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import axiosInstance from '../../../utils/axiosConfig';
import '../css/Reports.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTimes, faCheck, faBan, faTrash, faUndo, faTrashAlt, faClipboardList, faCheckCircle, faSearch } from '@fortawesome/free-solid-svg-icons'; 
import { API_BASE } from '../../../utils/url';

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    return dateString;
  }
};

// Format time helper
const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    return timeString;
  }
};

function Reports() {
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmReportId, setConfirmReportId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [generatingAOR, setGeneratingAOR] = useState({});
  const [showDeletedReports, setShowDeletedReports] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'sent', 'approved', 'rejected', 'draft'
  
  // Search and filter states for main page
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  
  // Filter states for history modal
  const [historyFilters, setHistoryFilters] = useState({
    organization: '',
    searchTerm: '',
    dateFrom: '',
    dateTo: ''
  });

  const setNotificationWithDebug = (message, type = 'success') => {
    if (type === 'error') {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    } else {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setHistoryFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setHistoryFilters({
      organization: '',
      searchTerm: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getFilteredReports = () => {
    // Filter based on showDeletedReports toggle
    let filtered = allReports.filter(report => {
      if (showDeletedReports) {
        // Show only deleted reports
        return report.status === 'approved' && report.deleted_at;
      } else {
        // Show only non-deleted reports
        return report.status === 'approved' && !report.deleted_at;
      }
    });
    
    if (historyFilters.organization) {
      filtered = filtered.filter(report => 
        report.data?.associateGroup?.name?.toLowerCase().includes(historyFilters.organization.toLowerCase())
      );
    }
    
    if (historyFilters.searchTerm) {
      const searchLower = historyFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        (report.title || report.data?.heading || '').toLowerCase().includes(searchLower) ||
        (report.data?.event_type || '').toLowerCase().includes(searchLower)
      );
    }
    
    if (historyFilters.dateFrom) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at);
        return reportDate >= new Date(historyFilters.dateFrom);
      });
    }
    
    if (historyFilters.dateTo) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at);
        const toDate = new Date(historyFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        return reportDate <= toDate;
      });
    }
    
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Fetch all reports including deleted ones for SuperAdmin
      const response = await axiosInstance.get(`${API_BASE}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Also fetch deleted reports separately
      let deletedReports = [];
      try {
        const deletedResponse = await axiosInstance.get(`${API_BASE}/api/superadmin/reports/deleted`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        deletedReports = deletedResponse.data || [];
      } catch (err) {
        // If endpoint doesn't exist yet, that's okay - we'll handle it
      }

      // Merge reports and remove duplicates based on ID
      const reportsMap = new Map();
      response.data.forEach(report => reportsMap.set(report.id, report));
      deletedReports.forEach(report => reportsMap.set(report.id, report));
      const allReportsData = Array.from(reportsMap.values());
      
      // Parse data field if it's a string (JSON)
      const parsedReports = allReportsData.map(report => {
        let reportData = report.data;
        if (typeof reportData === 'string') {
          try {
            reportData = JSON.parse(reportData);
          } catch (e) {
            reportData = {};
          }
        }
        if (!reportData || typeof reportData !== 'object') {
          reportData = {};
        }
        return {
          ...report,
          data: reportData
        };
      });

      const reportsWithGroups = await Promise.all(
        parsedReports.map(async (report) => {
          if (report.user_id) {
            try {
              const groupResponse = await axiosInstance.get(`${API_BASE}/api/associate-groups`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const associateGroup = groupResponse.data.find(group => group.user_id === report.user_id);
              return {
                ...report,
                data: {
                  ...report.data,
                  associateGroup
                }
              };
            } catch (error) {
              return report;
            }
          }
          return report;
        })
      );

      // Include deleted reports in allReports for history management
      setAllReports(reportsWithGroups);
      // SuperAdmin can see ALL non-deleted reports (not just pending)
      const allNonDeletedReports = reportsWithGroups.filter(report => !report.deleted_at);
      setReports(allNonDeletedReports);
      
      // Debug logging
      console.log('Reports loaded:', {
        total: allReportsData.length,
        nonDeleted: allNonDeletedReports.length,
        deleted: deletedReports.length,
        byStatus: {
          sent: allNonDeletedReports.filter(r => r.status === 'sent').length,
          approved: allNonDeletedReports.filter(r => r.status === 'approved').length,
          rejected: allNonDeletedReports.filter(r => r.status === 'rejected').length,
          draft: allNonDeletedReports.filter(r => r.status === 'draft').length
        }
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.put(`${API_BASE}/api/reports/${reportId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        setNotificationWithDebug('Report approved successfully!', 'approve');
        fetchReports();
        if (showPreviewModal) {
          setShowPreviewModal(false);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to approve report. Please try again.';
      setNotificationWithDebug(errorMessage, 'error');
      console.error('Approve error:', err);
    }
  };

  const handleReject = async (reportId, reason) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.put(`${API_BASE}/api/reports/${reportId}/reject`, {
        rejection_reason: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        setNotificationWithDebug('Report rejected successfully.', 'reject');
        fetchReports();
        setShowConfirmModal(false);
        setRejectionReason('');
        if (showPreviewModal) {
          setShowPreviewModal(false);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reject report. Please try again.';
      setNotificationWithDebug(errorMessage, 'error');
      console.error('Reject error:', err);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      setGeneratingAOR(prev => ({ ...prev, [reportId]: true }));
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AOR_Report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setNotificationWithDebug('Report downloaded successfully!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      if (err.response?.status === 403) {
        setNotificationWithDebug('Only approved reports can be downloaded.', 'error');
      } else if (err.response?.status === 404) {
        setNotificationWithDebug('Report not found.', 'error');
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to download report. Please try again.';
        setNotificationWithDebug(errorMsg, 'error');
      }
    } finally {
      setGeneratingAOR(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const handleSoftDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action can be undone.')) {
      return;
    }
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.delete(`${API_BASE}/api/superadmin/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        setNotificationWithDebug('Report deleted successfully.', 'success');
        fetchReports();
        if (showPreviewModal) {
          setShowPreviewModal(false);
        }
      }
    } catch (err) {
      setNotificationWithDebug('Failed to delete report. Please try again.', 'error');
    }
  };

  const handlePermanentDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to permanently delete this report? This action cannot be undone.')) {
      return;
    }
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.delete(`${API_BASE}/api/superadmin/reports/${reportId}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        setNotificationWithDebug('Report permanently deleted.', 'reject');
        fetchReports();
        if (showPreviewModal) {
          setShowPreviewModal(false);
        }
      }
    } catch (err) {
      setNotificationWithDebug('Failed to permanently delete report. Please try again.', 'error');
    }
  };

  const handleRestore = async (reportId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.post(`${API_BASE}/api/superadmin/reports/${reportId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        setNotificationWithDebug('Report restored successfully.', 'approve');
        fetchReports();
      }
    } catch (err) {
      setNotificationWithDebug('Failed to restore report. Please try again.', 'error');
    }
  };

  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    const filtered = getFilteredReports();
    if (selectedReports.length === filtered.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filtered.map(r => r.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedReports.length === 0) return;
    
    const action = showDeletedReports ? 'permanently delete' : 'delete';
    if (!window.confirm(`Are you sure you want to ${action} ${selectedReports.length} report(s)?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const promises = selectedReports.map(reportId => {
        if (showDeletedReports) {
          return axiosInstance.delete(`${API_BASE}/api/superadmin/reports/${reportId}/permanent`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          return axiosInstance.delete(`${API_BASE}/api/superadmin/reports/${reportId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      });

      await Promise.all(promises);
      setNotificationWithDebug(`${selectedReports.length} report(s) ${showDeletedReports ? 'permanently deleted' : 'deleted'} successfully.`, showDeletedReports ? 'reject' : 'success');
      setSelectedReports([]);
      fetchReports();
    } catch (err) {
      setNotificationWithDebug('Failed to delete selected reports. Please try again.', 'error');
    }
  };

  const openPreview = (report) => {
    setSelectedReport(report);
    setShowPreviewModal(true);
  };

  const openConfirmModal = (action, reportId) => {
    setConfirmAction(action);
    setConfirmReportId(reportId);
    setShowConfirmModal(true);
  };

  const confirmActionHandler = () => {
    if (confirmAction === 'approve') {
      handleApprove(confirmReportId);
    } else if (confirmAction === 'reject') {
      if (!rejectionReason.trim()) {
        setNotificationWithDebug('Please provide a rejection reason.', 'error');
        return;
      }
      handleReject(confirmReportId, rejectionReason);
      return;
    }
    setShowConfirmModal(false);
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading reports...</p>
        </div>
      </SuperAdminLayout>
    );
  }

  if (error) {
    return (
      <SuperAdminLayout>
        <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
          <p>{error}</p>
        </div>
      </SuperAdminLayout>
    );
  }

  // Filter reports based on status filter, search term, and organization
  const getFilteredReportsByStatus = () => {
    let filtered = reports;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(report => {
        const title = (report.title || report.data?.heading || '').toLowerCase();
        const subject = (report.data?.subject || '').toLowerCase();
        const org = (report.data?.associateGroup?.name || report.user?.organization || '').toLowerCase();
        return title.includes(searchLower) || subject.includes(searchLower) || org.includes(searchLower);
      });
    }
    
    // Apply organization filter
    if (organizationFilter.trim()) {
      const orgLower = organizationFilter.toLowerCase();
      filtered = filtered.filter(report => {
        const org = (report.data?.associateGroup?.name || report.user?.organization || '').toLowerCase();
        return org.includes(orgLower);
      });
    }
    
    return filtered;
  };

  const filteredReports = getFilteredReportsByStatus();
  const pendingReports = allReports.filter(r => r.status === 'sent' && !r.deleted_at);
  const approvedReports = allReports.filter(r => r.status === 'approved' && !r.deleted_at);
  const rejectedReports = allReports.filter(r => r.status === 'rejected' && !r.deleted_at);
  const draftReports = allReports.filter(r => r.status === 'draft' && !r.deleted_at);

  return (
    <SuperAdminLayout>
      <div className="sa-reports-container">
        {successMessage && (
          <div className="success-message">
            <FontAwesomeIcon icon={faCheckCircle} /> {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        <div className="sa-reports-header">
          <div>
            <h1><FontAwesomeIcon icon={faClipboardList} /> Report Management</h1>
            <div className="sa-reports-stats">
              <div className="sa-reports-stat-item">
                <span className="sa-reports-stat-label">Total:</span>
                <span className="sa-reports-stat-value">{reports.length}</span>
              </div>
              <div className="sa-reports-stat-item">
                <span className="sa-reports-stat-label">Pending:</span>
                <span className="sa-reports-stat-value pending">{pendingReports.length}</span>
              </div>
              <div className="sa-reports-stat-item">
                <span className="sa-reports-stat-label">Approved:</span>
                <span className="sa-reports-stat-value approved">{approvedReports.length}</span>
              </div>
              <div className="sa-reports-stat-item">
                <span className="sa-reports-stat-label">Rejected:</span>
                <span className="sa-reports-stat-value rejected">{rejectedReports.length}</span>
              </div>
              <div className="sa-reports-stat-item">
                <span className="sa-reports-stat-label">Draft:</span>
                <span className="sa-reports-stat-value draft">{draftReports.length}</span>
              </div>
            </div>
          </div>
          <button 
            className="sa-reports-btn-view-history"
            onClick={() => setShowHistoryModal(true)}
          >
            <FontAwesomeIcon icon={faClipboardList} /> View History
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="sa-reports-search-filter-section">
          <div className="sa-reports-search-inputs">
            <div className="sa-reports-search-input-group">
              <FontAwesomeIcon icon={faSearch} className="sa-reports-search-icon" />
              <input
                type="text"
                placeholder="Search by title, subject, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sa-reports-search-input"
              />
            </div>
            <div className="sa-reports-search-input-group">
              <input
                type="text"
                placeholder="Filter by organization..."
                value={organizationFilter}
                onChange={(e) => setOrganizationFilter(e.target.value)}
                className="sa-reports-search-input"
              />
            </div>
            {(searchTerm || organizationFilter) && (
              <button
                className="sa-reports-clear-search-btn"
                onClick={() => {
                  setSearchTerm('');
                  setOrganizationFilter('');
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="sa-reports-status-filters">
          <button 
            className={`sa-reports-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({reports.length})
          </button>
          <button 
            className={`sa-reports-filter-btn ${statusFilter === 'sent' ? 'active' : ''}`}
            onClick={() => setStatusFilter('sent')}
          >
            Pending ({pendingReports.length})
          </button>
          <button 
            className={`sa-reports-filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            Approved ({approvedReports.length})
          </button>
          <button 
            className={`sa-reports-filter-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected ({rejectedReports.length})
          </button>
          <button 
            className={`sa-reports-filter-btn ${statusFilter === 'draft' ? 'active' : ''}`}
            onClick={() => setStatusFilter('draft')}
          >
            Draft ({draftReports.length})
          </button>
        </div>

        {filteredReports.length === 0 ? (
          <div className="sa-reports-no-reports-message">
            <p>No reports found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}{searchTerm || organizationFilter ? ' matching your search' : ''}.</p>
          </div>
        ) : (
          <div className="sa-reports-grid-wrapper">
            <div className="sa-reports-grid">
              {filteredReports.map((report) => (
              <div key={report.id} className="sa-reports-card">
                <div className="sa-reports-card-header">
                  <h3>{report.title || report.data?.heading || 'Untitled Report'}</h3>
                  <span className={`sa-reports-status ${report.status}`}>
                    {report.status === 'sent' ? 'Pending' : 
                     report.status === 'approved' ? 'Approved' :
                     report.status === 'rejected' ? 'Rejected' :
                     report.status === 'draft' ? 'Draft' : report.status}
                  </span>
                </div>
                <div className="sa-reports-card-body">
                  <p><strong>Organization:</strong> {report.data?.associateGroup?.name || report.user?.organization || 'N/A'}</p>
                  <p><strong>Subject:</strong> {report.data?.subject || report.title || 'N/A'}</p>
                  <p><strong>Date:</strong> {formatDate(report.data?.date || report.created_at)}</p>
                  <p><strong>Submitted:</strong> {formatDate(report.created_at)}</p>
                </div>
                <div className="sa-reports-card-actions">
                  <button 
                    className="sa-reports-btn-preview"
                    onClick={() => openPreview(report)}
                  >
                    <FontAwesomeIcon icon={faClipboardList} /> View Details
                  </button>
                  {report.status === 'sent' && (
                    <>
                      <button 
                        className="sa-reports-btn-approve"
                        onClick={() => openConfirmModal('approve', report.id)}
                      >
                        <FontAwesomeIcon icon={faCheck} /> Approve
                      </button>
                      <button 
                        className="sa-reports-btn-reject"
                        onClick={() => openConfirmModal('reject', report.id)}
                      >
                        <FontAwesomeIcon icon={faBan} /> Reject
                      </button>
                    </>
                  )}
                  {report.status === 'approved' && (
                    <>
                      <button 
                        className="sa-reports-btn-download"
                        onClick={() => handleDownload(report.id)}
                        disabled={generatingAOR[report.id]}
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        {generatingAOR[report.id] ? 'Generating...' : 'Download AOR'}
                      </button>
                      <button 
                        className="sa-reports-btn-delete"
                        onClick={() => handleSoftDelete(report.id)}
                        title="Soft Delete Report"
                      >
                        <FontAwesomeIcon icon={faTrash} /> Delete
                      </button>
                    </>
                  )}
                  {(report.status === 'rejected' || report.status === 'draft') && (
                    <button 
                      className="sa-reports-btn-delete"
                      onClick={() => handleSoftDelete(report.id)}
                      title="Delete Report"
                    >
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedReport && (
          <div className="sa-reports-modal-overlay" onClick={() => setShowPreviewModal(false)}>
            <div className="sa-reports-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="sa-reports-modal-header">
                <h2>Report Details</h2>
                <button className="sa-reports-modal-close" onClick={() => setShowPreviewModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="sa-reports-modal-body">
                <div className="sa-reports-details">
                  {/* Header Information */}
                  <div className="sa-reports-header-info">
                    <h2>Disaster Preparedness And Response Volunteers Coalition of Laguna</h2>
                    <p>Blk 63 Lot 21 Aventine Hills BF Resort Village, Las Pinas City</p>
                  </div>

                  {selectedReport.data && (
                    <>
                      {/* Heading Section */}
                      <div className="sa-reports-view-section">
                        <h3>I. HEADING</h3>
                        <div className="sa-reports-detail-row">
                          <strong>For:</strong>
                          <span>
                            {selectedReport.data.for && selectedReport.data.forPosition 
                              ? `${selectedReport.data.for} - ${selectedReport.data.forPosition}`
                              : selectedReport.data.for || selectedReport.data.forPosition || 'N/A'
                            }
                          </span>
                        </div>
                        <div className="sa-reports-detail-row">
                          <strong>Date:</strong>
                          <span>{selectedReport.data.date ? formatDate(selectedReport.data.date) : 'N/A'}</span>
                        </div>
                        <div className="sa-reports-detail-row">
                          <strong>Subject:</strong>
                          <span>{selectedReport.data.subject || selectedReport.title || 'N/A'}</span>
                        </div>
                        {selectedReport.data.authorities && selectedReport.data.authorities.length > 0 && (
                          <div className="sa-reports-detail-row">
                            <strong>Authorities:</strong>
                            <ul className="sa-reports-detail-list">
                              {selectedReport.data.authorities.map((auth, index) => (
                                <li key={index}>{auth}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Event Details Section */}
                      <div className="sa-reports-view-section">
                        <h3>II. EVENT DETAILS</h3>
                        <div className="sa-reports-detail-row">
                          <strong>Place:</strong>
                          <span>{selectedReport.data.place || 'N/A'}</span>
                        </div>
                        {selectedReport.data.personnelInvolved && selectedReport.data.personnelInvolved.length > 0 && (
                          <div className="sa-reports-detail-row">
                            <strong>Personnel Involved:</strong>
                            <ul className="sa-reports-detail-list">
                              {selectedReport.data.personnelInvolved.map((person, index) => (
                                <li key={index}>{person}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="sa-reports-detail-row">
                          <strong>Event Name:</strong>
                          <span>{selectedReport.data.eventName || 'N/A'}</span>
                        </div>
                        <div className="sa-reports-detail-row">
                          <strong>Event Location:</strong>
                          <span>{selectedReport.data.eventLocation || 'N/A'}</span>
                        </div>
                        {selectedReport.data.organizers && selectedReport.data.organizers.length > 0 && (
                          <div className="sa-reports-detail-row">
                            <strong>Organizers:</strong>
                            <ul className="sa-reports-detail-list">
                              {selectedReport.data.organizers.map((org, index) => (
                                <li key={index}>{org}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Narration of Events I Section */}
                      <div className="sa-reports-view-section">
                        <h3>III. NARRATION OF EVENTS I</h3>
                        <div className="sa-reports-detail-row">
                          <strong>Event Date:</strong>
                          <span>{selectedReport.data.eventDate ? formatDate(selectedReport.data.eventDate) : 'N/A'}</span>
                        </div>
                        <div className="sa-reports-detail-row">
                          <strong>Event Duration:</strong>
                          <span>
                            {selectedReport.data.startTime && selectedReport.data.endTime 
                              ? `${formatTime(selectedReport.data.startTime)} - ${formatTime(selectedReport.data.endTime)}`
                              : selectedReport.data.startTime 
                                ? formatTime(selectedReport.data.startTime)
                                : selectedReport.data.endTime 
                                  ? formatTime(selectedReport.data.endTime)
                                  : 'N/A'
                            }
                          </span>
                        </div>
                        {selectedReport.data.participants && selectedReport.data.participants.length > 0 && (
                          <div className="sa-reports-detail-row">
                            <strong>Participants:</strong>
                            <ul className="sa-reports-detail-list">
                              {selectedReport.data.participants.map((participant, index) => (
                                <li key={index}>
                                  {participant.name} - {participant.position}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="sa-reports-detail-row">
                          <strong>Training Agenda:</strong>
                          <div className="sa-reports-detail-textarea">
                            {selectedReport.data.trainingAgenda || 'N/A'}
                          </div>
                        </div>
                        <div className="sa-reports-detail-row">
                          <strong>Event Overview:</strong>
                          <div className="sa-reports-detail-textarea">
                            {selectedReport.data.eventOverview || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Narration of Events II Section */}
                      <div className="sa-reports-view-section">
                        <h3>IV. NARRATION OF EVENTS II</h3>
                        <div className="sa-reports-detail-row">
                          <strong>Key Outcomes:</strong>
                          <div className="sa-reports-detail-textarea">
                            {selectedReport.data.keyOutcomes && selectedReport.data.keyOutcomes.length > 0 
                              ? selectedReport.data.keyOutcomes.map((outcome, idx) => (
                                  <div key={idx} className="sa-reports-list-item">
                                    <span className="sa-reports-item-number">{idx + 1}</span>
                                    <span className="sa-reports-item-text">{outcome}</span>
                                  </div>
                                ))
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="sa-reports-detail-row">
                          <strong>Challenges:</strong>
                          <div className="sa-reports-detail-textarea">
                            {selectedReport.data.challenges && selectedReport.data.challenges.length > 0 
                              ? selectedReport.data.challenges.map((challenge, idx) => (
                                  <div key={idx} className="sa-reports-list-item">
                                    <span className="sa-reports-item-number">{idx + 1}</span>
                                    <span className="sa-reports-item-text">{challenge}</span>
                                  </div>
                                ))
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="sa-reports-detail-row">
                          <strong>Recommendations:</strong>
                          <div className="sa-reports-detail-textarea">
                            {selectedReport.data.recommendations && selectedReport.data.recommendations.length > 0 
                              ? selectedReport.data.recommendations.map((recommendation, idx) => (
                                  <div key={idx} className="sa-reports-list-item">
                                    <span className="sa-reports-item-number">{idx + 1}</span>
                                    <span className="sa-reports-item-text">{recommendation}</span>
                                  </div>
                                ))
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="sa-reports-detail-row">
                          <strong>Conclusion:</strong>
                          <div className="sa-reports-detail-textarea">
                            {selectedReport.data.conclusion || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Attachments Section */}
                      {selectedReport.data.photos && selectedReport.data.photos.length > 0 && (
                        <div className="sa-reports-view-section">
                          <h3>V. ATTACHMENTS</h3>
                          <div className="sa-reports-detail-row">
                            <strong>Photos:</strong>
                            <div className="sa-reports-photos-grid">
                              {selectedReport.data.photos.map((photo, index) => (
                                <img
                                  key={index}
                                  src={`${API_BASE}/storage/${photo}`}
                                  alt={`Report photo ${index + 1}`}
                                  className="sa-reports-photo-thumbnail"
                                  onClick={() => {
                                    setSelectedPhoto(`${API_BASE}/storage/${photo}`);
                                    setShowPhotoModal(true);
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Signatories Section */}
                      <div className="sa-reports-view-section">
                        <h3>VI. SIGNATORIES</h3>
                        <div className="sa-reports-detail-row">
                          <strong>Prepared By:</strong>
                          <span>
                            {selectedReport.data.preparedBy && selectedReport.data.preparedByPosition 
                              ? `${selectedReport.data.preparedBy} - ${selectedReport.data.preparedByPosition}`
                              : selectedReport.data.preparedBy || selectedReport.data.preparedByPosition || 'N/A'
                            }
                          </span>
                        </div>
                        {selectedReport.data.preparedBySignature && (
                          <div className="sa-reports-detail-row">
                            <strong>Signature:</strong>
                            <img
                              src={`${API_BASE}/storage/${selectedReport.data.preparedBySignature}`}
                              alt="Prepared by signature"
                              className="sa-reports-signature-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        {selectedReport.data.approvedBy && (
                          <div className="sa-reports-detail-row">
                            <strong>Approved By:</strong>
                            <span>
                              {selectedReport.data.approvedBy && selectedReport.data.approvedByPosition 
                                ? `${selectedReport.data.approvedBy} - ${selectedReport.data.approvedByPosition}`
                                : selectedReport.data.approvedBy || selectedReport.data.approvedByPosition || 'N/A'
                              }
                            </span>
                          </div>
                        )}
                        {selectedReport.data.approvedBySignature && (
                          <div className="sa-reports-detail-row">
                            <strong>Approval Signature:</strong>
                            <img
                              src={`${API_BASE}/storage/${selectedReport.data.approvedBySignature}`}
                              alt="Approved by signature"
                              className="sa-reports-signature-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="sa-reports-modal-actions">
                  {selectedReport.status === 'sent' && (
                    <>
                      <button 
                        className="sa-reports-btn-approve"
                        onClick={() => {
                          handleApprove(selectedReport.id);
                        }}
                      >
                        <FontAwesomeIcon icon={faCheck} /> Approve
                      </button>
                      <button 
                        className="sa-reports-btn-reject"
                        onClick={() => {
                          setShowPreviewModal(false);
                          openConfirmModal('reject', selectedReport.id);
                        }}
                      >
                        <FontAwesomeIcon icon={faBan} /> Reject
                      </button>
                    </>
                  )}
                  {selectedReport.status === 'approved' && (
                    <>
                      <button 
                        className="sa-reports-btn-download"
                        onClick={() => handleDownload(selectedReport.id)}
                        disabled={generatingAOR[selectedReport.id]}
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        {generatingAOR[selectedReport.id] ? 'Generating...' : 'Download AOR'}
                      </button>
                      <button 
                        className="sa-reports-btn-delete"
                        onClick={() => {
                          setShowPreviewModal(false);
                          handleSoftDelete(selectedReport.id);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} /> Delete
                      </button>
                    </>
                  )}
                  {(selectedReport.status === 'rejected' || selectedReport.status === 'draft') && (
                    <button 
                      className="sa-reports-btn-delete"
                      onClick={() => {
                        setShowPreviewModal(false);
                        handleSoftDelete(selectedReport.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {showConfirmModal && (
          <div className="sa-reports-modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="sa-reports-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="sa-reports-modal-header">
                <h2>
                  {confirmAction === 'approve' ? 'Approve Report' : 'Reject Report'}
                </h2>
                <button className="sa-reports-modal-close" onClick={() => setShowConfirmModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="sa-reports-modal-body">
                {confirmAction === 'reject' && (
                  <div className="sa-reports-rejection-reason-input">
                    <label>Rejection Reason *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      rows="4"
                    />
                  </div>
                )}
                <p>
                  Are you sure you want to {confirmAction === 'approve' ? 'approve' : 'reject'} this report?
                </p>
                <div className="sa-reports-modal-actions">
                  <button 
                    className="sa-reports-btn-cancel"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setRejectionReason('');
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                  <button 
                    className={confirmAction === 'approve' ? 'sa-reports-btn-approve' : 'sa-reports-btn-reject'}
                    onClick={confirmActionHandler}
                  >
                    {confirmAction === 'approve' ? (
                      <>
                        <FontAwesomeIcon icon={faCheck} /> Confirm Approve
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faBan} /> Confirm Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="sa-reports-modal-overlay" onClick={() => setShowHistoryModal(false)}>
            <div className="sa-reports-modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sa-reports-modal-header">
                <h2>{showDeletedReports ? 'Deleted Reports' : 'Approved Reports History'}</h2>
                <button className="sa-reports-modal-close" onClick={() => setShowHistoryModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="sa-reports-modal-body">
                <div className="sa-reports-history-controls">
                  <div className="sa-reports-history-selection-controls">
                    <label className="sa-reports-select-all-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedReports.length > 0 && selectedReports.length === getFilteredReports().length}
                        onChange={handleSelectAll}
                      />
                      <span>Select All</span>
                    </label>
                    {selectedReports.length > 0 && (
                      <button 
                        className="sa-reports-delete-selected-btn"
                        onClick={handleDeleteSelected}
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                        {showDeletedReports ? 'Permanently Delete Selected' : 'Delete Selected'} ({selectedReports.length})
                      </button>
                    )}
                  </div>
                  <div className="sa-reports-history-toggle">
                    <label>
                      <input
                        type="checkbox"
                        checked={showDeletedReports}
                        onChange={(e) => {
                          setShowDeletedReports(e.target.checked);
                          setSelectedReports([]);
                        }}
                      />
                      <span>Show Deleted Reports</span>
                    </label>
                  </div>
                </div>
                <div className="sa-reports-history-filters">
                  <input
                    type="text"
                    placeholder="Search by organization..."
                    value={historyFilters.organization}
                    onChange={(e) => handleFilterChange('organization', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Search by heading or subject..."
                    value={historyFilters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="From Date"
                    value={historyFilters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="To Date"
                    value={historyFilters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                  <button onClick={clearFilters}>Clear Filters</button>
                </div>
                <div className="sa-reports-history-reports-list">
                  {getFilteredReports().map((report) => (
                    <div key={report.id} className={`sa-reports-history-report-item ${report.deleted_at ? 'sa-reports-deleted' : ''}`}>
                      <div className="sa-reports-history-item-selection">
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.id)}
                          onChange={() => handleSelectReport(report.id)}
                        />
                      </div>
                      <div className="sa-reports-history-report-info">
                        <h4>{report.title || report.data?.heading || 'Untitled Report'}</h4>
                        <p><strong>Organization:</strong> {report.data?.associateGroup?.name || report.user?.organization || 'N/A'}</p>
                        <p><strong>Subject:</strong> {report.data?.subject || report.title || 'N/A'}</p>
                        <p><strong>Date:</strong> {formatDate(report.created_at)}</p>
                        {report.deleted_at && (
                          <p style={{ color: '#dc3545', fontStyle: 'italic' }}>
                            <strong>Deleted:</strong> {formatDate(report.deleted_at)}
                          </p>
                        )}
                      </div>
                      <div className="sa-reports-history-report-actions">
                        {!report.deleted_at ? (
                          <>
                            <button 
                              className="sa-reports-btn-preview"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowHistoryModal(false);
                                setShowPreviewModal(true);
                              }}
                            >
                              View
                            </button>
                            <button 
                              className="sa-reports-btn-download"
                              onClick={() => handleDownload(report.id)}
                              disabled={generatingAOR[report.id]}
                            >
                              <FontAwesomeIcon icon={faDownload} />
                              {generatingAOR[report.id] ? 'Generating...' : 'Download'}
                            </button>
                            <button 
                              className="sa-reports-btn-delete"
                              onClick={() => handleSoftDelete(report.id)}
                              title="Delete Report"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="sa-reports-btn-restore"
                              onClick={() => handleRestore(report.id)}
                              title="Restore Report"
                            >
                              <FontAwesomeIcon icon={faUndo} /> Restore
                            </button>
                            <button 
                              className="sa-reports-btn-permanent-delete"
                              onClick={() => handlePermanentDelete(report.id)}
                              title="Permanently Delete Report"
                            >
                              <FontAwesomeIcon icon={faTrashAlt} /> Permanent Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {getFilteredReports().length === 0 && (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                      {showDeletedReports ? 'No deleted reports found.' : 'No approved reports found.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Modal */}
        {showPhotoModal && selectedPhoto && (
          <div className="sa-reports-modal-overlay" onClick={() => setShowPhotoModal(false)}>
            <div className="sa-reports-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="sa-reports-modal-header">
                <h2>Photo Preview</h2>
                <button className="sa-reports-modal-close" onClick={() => setShowPhotoModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="sa-reports-modal-body">
                <img 
                  src={selectedPhoto} 
                  alt="Photo Preview" 
                  className="sa-reports-photo-preview-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 20px;">Photo not available</div>';
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export default Reports;


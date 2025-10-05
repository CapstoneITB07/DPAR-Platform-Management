import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import '../css/ApprovalAOR.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTimes, faCheck, faBan } from '@fortawesome/free-solid-svg-icons';
import { API_BASE } from '../../../utils/url';

// Notification component
function Notification({ message, type, onClose }) {
  if (!message) return null;
  
  const getNotificationClass = () => {
    console.log('Notification type:', type); // Debug log
    switch (type) {
      case 'reject':
        console.log('Using reject notification class'); // Debug log
        return 'approval-aor-reject-notification';
      case 'approve':
        return 'approval-aor-approve-notification';
      default:
        return 'approval-aor-success-notification';
    }
  };
  
  const notificationClass = getNotificationClass();
  console.log('Final notification class:', notificationClass); // Debug log
  
  return (
    <div className={notificationClass}>
      {message}
    </div>
  );
}

const organizationLogos = {
  'AKLMV': '/Assets/AKLMV.png',
  'ALERT': '/Assets/ALERT.png',
  'CCVOL': '/Assets/CCVOL.png',
  'CRRG': '/Assets/CRRG.png',
  'DRRM-Y': '/Assets/DRRM - Y.png',
  'FRONTLINER': '/Assets/FRONTLINER.png',
  'JKM': '/Assets/JKM.png',
  'KAIC': '/Assets/KAIC.png',
  'MRAP': '/Assets/MRAP.png',
  'MSG-ERU': '/Assets/MSG - ERU.png',
  'PCGA 107th': '/Assets/PCGA 107th.png',
  'RMFB': '/Assets/RMFB.png',
  'SPAG': '/Assets/SPAG.png',
  'SRG': '/Assets/SRG.png',
  'TF': '/Assets/TF.png'
};

const getLogoUrl = (logoPath) => {
  if (!logoPath) return `${window.location.origin}/Assets/disaster_logo.png`;
  
  if (logoPath.startsWith('logos/')) {
    return `${API_BASE}/storage/${logoPath}`;
  }
  
  if (logoPath.startsWith('/storage/')) {
    return `${API_BASE}${logoPath}`;
  }
  
  if (logoPath.startsWith('/Assets/')) {
    return `${window.location.origin}${logoPath}`;
  }
  
  return logoPath;
};

// Helper functions for formatting dates and times
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

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  try {
    // Handle both HH:MM and HH:MM:SS formats
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    if (hour === 0 && minute === 0) return '12:00 AM';
    if (hour === 12 && minute === 0) return '12:00 PM';
    if (hour === 12) return `12:${minutes} PM`;
    if (hour > 12) return `${hour - 12}:${minutes} PM`;
    return `${hour}:${minutes} AM`;
  } catch (error) {
    return timeString;
  }
};

function ApprovalAOR() {
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmReportId, setConfirmReportId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Create a wrapper for setNotification to add debugging
  const setNotificationWithDebug = (message, type = 'success') => {
    console.log(`Setting notification: "${message}" with type: "${type}"`);
    setNotification(message);
    setNotificationType(type);
  };

  useEffect(() => {
    fetchReports();
    
    // Debug: Check current user role
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      // Decode JWT token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Current user role:', payload.role);
        console.log('Current user info:', payload);
      } catch (e) {
        console.log('Could not decode token:', e);
      }
    }
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Fetch all reports instead of just submitted ones
      const response = await axios.get(`${API_BASE}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Fetch associate groups for each report
      const reportsWithGroups = await Promise.all(
        response.data.map(async (report) => {
          if (report.user_id) {
            try {
              const groupResponse = await axios.get(`${API_BASE}/api/associate-groups`, {
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
              console.error('Error fetching associate group:', error);
              return report;
            }
          }
          return report;
        })
      );

      // Set all reports for history, and filter sent reports for main grid
      setAllReports(reportsWithGroups);
      setReports(reportsWithGroups.filter(report => report.status === 'sent'));
      
      // Debug logging
      console.log('All reports fetched:', reportsWithGroups.length);
      console.log('Reports by status:', {
        sent: reportsWithGroups.filter(r => r.status === 'sent').length,
        approved: reportsWithGroups.filter(r => r.status === 'approved').length,
        rejected: reportsWithGroups.filter(r => r.status === 'rejected').length,
        draft: reportsWithGroups.filter(r => r.status === 'draft').length
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to load reports. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getOrganizationLogo = (report) => {
    try {
      // Get the organization from the report data
      const organization = report?.data?.organization;
      if (!organization) {
        console.log('No organization found in report data:', report);
        return `${window.location.origin}/Assets/disaster_logo.png`;
      }

      // First check if there's a logo in the associate group data
      const associateGroup = report?.data?.associateGroup;
      if (associateGroup?.logo) {
        return getLogoUrl(associateGroup.logo);
      }

      // Fallback to the predefined logos
      const logo = organizationLogos[organization];
      if (!logo) {
        console.log('No logo found for organization:', organization);
        return `${window.location.origin}/Assets/disaster_logo.png`;
      }
      
      return `${window.location.origin}${logo}`;
    } catch (error) {
      console.error('Error getting organization logo:', error);
      return `${window.location.origin}/Assets/disaster_logo.png`;
    }
  };

  const handleGenerateAOR = async (reportId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AOR_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setNotificationWithDebug('AOR downloaded successfully!');
      setTimeout(() => {
        setNotification('');
        setNotificationType('success');
      }, 2000);
    } catch (err) {
      setError('Failed to generate AOR');
    }
  };

  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  const handlePreview = async (report) => {
    try {
      // Fetch the latest data for this report before showing the modal
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const reportResponse = await axios.get(`${API_BASE}/api/reports/${report.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch the latest associate group data
      if (reportResponse.data.user_id) {
        const groupResponse = await axios.get(`${API_BASE}/api/associate-groups`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const associateGroup = groupResponse.data.find(group => group.user_id === reportResponse.data.user_id);
        reportResponse.data.data = {
          ...reportResponse.data.data,
          associateGroup
        };
      }
      
      setSelectedReport(reportResponse.data);
    } catch (error) {
      console.error('Error fetching latest report data:', error);
      
      // If the report doesn't exist, show an error message
      if (error.response && error.response.status === 404) {
        console.error(`Report with ID ${report.id} not found. It may have been deleted.`);
        // Use the existing report data from the list instead
        setSelectedReport(report);
      } else {
        // For other errors, still use the existing report data
      setSelectedReport(report);
      }
    }
    setShowPreviewModal(true);
  };

  const handleApprove = async (reportId) => {
    try {
      console.log('Attempting to approve report:', reportId);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const response = await axios.put(`${API_BASE}/api/reports/${reportId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Approve response:', response.data);
      await fetchReports(); // Refresh the list after approval
      setShowPreviewModal(false);
      setNotificationWithDebug('Report approved successfully!', 'approve');
      setTimeout(() => {
        setNotification('');
        setNotificationType('approve');
      }, 2000);
    } catch (err) {
      console.error('Approve error:', err);
      console.error('Approve error response:', err.response?.data);
      setError('Failed to approve report: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (reportId) => {
    try {
      console.log('Attempting to reject report:', reportId);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const response = await axios.put(`${API_BASE}/api/reports/${reportId}/reject`, {
        rejection_reason: rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Reject response:', response.data);
      await fetchReports(); // Refresh the list after rejection
      setShowPreviewModal(false);
      
      // Set rejection notification with explicit type
      setNotificationWithDebug('Report rejected successfully!', 'reject');
      
      // Clear notification after 2 seconds
      setTimeout(() => {
        setNotification('');
        setNotificationType('reject');
      }, 2000);
    } catch (err) {
      console.error('Reject error:', err);
      console.error('Reject error response:', err.response?.data);
      
      // Handle validation errors specifically
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat();
        setError('Validation failed: ' + errorMessages.join(', '));
      } else {
        setError('Failed to reject report: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleConfirmApprove = (reportId) => {
    setConfirmAction('approve');
    setConfirmReportId(reportId);
    setShowConfirmModal(true);
  };

  const handleConfirmReject = (reportId) => {
    setConfirmAction('reject');
    setConfirmReportId(reportId);
    setRejectionReason('');
    setShowConfirmModal(true);
  };

  const handlePhotoClick = (photoPath) => {
    setSelectedPhoto(`${API_BASE}/storage/${photoPath}`);
    setShowPhotoModal(true);
  };

  const handleConfirmAction = async () => {
    // Validate rejection reason if rejecting
    if (confirmAction === 'reject') {
      if (rejectionReason.trim().length === 0) {
        setError('Please provide a rejection reason before proceeding.');
        return; // Don't proceed if no rejection reason
      }
      if (rejectionReason.trim().length < 10) {
        setError('Rejection reason must be at least 10 characters long.');
        return; // Don't proceed if rejection reason is too short
      }
    }
    
    // Close modal immediately for better UX
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmReportId(null);
    
    // Handle the action in the background
    if (confirmAction === 'approve') {
      await handleApprove(confirmReportId);
    } else if (confirmAction === 'reject') {
      await handleReject(confirmReportId);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmReportId(null);
    setRejectionReason('');
  };




  return (
    <AdminLayout>
      <Notification message={notification} type={notificationType} onClose={() => {
        setNotification('');
        setNotificationType(notificationType);
      }} />
      <div className="approval-aor-container">
        <div className="header-section">
          <h2 className="main-header">APPROVAL / AOR</h2>
          <button className="show-history-btn" onClick={handleShowHistory} style={{ fontWeight: 700 }}>
            SHOW HISTORY
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="dashboard-loading-container">
            <div className="loading-content">
              <div className="simple-loader">
                <div className="loader-dot"></div>
                <div className="loader-dot"></div>
                <div className="loader-dot"></div>
              </div>
              <h3>Loading Approval Reports</h3>
              <p>Fetching pending reports and approval data...</p>
            </div>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.filter(report => report.status === 'sent').length > 0 ? (
              reports.filter(report => report.status === 'sent').map(report => {
                const logoUrl = getOrganizationLogo(report);
                let displayStatus = report.status.toUpperCase();
                
                // Customize status display
                if (report.status === 'sent') {
                  displayStatus = 'PENDING APPROVAL';
                } else if (report.status === 'approved') {
                  displayStatus = 'APPROVED';
                } else if (report.status === 'rejected') {
                  displayStatus = 'REJECTED';
                }
                
                return (
                  <div key={report.id} className="report-card">
                    <img 
                      src={logoUrl}
                      alt={report.user?.organization || 'Organization Logo'} 
                      className="org-logo"
                      onError={(e) => {
                        console.log('Failed to load logo:', e.target.src);
                        e.target.src = '/Assets/disaster_logo.png';
                      }}
                    />
                    <div className="report-info">
                      <span className="org-label">{report.user?.organization || 'ASSOCIATE'}</span>
                      <h3>{report.title}</h3>
                      <span className={`report-status ${report.status}`}>
                        {displayStatus}
                      </span>
                      <button className="see-more-btn" onClick={() => handlePreview(report)}>
                        SEE MORE
                      </button>
                    </div>
                  </div>
                );
              })
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
                No pending reports found. Reports will appear here when associates submit them for approval.
              </div>
            )}
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>After Operation Report History</h3>
                <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body">
                <div className="history-list">
                  {(() => {
                    const approvedReports = allReports.filter(report => report.status === 'approved');
                    console.log('Approved reports in history:', approvedReports.length);
                    console.log('Approved reports:', approvedReports);
                    
                    return approvedReports.map(report => (
                    <div key={report.id} className="history-item">
                      <img 
                        src={getOrganizationLogo(report)}
                        alt={report.user?.organization || 'Organization Logo'} 
                        className="history-logo"
                      />
                      <div className="history-info">
                        <h4 className="history-title">{report.title}</h4>
                        <p className="history-date">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                          <p className="history-status approved">
                            Approved on {new Date(report.approved_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        className="generate-btn"
                        onClick={() => handleGenerateAOR(report.id)}
                      >
                        <FontAwesomeIcon icon={faDownload} /> Generate AOR
                      </button>
                    </div>
                    ));
                  })()}
                  {allReports.filter(report => report.status === 'approved').length === 0 && (
                    <div className="no-approved-reports">
                      <p>No approved reports found.</p>
                      <p>Reports will appear here after they are approved.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedReport && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div className="preview-header">
                  <img 
                    src={getOrganizationLogo(selectedReport)}
                    alt={selectedReport.user?.organization || 'Organization Logo'} 
                    className="preview-org-logo"
                  />
                  <div className="preview-org-info">
                    <h4>{selectedReport.user?.organization || 'ASSOCIATE'}</h4>
                    <p>{selectedReport.title}</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowPreviewModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body">
                <div className="preview-content">
                  {/* Header Information */}
                  <div className="report-header-info">
                    <h2>Disaster Preparedness And Response Volunteers Coalition of Laguna</h2>
                    <p>Blk 63 Lot 21 Aventine Hills BF Resort Village, Las Pinas City</p>
                  </div>

                  {selectedReport.data && (
                    <>
                      {/* Heading Section */}
                      <div className="report-view-section">
                        <h3>I. HEADING</h3>
                        <div className="detail-row">
                          <strong>For:</strong>
                           <span>
                             {selectedReport.data.for && selectedReport.data.forPosition 
                               ? `${selectedReport.data.for} - ${selectedReport.data.forPosition}`
                               : selectedReport.data.for || selectedReport.data.forPosition || 'N/A'
                             }
                           </span>
                        </div>
                        <div className="detail-row">
                          <strong>Date:</strong>
                           <span>{selectedReport.data.date ? formatDate(selectedReport.data.date) : 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <strong>Subject:</strong>
                          <span>{selectedReport.data.subject || 'N/A'}</span>
                        </div>
                        {selectedReport.data.authorities && selectedReport.data.authorities.length > 0 && (
                          <div className="detail-row">
                            <strong>Authorities:</strong>
                            <ul className="detail-list">
                              {selectedReport.data.authorities.map((auth, index) => (
                                <li key={index}>{auth}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Event Details Section */}
                      <div className="report-view-section">
                        <h3>II. EVENT DETAILS</h3>
                        <div className="detail-row">
                          <strong>Place:</strong>
                          <span>{selectedReport.data.place || 'N/A'}</span>
                        </div>
                        {selectedReport.data.personnelInvolved && selectedReport.data.personnelInvolved.length > 0 && (
                          <div className="detail-row">
                            <strong>Personnel Involved:</strong>
                            <ul className="detail-list">
                              {selectedReport.data.personnelInvolved.map((person, index) => (
                                <li key={index}>{person}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="detail-row">
                          <strong>Event Name:</strong>
                          <span>{selectedReport.data.eventName || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <strong>Event Location:</strong>
                          <span>{selectedReport.data.eventLocation || 'N/A'}</span>
                        </div>
                        {selectedReport.data.organizers && selectedReport.data.organizers.length > 0 && (
                          <div className="detail-row">
                            <strong>Organizers:</strong>
                            <ul className="detail-list">
                              {selectedReport.data.organizers.map((org, index) => (
                                <li key={index}>{org}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Narration of Events I Section */}
                      <div className="report-view-section">
                        <h3>III. NARRATION OF EVENTS I</h3>
                        <div className="detail-row">
                           <strong>Event Date:</strong>
                           <span>{selectedReport.data.eventDate ? formatDate(selectedReport.data.eventDate) : 'N/A'}</span>
                          </div>
                        <div className="detail-row">
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
                          <div className="detail-row">
                            <strong>Participants:</strong>
                            <ul className="detail-list">
                              {selectedReport.data.participants.map((participant, index) => (
                                <li key={index}>
                                  {participant.name} - {participant.position}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="detail-row">
                          <strong>Training Agenda:</strong>
                          <div className="detail-textarea">
                            {selectedReport.data.trainingAgenda || 'N/A'}
                          </div>
                        </div>
                        <div className="detail-row">
                          <strong>Event Overview:</strong>
                          <div className="detail-textarea">
                            {selectedReport.data.eventOverview || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Narration of Events II Section */}
                      <div className="report-view-section">
                        <h3>IV. NARRATION OF EVENTS II</h3>
                        <div className="detail-row">
                          <strong>Key Outcomes:</strong>
                          <div className="detail-textarea">
                            {selectedReport.data.keyOutcomes && selectedReport.data.keyOutcomes.length > 0 
                              ? selectedReport.data.keyOutcomes.join('\n') 
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="detail-row">
                          <strong>Challenges:</strong>
                          <div className="detail-textarea">
                            {selectedReport.data.challenges && selectedReport.data.challenges.length > 0 
                              ? selectedReport.data.challenges.join('\n') 
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="detail-row">
                          <strong>Recommendations:</strong>
                          <div className="detail-textarea">
                            {selectedReport.data.recommendations && selectedReport.data.recommendations.length > 0 
                              ? selectedReport.data.recommendations.join('\n') 
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="detail-row">
                          <strong>Conclusion:</strong>
                          <div className="detail-textarea">
                            {selectedReport.data.conclusion || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Attachments Section */}
                      {selectedReport.data.photos && selectedReport.data.photos.length > 0 && (
                        <div className="report-view-section">
                          <h3>V. ATTACHMENTS</h3>
                          <div className="detail-row">
                            <strong>Photos:</strong>
                            <div className="detail-images">
                              {selectedReport.data.photos.map((photo, index) => (
                                <img
                                  key={index}
                                  src={`${API_BASE}/storage/${photo}`}
                                  alt={`Report photo ${index + 1}`}
                                  className="detail-image"
                                  onClick={() => handlePhotoClick(photo)}
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
                      <div className="report-view-section">
                        <h3>VI. SIGNATORIES</h3>
                        <div className="detail-row">
                          <strong>Prepared By:</strong>
                           <span>
                             {selectedReport.data.preparedBy && selectedReport.data.preparedByPosition 
                               ? `${selectedReport.data.preparedBy} - ${selectedReport.data.preparedByPosition}`
                               : selectedReport.data.preparedBy || selectedReport.data.preparedByPosition || 'N/A'
                             }
                           </span>
                        </div>
                        {selectedReport.data.preparedBySignature && (
                          <div className="detail-row">
                            <strong>Signature:</strong>
                            <img
                              src={`${API_BASE}/storage/${selectedReport.data.preparedBySignature}`}
                              alt="Prepared by signature"
                              className="detail-image"
                              style={{ maxWidth: '200px', maxHeight: '100px' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        {selectedReport.data.approvedBy && (
                          <div className="detail-row">
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
                          <div className="detail-row">
                            <strong>Approval Signature:</strong>
                            <img
                              src={`${API_BASE}/storage/${selectedReport.data.approvedBySignature}`}
                              alt="Approved by signature"
                              className="detail-image"
                              style={{ maxWidth: '200px', maxHeight: '100px' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Keep any additional fields that are not in the associate side */}
                  {Object.entries(selectedReport.data).map(([key, value]) => {
                    const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
                    
                    // Skip fields that are already covered in the organized sections or should be hidden
                    const coveredFields = [
                      'for', 'forPosition', 'date', 'subject', 'authorities',
                      'place', 'personnelInvolved', 'eventName', 'eventLocation', 'organizers',
                      'eventDate', 'startTime', 'endTime', 'participants', 'trainingAgenda', 'eventOverview',
                      'keyOutcomes', 'challenges', 'recommendations', 'conclusion',
                      'photos', 'preparedBy', 'preparedByPosition', 'preparedBySignature',
                      'approvedBy', 'approvedByPosition', 'approvedBySignature',
                      'dateTime', 'organization', 'associateGroup', 'institutionName', 'address'
                    ];
                    
                    if (coveredFields.includes(key)) {
                      return null;
                    }

                    // Helper function to format value with "NONE" for empty fields
                    const formatValue = (val) => {
                      if (val === null || val === undefined || val === '' || 
                          (Array.isArray(val) && val.length === 0) ||
                          (typeof val === 'object' && Object.keys(val).length === 0)) {
                        return 'NONE';
                      }
                      
                      // Handle arrays
                      if (Array.isArray(val)) {
                        return val.map(item => {
                          if (typeof item === 'object' && item !== null) {
                            return JSON.stringify(item);
                          }
                          return String(item);
                        }).join(', ');
                      }
                      
                      // Handle objects
                      if (typeof val === 'object' && val !== null) {
                        return JSON.stringify(val);
                      }
                      
                      return String(val);
                    };

                    // Hide signature fields for privacy
                    if (key === 'associateLogo' || key === 'pcgaLogo' || 
                        key === 'signature' || key === 'logo' || key === 'stamp') {
                      return null;
                    }

                    if (key === 'activities' && typeof value === 'object' && value !== null) {
                      return (
                        <div key={key} className="report-view-section">
                          <h3>{formattedKey}</h3>
                          <div className="activities-list">
                            {Array.isArray(value) && value.length > 0
                              ? value.map((activity, idx) => (
                                  <div key={idx} className="activity-item">
                                    <div className="activity-number">Activity {idx + 1}:</div>
                                    {Object.entries(activity).map(([k, v]) => (
                                      <div key={k} className="activity-detail">
                                        <strong>{k.charAt(0).toUpperCase() + k.slice(1)}:</strong> 
                                        <span className="activity-value">{formatValue(v)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ))
                              : <span className="preview-value">NONE</span>
                            }
                          </div>
                        </div>
                      );
                    }

                    if (key === 'associateGroup' && typeof value === 'object' && value !== null) {
                      return (
                        <div key={key} className="report-view-section">
                          <h3>Associate Group</h3>
                          <div className="associate-details">
                            <div className="detail-row">
                              <strong>Name:</strong>
                              <span>{formatValue(value.name)}</span>
                            </div>
                            <div className="detail-row">
                              <strong>Director:</strong>
                              <span>{formatValue(value.director)}</span>
                            </div>
                            <div className="detail-row">
                              <strong>Description:</strong>
                              <span>{formatValue(value.description)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="report-view-section">
                        <h3>{formattedKey}</h3>
                        <div className="detail-row">
                          <strong>Value:</strong>
                          <span>{formatValue(value)}</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="preview-actions">
                    {selectedReport.status === 'sent' && (
                      <>
                    <button 
                      className="preview-btn approve"
                          onClick={() => handleConfirmApprove(selectedReport.id)}
                    >
                      <FontAwesomeIcon icon={faCheck} /> Approve
                    </button>
                    <button 
                      className="preview-btn reject"
                          onClick={() => handleConfirmReject(selectedReport.id)}
                    >
                      <FontAwesomeIcon icon={faBan} /> Reject
                    </button>
                      </>
                    )}
                    
                    {selectedReport.status === 'approved' && (
                      <>
                        <button 
                          className="preview-btn approve disabled"
                          disabled
                          title="Already approved"
                        >
                          <FontAwesomeIcon icon={faCheck} /> Approved
                        </button>
                      </>
                    )}
                    
                    {selectedReport.status === 'rejected' && (
                      <>
                    <button 
                          className="preview-btn reject disabled"
                          disabled
                          title="Already rejected"
                    >
                          <FontAwesomeIcon icon={faBan} /> Rejected
                    </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Action Confirmation Required</h3>
                <button className="modal-close" onClick={handleCancelAction}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body">
                <div className="confirmation-content">
                  <div className="confirmation-icon">
                    <FontAwesomeIcon 
                      icon={confirmAction === 'approve' ? faCheck : faBan} 
                      className={confirmAction === 'approve' ? 'approve-icon' : 'reject-icon'}
                    />
                  </div>
                  <h4 className="confirmation-title">
                    {confirmAction === 'approve' ? 'Approve After Operation Report' : 'Reject After Operation Report'}
                  </h4>
                  <p className="confirmation-message">
                    You are about to <strong>{confirmAction === 'approve' ? 'approve' : 'reject'}</strong> the report titled:
                  </p>
                  <div className="report-title-display">
                    "{selectedReport?.title || 'Untitled Report'}"
                  </div>
                  <div className="confirmation-details">
                    {confirmAction === 'approve' ? (
                      <>
                        <p><strong>Approval Action:</strong> This report will be marked as approved and will be:</p>
                        <ul>
                          <li>Available for AOR generation and download</li>
                          <li>Added to the approved reports history</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p><strong>Rejection Action:</strong> This report will be marked as rejected and:</p>
                        <ul>
                          <li>The associate organization will be notified</li>
                        </ul>
                        <div className="rejection-reason-section">
                          <label htmlFor="rejection-reason" className="rejection-reason-label">
                            <strong>Rejection Reason (Required):</strong>
                          </label>
                          <textarea
                            id="rejection-reason"
                            className="rejection-reason-input"
                            placeholder="Please provide a clear reason for rejection (minimum 10 characters) to help the associate improve their submission..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows="3"
                            required
                          />
                          <div className="rejection-reason-help">
                            <small>Minimum 10 characters required. Current: {rejectionReason.length}/10</small>
                          </div>
                          {rejectionReason.trim().length === 0 && (
                            <div className="rejection-reason-error">
                              Please provide a rejection reason before proceeding.
                            </div>
                          )}
                          {rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 && (
                            <div className="rejection-reason-error">
                              Rejection reason must be at least 10 characters long.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="confirmation-warning">
                    <p><strong>Note:</strong> This action cannot be undone. Please ensure all information has been thoroughly reviewed.</p>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className={`modal-btn ${confirmAction === 'approve' ? 'confirm-approve' : 'confirm-reject'}`} onClick={handleConfirmAction}>
                    <FontAwesomeIcon icon={confirmAction === 'approve' ? faCheck : faBan} /> 
                    {confirmAction === 'approve' ? 'Approve Report' : 'Reject Report'}
                  </button>
                  <button className="modal-btn cancel-btn" onClick={handleCancelAction}>
                    Cancel Action
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Modal */}
        {showPhotoModal && selectedPhoto && (
          <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Photo Preview</h3>
                <button className="modal-close" onClick={() => setShowPhotoModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body">
                <img 
                  src={selectedPhoto} 
                  alt="Photo Preview" 
                  className="photo-preview-image"
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
    </AdminLayout>
  );
}

export default ApprovalAOR; 
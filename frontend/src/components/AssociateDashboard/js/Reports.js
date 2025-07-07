import React, { useEffect, useState, useCallback } from 'react';
import AssociateLayout from './AssociateLayout';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faArrowLeft, faArrowRight, faSave, faXmark, faSearch, faTimes, faPlus, faEdit, faCheck, faTrash, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import '../css/Reports.css';
import imageCompression from 'browser-image-compression';
import '../css/VolunteerList.css'; // Import confirm modal styles

// Reusable ConfirmModal (copied from VolunteerList.js)
function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" style={{zIndex: 10000}}>
      <div className="confirm-modal">
        <button className="modal-close confirm-close" onClick={onCancel}>&times;</button>
        <div className="confirm-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="28" stroke="#e53935" strokeWidth="4" fill="#fff"/>
            <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="32" fill="#e53935">!</text>
          </svg>
        </div>
        <div className="confirm-message">{message}</div>
        <div className="modal-actions confirm-actions">
          <button className="delete-btn" onClick={onConfirm}>Yes, I'm sure</button>
          <button className="cancel-btn" onClick={onCancel}>No, cancel</button>
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Header Information
    for: '',
    forPosition: '',
    thru: '',
    thruPosition: '',
    from: '',
    fromPosition: '',
    date: '',
    subject: '',

    // Authority Section
    authority: ['', ''], // Array for multiple authority entries

    // Date, Time, and Place Section
    dateTime: '',
    activityType: '',
    location: '',

    // Personnel Section
    auxiliaryPersonnel: [''], // Array for auxiliary personnel
    pcgPersonnel: [''], // Array for PCG personnel

    // Narration Section
    objective: '',
    summary: '',
    activities: [
      {
        title: '',
        description: ''
      }
    ],
    conclusion: '',

    // Recommendations Section
    recommendations: [''],

    // Attachments Section
    photos: []
  });

  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const steps = [
    'Header',
    'Authority',
    'Date, Time, and Place',
    'Personnel Involved',
    'Narrations of Events',
    'Recommendations',
    'Attachments'
  ];

  const isStepComplete = useCallback((stepIndex) => {
    switch (stepIndex) {
      case 0: // Header
        return !!formData.for && !!formData.thru && !!formData.from && !!formData.date && !!formData.subject;
      case 1: // Authority
        return formData.authority.some(auth => auth.trim());
      case 2: // Date, Time, and Place of Activity
        return !!formData.dateTime && !!formData.activityType && !!formData.location;
      case 3: // Personnel Involved
        return formData.auxiliaryPersonnel.some(p => p.trim()) || formData.pcgPersonnel.some(p => p.trim());
      case 4: // Narration of Events
        return !!formData.objective && !!formData.summary && formData.activities.some(a => a.title.trim() || a.description.trim()) && !!formData.conclusion;
      case 5: // Recommendations
        return formData.recommendations.some(r => r.trim());
      case 6: // Attachments
        return true; // Optional
      default:
        return false;
    }
  }, [formData]);

  useEffect(() => {
    fetchReports();
  }, []);
    
  useEffect(() => {
    // Update completed steps when form data changes
    const newCompletedSteps = new Set();
    steps.forEach((step, index) => {
      if (isStepComplete(index)) {
        newCompletedSteps.add(index);
      }
    });
    setCompletedSteps(newCompletedSteps);
    
    // Update progress
    const totalSteps = steps.length;
    const completedCount = newCompletedSteps.size;
    setProgress((completedCount / totalSteps) * 100);
  }, [formData, isStepComplete, steps.length]);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get('http://localhost:8000/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add photo_url to each report if it has a photo_path
      const reportsWithUrls = res.data.map(report => ({
        ...report,
        photo_url: report.photo_path ? `http://localhost:8000/storage/${report.photo_path}` : null
      }));
      
      setReports(reportsWithUrls);
    } catch (err) {
      setError('Failed to load reports');
    }
    setLoading(false);
  };

  const handleInputChange = (e, field, index = null, subfield = null) => {
    const value = e.target.value;
    setFormData(prev => {
      const newData = { ...prev };
      
      if (index !== null) {
        if (subfield) {
          newData[field][index][subfield] = value;
        } else {
          newData[field][index] = value;
        }
      } else {
        newData[field] = value;
      }
      
      return newData;
    });
  };

  const addField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], field === 'activities' ? { title: '', description: '' } : '']
    }));
  };

  const removeField = (field, index) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (field === 'photos') {
        // For photos, we need to handle File objects differently
        newData[field] = prev[field].filter((_, i) => i !== index);
      } else {
        newData[field] = prev[field].filter((_, i) => i !== index);
      }
      return newData;
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };

  const openCreateModal = () => {
    setEditingReport(null);
    setFormData({
      for: '', forPosition: '', thru: '', thruPosition: '', from: '', fromPosition: '', date: '', subject: '',
      authority: ['', ''], dateTime: '', activityType: '', location: '', auxiliaryPersonnel: [''], pcgPersonnel: [''],
      objective: '', summary: '', activities: [{ title: '', description: '' }], conclusion: '', recommendations: [''], photos: []
    });
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setSuccessMessage('');
    setError('');
    setShowCreateModal(true);
  };

  const handleSubmit = async (shouldSubmit = false, existingReport = null) => {
    setSubmitting(true);
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setSubmitting(false);
        return;
      }

      if (existingReport) {
        // Simple status update for draft submission
        const response = await axios.put(
          `http://localhost:8000/api/reports/${existingReport.id}`,
          { status: 'sent' },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );

        if (response.data) {
          setError('');
          setSuccessMessage('Report submitted successfully!');
          await fetchReports();
        }
      } else {
        // Only validate if submitting, not when saving as draft
        if (shouldSubmit) {
          const validationResults = steps.map((step, index) => ({
            step: step,
            isComplete: isStepComplete(index),
          }));
          const incompleteSteps = validationResults.filter(result => !result.isComplete).map(result => result.step);
          if (incompleteSteps.length > 0) {
            setError(`Please complete all required fields in: ${incompleteSteps.join(', ')}`);
            setSubmitting(false);
            return;
          }
        }

        const formDataToSend = new FormData();
        // Prepare the report data
        const reportData = {
          for: formData.for || '',
          forPosition: formData.forPosition || '',
          thru: formData.thru || '',
          thruPosition: formData.thruPosition || '',
          from: formData.from || '',
          fromPosition: formData.fromPosition || '',
          date: formData.date || '',
          subject: formData.subject || '',
          authority: formData.authority.filter(auth => auth.trim()),
          dateTime: formData.dateTime || '',
          activityType: formData.activityType || '',
          location: formData.location || '',
          auxiliaryPersonnel: formData.auxiliaryPersonnel.filter(p => p.trim()),
          pcgPersonnel: formData.pcgPersonnel.filter(p => p.trim()),
          objective: formData.objective || '',
          summary: formData.summary || '',
          activities: formData.activities.filter(a => a.title.trim() || a.description.trim()),
          conclusion: formData.conclusion || '',
          recommendations: formData.recommendations.filter(r => r.trim()),
          details: formData.summary || ''
        };

        formDataToSend.append('title', formData.subject || 'Untitled Report');
        formDataToSend.append('description', formData.summary || 'No summary provided');
        formDataToSend.append('status', shouldSubmit ? 'sent' : 'draft');
        formDataToSend.append('data', JSON.stringify(reportData));

        // Compress and append photos
        if (formData.photos && formData.photos.length > 0) {
          for (let i = 0; i < formData.photos.length; i++) {
            const file = formData.photos[i];
            const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true });
            formDataToSend.append('photo', compressed, file.name);
          }
        }

        const url = editingReport 
          ? `http://localhost:8000/api/reports/${editingReport.id}`
          : 'http://localhost:8000/api/reports';
        const method = editingReport ? 'put' : 'post';
        const response = await axios({
          method,
          url,
          data: formDataToSend,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        });
        if (response.data) {
          setError('');
          setShowCreateModal(false);
          setSuccessMessage(shouldSubmit ? 'Report submitted successfully!' : 'Draft saved successfully!');
          await fetchReports();
        }
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        setError(err.response.data.message || 'Server error: ' + err.response.status);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', err.message);
        setError('Error preparing request: ' + err.message);
      }
    }
    setSubmitting(false);
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    
    // Parse the report data if it's stored as JSON string
    let reportData = {};
    try {
      if (report.data && typeof report.data === 'string') {
        reportData = JSON.parse(report.data);
      } else if (report.data) {
        reportData = report.data;
      }
    } catch (error) {
      console.error('Error parsing report data:', error);
    }

    setFormData({
      // Header Information
      for: reportData.for || report.for || '',
      forPosition: reportData.forPosition || report.forPosition || '',
      thru: reportData.thru || report.thru || '',
      thruPosition: reportData.thruPosition || report.thruPosition || '',
      from: reportData.from || report.from || '',
      fromPosition: reportData.fromPosition || report.fromPosition || '',
      date: reportData.date || report.date || '',
      subject: reportData.subject || report.subject || '',

      // Authority Section
      authority: reportData.authority || (report.authority ? report.authority.split(',') : ['', '']),

      // Date, Time, and Place Section
      dateTime: reportData.dateTime || report.dateTime || '',
      activityType: reportData.activityType || report.activityType || '',
      location: reportData.location || report.location || '',

      // Personnel Section
      auxiliaryPersonnel: reportData.auxiliaryPersonnel || (report.auxiliaryPersonnel ? report.auxiliaryPersonnel.split(',') : ['']),
      pcgPersonnel: reportData.pcgPersonnel || (report.pcgPersonnel ? report.pcgPersonnel.split(',') : ['']),

      // Narration Section
      objective: reportData.objective || report.objective || '',
      summary: reportData.summary || report.summary || '',
      activities: reportData.activities || (report.activities ? report.activities.map(activity => ({
        title: activity.title || '',
        description: activity.description || ''
      })) : [{ title: '', description: '' }]),
      conclusion: reportData.conclusion || report.conclusion || '',

      // Recommendations Section
      recommendations: reportData.recommendations || (report.recommendations ? report.recommendations.split(',') : ['']),

      // Attachments Section
      photos: []
    });
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setShowCreateModal(true);
  };

  const [confirm, setConfirm] = useState({ open: false, onConfirm: null, message: '' });

  const handleDelete = async (id) => {
    setConfirm({
      open: true,
      message: 'Are you sure you want to delete this report?',
      onConfirm: async () => {
        setConfirm({ ...confirm, open: false });
        try {
          const token = localStorage.getItem('authToken');
          await axios.delete(`http://localhost:8000/api/reports/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchReports();
        } catch {
          setError('Failed to delete report');
        }
      }
    });
  };

  const handleModalClose = () => {
    setConfirm({
      open: true,
      message: 'Are you sure you want to close? Any unsaved changes will be lost.',
      onConfirm: () => {
        setConfirm({ ...confirm, open: false });
        setShowCreateModal(false);
        setCurrentStep(0);
        setCompletedSteps(new Set());
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#6c757d',
      sent: '#007bff',
      reviewed: '#ffc107',
      approved: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (isStepComplete(currentStep)) {
        setCompletedSteps(prev => {
          const newSet = new Set(prev);
          newSet.add(currentStep);
          return newSet;
        });
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step) => {
    if (step < currentStep || steps.slice(0, step).every((s, i) => isStepComplete(i))) {
      setCurrentStep(step);
    }
  };

  const updateProgress = () => {
    const totalSteps = steps.length;
    const completedCount = completedSteps ? completedSteps.size : 0;
    setProgress((currentStep + 1) / totalSteps * 100);
  };

  return (
    <AssociateLayout>
      <div className="reports-container">
        <div className="header-section">
          <div className="header-left">
            <h2>REPORTS</h2>
          </div>
          
          <div className="header-actions">
            <div className="search-container">
              <div className="search-bar">
                <FontAwesomeIcon icon={faSearch} />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="action-buttons">
              <button className="add-report-btn" onClick={openCreateModal}>
                <FontAwesomeIcon icon={faPlus} />
                Make a Report
          </button>
            </div>
          </div>
        </div>

        {/* Reports summary */}
        <div className="reports-summary">
          <span>
            Total:
            <span className="total">{reports.length}</span>
          </span>
          <span>
            Draft:
            <span className="draft">{reports.filter(r => r.status === 'draft').length}</span>
          </span>
          <span>
            Sent:
            <span className="sent">{reports.filter(r => r.status === 'sent').length}</span>
          </span>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <p>Loading reports...</p>
          </div>
        ) : (
          <div className="table-container">
            {reports.length === 0 ? (
              <div className="no-data">
                <div className="no-data-content">
                  <FontAwesomeIcon icon={faPlus} />
                  <p>No reports found</p>
                  <button className="add-first-btn" onClick={openCreateModal}>
                    Create your first report
                  </button>
                </div>
              </div>
            ) : (
              <table className="reports-table">
              <thead>
                <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                  {reports
                    .filter(report => 
                      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      report.description?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(report => (
                    <tr key={report.id}>
                      <td className="title-cell">{report.title}</td>
                      <td className="description-cell">{report.description}</td>
                      <td className="status-cell">
                        <span className={`status-badge ${report.status}`}>
                        {report.status?.toUpperCase() || 'DRAFT'}
                      </span>
                    </td>
                      <td className="actions-cell">
                      <div className="action-buttons-row">
                        {report.status === 'draft' && (
                          <>
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleEdit(report)}
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="action-btn send-btn"
                              onClick={() => handleSubmit(true, report)}
                              title="Send"
                            >
                              <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(report.id)}
                              title="Delete"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
                        )}
                        {report.status !== 'draft' && (
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(report.id)}
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content report-modal-card">
              {/* Modal Header */}
              <div className="report-modal-header">
                <h2>{editingReport ? 'Edit Report' : 'Add New Report'}</h2>
              <button 
                className="modal-close"
                onClick={handleModalClose}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
              </div>
              {/* Stepper and Section Header Card in one container */}
              <div className="stepper-section-header-wrapper">
              <div className="progress-steps">
                {steps.map((step, index) => (
                  <div
                    key={index}
                      className={`progress-step${index < currentStep ? ' completed' : ''}${index === currentStep ? ' active' : ''}`}
                    onClick={() => goToStep(index)}
                  >
                    {index + 1}
                  </div>
                ))}
                </div>
                {/* Section Header Card */}
                {currentStep === 0 && <div className="section-gradient-card-red">I. HEADER</div>}
                {currentStep === 1 && <div className="section-gradient-card-red">II. AUTHORITY</div>}
                {currentStep === 2 && <div className="section-gradient-card-red">III. DATE, TIME, AND PLACE</div>}
                {currentStep === 3 && <div className="section-gradient-card-red">IV. PERSONNEL INVOLVED</div>}
                {currentStep === 4 && <div className="section-gradient-card-red">V. NARRATIONS OF EVENTS</div>}
                {currentStep === 5 && <div className="section-gradient-card-red">VI. RECOMMENDATIONS</div>}
                {currentStep === 6 && <div className="section-gradient-card-red">VII. ATTACHMENTS</div>}
              </div>
              {/* Modal Body */}
              <div className="report-modal-body">
                <form className="report-form-grid" onSubmit={e => { e.preventDefault(); handleSubmit(editingReport ? true : false); }}>
                  {/* Step 1: Header */}
                  {currentStep === 0 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 2'}}>
                          <label>SUBJECT:</label>
                          <input type="text" value={formData.subject} onChange={e => handleInputChange(e, 'subject')} placeholder="Report Subject" />
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group">
                          <label>FOR:</label>
                          <input type="text" value={formData.for} onChange={e => handleInputChange(e, 'for')} placeholder="Recipient Name" />
                        </div>
                        <div className="report-form-group">
                          <label>THRU:</label>
                          <input type="text" value={formData.thru} onChange={e => handleInputChange(e, 'thru')} placeholder="Thru Name" />
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group">
                          <label>FROM:</label>
                          <input type="text" value={formData.from} onChange={e => handleInputChange(e, 'from')} placeholder="Sender Name" />
                        </div>
                        <div className="report-form-group">
                          <label>DATE:</label>
                          <input type="date" value={formData.date} onChange={e => handleInputChange(e, 'date')} />
                        </div>
                      </div>
                    </>
                  )}
                  {/* Step 2: Authority */}
                  {currentStep === 1 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 2'}}>
                          <label>Authority:</label>
                  {formData.authority.map((auth, index) => (
                            <div key={index} style={{display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 8}}>
                              <input type="text" value={auth} onChange={e => handleInputChange(e, 'authority', index)} placeholder={`Authority ${index + 1}`} style={{flex: 1}} />
                              {index === formData.authority.length - 1 && (
                                <button type="button" onClick={() => addField('authority')}>Add</button>
                              )}
                              {formData.authority.length > 1 && (
                                <button type="button" onClick={() => removeField('authority', index)}>Remove</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {/* Step 3: Date, Time, and Place of Activity */}
                  {currentStep === 2 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group">
                          <label>Date and Time:</label>
                          <input type="datetime-local" value={formData.dateTime} onChange={e => handleInputChange(e, 'dateTime')} />
                        </div>
                        <div className="report-form-group">
                          <label>Type of Activity:</label>
                          <input type="text" value={formData.activityType} onChange={e => handleInputChange(e, 'activityType')} placeholder="Activity Type" />
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 2'}}>
                          <label>Areas/Location:</label>
                          <input type="text" value={formData.location} onChange={e => handleInputChange(e, 'location')} placeholder="Location" />
                        </div>
                      </div>
                    </>
                  )}
                  {/* Step 4: Personnel Involved */}
                  {currentStep === 3 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group">
                          <label>Auxiliary Personnel:</label>
                          {formData.auxiliaryPersonnel.map((person, index) => (
                            <div key={index} style={{display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 8}}>
                              <input type="text" value={person} onChange={e => handleInputChange(e, 'auxiliaryPersonnel', index)} placeholder={`Personnel ${index + 1}`} style={{flex: 1}} />
                              {index === formData.auxiliaryPersonnel.length - 1 && (
                                <button type="button" onClick={() => addField('auxiliaryPersonnel')}>Add</button>
                              )}
                              {formData.auxiliaryPersonnel.length > 1 && (
                                <button type="button" onClick={() => removeField('auxiliaryPersonnel', index)}>Remove</button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="report-form-group">
                          <label>PCG Personnel:</label>
                          {formData.pcgPersonnel.map((person, index) => (
                            <div key={index} style={{display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 8}}>
                              <input type="text" value={person} onChange={e => handleInputChange(e, 'pcgPersonnel', index)} placeholder={`Personnel ${index + 1}`} style={{flex: 1}} />
                              {index === formData.pcgPersonnel.length - 1 && (
                                <button type="button" onClick={() => addField('pcgPersonnel')}>Add</button>
                              )}
                              {formData.pcgPersonnel.length > 1 && (
                                <button type="button" onClick={() => removeField('pcgPersonnel', index)}>Remove</button>
                              )}
                    </div>
                  ))}
                        </div>
                      </div>
                    </>
                  )}
                  {/* Step 5: Narration of Events */}
                  {currentStep === 4 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group">
                          <label>Objective:</label>
                          <textarea value={formData.objective} onChange={e => handleInputChange(e, 'objective')} placeholder="State the objective" />
                        </div>
                        <div className="report-form-group">
                          <label>Summary:</label>
                          <textarea value={formData.summary} onChange={e => handleInputChange(e, 'summary')} placeholder="Provide a summary" />
                        </div>
              </div>
                      <div className="report-form-row">
                        <div className="report-form-group activities-panel" style={{gridColumn: '1 / span 2'}}>
                          <label>Activities:</label>
                          {formData.activities.map((activity, index) => (
                            <div key={index} className="activity-row">
                              <input
                                type="text"
                                value={activity.title}
                                onChange={e => handleInputChange(e, 'activities', index, 'title')}
                                placeholder="Activity Title"
                              />
                              <textarea
                                value={activity.description}
                                onChange={e => handleInputChange(e, 'activities', index, 'description')}
                                placeholder="Activity Description"
                              />
                              {formData.activities.length > 1 && (
                <button
                                  type="button"
                                  className="activity-remove-btn"
                                  onClick={() => removeField('activities', index)}
                                >
                                  Remove
                </button>
                              )}
                            </div>
                          ))}
                    <button
                            type="button"
                            className="add-activity-btn"
                            onClick={() => addField('activities')}
                          >
                            Add Activity
                    </button>
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 2'}}>
                          <label>Conclusion:</label>
                          <textarea value={formData.conclusion} onChange={e => handleInputChange(e, 'conclusion')} placeholder="State the conclusion" />
                        </div>
                      </div>
                    </>
                  )}
                  {/* Step 6: Recommendations */}
                  {currentStep === 5 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 2'}}>
                          <label>Recommendations:</label>
                          {formData.recommendations.map((rec, index) => (
                            <div key={index} style={{display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 8}}>
                              <textarea value={rec} onChange={e => handleInputChange(e, 'recommendations', index)} placeholder={`Recommendation ${index + 1}`} style={{flex: 1}} />
                              {index === formData.recommendations.length - 1 && (
                                <button type="button" onClick={() => addField('recommendations')}>Add</button>
                              )}
                              {formData.recommendations.length > 1 && (
                                <button type="button" onClick={() => removeField('recommendations', index)}>Remove</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {/* Step 7: Attachments */}
                  {currentStep === 6 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Attachments:</label>
                          <div className="photo-upload-section">
                            <label className="photo-upload-label">
                              <FontAwesomeIcon icon={faUpload} /> Upload Photos
                              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                            </label>
                            <div className="photo-preview">
                              {formData.photos.map((photo, index) => (
                                <div key={index} className="photo-thumbnail">
                                  <img src={URL.createObjectURL(photo)} alt={`Upload ${index + 1}`} />
                                  <button type="button" onClick={() => removeField('photos', index)}><FontAwesomeIcon icon={faXmark} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                    </div>
                  </div>
                    </>
                  )}
                  <div className="report-modal-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, gap: 8 }}>
                    {/* Left: Save as Draft (only on last step) */}
                    <div>
                      {currentStep === steps.length - 1 && (
                        <button
                          className="report-modal-draft-btn"
                          type="button"
                          onClick={() => handleSubmit(false)}
                        >
                          <FontAwesomeIcon icon={faSave} />
                          Save as Draft
                        </button>
                      )}
                    </div>
                    {/* Right: Previous, Next, and Add Report */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {currentStep > 0 && (
                        <button className="nav-button prev" type="button" onClick={handlePrev}>
                          <FontAwesomeIcon icon={faArrowLeft} /> Previous
                        </button>
                      )}
                      {currentStep < steps.length - 1 && (
                        <button className="nav-button next" type="button" onClick={handleNext} disabled={!isStepComplete(currentStep)}>
                          Next <FontAwesomeIcon icon={faArrowRight} />
                        </button>
                      )}
                      {currentStep === steps.length - 1 && (
                        <button className="report-modal-submit-btn" type="submit">
                          Submit
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        <ConfirmModal
          open={confirm.open}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm({ ...confirm, open: false })}
        />
      </div>
    </AssociateLayout>
  );
}

export default Reports; 
import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faArrowLeft, faArrowRight, faSave, faXmark, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../css/Reports.css';
import imageCompression from 'browser-image-compression';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
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
    'Date, Time, and Place of Activity',
    'Personnel Involved',
    'Narration of Events',
    'Recommendations',
    'Attachments'
  ];

  const isStepComplete = (stepIndex) => {
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
  };

  useEffect(() => {
    fetchReports();
    
    // Initialize completedSteps based on actual completion status
    const initialCompletedSteps = new Set();
    steps.forEach((step, index) => {
      if (isStepComplete(index)) {
        initialCompletedSteps.add(index);
      }
    });
    setCompletedSteps(initialCompletedSteps);
  }, []);

  useEffect(() => {
    // Update step validation
    const validateStep = () => {
      // ... validation logic
    };
    validateStep();
  }, [currentStep, formData, steps]); // Added steps to dependencies

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
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
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
    setFormData({
      // Header Information
      for: report.for || '',
      forPosition: report.forPosition || '',
      thru: report.thru || '',
      thruPosition: report.thruPosition || '',
      from: report.from || '',
      fromPosition: report.fromPosition || '',
      date: report.date || '',
      subject: report.subject || '',

      // Authority Section
      authority: report.authority ? report.authority.split(',') : ['', ''],

      // Date, Time, and Place Section
      dateTime: report.dateTime || '',
      activityType: report.activityType || '',
      location: report.location || '',

      // Personnel Section
      auxiliaryPersonnel: report.auxiliaryPersonnel ? report.auxiliaryPersonnel.split(',') : [''],
      pcgPersonnel: report.pcgPersonnel ? report.pcgPersonnel.split(',') : [''],

      // Narration Section
      objective: report.objective || '',
      summary: report.summary || '',
      activities: report.activities ? report.activities.map(activity => ({
        title: activity.title || '',
        description: activity.description || ''
      })) : [{ title: '', description: '' }],
      conclusion: report.conclusion || '',

      // Recommendations Section
      recommendations: report.recommendations ? report.recommendations.split(',') : [''],

      // Attachments Section
      photos: report.photos ? report.photos.split(',').map(url => new Blob([], { type: 'image/jpeg' })) : []
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`http://localhost:8000/api/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReports();
    } catch {
      setError('Failed to delete report');
    }
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
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>REPORTS</h2>
          <button
            onClick={openCreateModal}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            MAKE A REPORT
          </button>
        </div>

        <h3 style={{ marginBottom: '16px' }}>LIST OF COMPILED REPORTS:</h3>

        {error && (
          <div style={{ color: 'red', margin: '10px 0', padding: '8px', background: '#fff', borderRadius: '4px', border: '1px solid red' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{report.title}</td>
                    <td style={{ padding: '12px' }}>{report.description}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: getStatusColor(report.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {report.status?.toUpperCase() || 'DRAFT'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {report.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleEdit(report)}
                            style={{
                              backgroundColor: '#ffc107',
                              color: 'black',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              marginRight: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSubmit(true, report)}
                            style={{
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              marginRight: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {report.status !== 'draft' && (
                        <button
                          onClick={() => handleDelete(report.id)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content modern-card">
              {submitting && <div className="loading-spinner">Submitting...</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              <button 
                className="modal-close"
                onClick={() => {
                  if(window.confirm('Are you sure you want to close? Any unsaved changes will be lost.')) {
                    setShowCreateModal(false);
                    setCurrentStep(0);
                    setCompletedSteps(new Set());
                  }
                }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
              <div className="modal-header">
                <h2>{editingReport ? 'Edit Report' : 'Create New Report'}</h2>
              </div>
              <div className="progress-steps">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`progress-step ${currentStep === index ? 'active' : ''} ${completedSteps.has(index) ? 'completed' : ''}`}
                    onClick={() => goToStep(index)}
                  >
                    {index + 1}
                    <span className="step-label">{step}</span>
                  </div>
                ))}
              </div>
              <div className="form-sections-container modern-form">
                {/* Section 1: Header */}
                <section className={`form-section ${currentStep === 0 ? 'active' : ''}`}>
                  <h3>Header</h3>
                  <div className="form-group"><label>FOR:</label><input type="text" value={formData.for} onChange={e => handleInputChange(e, 'for')} placeholder="Recipient Name" /></div>
                  <div className="form-group"><label>THRU:</label><input type="text" value={formData.thru} onChange={e => handleInputChange(e, 'thru')} placeholder="Thru Name" /></div>
                  <div className="form-group"><label>FROM:</label><input type="text" value={formData.from} onChange={e => handleInputChange(e, 'from')} placeholder="Sender Name" /></div>
                  <div className="form-group"><label>DATE:</label><input type="date" value={formData.date} onChange={e => handleInputChange(e, 'date')} /></div>
                  <div className="form-group"><label>SUBJECT:</label><input type="text" value={formData.subject} onChange={e => handleInputChange(e, 'subject')} placeholder="Report Subject" /></div>
                </section>
                {/* Section 2: Authority */}
                <section className={`form-section ${currentStep === 1 ? 'active' : ''}`}>
                  <h3>I. AUTHORITY</h3>
                  {formData.authority.map((auth, index) => (
                    <div key={index} className="form-group">
                      <input type="text" value={auth} onChange={e => handleInputChange(e, 'authority', index)} placeholder={`Authority ${index + 1}`} />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {index === formData.authority.length - 1 && (<button type="button" onClick={() => addField('authority')}>Add Authority</button>)}
                        {formData.authority.length > 1 && (<button type="button" onClick={() => removeField('authority', index)}>Remove</button>)}
                      </div>
                    </div>
                  ))}
                </section>
                {/* Section 3: Date, Time, and Place of Activity */}
                <section className={`form-section ${currentStep === 2 ? 'active' : ''}`}>
                  <h3>II. DATE, TIME, AND PLACE OF ACTIVITY</h3>
                  <div className="form-group"><label>Date and Time:</label><input type="datetime-local" value={formData.dateTime} onChange={e => handleInputChange(e, 'dateTime')} /></div>
                  <div className="form-group"><label>Type of Activity:</label><input type="text" value={formData.activityType} onChange={e => handleInputChange(e, 'activityType')} placeholder="Activity Type" /></div>
                  <div className="form-group"><label>Areas/Location:</label><input type="text" value={formData.location} onChange={e => handleInputChange(e, 'location')} placeholder="Location" /></div>
                </section>
                {/* Section 4: Personnel Involved */}
                <section className={`form-section ${currentStep === 3 ? 'active' : ''}`}>
                  <h3>III. PERSONNEL INVOLVED</h3>
                  <div className="personnel-section"><h4>Auxiliary Personnel</h4>{formData.auxiliaryPersonnel.map((person, index) => (<div key={index} className="form-group"><input type="text" value={person} onChange={e => handleInputChange(e, 'auxiliaryPersonnel', index)} placeholder={`Personnel ${index + 1}`} /><div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>{index === formData.auxiliaryPersonnel.length - 1 && (<button type="button" onClick={() => addField('auxiliaryPersonnel')}>Add Personnel</button>)}{formData.auxiliaryPersonnel.length > 1 && (<button type="button" onClick={() => removeField('auxiliaryPersonnel', index)}>Remove</button>)}</div></div>))}</div>
                  <div className="personnel-section"><h4>PCG Personnel</h4>{formData.pcgPersonnel.map((person, index) => (<div key={index} className="form-group"><input type="text" value={person} onChange={e => handleInputChange(e, 'pcgPersonnel', index)} placeholder={`Personnel ${index + 1}`} /><div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>{index === formData.pcgPersonnel.length - 1 && (<button type="button" onClick={() => addField('pcgPersonnel')}>Add Personnel</button>)}{formData.pcgPersonnel.length > 1 && (<button type="button" onClick={() => removeField('pcgPersonnel', index)}>Remove</button>)}</div></div>))}</div>
                </section>
                {/* Section 5: Narration of Events */}
                <section className={`form-section ${currentStep === 4 ? 'active' : ''}`}>
                  <h3>IV. NARRATION OF EVENTS</h3>
                  <div className="form-group"><label>Objective:</label><textarea value={formData.objective} onChange={e => handleInputChange(e, 'objective')} placeholder="State the objective" /></div>
                  <div className="form-group"><label>Summary:</label><textarea value={formData.summary} onChange={e => handleInputChange(e, 'summary')} placeholder="Provide a summary" /></div>
                  <div className="activities-section"><label>Activities:</label>{formData.activities.map((activity, index) => (<div key={index} className="activity-group"><input type="text" value={activity.title} onChange={e => handleInputChange(e, 'activities', index, 'title')} placeholder="Activity Title" /><textarea value={activity.description} onChange={e => handleInputChange(e, 'activities', index, 'description')} placeholder="Activity Description" /><div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>{index === formData.activities.length - 1 && (<button type="button" onClick={() => addField('activities')}>Add Activity</button>)}{formData.activities.length > 1 && (<button type="button" onClick={() => removeField('activities', index)}>Remove</button>)}</div></div>))}</div>
                  <div className="form-group"><label>Conclusion:</label><textarea value={formData.conclusion} onChange={e => handleInputChange(e, 'conclusion')} placeholder="State the conclusion" /></div>
                </section>
                {/* Section 6: Recommendations */}
                <section className={`form-section ${currentStep === 5 ? 'active' : ''}`}>
                  <h3>V. RECOMMENDATIONS</h3>
                  {formData.recommendations.map((rec, index) => (<div key={index} className="form-group"><textarea value={rec} onChange={e => handleInputChange(e, 'recommendations', index)} placeholder={`Recommendation ${index + 1}`} /><div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>{index === formData.recommendations.length - 1 && (<button type="button" onClick={() => addField('recommendations')}>Add Recommendation</button>)}{formData.recommendations.length > 1 && (<button type="button" onClick={() => removeField('recommendations', index)}>Remove</button>)}</div></div>))}
                </section>
                {/* Section 7: Attachments */}
                <section className={`form-section ${currentStep === 6 ? 'active' : ''}`}>
                  <h3>VI. ATTACHMENTS</h3>
                  <div className="photo-upload-section"><label className="photo-upload-label"><FontAwesomeIcon icon={faUpload} /> Upload Photos<input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} /></label><div className="photo-preview">{formData.photos.map((photo, index) => (<div key={index} className="photo-thumbnail"><img src={URL.createObjectURL(photo)} alt={`Upload ${index + 1}`} /><button type="button" onClick={() => removeField('photos', index)}><FontAwesomeIcon icon={faXmark} /></button></div>))}</div></div>
                </section>
              </div>

              <div className="section-navigation">
                <button
                  className="nav-button prev"
                  onClick={handlePrev}
                  disabled={currentStep === 0 || submitting}
                >
                  <FontAwesomeIcon icon={faArrowLeft} /> Previous
                </button>
                {currentStep === steps.length - 1 ? (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                      className="nav-button save"
                      onClick={() => handleSubmit(false)}
                      disabled={submitting}
                    >
                      Save as Draft
                    </button>
                    <button
                      className="nav-button submit"
                      onClick={() => handleSubmit(true)}
                      disabled={submitting}
                    >
                      Save & Submit
                    </button>
                    <div style={{ color: '#dc3545', fontSize: '0.9rem' }}>
                      {!steps.every((step, index) => isStepComplete(index)) && 
                        'Please complete all required fields in previous sections'}
                    </div>
                  </div>
                ) : (
                  <button
                    className="nav-button next"
                    onClick={handleNext}
                    disabled={!isStepComplete(currentStep) || submitting}
                  >
                    Next <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AssociateLayout>
  );
}

export default Reports; 
import React, { useEffect, useState, useCallback } from 'react';
import AssociateLayout from './AssociateLayout';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faArrowLeft, faArrowRight, faSave, faXmark, faSearch, faTimes, faPlus, faEdit, faCheck, faTrash, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import '../css/Reports.css';
import imageCompression from 'browser-image-compression';
import '../css/VolunteerList.css'; // Import confirm modal styles

// Helper function to format dates as "Mon xx, XXXX"
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
};

// Helper function to format datetime as "Mon XX, XXXX HH:MM AM/PM" (12-hour format)
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return 'N/A';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = hours.toString().padStart(2, '0');
  
  return `${month} ${day}, ${year} ${formattedHours}:${minutes} ${ampm}`;
};

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
    // I. REPORT HEADER
    institutionName: '',
    associateName: '',
    address: '',
    associateLogo: null,

    // II. HEADING
    forName: '',
    forPosition: '',
    date: '',
    subject: '',

    // III. EVENT DETAILS
    authorities: [''],
    dateTime: '',
    place: '',
    personnelInvolved: [''],

    // IV. NARRATION OF EVENTS I
    eventName: '',
    eventLocation: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    organizers: [''],

    // V. NARRATION OF EVENTS II
    eventOverview: '',
    participants: [''],
    trainingAgenda: '',
    keyOutcomes: [''],
    challenges: [''],
    recommendations: [''],
    conclusion: '',

    // VI. ATTACHMENTS
    photos: [],

    // VII. SIGNATORIES
    preparedBy: '',
    preparedByPosition: '',
    preparedBySignature: null,
    approvedBy: '',
    approvedByPosition: ''
  });

  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReports, setSelectedReports] = useState([]);
  const [approvalNotification, setApprovalNotification] = useState('');
  const [rejectionNotification, setRejectionNotification] = useState('');
  const [focusedFields, setFocusedFields] = useState(new Set());

  const steps = [
    'Report Header',
    'Heading',
    'Event Details',
    'Narration of Events I',
    'Narration of Events II',
    'Attachments',
    'Signatories'
  ];

  const isStepComplete = useCallback((stepIndex) => {
    switch (stepIndex) {
      case 0: // Report Header
        return !!formData.institutionName?.trim() && 
               !!formData.associateName?.trim() && 
               !!formData.address?.trim() && 
               formData.associateLogo;
      case 1: // Heading
        return !!formData.forName?.trim() && 
               !!formData.forPosition?.trim() && 
               !!formData.date?.trim() && 
               !!formData.subject?.trim();
      case 2: // Event Details
        return formData.authorities.some(auth => auth.trim()) && 
               !!formData.dateTime?.trim() &&
               !!formData.place?.trim() &&
               formData.personnelInvolved.some(p => p.trim());
      case 3: // Narration of Events I
        return !!formData.eventName?.trim() && 
               !!formData.eventLocation?.trim() && 
               !!formData.eventDate?.trim() && 
               !!formData.startTime?.trim() && 
               !!formData.endTime?.trim() && 
               formData.organizers.some(org => org.trim());
      case 4: // Narration of Events II
        return !!formData.eventOverview?.trim() && 
               formData.participants.some(p => p.name.trim()) && 
               !!formData.trainingAgenda?.trim() && 
               formData.keyOutcomes.some(ko => ko.trim()) && 
               formData.challenges.some(c => c.trim()) && 
               formData.recommendations.some(r => r.trim()) && 
               !!formData.conclusion?.trim();
      case 5: // Attachments
        return true; // Optional
      case 6: // Signatories
        return !!formData.preparedBy?.trim() && 
               !!formData.preparedByPosition?.trim() &&
               formData.preparedBySignature && 
               !!formData.approvedBy?.trim() && 
               !!formData.approvedByPosition?.trim();
      default:
        return false;
    }
  }, [formData]);

  useEffect(() => {
    fetchReports();
  }, []);

  // Check for approval/rejection notifications
  useEffect(() => {
    const checkForNotifications = () => {
      reports.forEach(report => {
        if (report.status === 'approved' && report.approved_at) {
          const approvedTime = new Date(report.approved_at).getTime();
          const now = Date.now();
          const timeDiff = now - approvedTime;
          
          // Show notification if approved within last 5 minutes
          if (timeDiff < 5 * 60 * 1000) {
            setApprovalNotification('Your report has been approved! You can now download the AOR.');
            setTimeout(() => setApprovalNotification(''), 5000);
          }
        }
        
        if (report.status === 'rejected' && report.rejected_at) {
          const rejectedTime = new Date(report.rejected_at).getTime();
          const now = Date.now();
          const timeDiff = now - rejectedTime;
          
          // Show notification if rejected within last 5 minutes
          if (timeDiff < 5 * 60 * 1000) {
            setRejectionNotification('Your report has been rejected. Please submit a new one.');
            setTimeout(() => setRejectionNotification(''), 5000);
          }
        }
      });
    };

    checkForNotifications();
    const interval = setInterval(checkForNotifications, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [reports]);
    
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
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await axios.get('http://localhost:8000/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Fetched reports:', res.data);
      
      setReports(res.data);
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

  const handleFieldFocus = (fieldName, index = null) => {
    const fieldKey = index !== null ? `${fieldName}_${index}` : fieldName;
    setFocusedFields(prev => new Set([...prev, fieldKey]));
  };

  const handleFieldBlur = (fieldName, index = null) => {
    // Keep the field in focusedFields even after blur so validation errors persist
    // This ensures the red border stays visible after the user has interacted with the field
  };

  const shouldShowValidationError = (fieldName, index = null, value) => {
    const fieldKey = index !== null ? `${fieldName}_${index}` : fieldName;
    const isFocused = focusedFields.has(fieldKey);
    const isEmpty = typeof value === 'string' ? !value?.trim() : !value;
    
    return isFocused && isEmpty;
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const addField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], 
        field === 'participants' ? {name: '', position: ''} : 
        field === 'authorities' || field === 'organizers' || field === 'keyOutcomes' || field === 'challenges' || field === 'recommendations' ? '' : ''
      ]
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
    console.log('Photo upload - selected files:', files.length, files.map(f => f.name));
    console.log('File input files:', e.target.files);
    console.log('Files length:', e.target.files.length);
    
    // Validate that we have files
    if (files.length === 0) {
      console.log('No files selected');
      return;
    }
    
    // Check if we're adding to existing photos or replacing them
    const currentPhotos = formData.photos || [];
    const newPhotos = [...currentPhotos, ...files];
    
    console.log('Current photos:', currentPhotos.length);
    console.log('New photos to add:', files.length);
    console.log('Total photos after merge:', newPhotos.length);
    console.log('All photo names:', newPhotos.map(f => f.name));
    
    setFormData(prev => ({
      ...prev,
      photos: newPhotos // Merge with existing photos
    }));
    
    // Reset the input value to allow selecting the same files again
    e.target.value = '';
  };

  const openCreateModal = () => {
    setEditingReport(null);
    setFormData({
      // I. REPORT HEADER
      institutionName: '', associateName: '', address: '', associateLogo: null,
      // II. HEADING
      forName: '', forPosition: '', date: '', subject: '',
      // III. EVENT DETAILS
      authorities: [''], dateTime: '', place: '', personnelInvolved: [''],
      // IV. NARRATION OF EVENTS I
      eventName: '', eventLocation: '', eventDate: '', startTime: '', endTime: '', organizers: [''],
      // V. NARRATION OF EVENTS II
      eventOverview: '', participants: [{name: '', position: ''}], trainingAgenda: '', keyOutcomes: [''], challenges: [''], recommendations: [''], conclusion: '',
      // VI. ATTACHMENTS
      photos: [],
      // VII. SIGNATORIES
      preparedBy: '', preparedByPosition: '', preparedBySignature: null, approvedBy: '', approvedByPosition: ''
    });
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setSuccessMessage('');
    setError('');
    setFocusedFields(new Set());
    setShowCreateModal(true);
  };

  const handleSubmit = async (shouldSubmit = false, existingReport = null) => {
    setSubmitting(true);
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
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
          // I. REPORT HEADER
          institutionName: formData.institutionName || '',
          associateName: formData.associateName || '',
          address: formData.address || '',
          associateLogo: formData.associateLogo,
          // II. HEADING
          for: formData.forName || '', // Fixed: template expects 'for' not 'forName'
          forPosition: formData.forPosition || '',
          date: formData.date || '',
          subject: formData.subject || '',
          // III. EVENT DETAILS
          authority: formData.authorities.filter(auth => auth.trim()), // Fixed: template expects 'authority' not 'authorities'
          dateTime: formData.dateTime || '',
          location: formData.place || '', // Fixed: template expects 'location' not 'place'
          activityType: formData.eventName || '', // Added: map eventName to activityType
          auxiliaryPersonnel: formData.personnelInvolved.filter(p => p.trim()), // Fixed: template expects 'auxiliaryPersonnel'
          pcgPersonnel: [], // Added: template expects this array (form doesn't collect PCG personnel separately)
          // IV. NARRATION OF EVENTS I
          eventName: formData.eventName || '',
          eventLocation: formData.eventLocation || '',
          eventDate: formData.eventDate || '',
          startTime: formData.startTime || '',
          endTime: formData.endTime || '',
          organizers: formData.organizers.filter(org => org.trim()),
          // IV. NARRATION OF EVENTS (Template expectations)
          objective: formData.trainingAgenda || '', // Map trainingAgenda to objective
          summary: formData.eventOverview || '', // Map eventOverview to summary
          activities: formData.keyOutcomes.filter(ko => ko.trim()).map(outcome => ({
            title: 'Key Outcome',
            description: outcome
          })), // Convert keyOutcomes to activities structure
          conclusion: formData.conclusion || '',
          // V. NARRATION OF EVENTS II
          participants: formData.participants.filter(p => p.name.trim()),
          trainingAgenda: formData.trainingAgenda || '',
          keyOutcomes: formData.keyOutcomes.filter(ko => ko.trim()),
          challenges: formData.challenges.filter(c => c.trim()),
          recommendations: formData.recommendations.filter(r => r.trim()),
          // VI. ATTACHMENTS
          photos: [], // Initialize empty photos array
          // VII. SIGNATORIES
          preparedBy: formData.preparedBy || '',
          preparedByPosition: formData.preparedByPosition || '',
          preparedBySignature: formData.preparedBySignature,
          approvedBy: formData.approvedBy || '',
          approvedByPosition: formData.approvedByPosition || ''
        };

        formDataToSend.append('title', formData.subject || 'Untitled Report');
        formDataToSend.append('description', formData.eventOverview || 'No summary provided');
        formDataToSend.append('status', shouldSubmit ? 'sent' : 'draft');
        formDataToSend.append('data', JSON.stringify(reportData));

        // Append logos and signatures
        if (formData.associateLogo) {
          formDataToSend.append('associateLogo', formData.associateLogo);
        }
        if (formData.preparedBySignature) {
          formDataToSend.append('preparedBySignature', formData.preparedBySignature);
        }
        if (formData.approvedBySignature) {
          formDataToSend.append('approvedBySignature', formData.approvedBySignature);
        }

        // Compress and append photos
        if (formData.photos && formData.photos.length > 0) {
          console.log('Processing photos:', formData.photos.length, 'files');
          console.log('Photo names:', formData.photos.map(f => f.name));
          for (let i = 0; i < formData.photos.length; i++) {
            const file = formData.photos[i];
            console.log(`Processing photo ${i + 1}:`, file.name, 'Size:', file.size);
            const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true });
            formDataToSend.append(`photo[${i}]`, compressed, file.name);
            console.log('Appended photo:', file.name, 'with key:', `photo[${i}]`);
          }
        } else {
          console.log('No photos to upload');
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
        
        console.log('Response received:', response.data);
        
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
      // I. REPORT HEADER
      institutionName: reportData.institutionName || report.institutionName || '',
      associateName: reportData.associateName || report.associateName || '',
      address: reportData.address || report.address || '',
      associateLogo: reportData.associateLogo || report.associateLogo,

      // II. HEADING
      forName: reportData.forName || report.forName || '',
      forPosition: reportData.forPosition || report.forPosition || '',
      date: reportData.date || report.date || '',
      subject: reportData.subject || report.subject || '',

      // III. EVENT DETAILS
      authorities: reportData.authorities || (report.authorities ? report.authorities.split(',') : ['']),
      dateTime: reportData.dateTime || report.dateTime || '',
      place: reportData.place || report.place || '',
      personnelInvolved: reportData.personnelInvolved || (report.personnelInvolved ? report.personnelInvolved.split(',') : ['']),

      // IV. NARRATION OF EVENTS I
      eventName: reportData.eventName || report.eventName || '',
      eventLocation: reportData.eventLocation || report.eventLocation || '',
      eventDate: reportData.eventDate || report.eventDate || '',
      startTime: reportData.startTime || report.startTime || '',
      endTime: reportData.endTime || report.endTime || '',
      organizers: reportData.organizers || (report.organizers ? report.organizers.split(',') : ['']),

      // V. NARRATION OF EVENTS II
      eventOverview: reportData.eventOverview || report.eventOverview || '',
      participants: reportData.participants || (report.participants ? report.participants.split(',').map(p => ({name: p.trim(), position: ''})) : [{name: '', position: ''}]),
      trainingAgenda: reportData.trainingAgenda || report.trainingAgenda || '',
      keyOutcomes: reportData.keyOutcomes || (report.keyOutcomes ? report.keyOutcomes.split(',') : ['']),
      challenges: reportData.challenges || (report.challenges ? report.challenges.split(',') : ['']),
      recommendations: reportData.recommendations || (report.recommendations ? report.recommendations.split(',') : ['']),
      conclusion: reportData.conclusion || report.conclusion || '',

      // VI. ATTACHMENTS
      photos: [],

      // VII. SIGNATORIES
      preparedBy: reportData.preparedBy || report.preparedBy || '',
      preparedByPosition: reportData.preparedByPosition || report.preparedByPosition || '',
      preparedBySignature: reportData.preparedBySignature || report.preparedBySignature,
      approvedBy: reportData.approvedBy || report.approvedBy || '',
      approvedByPosition: reportData.approvedByPosition || report.approvedByPosition || ''
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
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
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
        setFocusedFields(new Set());
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
        setError(''); // Clear any previous errors
      } else {
        // Show specific validation error for current step
        const stepName = steps[currentStep];
        setError(`Please complete all required fields in ${stepName} before proceeding.`);
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

  // Bulk delete handler
  const handleBulkDelete = () => {
    setConfirm({
      open: true,
      message: `Are you sure you want to delete ${selectedReports.length} report(s)?`,
      onConfirm: async () => {
        setConfirm({ ...confirm, open: false });
        try {
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          await Promise.all(
            selectedReports.map(id =>
              axios.delete(`http://localhost:8000/api/reports/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            )
          );
          setSelectedReports([]);
          fetchReports();
        } catch {
          setError('Failed to delete some reports');
        }
      }
    });
  };
  // Select all handler
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedReports(reports.map(r => r.id));
    } else {
      setSelectedReports([]);
    }
  };
  // Select single handler
  const handleSelectReport = (id) => {
    setSelectedReports(prev =>
      prev.includes(id)
        ? prev.filter(rid => rid !== id)
        : [...prev, id]
    );
  };

  return (
    <AssociateLayout>
      <div className="reports-container">
        {/* Approval/Rejection Notification */}
        {approvalNotification && (
          <div className="approval-notification approved">
            {approvalNotification}
          </div>
        )}
        {rejectionNotification && (
          <div className="approval-notification rejected">
            {rejectionNotification}
          </div>
        )}
        
        <div className="header-section">
          <div className="header-left">
            <h2>REPORTS</h2>
          </div>
          <div className="header-actions">
            <div className="search-bar">
              <FontAwesomeIcon icon={faSearch} />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="button-row">
              {selectedReports.length > 0 && (
                <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                  <FontAwesomeIcon icon={faTrash} /> Delete ({selectedReports.length})
                </button>
              )}
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
                </div>
              </div>
            ) : (
              <table className="reports-table">
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedReports.length === reports.length && reports.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="subject-col">SUBJECT</th>
                    <th className="date-col">DATE CREATED</th>
                    <th className="status-col">STATUS</th>
                    <th className="actions-col">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {reports
                    .filter(report => 
                      report.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      report.title?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(report => (
                      <tr 
                        key={report.id} 
                        className={selectedReports.includes(report.id) ? 'selected' : ''}
                      >
                        <td className="checkbox-col">
                          <input
                            type="checkbox"
                            checked={selectedReports.includes(report.id)}
                            onChange={() => handleSelectReport(report.id)}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        <td className="subject-cell subject-col">{report.subject || report.title}</td>
                        <td className="date-cell date-col">
                          {formatDate(report.created_at)}
                        </td>
                        <td className="status-cell status-col">
                          <span className={`status-badge ${report.status}`}>
                            {report.status === 'sent' ? 'PENDING APPROVAL' : 
                             report.status === 'approved' ? 'APPROVED' :
                             report.status === 'rejected' ? 'REJECTED' :
                             report.status?.toUpperCase() || 'DRAFT'}
                          </span>
                          {report.status === 'approved' && report.approved_at && (
                            <div className="status-detail">
                              Approved on {formatDate(report.approved_at)}
                            </div>
                          )}
                          {report.status === 'rejected' && report.rejected_at && (
                            <div className="status-detail rejected">
                              Rejected on {formatDate(report.rejected_at)}
                            </div>
                          )}
                        </td>
                        <td className="actions-cell actions-col">
                          <div className="action-buttons-row">
                            {report.status === 'draft' && (
                              <>
                                <button
                                  className="action-btn delete-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(report.id);
                                  }}
                                  title="Delete"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                                <button
                                  className="action-btn edit-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(report);
                                  }}
                                  title="Edit"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  className="action-btn send-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubmit(true, report);
                                  }}
                                  title="Send"
                                >
                                  <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                              </>
                            )}
                            {report.status !== 'draft' && (
                              <button
                                className="action-btn delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(report.id);
                                }}
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
                {currentStep === 0 && <div className="section-gradient-card-red">I. REPORT HEADER</div>}
                {currentStep === 1 && <div className="section-gradient-card-red">II. HEADING</div>}
                {currentStep === 2 && <div className="section-gradient-card-red">III. EVENT DETAILS</div>}
                {currentStep === 3 && <div className="section-gradient-card-red">IV. NARRATION OF EVENTS I</div>}
                {currentStep === 4 && <div className="section-gradient-card-red">V. NARRATION OF EVENTS II</div>}
                {currentStep === 5 && <div className="section-gradient-card-red">VI. ATTACHMENTS</div>}
                {currentStep === 6 && <div className="section-gradient-card-red">VII. SIGNATORIES</div>}
              </div>
              {/* Modal Body */}
              <div className="report-modal-body">
                <form className="report-form-grid" onSubmit={e => { e.preventDefault(); handleSubmit(true); }}>
                  {/* Step 1: Header */}
                  {currentStep === 0 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
                          <label>Institution Name:</label>
                          <input 
                            type="text" 
                            value={formData.institutionName} 
                            onChange={e => handleInputChange(e, 'institutionName')} 
                            onFocus={() => handleFieldFocus('institutionName')}
                            onBlur={() => handleFieldBlur('institutionName')}
                            placeholder="Institution Name" 
                            style={{
                              borderColor: shouldShowValidationError('institutionName', null, formData.institutionName) ? '#ef4444' : '#e2e8f0'
                            }}
                          />
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
                          <label>Address:</label>
                          <input 
                            type="text" 
                            value={formData.address} 
                            onChange={e => handleInputChange(e, 'address')} 
                            onFocus={() => handleFieldFocus('address')}
                            onBlur={() => handleFieldBlur('address')}
                            placeholder="Address" 
                            style={{
                              borderColor: shouldShowValidationError('address', null, formData.address) ? '#ef4444' : '#e2e8f0'
                            }}
                          />
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 3'}}>
                          <label>Associate Name:</label>
                          <input 
                            type="text" 
                            value={formData.associateName} 
                            onChange={e => handleInputChange(e, 'associateName')} 
                            onFocus={() => handleFieldFocus('associateName')}
                            onBlur={() => handleFieldBlur('associateName')}
                            placeholder="Associate Name" 
                            style={{
                              borderColor: shouldShowValidationError('associateName', null, formData.associateName) ? '#ef4444' : '#e2e8f0'
                            }}
                          />
                        </div>
                        <div className="report-form-group" style={{gridColumn: '4 / span 1'}}>
                          <label>Associate Logo:</label>
                          <input 
                            id="associateLogoInput"
                            type="file" 
                            accept="image/*" 
                            onChange={e => handleFileUpload(e, 'associateLogo')} 
                            style={{ display: 'none' }} 
                          />
                          <button 
                            type="button" 
                            onClick={() => document.getElementById('associateLogoInput').click()}
                            style={{
                              background: formData.associateLogo ? 'linear-gradient(to right, #10b981, #3b82f6)' : '#e2e8f0',
                              color: formData.associateLogo ? 'white' : '#666',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: 'none',
                              width: '100%',
                              textAlign: 'left',
                              boxShadow: formData.associateLogo ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
                            }}
                          >
                            <FontAwesomeIcon icon={faUpload} style={{marginRight: '8px'}} />
                            {formData.associateLogo ? `Selected: ${formData.associateLogo.name}` : 'No Uploaded Image'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {/* Step 2: Heading */}
                  {currentStep === 1 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
                          <label>RECIPIENT/FOR: <span style={{color: '#ef4444'}}>*</span></label>
                          <div style={{
                            display: 'flex', 
                            gap: '0.5rem', 
                            alignItems: 'center', 
                            width: '100%',
                            minWidth: 0
                          }}>
                          <input 
                            type="text" 
                            value={formData.forName} 
                            onChange={e => handleInputChange(e, 'forName')} 
                              onFocus={() => handleFieldFocus('forName')}
                              onBlur={() => handleFieldBlur('forName')}
                            placeholder="Recipient Name" 
                            style={{
                                flex: 2,
                                minWidth: 0,
                                borderColor: shouldShowValidationError('forName', null, formData.forName) ? '#ef4444' : '#e2e8f0'
                            }}
                          />
                          <input 
                            type="text" 
                            value={formData.forPosition} 
                            onChange={e => handleInputChange(e, 'forPosition')} 
                              onFocus={() => handleFieldFocus('forPosition')}
                              onBlur={() => handleFieldBlur('forPosition')}
                            placeholder="Position" 
                            style={{
                                flex: 1,
                                minWidth: 0,
                                borderColor: shouldShowValidationError('forPosition', null, formData.forPosition) ? '#ef4444' : '#e2e8f0'
                            }}
                          />
                        </div>
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 1'}}>
                          <label>DATE: <span style={{color: '#ef4444'}}>*</span></label>
                          <input 
                            type="date" 
                            value={formData.date} 
                            onChange={e => handleInputChange(e, 'date')} 
                            onFocus={() => handleFieldFocus('date')}
                            onBlur={() => handleFieldBlur('date')}
                            style={{
                              borderColor: shouldShowValidationError('date', null, formData.date) ? '#ef4444' : '#e2e8f0'
                            }}
                          />
                        </div>
                        <div className="report-form-group" style={{gridColumn: '2 / span 3'}}>
                          <label>SUBJECT: <span style={{color: '#ef4444'}}>*</span></label>
                          <input 
                            type="text" 
                            value={formData.subject} 
                            onChange={e => handleInputChange(e, 'subject')} 
                            onFocus={() => handleFieldFocus('subject')}
                            onBlur={() => handleFieldBlur('subject')}
                            placeholder="Report Subject" 
                            style={{
                              borderColor: shouldShowValidationError('subject', null, formData.subject) ? '#ef4444' : '#e2e8f0'
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {/* Step 3: Event Details */}
                  {currentStep === 2 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 1'}}>
                          <label>Date and Time:</label>
                          <input type="datetime-local" value={formData.dateTime} onChange={e => handleInputChange(e, 'dateTime')} />
                        </div>
                        <div className="report-form-group" style={{gridColumn: '2 / span 3'}}>
                          <label>Place:</label>
                          <input type="text" value={formData.place} onChange={e => handleInputChange(e, 'place')} placeholder="Place of Activity" />
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 2'}}>
                          <label>Authority:</label>
                          {formData.authorities.map((auth, index) => (
                            <div key={index} style={{
                              display: 'flex', 
                              gap: '0.5rem', 
                              alignItems: 'center', 
                              marginBottom: 8,
                              width: '100%',
                              minWidth: 0
                            }}>
                              <input type="text" value={auth} onChange={e => handleInputChange(e, 'authorities', index)} placeholder={`Authority ${index + 1}`} style={{flex: 1, minWidth: 0}} />
                              {index === formData.authorities.length - 1 && (
                                <button type="button" onClick={() => addField('authorities')} style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}>+</button>
                              )}
                              {formData.authorities.length > 1 && (
                                <button type="button" onClick={() => removeField('authorities', index)} style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}>×</button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="report-form-group" style={{gridColumn: '3 / span 2'}}>
                          <label>Personnel Involved:</label>
                          {formData.personnelInvolved.map((person, index) => (
                            <div key={index} style={{
                              display: 'flex', 
                              gap: '0.5rem', 
                              alignItems: 'center', 
                              marginBottom: 8,
                              width: '100%',
                              minWidth: 0
                            }}>
                              <input type="text" value={person} onChange={e => handleInputChange(e, 'personnelInvolved', index)} placeholder={`Personnel ${index + 1}`} style={{flex: 1, minWidth: 0}} />
                              {index === formData.personnelInvolved.length - 1 && (
                                <button type="button" onClick={() => addField('personnelInvolved')} style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}>+</button>
                              )}
                              {formData.personnelInvolved.length > 1 && (
                                <button type="button" onClick={() => removeField('personnelInvolved', index)} style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}>×</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {/* Step 4: Narration of Events I */}
                  {currentStep === 3 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 2'}}>
                          <label>Event Name:</label>
                          <input type="text" value={formData.eventName} onChange={e => handleInputChange(e, 'eventName')} placeholder="Event Name" />
                        </div>
                        <div className="report-form-group" style={{gridColumn: '3 / span 2'}}>
                          <label>Location:</label>
                          <input type="text" value={formData.eventLocation} onChange={e => handleInputChange(e, 'eventLocation')} placeholder="Location" />
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 1'}}>
                          <label>Date:</label>
                          <input type="date" value={formData.eventDate} onChange={e => handleInputChange(e, 'eventDate')} />
                        </div>
                        <div className="report-form-group" style={{gridColumn: '2 / span 1'}}>
                          <label>Start Time:</label>
                          <input type="time" value={formData.startTime} onChange={e => handleInputChange(e, 'startTime')} />
                        </div>
                        <div className="report-form-group" style={{gridColumn: '3 / span 1'}}>
                          <label>End Time:</label>
                          <input type="time" value={formData.endTime} onChange={e => handleInputChange(e, 'endTime')} />
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
                          <label>Organizers:</label>
                          {formData.organizers.map((org, index) => (
                            <div key={index} style={{
                              display: 'flex', 
                              gap: '0.5rem', 
                              alignItems: 'center', 
                              marginBottom: 8,
                              width: '100%',
                              minWidth: 0
                            }}>
                              <input type="text" value={org} onChange={e => handleInputChange(e, 'organizers', index)} placeholder={`Organizer ${index + 1}`} style={{flex: 1, minWidth: 0}} />
                              {index === formData.organizers.length - 1 && (
                                <button type="button" onClick={() => addField('organizers')} style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}>+</button>
                              )}
                              {formData.organizers.length > 1 && (
                                <button type="button" onClick={() => removeField('organizers', index)} style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}>×</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {/* Step 5: Narration of Events II */}
                  {currentStep === 4 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
                          <label>Event Overview:</label>
                          <textarea 
                            value={formData.eventOverview} 
                            onChange={e => handleInputChange(e, 'eventOverview')} 
                            onFocus={() => handleFieldFocus('eventOverview')}
                            onBlur={() => handleFieldBlur('eventOverview')}
                            placeholder="Provide an overview of the event" 
                            style={{
                              minHeight: '120px',
                              borderColor: shouldShowValidationError('eventOverview', null, formData.eventOverview) ? '#ef4444' : '#e2e8f0'
                            }} 
                          />
                        </div>
                        </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
                          <label>Training Agenda:</label>
                          <textarea 
                            value={formData.trainingAgenda} 
                            onChange={e => handleInputChange(e, 'trainingAgenda')} 
                            onFocus={() => handleFieldFocus('trainingAgenda')}
                            onBlur={() => handleFieldBlur('trainingAgenda')}
                            placeholder="Outline of the training agenda" 
                            style={{
                              minHeight: '120px',
                              borderColor: shouldShowValidationError('trainingAgenda', null, formData.trainingAgenda) ? '#ef4444' : '#e2e8f0'
                            }} 
                          />
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
                          <label>Participants:</label>
                          {formData.participants.map((part, index) => (
                            <div key={index} style={{
                              display: 'flex', 
                              gap: '0.5rem', 
                              alignItems: 'center', 
                              marginBottom: 8,
                              width: '100%',
                              minWidth: 0
                            }}>
                              <input 
                                type="text" 
                                value={part.name || ''} 
                                onChange={e => handleInputChange(e, 'participants', index, 'name')} 
                                onFocus={() => handleFieldFocus('participants', index)}
                                onBlur={() => handleFieldBlur('participants', index)}
                                placeholder={`Participant ${index + 1} Name`} 
                                style={{
                                  flex: 2, 
                                  minWidth: 0,
                                  borderColor: shouldShowValidationError('participants', index, part.name) ? '#ef4444' : '#e2e8f0'
                                }} 
                              />
                              <input 
                                type="text" 
                                value={part.position || ''} 
                                onChange={e => handleInputChange(e, 'participants', index, 'position')} 
                                placeholder={`Position (Optional)`} 
                                style={{
                                  flex: 1, 
                                  minWidth: 0
                                }} 
                              />
                              {index === formData.participants.length - 1 && (
                                <button type="button" onClick={() => addField('participants')} style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}>+</button>
                              )}
                              {formData.participants.length > 1 && (
                                <button type="button" onClick={() => removeField('participants', index)} style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}>×</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>                      
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 2'}}>
                          <label>Key Outcomes:</label>
                          {formData.keyOutcomes.map((ko, index) => (
                            <div key={index} style={{
                              display: 'flex', 
                              gap: '0.5rem', 
                              alignItems: 'center', 
                              marginBottom: 8,
                              width: '100%',
                              minWidth: 0
                            }}>
                              <textarea value={ko} onChange={e => handleInputChange(e, 'keyOutcomes', index)} placeholder={`Outcome ${index + 1}`} style={{flex: 1, minWidth: 0, minHeight: '120px'}} />

                              {formData.keyOutcomes.length > 1 && (
                                <button type="button" onClick={() => removeField('keyOutcomes', index)} style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}>×</button>
                              )}
                        </div>
                          ))}
                        </div>
                        <div className="report-form-group" style={{gridColumn: '3 / span 2'}}>
                          <label>Challenges:</label>
                          {formData.challenges.map((challenge, index) => (
                            <div key={index} style={{
                              display: 'flex', 
                              gap: '0.5rem', 
                              alignItems: 'center', 
                              marginBottom: 8,
                              width: '100%',
                              minWidth: 0
                            }}>
                              <textarea value={challenge} onChange={e => handleInputChange(e, 'challenges', index)} placeholder={`Challenge ${index + 1}`} style={{flex: 1, minWidth: 0, minHeight: '120px'}} />

                              {formData.challenges.length > 1 && (
                                <button type="button" onClick={() => removeField('challenges', index)} style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}>×</button>
                              )}
                        </div>
                          ))}
                        </div>
                        </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
                          <label>Recommendations:</label>
                          {formData.recommendations.map((rec, index) => (
                            <div key={index} style={{
                              display: 'flex', 
                              gap: '0.5rem', 
                              alignItems: 'flex-start', 
                              marginBottom: 8,
                              width: '100%',
                              minWidth: 0
                            }}>
                              <textarea value={rec} onChange={e => handleInputChange(e, 'recommendations', index)} placeholder={`Recommendation ${index + 1}`} style={{flex: 1, minWidth: 0, minHeight: '120px'}} />

                              {formData.recommendations.length > 1 && (
                                <button type="button" onClick={() => removeField('recommendations', index)} style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                                  transition: 'all 0.2s',
                                  flexShrink: 0,
                                  marginTop: '8px'
                                }}>×</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
                          <label>Conclusion:</label>
                          <textarea 
                            value={formData.conclusion} 
                            onChange={e => handleInputChange(e, 'conclusion')} 
                            onFocus={() => handleFieldFocus('conclusion')}
                            onBlur={() => handleFieldBlur('conclusion')}
                            placeholder="State the conclusion" 
                            style={{
                              minHeight: '120px',
                              borderColor: shouldShowValidationError('conclusion', null, formData.conclusion) ? '#ef4444' : '#e2e8f0'
                            }} 
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 6: Attachments */}
                  {currentStep === 5 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{ gridColumn: '1 / span 4' }}>
                          <label>Attach photos of the event</label>
                          <div className="photo-upload-section">
                            <label className="photo-upload-label">
                              <FontAwesomeIcon icon={faUpload} /> Upload Photos
                              <input 
                                key={`photo-input-${Date.now()}`}
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={handlePhotoUpload} 
                                style={{ display: 'none' }} 
                              />
                            </label>
                            <div style={{marginTop: '5px', fontSize: '11px', color: '#666', fontStyle: 'italic'}}>
                              💡 Tip: Hold Ctrl (or Cmd on Mac) to select multiple photos at once
                            </div>
                            <div style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
                              Selected: {formData.photos.length} photo(s)
                              {formData.photos.length > 0 && (
                                  <button 
                                    type="button" 
                                    onClick={() => setFormData(prev => ({ ...prev, photos: [] }))}
                                    style={{
                                      marginLeft: '10px',
                                      padding: '2px 8px',
                                      fontSize: '10px',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Clear All
                                  </button>
                              )}
                            </div>
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
                  {/* Step 7: Signatories */}
                  {currentStep === 6 && (
                    <>
                      <div className="report-form-row" style={{display: 'flex', gap: '1rem'}}>
                        <div className="report-form-group" style={{flex: 3, minWidth: 0}}>
                          <label>PREPARED BY:</label>
                          <div style={{
                            display: 'flex', 
                            gap: '0.5rem', 
                            alignItems: 'center', 
                            width: '100%',
                            minWidth: 0
                          }}>
                          <input 
                            type="text" 
                            value={formData.preparedBy} 
                            onChange={e => handleInputChange(e, 'preparedBy')} 
                              onFocus={() => handleFieldFocus('preparedBy')}
                              onBlur={() => handleFieldBlur('preparedBy')}
                            placeholder="Name of person who prepared the report" 
                            style={{
                                flex: 2,
                                minWidth: 0,
                                borderColor: shouldShowValidationError('preparedBy', null, formData.preparedBy) ? '#ef4444' : '#e2e8f0'
                              }}
                            />
                            <input 
                              type="text" 
                              value={formData.preparedByPosition} 
                              onChange={e => handleInputChange(e, 'preparedByPosition')} 
                              onFocus={() => handleFieldFocus('preparedByPosition')}
                              onBlur={() => handleFieldBlur('preparedByPosition')}
                              placeholder="Position" 
                              style={{
                                flex: 1,
                                minWidth: 0,
                                borderColor: shouldShowValidationError('preparedByPosition', null, formData.preparedByPosition) ? '#ef4444' : '#e2e8f0'
                            }}
                          />
                        </div>
                        </div>
                        <div className="report-form-group" style={{flex: 1, minWidth: 0}}>
                          <label>E-SIGNATURE:</label>
                          <input 
                            id="preparedBySignatureInput"
                            type="file" 
                            accept="image/*" 
                            onChange={e => handleFileUpload(e, 'preparedBySignature')} 
                            style={{ display: 'none' }} 
                          />
                          <button 
                            type="button" 
                            onClick={() => document.getElementById('preparedBySignatureInput').click()}
                            style={{
                              background: formData.preparedBySignature ? 'linear-gradient(to right, #10b981, #3b82f6)' : '#e2e8f0',
                              color: formData.preparedBySignature ? 'white' : '#666',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: 'none',
                              width: '100%',
                              textAlign: 'left',
                              boxShadow: formData.preparedBySignature ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
                            }}
                          >
                            {formData.preparedBySignature ? '✓' : 'Upload'}
                            <FontAwesomeIcon icon={faUpload} style={{marginLeft: '4px'}} />
                          </button>
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
                          <label>APPROVED BY:</label>
                          <div style={{
                            display: 'flex', 
                            gap: '0.5rem', 
                            alignItems: 'center', 
                            width: '100%',
                            minWidth: 0
                          }}>
                          <input 
                            type="text" 
                            value={formData.approvedBy} 
                            onChange={e => handleInputChange(e, 'approvedBy')} 
                              onFocus={() => handleFieldFocus('approvedBy')}
                              onBlur={() => handleFieldBlur('approvedBy')}
                            placeholder="Name of person who approved the report" 
                            style={{
                                flex: 1,
                                minWidth: 0,
                                borderColor: shouldShowValidationError('approvedBy', null, formData.approvedBy) ? '#ef4444' : '#e2e8f0'
                              }}
                            />
                            <input 
                              type="text" 
                              value={formData.approvedByPosition} 
                              onChange={e => handleInputChange(e, 'approvedByPosition')} 
                              onFocus={() => handleFieldFocus('approvedByPosition')}
                              onBlur={() => handleFieldBlur('approvedByPosition')}
                              placeholder="Position" 
                              style={{
                                flex: 1,
                                minWidth: 0,
                                borderColor: shouldShowValidationError('approvedByPosition', null, formData.approvedByPosition) ? '#ef4444' : '#e2e8f0'
                              }}
                            />
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
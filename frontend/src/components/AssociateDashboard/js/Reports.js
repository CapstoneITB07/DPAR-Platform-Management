import React, { useEffect, useState, useCallback } from 'react';
import AssociateLayout from './AssociateLayout';
import axios from '../../../utils/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faSave, faXmark, faSearch, faTimes, faPlus, faEdit, faCheck, faTrash, faPaperPlane, faEye, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import '../css/Reports.css';
import imageCompression from 'browser-image-compression';
import '../css/VolunteerList.css'; // Import confirm modal styles

import { API_BASE } from '../../../utils/url';

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

// Helper function to format datetime for footer as "Mon XX, XXXX at HH:MM AM/PM"
const formatDateTimeFooter = (dateTimeString) => {
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
  
  return `${month} ${day}, ${year} at ${formattedHours}:${minutes} ${ampm}`;
};

// Helper function to format time as "HH:MM AM/PM" (12-hour format)
const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  
  // Handle both "HH:MM" and "HH:MM:SS" formats
  const timeParts = timeString.split(':');
  if (timeParts.length < 2) return timeString;
  
  let hours = parseInt(timeParts[0]);
  const minutes = timeParts[1];
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = hours.toString().padStart(2, '0');
  
  return `${formattedHours}:${minutes} ${ampm}`;
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
    forName: 'Aux. Lt. Michael G. Caparas',
    forPosition: 'DPARVC Founder',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    authorities: [''],
    dateTime: '',
    place: '',
    personnelInvolved: [''],
    eventName: '',
    eventLocation: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    organizers: [''],
    eventOverview: '',
    participants: [{name: '', position: ''}],
    trainingAgenda: '',
    keyOutcomes: [''],
    challenges: [''],
    recommendations: [''],
    conclusion: '',
    photos: [],
    preparedBy: '',
    preparedByPosition: '',
    preparedBySignature: null,
    approvedBy: 'Aux. Lt. Michael G. Caparas',
    approvedByPosition: 'DPARVC Founder'
  });

  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReports, setSelectedReports] = useState([]);
  const [approvalNotification, setApprovalNotification] = useState('');
  const [rejectionNotification, setRejectionNotification] = useState('');
  const [focusedFields, setFocusedFields] = useState(new Set());
  const [existingPhotoPaths, setExistingPhotoPaths] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [dateTimeErrors, setDateTimeErrors] = useState({
    eventDate: '',
    startTime: '',
    endTime: ''
  });

  const steps = [
    'Heading',
    'Event Details',
    'Narration of Events I',
    'Narration of Events II',
    'Attachments',
    'Signatories'
  ];

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}. ${day}, ${year}`;
  };

  const isStepComplete = useCallback((stepIndex) => {
    switch (stepIndex) {
      case 0: // Heading
        // forName, forPosition, and date are now static/auto-filled, so only check subject
        return !!formData.subject?.trim();
      case 1: // Event Details
        return (formData.authorities && formData.authorities.some(auth => auth?.trim())) && 
               !!formData.place?.trim();
      case 2: // Narration of Events I
        return !!formData.eventName?.trim() && 
               !!formData.eventLocation?.trim() && 
               !!formData.eventDate?.trim() && 
               !!formData.startTime?.trim() && 
               !!formData.endTime?.trim() && 
               (formData.organizers && formData.organizers.some(org => org?.trim())) &&
               !dateTimeErrors.eventDate && 
               !dateTimeErrors.startTime && 
               !dateTimeErrors.endTime;
      case 3: // Narration of Events II
        return !!formData.eventOverview?.trim() && 
               formData.participants?.some(p => p.name?.trim()) && 
               !!formData.trainingAgenda?.trim() && 
               (formData.keyOutcomes && formData.keyOutcomes.some(ko => ko?.trim())) && 
               (formData.challenges && formData.challenges.some(c => c?.trim())) && 
               !!formData.conclusion?.trim();
      case 4: // Attachments
        return true; // Optional
      case 5: // Signatories
        return formData.preparedBy?.trim() && formData.preparedByPosition?.trim() && (formData.preparedBySignature instanceof File || formData.preparedBySignature);
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
            setRejectionNotification('Your report has been rejected. Please check the rejection details and submit a new one.');
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
      const res = await axios.get(`${API_BASE}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Fetched reports:', res.data);
      
      setReports(res.data);
    } catch (err) {
      showError('Failed to load reports');
    }
    setLoading(false);
  };

  const handleInputChange = (e, field, index = null, subfield = null) => {
    // Handle file inputs differently
    let value;
    if (e.target.type === 'file') {
      value = e.target.files[0] || null; // Get the actual file object, not the path
    } else {
      value = e.target.value;
    }
    
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

    // Validate date and time fields
    if (field === 'eventDate' || field === 'startTime' || field === 'endTime') {
      validateDateTimeFields(field, value);
    }
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
        // For photos, we need to handle both existing and new photos
        const photoToRemove = prev[field][index];
        if (photoToRemove.isExisting) {
          // If removing an existing photo, find and remove it from existingPhotoPaths by URL
          setExistingPhotoPaths(prevPaths => {
            // Find the photo path that corresponds to this photo URL
            const photoPath = prevPaths.find(path => {
              const photoUrl = `${API_BASE}/storage/` + path;
              return photoUrl === photoToRemove.url;
            });
            if (photoPath) {
              return prevPaths.filter(path => path !== photoPath);
            }
            return prevPaths;
          });
        }
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
    setExistingPhotoPaths([]);
    setFormData({
      forName: 'Aux. Lt. Michael G. Caparas', forPosition: 'DPARVC Founder', date: new Date().toISOString().split('T')[0], subject: '',
      authorities: [''], dateTime: '', place: '', personnelInvolved: [''],
      eventName: '', eventLocation: '', eventDate: '', startTime: '', endTime: '', organizers: [''],
      eventOverview: '', participants: [{name: '', position: ''}], trainingAgenda: '', keyOutcomes: [''], challenges: [''], recommendations: [''], conclusion: '',
      photos: [],
      preparedBy: '', preparedByPosition: '', preparedBySignature: null, approvedBy: 'Aux. Lt. Michael G. Caparas', approvedByPosition: 'DPARVC Founder'
    });
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setSuccessMessage('');
    setError('');
    setFocusedFields(new Set());
    setDateTimeErrors({ eventDate: '', startTime: '', endTime: '' });
    setShowCreateModal(true);
  };

  const handleSubmit = async (shouldSubmit = false, existingReport = null) => {
    if (shouldSubmit) {
      setSubmitting(true);
    } else {
      setDrafting(true);
    }
    setSuccessMessage('');
    
    // Declare reportData at the top so it's available throughout the function
    let reportData = {};
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        showError('Authentication token not found. Please log in again.');
        if (shouldSubmit) {
          setSubmitting(false);
        } else {
          setDrafting(false);
        }
        return;
      }

      // Debug: Show current user organization (remove in production)
      const currentUserOrg = localStorage.getItem('userOrganization');
      // console.log('Current user organization:', currentUserOrg);
      // console.log('User ID:', localStorage.getItem('userId'));
      // console.log('User role:', localStorage.getItem('userRole'));

      if (existingReport) {
        // Simple status update for draft submission
        const response = await axios.put(
          `${API_BASE}/api/reports/${existingReport.id}`,
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
            showError(`Please fill in all required fields in: ${incompleteSteps.join(', ')}`);
            if (shouldSubmit) {
              setSubmitting(false);
            } else {
              setDrafting(false);
            }
            return;
          }
        }

        // Check if FormData is supported
        if (typeof FormData === 'undefined') {
          showError('FormData is not supported in this browser. Please update your browser.');
          if (shouldSubmit) {
            setSubmitting(false);
          } else {
            setDrafting(false);
          }
          return;
        }

        const formDataToSend = new FormData();
        console.log('FormData created:', formDataToSend);
        console.log('FormData constructor:', FormData);
        console.log('FormData prototype:', FormData.prototype);
        
        // Test FormData.append
        try {
          formDataToSend.append('test', 'test_value');
          console.log('FormData.append test successful');
        } catch (error) {
          console.error('FormData.append test failed:', error);
          showError('FormData.append is not working. Please check browser compatibility.');
          if (shouldSubmit) {
            setSubmitting(false);
          } else {
            setDrafting(false);
          }
          return;
        }
        
        // Prepare the report data - ensure 1:1 mapping with creation form fields
        reportData = {
          // Fixed header information - automatically set
          institutionName: 'Disaster Preparedness And Response Volunteers Coalition of Laguna',
          address: 'Blk 63 Lot 21 Aventine Hills BF Resort Village, Las Pinas City',
          
          // Form data - exact 1:1 mapping with creation form
          for: formData.forName || '',
          forPosition: formData.forPosition || '',
          date: formData.date || '',
          subject: formData.subject || '',
          authorities: formData.authorities.filter(auth => auth.trim()),
          dateTime: formData.dateTime || '',
          place: formData.place || '',
          personnelInvolved: formData.personnelInvolved.filter(p => p.trim()),
          eventName: formData.eventName || '',
          eventLocation: formData.eventLocation || '',
          eventDate: formData.eventDate || '',
          startTime: formData.startTime || '',
          endTime: formData.endTime || '',
          organizers: formData.organizers.filter(org => org.trim()),
          trainingAgenda: formData.trainingAgenda || '',
          eventOverview: formData.eventOverview || '',
          participants: formData.participants.filter(p => p.name.trim()),
          keyOutcomes: formData.keyOutcomes.filter(ko => ko.trim()),
          challenges: formData.challenges.filter(c => c.trim()),
          recommendations: formData.recommendations.filter(r => r.trim()),
          conclusion: formData.conclusion || '',
          photos: editingReport && editingReport.data ? (editingReport.data.photos || []) : [],
          preparedBy: formData.preparedBy || '',
          preparedByPosition: formData.preparedByPosition || '',
          approvedBy: formData.approvedBy || '',
          approvedByPosition: formData.approvedByPosition || ''
        };

        // If editing a report, preserve existing photos and add new ones
        if (editingReport && editingReport.data && editingReport.data.photos) {
          const newPhotos = formData.photos.filter(photo => !photo.isExisting);
          
          // Keep existing photo paths and add new photo paths (will be filled by backend)
          reportData.photos = [...existingPhotoPaths];
          
          console.log('Preserving existing photos:', existingPhotoPaths);
          console.log('New photos to upload:', newPhotos.length);
        }

        // Ensure we have valid values for required fields
        const title = formData.subject?.trim() || 'Untitled Report';
        const description = formData.eventOverview?.trim() || 'No summary provided';
        const status = shouldSubmit ? 'sent' : 'draft';
        
        // Additional validation for time fields
        if (shouldSubmit) {
          if (formData.startTime && formData.endTime) {
            const startTime = new Date(`2000-01-01 ${formData.startTime}`);
            const endTime = new Date(`2000-01-01 ${formData.endTime}`);
            if (startTime >= endTime) {
              showError('The end time should be after the start time. Please check your time entries.');
              if (shouldSubmit) {
                setSubmitting(false);
              } else {
                setDrafting(false);
              }
              return;
            }
          }
        }

        // Debug: Check if required fields are empty
        if (shouldSubmit) {
          console.log('=== VALIDATION CHECK ===');
          console.log('subject:', formData.subject, 'Empty:', !formData.subject?.trim());
          console.log('place:', formData.place, 'Empty:', !formData.place?.trim());
          console.log('eventOverview:', formData.eventOverview, 'Empty:', !formData.eventOverview?.trim());
          console.log('preparedBy:', formData.preparedBy, 'Empty:', !formData.preparedBy?.trim());
          console.log('preparedByPosition:', formData.preparedByPosition, 'Empty:', !formData.preparedByPosition?.trim());
          console.log('=======================');
        }

        console.log('About to append title:', title);
        try {
          formDataToSend.append('title', title);
          console.log('Title appended successfully');
        } catch (error) {
          console.error('Failed to append title:', error);
          showError('Failed to append title to FormData: ' + error.message);
          if (shouldSubmit) {
            setSubmitting(false);
          } else {
            setDrafting(false);
          }
          return;
        }

        console.log('About to append description:', description);
        try {
          formDataToSend.append('description', description);
          console.log('Description appended successfully');
        } catch (error) {
          console.error('Failed to append description:', error);
          showError('Failed to append description to FormData: ' + error.message);
          if (shouldSubmit) {
            setSubmitting(false);
          } else {
            setDrafting(false);
          }
          return;
        }

        console.log('About to append status:', status);
        try {
          formDataToSend.append('status', status);
          console.log('Status appended successfully');
        } catch (error) {
          console.error('Failed to append status:', error);
          showError('Failed to append status to FormData: ' + error.message);
          if (shouldSubmit) {
            setSubmitting(false);
          } else {
            setDrafting(false);
          }
          return;
        }

        console.log('About to append data:', JSON.stringify(reportData));
        try {
        formDataToSend.append('data', JSON.stringify(reportData));
          console.log('Data appended successfully');
        } catch (error) {
          console.error('Failed to append data:', error);
          showError('Failed to append data to FormData: ' + error.message);
          if (shouldSubmit) {
            setSubmitting(false);
          } else {
            setDrafting(false);
          }
          return;
        }

        // Debug: Log what's being sent
        console.log('FormData being sent:');
        console.log('Title:', title);
        console.log('Description:', description);
        console.log('Status:', status);
        console.log('Form data subject:', formData.subject);
        console.log('Form data eventOverview:', formData.eventOverview);
        console.log('Form data place:', formData.place);
        console.log('Form data preparedBy:', formData.preparedBy);
        console.log('Form data preparedByPosition:', formData.preparedByPosition);
        console.log('Report data keys:', Object.keys(reportData));
        console.log('Report data location:', reportData.location);
        console.log('Report data place:', reportData.place);
        console.log('Report data eventOverview:', reportData.eventOverview);
        console.log('Report data preparedBy:', reportData.preparedBy);
        console.log('Report data:', reportData);
        console.log('Is draft save:', !shouldSubmit);
        console.log('Form data place value:', formData.place);
        console.log('Form data place length:', formData.place?.length);
        console.log('Form data place trimmed:', formData.place?.trim());
        console.log('Form data place empty check:', !formData.place?.trim());
        console.log('Report data photos before photo processing:', reportData.photos);

        // Debug: Log FormData contents
        for (let [key, value] of formDataToSend.entries()) {
          console.log(`FormData key: ${key}, value:`, value);
        }

        // Append signatures
        if (formData.preparedBySignature && formData.preparedBySignature instanceof File) {
          formDataToSend.append('preparedBySignature', formData.preparedBySignature);
        }

        // Compress and append photos
        if (formData.photos && formData.photos.length > 0) {
          console.log('Processing photos:', formData.photos.length, 'files');
          
          // Separate existing and new photos
          const existingPhotos = formData.photos.filter(photo => photo.isExisting);
          const newPhotos = formData.photos.filter(photo => !photo.isExisting);
          
          console.log(`Found ${existingPhotos.length} existing photos and ${newPhotos.length} new photos`);
          
          // Update reportData.photos to include both existing and new photos
          if (editingReport && editingReport.data && editingReport.data.photos) {
            // For editing, preserve existing photos and add placeholders for new ones
            reportData.photos = [...existingPhotoPaths];
            // Add placeholders for new photos (will be filled by backend)
            for (let i = 0; i < newPhotos.length; i++) {
              reportData.photos.push(`new_photo_${i}`); // Placeholder that backend will replace
            }
          } else {
            // For new reports, initialize empty array
            reportData.photos = [];
          }
          
          let photoIndex = 0;
          for (let i = 0; i < newPhotos.length; i++) {
            const photo = newPhotos[i];
            console.log(`Processing new photo: ${photo.name}, Size: ${photo.size}, Type: ${photo.type}`);
            
            try {
              const compressed = await imageCompression(photo, { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true });
              formDataToSend.append(`photo[${photoIndex}]`, compressed, photo.name);
              console.log('Appended new photo:', photo.name, 'with key:', `photo[${photoIndex}]`);
              photoIndex++;
            } catch (compressionError) {
              console.error('Error compressing photo:', compressionError);
              // Fallback: append original photo without compression
              formDataToSend.append(`photo[${photoIndex}]`, photo, photo.name);
              console.log('Appended uncompressed photo:', photo.name, 'with key:', `photo[${photoIndex}]`);
              photoIndex++;
            }
          }
          
          if (existingPhotos.length > 0) {
            console.log('Existing photos will be preserved in reportData.photos:', existingPhotos.map(p => p.name));
          }
          
          console.log('Final reportData.photos after processing:', reportData.photos);
        } else {
          console.log('No photos to upload');
        }

        // Append associate logo
        if (formData.associateLogo && formData.associateLogo instanceof File) {
          formDataToSend.append('associateLogo', formData.associateLogo);
        }

        const url = editingReport 
          ? `${API_BASE}/api/reports/${editingReport.id}`
          : `${API_BASE}/api/reports`;
        
        // For editing reports, use POST with _method=PUT to avoid FormData issues in PUT requests
        const method = editingReport ? 'post' : 'post';
        
        // If editing, add the _method field to simulate PUT
        if (editingReport) {
          formDataToSend.append('_method', 'PUT');
        }
        
        console.log('Making request to:', url);
        console.log('Request method:', method);
        console.log('_method field:', editingReport ? 'PUT' : 'N/A');
        console.log('Request headers:', {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        });
        
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
        
        // Response received logged for debugging (remove in production)
        
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
        console.error('Response headers:', err.response.headers);
        
        // Show more detailed error message
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Server error: ' + err.response.status;
        showError(`Failed to create report: ${errorMessage}`);
        
        // Log the request data for debugging
        console.error('Request data that failed:', {
          formData,
          reportData: reportData || 'No report data available'
        });
      } else if (err.request) {
        console.error('No response received:', err.request);
        showError('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', err.message);
        showError('Error preparing request: ' + err.message);
      }
    }
    if (shouldSubmit) {
      setSubmitting(false);
    } else {
      setDrafting(false);
    }
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

    // Debug: Log what's being loaded
    console.log('Editing report:', report);
    console.log('Parsed report data:', reportData);
    console.log('Report subject:', report.subject);
    console.log('ReportData subject:', reportData.subject);

    // Convert photo URLs to photo objects for display
    let existingPhotos = [];
    if (report.photo_urls && report.photo_urls.length > 0) {
      existingPhotos = report.photo_urls.map((url, index) => ({
        url: url,
        name: `Photo ${index + 1}`,
        isExisting: true
      }));
    }

    // Set existing photo paths for preservation during updates
    if (report.data && report.data.photos) {
      setExistingPhotoPaths(report.data.photos);
      console.log('Setting existing photo paths:', report.data.photos);
    } else {
      setExistingPhotoPaths([]);
      console.log('No existing photo paths found');
    }

    const subjectValue = reportData.subject || report.subject || report.title || '';
    console.log('Setting subject to:', subjectValue);
    console.log('reportData.subject:', reportData.subject);
    console.log('report.subject:', report.subject);
    console.log('report.title:', report.title);

    setFormData({
      forName: 'Aux. Lt. Michael G. Caparas',
      forPosition: 'DPARVC Founder',
      date: reportData.date || report.date || new Date().toISOString().split('T')[0],
      subject: subjectValue,
      authorities: reportData.authorities || (report.authorities ? report.authorities.split(',') : ['']),
      dateTime: reportData.dateTime || report.dateTime || '',
      place: reportData.place || report.place || '',
      personnelInvolved: reportData.personnelInvolved || (report.personnelInvolved ? report.personnelInvolved.split(',') : ['']),
      eventName: reportData.eventName || report.eventName || '',
      eventLocation: reportData.eventLocation || report.eventLocation || '',
      eventDate: reportData.eventDate || report.eventDate || '',
      startTime: reportData.startTime || report.startTime || '',
      endTime: reportData.endTime || report.endTime || '',
      organizers: reportData.organizers || (report.organizers ? report.organizers.split(',') : ['']),
      eventOverview: reportData.eventOverview || report.eventOverview || '',
      participants: reportData.participants || (report.participants ? report.participants.map(p => ({name: p.name, position: p.position})) : [{name: '', position: ''}]),
      trainingAgenda: reportData.trainingAgenda || report.trainingAgenda || '',
      keyOutcomes: reportData.keyOutcomes || (report.keyOutcomes ? report.keyOutcomes.split(',') : ['']),
      challenges: reportData.challenges || (report.challenges ? report.challenges.split(',') : ['']),
      recommendations: reportData.recommendations || (report.recommendations ? report.recommendations.split(',') : ['']),
      conclusion: reportData.conclusion || report.conclusion || '',
      photos: existingPhotos,
      preparedBy: reportData.preparedBy || report.preparedBy || '',
      preparedByPosition: reportData.preparedByPosition || report.preparedByPosition || '',
      preparedBySignature: reportData.preparedBySignature || report.preparedBySignature || null,
      approvedBy: 'Aux. Lt. Michael G. Caparas',
      approvedByPosition: 'DPARVC Founder'
    });
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setDateTimeErrors({ eventDate: '', startTime: '', endTime: '' });
    setShowCreateModal(true);
  };

  const resetFormData = () => {
    setEditingReport(null);
    setExistingPhotoPaths([]);
    setFormData({
      forName: 'Aux. Lt. Michael G. Caparas', 
      forPosition: 'DPARVC Founder', 
      date: new Date().toISOString().split('T')[0], 
      subject: '', 
      authorities: [''], 
      dateTime: '', 
      place: '', 
      personnelInvolved: [''],
      eventName: '',
      eventLocation: '',
      eventDate: '',
      startTime: '',
      endTime: '',
      organizers: [''],
      eventOverview: '',
      participants: [{name: '', position: ''}],
      trainingAgenda: '',
      keyOutcomes: [''],
      challenges: [''],
      recommendations: [''],
      conclusion: '',
      photos: [],
      preparedBy: '',
      preparedByPosition: '',
      preparedBySignature: null,
      approvedBy: 'Aux. Lt. Michael G. Caparas',
      approvedByPosition: 'DPARVC Founder'
    });
  };

  const [confirm, setConfirm] = useState({ open: false, onConfirm: null, message: '' });

  // Helper function to check if report can be deleted
  const canDeleteReport = (report) => {
    // Only draft and rejected reports can be deleted
    return report.status === 'draft' || report.status === 'rejected';
  };

  const handleDelete = async (id) => {
    const report = reports.find(r => r.id === id);
    if (!report) {
      showError('Report not found');
      return;
    }

    // Check if report can be deleted
    if (!canDeleteReport(report)) {
      if (report.status === 'approved') {
        showError('Approved reports cannot be deleted.');
      } else if (report.status === 'sent') {
        showError('Submitted reports cannot be deleted. Please wait for admin approval or rejection.');
      } else {
        showError('This report cannot be deleted.');
      }
      return;
    }

    setConfirm({
      open: true,
      message: 'Are you sure you want to delete this report?',
      onConfirm: async () => {
        setConfirm({ ...confirm, open: false });
        try {
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          await axios.delete(`${API_BASE}/api/reports/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchReports();
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to delete report';
          showError(errorMessage);
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

  const handleViewReport = async (reportId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setViewingReport(response.data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching report:', error);
      showError('Failed to load report details');
    }
  };

    const handleDownloadPDF = async (reportId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AOR_Report_${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      if (error.response?.status === 403) {
        showError('Only approved reports can be downloaded as PDF.');
      } else if (error.response?.status === 404) {
        showError('Report not found.');
      } else {
        showError('Failed to download PDF. Please try again.');
      }
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingReport(null);
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setErrorModalMessage('');
  };

  const showError = (message) => {
    setErrorModalMessage(message);
    setShowErrorModal(true);
  };

  // Date and time validation functions
  const validateEventDate = (date) => {
    if (!date) return '';
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    if (selectedDate > today) {
      return 'Event date should be on or before the current date.';
    }
    return '';
  };

  const validateTimeRange = (startTime, endTime, field) => {
    if (!startTime || !endTime) return '';
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    if (start >= end) {
      if (field === 'startTime') {
        return 'Start time must be before end time';
      } else {
        return 'End time must be after start time';
      }
    }
    return '';
  };

  const validateDateTimeFields = (field, value) => {
    const newErrors = { ...dateTimeErrors };
    
    if (field === 'eventDate') {
      newErrors.eventDate = validateEventDate(value);
    } else if (field === 'startTime' || field === 'endTime') {
      const startTime = field === 'startTime' ? value : formData.startTime;
      const endTime = field === 'endTime' ? value : formData.endTime;
      
      if (startTime && endTime) {
        const startTimeError = validateTimeRange(startTime, endTime, 'startTime');
        const endTimeError = validateTimeRange(startTime, endTime, 'endTime');
        newErrors.startTime = startTimeError;
        newErrors.endTime = endTimeError;
      } else {
        newErrors.startTime = '';
        newErrors.endTime = '';
      }
    }
    
    setDateTimeErrors(newErrors);
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
        showError(`Please fill in all required fields in ${stepName} before proceeding.`);
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
    // Filter to only deletable reports
    const deletableReports = selectedReports.filter(id => {
      const report = reports.find(r => r.id === id);
      return report && canDeleteReport(report);
    });

    if (deletableReports.length === 0) {
      showError('No deletable reports selected. Only draft and rejected reports can be deleted.');
      setSelectedReports([]);
      return;
    }

    setConfirm({
      open: true,
      message: `Are you sure you want to delete ${deletableReports.length} report(s)?`,
      onConfirm: async () => {
        setConfirm({ ...confirm, open: false });
        try {
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          await Promise.all(
            deletableReports.map(id =>
              axios.delete(`${API_BASE}/api/reports/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            )
          );
          setSelectedReports([]);
          fetchReports();
        } catch {
          showError('Failed to delete some reports');
        }
      }
    });
  };
  // Select all handler - only select deletable reports
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const deletableReportIds = reports.filter(r => canDeleteReport(r)).map(r => r.id);
      setSelectedReports(deletableReportIds);
    } else {
      setSelectedReports([]);
    }
  };
  // Select single handler - prevent selecting non-deletable reports
  const handleSelectReport = (id) => {
    const report = reports.find(r => r.id === id);
    if (!report || !canDeleteReport(report)) {
      return; // Don't allow selection of non-deletable reports
    }
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
            <div className="reports-loading-spinner"></div>
            <div className="reports-loading-text">Loading reports...</div>
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
                        checked={selectedReports.length > 0 && selectedReports.length === reports.filter(r => canDeleteReport(r)).length && reports.filter(r => canDeleteReport(r)).length > 0}
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
                            disabled={!canDeleteReport(report)}
                            style={{
                              cursor: canDeleteReport(report) ? 'pointer' : 'not-allowed',
                              opacity: canDeleteReport(report) ? 1 : 0.5
                            }}
                            title={!canDeleteReport(report) ? 
                              (report.status === 'approved' ? 'Approved reports cannot be deleted' : 
                               report.status === 'sent' ? 'Submitted reports cannot be deleted' : 
                               'This report cannot be deleted') : 
                              'Select for deletion'}
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
                              {report.rejection_reason && (
                                <div className="rejection-reason-display">
                                  <div className="rejection-reason-header">
                                    <strong>Rejection Reason:</strong>
                                  </div>
                                  <div className="rejection-reason-text">
                                    {report.rejection_reason}
                                  </div>
                                  <div className="rejection-guidance">
                                    <strong>Action Required:</strong>
                                    <div className="rejection-action-steps">
                                      <div className="rejection-step">
                                        <span className="step-number">1</span>
                                        <span className="step-text">Delete this rejected report using the delete button</span>
                                      </div>
                                      <div className="rejection-step">
                                        <span className="step-number">2</span>
                                        <span className="step-text">Create a new report addressing the issues above</span>
                                      </div>
                                    </div>
                                    <div className="rejection-note">
                                      <strong>Note:</strong> You cannot edit rejected reports. You must create a new submission.
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="actions-cell actions-col">
                          <div className="action-buttons-row">
                            {/* View button for all statuses */}
                            <button
                              className="action-btn view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewReport(report.id);
                              }}
                              title="View Report"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            
                            {report.status === 'draft' && (
                              <>
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
                                  disabled={submitting || drafting}
                                  style={{
                                    cursor: (submitting || drafting) ? 'not-allowed' : 'pointer',
                                    opacity: (submitting || drafting) ? 0.5 : 1
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                              </>
                            )}
                            {report.status === 'approved' && (
                              <button
                                className="action-btn download-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPDF(report.id);
                                }}
                                title="Download PDF"
                                style={{
                                  width: 'auto',
                                  padding: '8px 12px',
                                  gap: '6px',
                                  minWidth: '100px'
                                }}
                              >
                                <FontAwesomeIcon icon={faFilePdf} />
                                <span style={{ fontSize: '12px', fontWeight: '600' }}>PDF</span>
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
                {currentStep === 0 && <div className="section-gradient-card-red">I. HEADING</div>}
                {currentStep === 1 && <div className="section-gradient-card-red">II. EVENT DETAILS</div>}
                {currentStep === 2 && <div className="section-gradient-card-red">III. NARRATION OF EVENTS I</div>}
                {currentStep === 3 && <div className="section-gradient-card-red">IV. NARRATION OF EVENTS II</div>}
                {currentStep === 4 && <div className="section-gradient-card-red">V. ATTACHMENTS</div>}
                {currentStep === 5 && <div className="section-gradient-card-red">VI. SIGNATORIES</div>}
              </div>
              {/* Modal Body */}
              <div className="report-modal-body">
                <form className="report-form-grid" onSubmit={e => { e.preventDefault(); handleSubmit(true); }}>
                  {/* Step 1: Heading (was previously Step 2) */}
                  {currentStep === 0 && (
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
                            value="Aux. Lt. Michael G. Caparas"
                            readOnly
                            style={{
                              flex: 2,
                              minWidth: 0,
                              backgroundColor: '#f8fafc',
                              cursor: 'not-allowed',
                              color: '#000000'
                            }}
                          />
                          <input 
                            type="text" 
                            value="DPARVC Founder"
                            readOnly
                            style={{
                              flex: 1,
                              minWidth: 0,
                              backgroundColor: '#f8fafc',
                              cursor: 'not-allowed',
                              color: '#000000'
                            }}
                          />
                        </div>
                        </div>
                      </div>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 1'}}>
                          <label>Report Created: <span style={{color: '#ef4444'}}>*</span></label>
                          <input 
                            type="text" 
                            value={formatDateDisplay(formData.date || new Date().toISOString().split('T')[0])}
                            readOnly
                            style={{
                              backgroundColor: '#f8fafc',
                              cursor: 'not-allowed',
                              color: '#000000'
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
                  {/* Step 2: Event Details (was previously Step 3) */}
                  {currentStep === 1 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{gridColumn: '1 / span 4'}}>
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
                  {/* Step 3: Narration of Events I (was previously Step 4) */}
                  {currentStep === 2 && (
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
                          {dateTimeErrors.eventDate && (
                            <div style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem'}}>
                              {dateTimeErrors.eventDate}
                            </div>
                          )}
                        </div>
                        <div className="report-form-group" style={{gridColumn: '2 / span 1'}}>
                          <label>Start Time:</label>
                          <input type="time" value={formData.startTime} onChange={e => handleInputChange(e, 'startTime')} />
                          {dateTimeErrors.startTime && (
                            <div style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem'}}>
                              {dateTimeErrors.startTime}
                            </div>
                          )}
                        </div>
                        <div className="report-form-group" style={{gridColumn: '3 / span 1'}}>
                          <label>End Time:</label>
                          <input type="time" value={formData.endTime} onChange={e => handleInputChange(e, 'endTime')} />
                          {dateTimeErrors.endTime && (
                            <div style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem'}}>
                              {dateTimeErrors.endTime}
                            </div>
                          )}
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
                  {/* Step 4: Narration of Events II (was previously Step 5) */}
                  {currentStep === 3 && (
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
                  {currentStep === 4 && (
                    <>
                      <div className="report-form-row">
                        <div className="report-form-group" style={{ gridColumn: '1 / span 4' }}>
                          <label>Attach photos of the event</label>
                          <div className="photo-upload-section">
                            <label className="photo-upload-label">
                              📷 Upload Photos
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
                                  {photo.isExisting ? (
                                    <img src={photo.url} alt={`Upload ${index + 1}`} />
                                  ) : (
                                  <img src={URL.createObjectURL(photo)} alt={`Upload ${index + 1}`} />
                                  )}
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
                  {currentStep === 5 && (
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
                            onChange={e => handleInputChange(e, 'preparedBySignature')} 
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
                            📝
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
                            value="Aux. Lt. Michael G. Caparas"
                            readOnly
                            style={{
                              flex: 1,
                              minWidth: 0,
                              backgroundColor: '#f8fafc',
                              cursor: 'not-allowed',
                              color: '#000000'
                            }}
                          />
                          <input 
                            type="text" 
                            value="DPARVC Founder"
                            readOnly
                            style={{
                              flex: 1,
                              minWidth: 0,
                              backgroundColor: '#f8fafc',
                              cursor: 'not-allowed',
                              color: '#000000'
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
                          disabled={drafting || submitting}
                          style={{
                            cursor: (drafting || submitting) ? 'not-allowed' : 'pointer',
                            opacity: (drafting || submitting) ? 0.6 : 1
                          }}
                        >
                          <FontAwesomeIcon icon={faSave} />
                          {drafting ? 'Drafting...' : 'Save as Draft'}
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
                        <button 
                          className="report-modal-submit-btn" 
                          type="submit" 
                          disabled={submitting || drafting}
                          style={{
                            cursor: (submitting || drafting) ? 'not-allowed' : 'pointer',
                            opacity: (submitting || drafting) ? 0.6 : 1
                          }}
                        >
                          {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Report Modal */}
        {showViewModal && viewingReport && (
          <div className="modal-overlay">
            <div className="modal-content report-view-modal">
              <div className="report-modal-header">
                <h2>Report: {viewingReport.title || 'Untitled'}</h2>
                <button 
                  className="modal-close"
                  onClick={handleCloseViewModal}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <div className="report-view-content">

                {viewingReport.data && (
                  <>
                    {/* Heading Section */}
                    <div className="report-view-section">
                      <h3>I. HEADING</h3>
                      <div className="detail-row">
                        <strong>For:</strong>
                         <span>
                           {viewingReport.data.for && viewingReport.data.forPosition 
                             ? `${viewingReport.data.for} - ${viewingReport.data.forPosition}`
                             : viewingReport.data.for || viewingReport.data.forPosition || 'N/A'
                           }
                         </span>
                      </div>
                      <div className="detail-row">
                        <strong>Date:</strong>
                         <span>{viewingReport.data.date ? formatDate(viewingReport.data.date) : 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <strong>Subject:</strong>
                        <span>{viewingReport.data.subject || 'N/A'}</span>
                      </div>
                      {viewingReport.data.authorities && viewingReport.data.authorities.length > 0 && (
                        <div className="detail-row">
                          <strong>Authorities:</strong>
                          <ul className="detail-list">
                            {viewingReport.data.authorities.map((auth, index) => (
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
                        <span>{viewingReport.data.place || 'N/A'}</span>
                      </div>
                      {viewingReport.data.personnelInvolved && viewingReport.data.personnelInvolved.length > 0 && (
                        <div className="detail-row">
                          <strong>Personnel Involved:</strong>
                          <ul className="detail-list">
                            {viewingReport.data.personnelInvolved.map((person, index) => (
                              <li key={index}>{person}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="detail-row">
                        <strong>Event Name:</strong>
                        <span>{viewingReport.data.eventName || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <strong>Event Location:</strong>
                        <span>{viewingReport.data.eventLocation || 'N/A'}</span>
                      </div>
                      {viewingReport.data.organizers && viewingReport.data.organizers.length > 0 && (
                        <div className="detail-row">
                          <strong>Organizers:</strong>
                          <ul className="detail-list">
                            {viewingReport.data.organizers.map((org, index) => (
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
                         <span>{viewingReport.data.eventDate ? formatDate(viewingReport.data.eventDate) : 'N/A'}</span>
                        </div>
                      <div className="detail-row">
                        <strong>Event Duration:</strong>
                        <span>
                          {viewingReport.data.startTime && viewingReport.data.endTime 
                            ? `${formatTime(viewingReport.data.startTime)} - ${formatTime(viewingReport.data.endTime)}`
                            : viewingReport.data.startTime 
                              ? formatTime(viewingReport.data.startTime)
                              : viewingReport.data.endTime 
                                ? formatTime(viewingReport.data.endTime)
                                : 'N/A'
                          }
                        </span>
                      </div>
                      {viewingReport.data.participants && viewingReport.data.participants.length > 0 && (
                        <div className="detail-row">
                          <strong>Participants:</strong>
                          <ul className="detail-list">
                            {viewingReport.data.participants.map((participant, index) => (
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
                          {viewingReport.data.trainingAgenda || 'N/A'}
                        </div>
                      </div>
                      <div className="detail-row">
                        <strong>Event Overview:</strong>
                        <div className="detail-textarea">
                          {viewingReport.data.eventOverview || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Narration of Events II Section */}
                    <div className="report-view-section">
                      <h3>IV. NARRATION OF EVENTS II</h3>
                      <div className="detail-row">
                        <strong>Key Outcomes:</strong>
                        <div className="detail-textarea">
                          {viewingReport.data.keyOutcomes && viewingReport.data.keyOutcomes.length > 0 
                            ? viewingReport.data.keyOutcomes.join('\n') 
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="detail-row">
                        <strong>Challenges:</strong>
                        <div className="detail-textarea">
                          {viewingReport.data.challenges && viewingReport.data.challenges.length > 0 
                            ? viewingReport.data.challenges.join('\n') 
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="detail-row">
                        <strong>Recommendations:</strong>
                        <div className="detail-textarea">
                          {viewingReport.data.recommendations && viewingReport.data.recommendations.length > 0 
                            ? viewingReport.data.recommendations.join('\n') 
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="detail-row">
                        <strong>Conclusion:</strong>
                        <div className="detail-textarea">
                          {viewingReport.data.conclusion || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Attachments Section */}
                    {viewingReport.data.photos && viewingReport.data.photos.length > 0 && (
                      <div className="report-view-section">
                        <h3>V. ATTACHMENTS</h3>
                        <div className="detail-row">
                          <strong>Photos:</strong>
                          <div className="detail-images">
                            {viewingReport.data.photos.map((photo, index) => (
                              <img
                                key={index}
                                src={`${API_BASE}/storage/${photo}`}
                                alt={`Report photo ${index + 1}`}
                                className="detail-image"
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
                           {viewingReport.data.preparedBy && viewingReport.data.preparedByPosition 
                             ? `${viewingReport.data.preparedBy} - ${viewingReport.data.preparedByPosition}`
                             : viewingReport.data.preparedBy || viewingReport.data.preparedByPosition || 'N/A'
                           }
                         </span>
                      </div>
                      {viewingReport.data.preparedBySignature && (
                        <div className="detail-row">
                          <strong>Signature:</strong>
                          <img
                            src={`${API_BASE}/storage/${viewingReport.data.preparedBySignature}`}
                            alt="Prepared by signature"
                            className="detail-image"
                            style={{ maxWidth: '200px', maxHeight: '100px' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                       <div className="detail-row">
                         <strong>Approved By:</strong>
                         <span>
                           {viewingReport.data.approvedBy && viewingReport.data.approvedByPosition 
                             ? `${viewingReport.data.approvedBy} - ${viewingReport.data.approvedByPosition}`
                             : viewingReport.data.approvedBy || viewingReport.data.approvedByPosition || 'N/A'
                           }
                         </span>
                       </div>
                    </div>

                    {/* Approval Information */}
                    {viewingReport.approved_at && (
                      <div className="report-view-section">
                        <h3>APPROVAL INFORMATION</h3>
                        <div className="detail-row">
                          <strong>Approved At:</strong>
                          <span>{formatDateTime(viewingReport.approved_at)}</span>
                        </div>
                        {viewingReport.approved_by && (
                          <div className="detail-row">
                            <strong>Approved By:</strong>
                            <span>Admin</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rejection Information */}
                    {viewingReport.rejected_at && (
                      <div className="report-view-section">
                        <h3>REJECTION INFORMATION</h3>
                        <div className="detail-row">
                          <strong>Rejected At:</strong>
                          <span>{formatDateTime(viewingReport.rejected_at)}</span>
                        </div>
                        {viewingReport.rejected_by && (
                          <div className="detail-row">
                            <strong>Rejected By:</strong>
                            <span>Admin</span>
                          </div>
                        )}
                        {viewingReport.rejection_reason && (
                          <div className="detail-row">
                            <strong>Rejection Reason:</strong>
                            <div className="detail-textarea">
                              {viewingReport.rejection_reason}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              
               {/* Sticky Bottom Report Information */}
               <div className="report-info-sticky-bottom">
                 <div className="report-info-row" style={{ gap: '4rem' }}>
                   <div className="report-info-item">
                     <span className="report-info-label">Status:</span>
                     <span className={`status-badge status-${viewingReport.status}`}>
                       {viewingReport.status.toUpperCase()}
                     </span>
                   </div>
                   <div className="report-info-item">
                     <span className="report-info-label">Created:</span>
                     <span className="report-info-value">{formatDateTimeFooter(viewingReport.created_at)}</span>
                   </div>
                   {viewingReport.updated_at && (
                     <div className="report-info-item">
                       <span className="report-info-label">Last Updated:</span>
                       <span className="report-info-value">{formatDateTimeFooter(viewingReport.updated_at)}</span>
                     </div>
                   )}
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="modal-overlay">
            <div className="modal-content error-modal">
              <div className="error-modal-body">
                <div className="error-icon">
                  <FontAwesomeIcon icon={faXmark} />
                </div>
                <h3>Oops! Something went wrong</h3>
                <p>{errorModalMessage}</p>
                <button 
                  className="error-modal-btn"
                  onClick={handleCloseErrorModal}
                >
                  Got it
                </button>
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
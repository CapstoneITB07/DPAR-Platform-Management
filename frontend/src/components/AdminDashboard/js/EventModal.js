import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faMapMarkerAlt, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import '../css/EventModal.css';
import { API_BASE } from '../../../utils/url';

const EventModal = ({ 
  show, 
  onClose, 
  event = null, 
  onEventCreated, 
  onEventUpdated,
  onEventDeleted 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  // Helper to format backend date to local input value
  function formatLocalInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const tzOffset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - tzOffset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }

  // Helper to convert local datetime-local input to UTC string for backend
  function localToUTCString(localDateTime) {
    if (!localDateTime) return '';
    const date = new Date(localDateTime);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  useEffect(() => {
    if (event) {
      setIsEditMode(true);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        start_date: event.start_date ? formatLocalInput(event.start_date) : '',
        end_date: event.end_date ? formatLocalInput(event.end_date) : ''
      });
    } else {
      setIsEditMode(false);
      setFormData({
        title: '',
        description: '',
        location: '',
        start_date: '',
        end_date: ''
      });
    }
    setError('');
    setErrors({});
  }, [event, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(updatedFormData);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Real-time validation for date/time fields
    if (name === 'start_date' || name === 'end_date') {
      // Small delay to allow both fields to update before validation
      setTimeout(() => {
        validateDateTimeLogic(updatedFormData);
      }, 100);
    }
  };

  // Helper function to validate date/time logic in real-time
  const validateDateTimeLogic = (currentFormData) => {
    if (currentFormData.start_date && currentFormData.end_date) {
      const startDateTime = new Date(currentFormData.start_date);
      const endDateTime = new Date(currentFormData.end_date);
      
      setErrors(prev => {
        const newErrors = { ...prev };
        
        // Only check if end date/time is after start date/time
        if (endDateTime <= startDateTime) {
          newErrors.end_date = 'End date and time must be after start date and time';
        } else if (newErrors.end_date === 'End date and time must be after start date and time') {
          delete newErrors.end_date;
        }
        
        return newErrors;
      });
    }
  };

  // Helper function to scroll to the first field with an error
  const scrollToFirstError = (errorFields) => {
    // Define the order of fields as they appear in the form
    const fieldOrder = [
      'title',
      'start_date',
      'end_date',
      'location',
      'description'
    ];
    
    // Find the first field with an error based on the form order
    const firstErrorField = fieldOrder.find(field => errorFields[field]);
    
    if (firstErrorField) {
      // Try to find the input element by ID first
      let element = document.getElementById(firstErrorField);
      
      // If not found by ID, try to find by name attribute
      if (!element) {
        element = document.querySelector(`[name="${firstErrorField}"]`);
      }
      
      // If still not found, try to find the form group container
      if (!element) {
        element = document.querySelector(`.form-group:has([name="${firstErrorField}"])`);
      }
      
      if (element) {
        // Scroll to the element with smooth behavior
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Focus the input field if it's an input element
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
          setTimeout(() => {
            element.focus();
          }, 500); // Small delay to allow scroll to complete
        }
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    } else if (formData.start_date) {
      const startDateTime = new Date(formData.start_date);
      const endDateTime = new Date(formData.end_date);
      
      // Only check if end date/time is actually after start date/time
      if (endDateTime <= startDateTime) {
        newErrors.end_date = 'End date and time must be after start date and time';
      }
    }
    
    setErrors(newErrors);
    
    // If there are errors, scroll to the first one
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        scrollToFirstError(newErrors);
      }, 100); // Small delay to ensure errors are rendered
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    // Convert local input to UTC string for backend
    const dataToSend = {
      ...formData,
      start_date: localToUTCString(formData.start_date),
      end_date: localToUTCString(formData.end_date),
    };

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      if (isEditMode) {
        const response = await axios.put(
          `${API_BASE}/api/calendar-events/${event.id}`,
          dataToSend,
          { headers }
        );
        if (response.data.success) {
          onEventUpdated(response.data.data);
          onClose();
        }
      } else {
        const response = await axios.post(
          `${API_BASE}/api/calendar-events`,
          dataToSend,
          { headers }
        );
        if (response.data.success) {
          onEventCreated(response.data.data);
          onClose();
        }
      }
    } catch (err) {
      console.error('Error saving event:', err);
      
      // Handle validation errors from server
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        // Scroll to first error when server returns validation errors
        setTimeout(() => {
          scrollToFirstError(err.response.data.errors);
        }, 100);
      } else {
        setError(err.response?.data?.message || 'Failed to save event');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.delete(
        `${API_BASE}/api/calendar-events/${event.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        onEventDeleted(event.id);
        onClose();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    return new Date(dateTime).toLocaleString();
  };

  return (
    <Modal
      isOpen={show}
      onRequestClose={onClose}
      className="event-modal"
      overlayClassName="event-modal-overlay"
      ariaHideApp={false}
    >
      <div className="event-modal-header">
        <h3>
          <FontAwesomeIcon icon={faCalendarAlt} />
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h3>
        <button className="event-modal-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="event-modal-content">
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Event Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter event title"
              className={errors.title ? 'error' : ''}
              required
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date">Start Date & Time *</label>
              <input
                type="datetime-local"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className={errors.start_date ? 'error' : ''}
                required
              />
              {errors.start_date && <span className="error-text">{errors.start_date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="end_date">End Date & Time *</label>
              <input
                type="datetime-local"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className={errors.end_date ? 'error' : ''}
                required
              />
              {errors.end_date && <span className="error-text">{errors.end_date}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">
              <FontAwesomeIcon icon={faMapMarkerAlt} /> Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter event location"
              className={errors.location ? 'error' : ''}
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter event description"
              className={errors.description ? 'error' : ''}
              rows="4"
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          {isEditMode && event && (
            <div className="event-details">
              <h4>Event Details</h4>
              <div className="detail-item">
                <strong>Created by:</strong> {event.creator?.name || 'Unknown'}
              </div>
              <div className="detail-item">
                <strong>Created on:</strong> {formatDateTime(event.created_at)}
              </div>
              <div className="detail-item">
                <strong>Last updated:</strong> {formatDateTime(event.updated_at)}
              </div>
            </div>
          )}

          <div className="event-modal-actions">
            {isEditMode && (
              <button
                type="button"
                className="btn-delete"
                onClick={handleDelete}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faTrash} /> Delete Event
              </button>
            )}
            
            <div className="btn-group">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={loading}
              >
                {loading ? 'Saving...' : (isEditMode ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EventModal; 
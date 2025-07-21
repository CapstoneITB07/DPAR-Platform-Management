import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faMapMarkerAlt, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import '../css/EventModal.css';

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
  }, [event, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.start_date) {
      setError('Start date is required');
      return false;
    }
    if (!formData.end_date) {
      setError('End date is required');
      return false;
    }
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setError('End date must be after start date');
      return false;
    }
    return true;
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
          `http://localhost:8000/api/calendar-events/${event.id}`,
          dataToSend,
          { headers }
        );
        if (response.data.success) {
          onEventUpdated(response.data.data);
          onClose();
        }
      } else {
        const response = await axios.post(
          'http://localhost:8000/api/calendar-events',
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
      setError(err.response?.data?.message || 'Failed to save event');
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
        `http://localhost:8000/api/calendar-events/${event.id}`,
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
              required
            />
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
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_date">End Date & Time *</label>
              <input
                type="datetime-local"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
              />
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter event description"
              rows="4"
            />
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
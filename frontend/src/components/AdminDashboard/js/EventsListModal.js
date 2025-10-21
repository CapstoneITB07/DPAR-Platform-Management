import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faMapMarkerAlt, faUser, faClock, faEdit, faTrash, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';
import axiosInstance from '../../../utils/axiosConfig';
import '../css/EventsListModal.css';
import { API_BASE } from '../../../utils/url';

const EventsListModal = ({ show, onClose, onEdit, onDelete }) => {
  const [events, setEvents] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all events when modal opens
  useEffect(() => {
    if (show) {
      fetchAllEvents();
    }
  }, [show]);

  const fetchAllEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/calendar-events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const allEvents = response.data.data;
        // Sort events by start date (newest first)
        const sortedEvents = allEvents.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        setEvents(sortedEvents);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    return format(new Date(dateTime), 'PPP p');
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return 'Not specified';
    return format(new Date(dateTime), 'PPP');
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '';
    return format(new Date(dateTime), 'p');
  };

  const formatMonth = (dateTime) => {
    if (!dateTime) return '';
    return format(new Date(dateTime), 'MMM yyyy');
  };

  const isAllDay = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
  };

  const toggleEvent = (eventId) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleEditEvent = (event) => {
    if (onEdit) {
      onEdit(event);
      onClose();
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (onDelete && window.confirm('Are you sure you want to delete this event?')) {
      try {
        await onDelete(eventId);
        // Refresh events after deletion
        fetchAllEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setExpandedEvents(new Set());
    setEvents([]);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={show}
      onRequestClose={handleCloseModal}
      className="events-list-modal"
      overlayClassName="events-list-modal-overlay"
      ariaHideApp={false}
    >
      <div className="events-list-modal-header">
        <h3>
          <FontAwesomeIcon icon={faCalendarAlt} />
          All Events ({events.length} total)
        </h3>
        <button className="events-list-modal-close" onClick={handleCloseModal}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="events-list-modal-content">
        {error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchAllEvents} className="retry-btn">Retry</button>
          </div>
        ) : events.length === 0 ? (
          <div className="no-events">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <p>No events created yet.</p>
            <p>Click the "+ EV" button to create your first event!</p>
          </div>
        ) : (
          <div className="events-accordion">
            {events.map((event) => (
              <div key={event.id} className="event-accordion-item">
                <div 
                  className="event-accordion-header"
                  onClick={() => toggleEvent(event.id)}
                >
                  <div className="event-accordion-info">
                    <FontAwesomeIcon 
                      icon={expandedEvents.has(event.id) ? faChevronDown : faChevronRight} 
                      className="expand-icon"
                    />
                    <span className="event-title">{event.title}</span>
                  </div>
                  <div className="event-accordion-actions">
                    <span className="event-month">{formatMonth(event.start_date)}</span>
                        <button 
                          className="btn-edit-event" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(event);
                      }}
                          title="Edit Event"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="btn-delete-event" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                          title="Delete Event"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                    
                {expandedEvents.has(event.id) && (
                  <div className="event-accordion-content">
                    <div className="event-info">
                      <div className="event-info-item">
                        <div className="info-icon">
                          <FontAwesomeIcon icon={faClock} />
                        </div>
                        <div className="info-content">
                          <div className="info-label">Date & Time</div>
                          <div className="info-value">
                            {isAllDay(event.start_date, event.end_date) ? (
                              <>
                                <div><strong>Start:</strong> {formatDate(event.start_date)}</div>
                                <div><strong>End:</strong> {formatDate(event.end_date)}</div>
                              </>
                            ) : (
                              <>
                                <div><strong>Start:</strong> {formatDate(event.start_date)} at {formatTime(event.start_date)}</div>
                                <div><strong>End:</strong> {formatDate(event.end_date)} at {formatTime(event.end_date)}</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {event.location && (
                        <div className="event-info-item">
                          <div className="info-icon">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                          </div>
                          <div className="info-content">
                            <div className="info-label">Location</div>
                            <div className="info-value">{event.location}</div>
                          </div>
                        </div>
                      )}

                      <div className="event-info-item">
                        <div className="info-icon">
                          <FontAwesomeIcon icon={faUser} />
                        </div>
                        <div className="info-content">
                          <div className="info-label">Created by</div>
                          <div className="info-value">{event.creator?.name || 'Unknown'}</div>
                        </div>
                      </div>
                    </div>

                    {event.description && (
                      <div className="event-description">
                        <strong>Description:</strong>
                        <p>{event.description}</p>
                      </div>
                    )}

                    <div className="event-meta">
                      <span><strong>Created:</strong> {formatDateTime(event.created_at)}</span>
                      <span><strong>Last updated:</strong> {formatDateTime(event.updated_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EventsListModal; 
import React, { useState } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faMapMarkerAlt, faUser, faClock, faEdit, faTrash, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import '../css/EventDetailsModal.css';

const EventDetailsModal = ({ show, onClose, event, onEdit, onDelete, events, date }) => {
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    return format(new Date(dateTime), 'PPP p');
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return 'Not specified';
    return format(new Date(dateTime), 'PPP');
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    return format(new Date(dateTime), 'p');
  };

  const isAllDay = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if the times are exactly midnight (00:00:00)
    const startTime = start.getHours() + start.getMinutes() + start.getSeconds();
    const endTime = end.getHours() + end.getMinutes() + end.getSeconds();
    
    // If both start and end times are midnight, it's likely an all-day event
    if (startTime === 0 && endTime === 0) {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
    }
    
    return false;
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

  const handleEditEvent = (eventToEdit) => {
    if (onEdit) {
      onEdit(eventToEdit);
      onClose();
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (onDelete && window.confirm('Are you sure you want to delete this event?')) {
      try {
        await onDelete(eventId);
        onClose();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setExpandedEvents(new Set());
    onClose();
  };

  // If we have multiple events for a day, show accordion format
  if (events && events.length > 1) {
    return (
      <Modal
        isOpen={show}
        onRequestClose={handleCloseModal}
        className="event-details-modal"
        overlayClassName="event-details-modal-overlay"
        ariaHideApp={false}
      >
        <div className="event-details-header">
          <h3>
            <FontAwesomeIcon icon={faCalendarAlt} />
            Events for {date ? format(date, 'EEEE, MMMM do, yyyy') : 'Selected Day'} ({events.length} events)
          </h3>
          <button className="event-details-close" onClick={handleCloseModal}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="event-details-content">
          <div className="events-accordion">
            {events.map((eventItem) => (
              <div key={eventItem.id} className="event-accordion-item">
                <div 
                  className="event-accordion-header"
                  onClick={() => toggleEvent(eventItem.id)}
                >
                  <div className="event-accordion-info">
                    <FontAwesomeIcon 
                      icon={expandedEvents.has(eventItem.id) ? faChevronDown : faChevronRight} 
                      className="expand-icon"
                    />
                    <span className="event-title">{eventItem.title}</span>
                    <span className="event-time">
                      {formatDate(eventItem.start_date)} at {formatTime(eventItem.start_date)}
                    </span>
                  </div>
                  <div className="event-accordion-actions">
                    <button 
                      className="btn-edit-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(eventItem);
                      }}
                      title="Edit Event"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    {onDelete && (
                      <button 
                        className="btn-delete-icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(eventItem.id);
                        }}
                        title="Delete Event"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
                
                {expandedEvents.has(eventItem.id) && (
                  <div className="event-accordion-content">
                    <div className="event-info-grid">
                      <div className="event-info-item">
                        <div className="info-icon">
                          <FontAwesomeIcon icon={faClock} />
                        </div>
                        <div className="info-content">
                          <div className="info-label">Date & Time</div>
                          <div className="info-value">
                            {isAllDay(eventItem.start_date, eventItem.end_date) ? (
                              <>
                                <div><strong>Start:</strong> {formatDate(eventItem.start_date)}</div>
                                <div><strong>End:</strong> {formatDate(eventItem.end_date)}</div>
                              </>
                            ) : (
                              <>
                                <div><strong>Start:</strong> {formatDate(eventItem.start_date)} at {formatTime(eventItem.start_date)}</div>
                                <div><strong>End:</strong> {formatDate(eventItem.end_date)} at {formatTime(eventItem.end_date)}</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {eventItem.location && (
                        <div className="event-info-item">
                          <div className="info-icon">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                          </div>
                          <div className="info-content">
                            <div className="info-label">Location</div>
                            <div className="info-value">{eventItem.location}</div>
                          </div>
                        </div>
                      )}

                      <div className="event-info-item">
                        <div className="info-icon">
                          <FontAwesomeIcon icon={faUser} />
                        </div>
                        <div className="info-content">
                          <div className="info-label">Created by</div>
                          <div className="info-value">{eventItem.creator?.name || 'Unknown'}</div>
                        </div>
                      </div>
                    </div>

                    {eventItem.description && (
                      <div className="event-description">
                        <h4>Description</h4>
                        <div className="description-content">
                          {eventItem.description}
                        </div>
                      </div>
                    )}

                    <div className="event-meta">
                      <div className="meta-item">
                        <strong>Created:</strong> {formatDateTime(eventItem.created_at)}
                      </div>
                      <div className="meta-item">
                        <strong>Last updated:</strong> {formatDateTime(eventItem.updated_at)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  // Single event display (original functionality)
  if (!event) return null;

  return (
    <Modal
      isOpen={show}
      onRequestClose={onClose}
      className="event-details-modal"
      overlayClassName="event-details-modal-overlay"
      ariaHideApp={false}
    >
      <div className="event-details-header">
        <h3>
          <FontAwesomeIcon icon={faCalendarAlt} />
          Event Details
        </h3>
        <div className="event-details-actions">
          {onEdit && (
            <button className="btn-edit-icon" onClick={() => onEdit(event)} title="Edit Event">
              <FontAwesomeIcon icon={faEdit} />
            </button>
          )}
          {onDelete && (
            <button className="btn-delete-icon" onClick={() => onDelete(event.id)} title="Delete Event">
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
          <button className="event-details-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>

      <div className="event-details-content">
        <div className="event-title">
          <h2>{event.title}</h2>
        </div>

        <div className="event-info-grid">
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
            <h4>Description</h4>
            <div className="description-content">
              {event.description}
            </div>
          </div>
        )}

        <div className="event-meta">
          <div className="meta-item">
            <strong>Created:</strong> {formatDateTime(event.created_at)}
          </div>
          <div className="meta-item">
            <strong>Last updated:</strong> {formatDateTime(event.updated_at)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EventDetailsModal; 
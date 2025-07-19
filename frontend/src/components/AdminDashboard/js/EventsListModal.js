import React, { useState } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faMapMarkerAlt, faUser, faClock, faEdit, faTrash, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import '../css/EventsListModal.css';

const EventsListModal = ({ show, onClose, events, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const eventsPerPage = 5; // Show 5 events per page
  
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    return format(new Date(dateTime), 'PPP p');
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return 'Not specified';
    return format(new Date(dateTime), 'PPP');
  };

  const isAllDay = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
  };

  const handleEditEvent = (event) => {
    if (onEdit) {
      onEdit(event);
      onClose();
    }
  };

  const handleDeleteEvent = (eventId) => {
    if (onDelete && window.confirm('Are you sure you want to delete this event?')) {
      onDelete(eventId);
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(Math.ceil(events.length / eventsPerPage) - 1, prev + 1));
  };

  const handleCloseModal = () => {
    setCurrentPage(0); // Reset to first page when closing
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
          All Events
        </h3>
        <button className="events-list-modal-close" onClick={handleCloseModal}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="events-list-modal-content">
        {events.length === 0 ? (
          <div className="no-events">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <p>No events created yet.</p>
            <p>Click the "+ EV" button to create your first event!</p>
          </div>
        ) : (
          <>
            <div className="events-list">
              {events
                .slice(currentPage * eventsPerPage, (currentPage + 1) * eventsPerPage)
                .map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-header">
                      <h4 className="event-title">{event.title}</h4>
                      <div className="event-actions">
                        <button 
                          className="btn-edit-event" 
                          onClick={() => handleEditEvent(event)}
                          title="Edit Event"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="btn-delete-event" 
                          onClick={() => handleDeleteEvent(event.id)}
                          title="Delete Event"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                    
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
                                <div><strong>Start:</strong> {formatDateTime(event.start_date)}</div>
                                <div><strong>End:</strong> {formatDateTime(event.end_date)}</div>
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
                ))}
            </div>
            
            {/* Pagination Controls */}
            {events.length > eventsPerPage && (
              <div className="events-pagination">
                <button 
                  className="pagination-btn prev-btn" 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {currentPage + 1} of {Math.ceil(events.length / eventsPerPage)}
                </span>
                
                <button 
                  className="pagination-btn next-btn" 
                  onClick={handleNextPage}
                  disabled={currentPage >= Math.ceil(events.length / eventsPerPage) - 1}
                >
                  Next
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default EventsListModal; 
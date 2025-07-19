import React from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faMapMarkerAlt, faUser, faClock, faEdit } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import '../css/EventDetailsModal.css';

const EventDetailsModal = ({ show, onClose, event, onEdit }) => {
  if (!event) return null;

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

  const isAllDay = () => {
    if (!event.start_date || !event.end_date) return false;
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
  };

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
            <button className="btn-edit" onClick={() => onEdit(event)}>
              <FontAwesomeIcon icon={faEdit} />
              Edit
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
                {isAllDay() ? (
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
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faMapMarkerAlt, faUser, faClock, faEdit, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';
import axiosInstance from '../../../utils/axiosConfig';
import '../css/EventsListModal.css';
import { API_BASE } from '../../../utils/url';

const EventsListModal = ({ show, onClose, onEdit }) => {
  const [events, setEvents] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  const [expandedDates, setExpandedDates] = useState(new Set()); // For mobile/tablet date dropdowns
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [allEvents, setAllEvents] = useState([]); // Store all events for filtering

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
        // Group events by date (local date, not UTC)
        const eventsByDate = {};
        allEvents.forEach(event => {
          const startDate = new Date(event.start_date);
          // Use local date components to avoid timezone issues
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const day = String(startDate.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
          }
          eventsByDate[dateKey].push(event);
        });
        
        // Store all events for filtering
        setAllEvents(response.data.data);
        
        // Apply date filter if set
        let filteredEventsByDate = eventsByDate;
        if (filterDateFrom || filterDateTo) {
          filteredEventsByDate = {};
          Object.keys(eventsByDate).forEach(dateKey => {
            // Parse dateKey (YYYY-MM-DD) to Date object
            const [year, month, day] = dateKey.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);
            dateObj.setHours(0, 0, 0, 0);
            
            const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            
            const toDate = filterDateTo ? new Date(filterDateTo) : null;
            if (toDate) toDate.setHours(23, 59, 59, 999);
            
            const isInRange = (!fromDate || dateObj >= fromDate) && (!toDate || dateObj <= toDate);
            if (isInRange) {
              filteredEventsByDate[dateKey] = eventsByDate[dateKey];
            }
          });
        }
        
        // Convert to array and sort by date (chronological order - earliest first)
        const sortedDates = Object.keys(filteredEventsByDate).sort((a, b) => {
          // Parse dates consistently (YYYY-MM-DD format)
          const [yearA, monthA, dayA] = a.split('-').map(Number);
          const [yearB, monthB, dayB] = b.split('-').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          dateA.setHours(0, 0, 0, 0);
          dateB.setHours(0, 0, 0, 0);
          
          // Sort chronologically (earliest dates first, latest dates last)
          return dateA.getTime() - dateB.getTime();
        });
        const groupedEvents = sortedDates.map(dateKey => ({
          date: dateKey,
          dateObj: new Date(dateKey + 'T00:00:00'),
          events: filteredEventsByDate[dateKey].sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        }));
        
        setEvents(groupedEvents);
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

  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return format(date, 'MMM d, yyyy');
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

  const toggleDate = (dateKey) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const handleEditEvent = (event) => {
    if (onEdit) {
      onEdit(event);
      onClose();
    }
  };

  const handleCloseModal = () => {
    setExpandedEvents(new Set());
    setExpandedDates(new Set());
    setEvents([]);
    setAllEvents([]);
    setFilterDateFrom('');
    setFilterDateTo('');
    setError('');
    onClose();
  };

  const handleFilterChange = () => {
    // Re-filter events when filter changes
    if (allEvents.length > 0) {
      const eventsByDate = {};
      allEvents.forEach(event => {
        const startDate = new Date(event.start_date);
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
      });
      
      // Apply date filter
      let filteredEventsByDate = eventsByDate;
      if (filterDateFrom || filterDateTo) {
        filteredEventsByDate = {};
        Object.keys(eventsByDate).forEach(dateKey => {
          // Parse dateKey (YYYY-MM-DD) to Date object
          const [year, month, day] = dateKey.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);
          dateObj.setHours(0, 0, 0, 0);
          
          const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
          if (fromDate) fromDate.setHours(0, 0, 0, 0);
          
          const toDate = filterDateTo ? new Date(filterDateTo) : null;
          if (toDate) toDate.setHours(23, 59, 59, 999);
          
          const isInRange = (!fromDate || dateObj >= fromDate) && (!toDate || dateObj <= toDate);
          if (isInRange) {
            filteredEventsByDate[dateKey] = eventsByDate[dateKey];
          }
        });
      }
      
      // Sort by date (chronological order - earliest first)
      const sortedDates = Object.keys(filteredEventsByDate).sort((a, b) => {
        // Parse dates consistently (YYYY-MM-DD format)
        const [yearA, monthA, dayA] = a.split('-').map(Number);
        const [yearB, monthB, dayB] = b.split('-').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        
        // Sort chronologically (earliest dates first, latest dates last)
        return dateA.getTime() - dateB.getTime();
      });
      const groupedEvents = sortedDates.map(dateKey => ({
        date: dateKey,
        dateObj: new Date(dateKey + 'T00:00:00'),
        events: filteredEventsByDate[dateKey].sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      }));
      
      setEvents(groupedEvents);
    }
  };

  const clearFilter = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    // Trigger re-filter
    setTimeout(() => {
      if (allEvents.length > 0) {
        const eventsByDate = {};
        allEvents.forEach(event => {
          const startDate = new Date(event.start_date);
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const day = String(startDate.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
          }
          eventsByDate[dateKey].push(event);
        });
        
        const sortedDates = Object.keys(eventsByDate).sort((a, b) => {
          // Parse dates consistently (YYYY-MM-DD format)
          const [yearA, monthA, dayA] = a.split('-').map(Number);
          const [yearB, monthB, dayB] = b.split('-').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          dateA.setHours(0, 0, 0, 0);
          dateB.setHours(0, 0, 0, 0);
          
          // Sort chronologically (earliest dates first, latest dates last)
          return dateA.getTime() - dateB.getTime();
        });
        const groupedEvents = sortedDates.map(dateKey => ({
          date: dateKey,
          dateObj: new Date(dateKey + 'T00:00:00'),
          events: eventsByDate[dateKey].sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        }));
        setEvents(groupedEvents);
      }
    }, 0);
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
          All Events ({events.reduce((total, group) => total + group.events.length, 0)} total)
        </h3>
        <button className="events-list-modal-close" onClick={handleCloseModal}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="events-filter-section">
        <div className="filter-controls">
          <div className="filter-date-row">
            <div className="filter-group">
              <label htmlFor="filter-date-from">From:</label>
              <input
                type="date"
                id="filter-date-from"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value);
                  setTimeout(handleFilterChange, 0);
                }}
                className="filter-date-input"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="filter-date-to">To:</label>
              <input
                type="date"
                id="filter-date-to"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value);
                  setTimeout(handleFilterChange, 0);
                }}
                className="filter-date-input"
              />
            </div>
            {(filterDateFrom || filterDateTo) && (
              <button className="clear-filter-btn clear-filter-inline" onClick={clearFilter}>
                Clear Filter
              </button>
            )}
          </div>
          {(filterDateFrom || filterDateTo) && (
            <button className="clear-filter-btn clear-filter-below" onClick={clearFilter}>
              Clear Filter
            </button>
          )}
        </div>
      </div>

      <div className="events-list-modal-content">
        {error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchAllEvents} className="retry-btn">Retry</button>
          </div>
        ) : (Array.isArray(events) && events.length === 0) ? (
          <div className="no-events">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <p>No events created yet.</p>
            <p>Click the "+ EV" button to create your first event!</p>
          </div>
        ) : (
          <div className="events-notes-layout">
            {events.map((dateGroup) => (
              <div key={dateGroup.date} className="events-date-group">
                <div 
                  className="events-date-header"
                  onClick={() => toggleDate(dateGroup.date)}
                >
                  <div className="events-date-header-content">
                    <FontAwesomeIcon 
                      icon={expandedDates.has(dateGroup.date) ? faChevronDown : faChevronRight} 
                      className="date-expand-icon"
                    />
                    <span>{formatDateShort(dateGroup.date)}</span>
                    <span className="date-event-count">
                      {'('}{dateGroup.events.length} {dateGroup.events.length === 1 ? 'event' : 'events'}{')'}
                    </span>
                  </div>
                </div>
                {expandedDates.has(dateGroup.date) && (
                  <div className="events-date-list date-expanded">
                    {dateGroup.events.map((event) => (
                      <div key={event.id} className="event-note-item">
                        <div 
                          className="event-note-header"
                          onClick={() => toggleEvent(event.id)}
                        >
                          <div className="event-note-content">
                            <FontAwesomeIcon 
                              icon={expandedEvents.has(event.id) ? faChevronDown : faChevronRight} 
                              className="event-note-expand-icon"
                            />
                            <span className="event-note-title">{event.title || 'Untitled Event'}</span>
                          </div>
                          <div className="event-note-actions">
                            <button 
                              className="btn-edit-event-note" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                              title="Edit Event"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                          </div>
                        </div>
                        {expandedEvents.has(event.id) && (
                          <div className="event-note-details">
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
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EventsListModal; 
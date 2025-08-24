import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';
import axios from 'axios';
import '../css/Announcements.css';
import { FaFire, FaCheckDouble, FaWater, FaSnowflake, FaShieldAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const slides = [
  {
    icon: <FaFire size={140} color="#a72828" />, // Changed to slight red
    title: "Disaster Preparedness & Response",
    subtitle: "Protecting Communities, Saving Lives",
    desc: "DPAR is dedicated to ensuring communities are prepared for disasters and equipped to respond effectively when emergencies occur."
  },
  {
    icon: <FaCheckDouble size={140} color="#a72828" />, // Changed to slight red
    title: "Mitigation",
    subtitle: "Minimize Risk and Damage",
    desc: "DPAR is dedicated to ensuring communities are prepared for disasters and equipped to respond effectively when emergencies occur."
  },
  {
    icon: <FaSnowflake size={140} color="#a72828" />, // Changed to slight red
    title: "Preparedness",
    subtitle: "Get Ready for the Unexpected",
    desc: "Tips for keeping your family safe during cold weather emergencies."
  },
  {
    icon: <FaShieldAlt size={140} color="#a72828" />, // Changed to slight red
    title: "Response",
    subtitle: "Together, We Are Stronger",
    desc: "Building resilient communities through preparedness and cooperation."
  },
  {
    icon: <FaWater size={140} color="#a72828" />, // Changed to slight red
    title: "Recovery",
    subtitle: "Rebuilding and Restoring",
    desc: "DPAR is dedicated to ensuring communities are prepared for disasters and equipped to respond effectively when emergencies occur."
  }
];

function AnnouncementsLeftCard() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const prevSlide = () => setCurrent((current - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrent((current + 1) % slides.length);

  // Auto-slide functionality
  useEffect(() => {
    if (isPaused) return; // Don't auto-slide if paused
    
    const interval = setInterval(() => {
      setCurrent((prevCurrent) => (prevCurrent + 1) % slides.length);
    }, 2000); // 2 seconds per slide

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  // Pause auto-slide on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div 
      className="announcements-left-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="announcements-bg-logo" style={{ backgroundImage: "url('/Assets/disaster_logo.png')", opacity: 0.13 }} />
      <button
        className="announcements-arrow announcements-arrow-left"
        onClick={prevSlide}
        tabIndex={0}
        aria-label="Previous slide"
        style={{ zIndex: 20 }}
      >
        &#10094;
      </button>
      <button
        className="announcements-arrow announcements-arrow-right"
        onClick={nextSlide}
        tabIndex={0}
        aria-label="Next slide"
        style={{ zIndex: 20 }}
      >
        &#10095;
      </button>
      <div className="announcements-content-overlay">
        <div className="announcements-icon-bg" style={{ marginBottom: 16 }}>
          {slides[current].icon}
        </div>
        <div className="announcements-title">{slides[current].title}</div>
        <div className="announcements-subtitle">{slides[current].subtitle}</div>
      </div>
      <div className="announcements-gradient-bottom">
        <div className="announcements-desc">{slides[current].desc}</div>
        <div className="announcements-dots">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={"announcements-dot" + (idx === current ? " active" : "")}
              onClick={() => setCurrent(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [modalImg, setModalImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullAnnouncementModal, setFullAnnouncementModal] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await axios.get('http://localhost:8000/api/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(res.data);
    } catch (err) {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  // Function to truncate text to 3 lines
  const truncateText = (text, maxLines = 3) => {
    if (!text) return '';
    const lines = text.split('\n');
    if (lines.length <= maxLines) return text;
    
    // Join first 3 lines and add ellipsis
    return lines.slice(0, maxLines).join('\n') + '...';
  };

  // Function to check if text needs truncation
  const needsTruncation = (text, maxLines = 3) => {
    if (!text) return false;
    const lines = text.split('\n');
    return lines.length > maxLines || text.length > 150; // Also check character length
  };

  const openFullModal = (announcement) => {
    setFullAnnouncementModal(announcement);
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (fullAnnouncementModal && fullAnnouncementModal.photo_urls && fullAnnouncementModal.photo_urls.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === fullAnnouncementModal.photo_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (fullAnnouncementModal && fullAnnouncementModal.photo_urls && fullAnnouncementModal.photo_urls.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? fullAnnouncementModal.photo_urls.length - 1 : prev - 1
      );
    }
  };

  return (
    <AssociateLayout>
      <div className="announcements-bg">
        <div className="announcements-container">
          <h1 className="announcements-header">Important Updates & Announcements</h1>
          {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
          
          {/* Modal for image */}
          {modalImg && (
            <div className="announcements-image-modal" onClick={() => setModalImg(null)}>
              <div className="announcements-image-modal-content" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="announcements-image-modal-close"
                  onClick={() => setModalImg(null)}
                >
                  ×
                </button>
                <img src={modalImg} alt="Announcement Large" className="announcements-modal-img" />
              </div>
            </div>
          )}

          {/* Modal for full announcement */}
          {fullAnnouncementModal && (
            <div className="announcements-modal" onClick={() => setFullAnnouncementModal(null)}>
              <div className="announcement-full-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="announcement-full-modal-header">
                  <h2>{fullAnnouncementModal.title}</h2>
                  <button 
                    className="announcement-full-modal-close"
                    onClick={() => setFullAnnouncementModal(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="announcement-full-modal-datetime">
                  <span className="announcement-date-badge">
                    <span role="img" aria-label="calendar">📅</span> {new Date(fullAnnouncementModal.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="announcement-time-badge">
                    <span role="img" aria-label="clock">⏰</span> {new Date(fullAnnouncementModal.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="announcement-full-modal-description">
                  {fullAnnouncementModal.description}
                </div>
                
                {/* Photo Navigation (Instagram/Facebook style) */}
                {fullAnnouncementModal.photo_urls && fullAnnouncementModal.photo_urls.length > 0 && (
                  <div className="announcement-photo-navigation">
                    <div className="announcement-photo-container">
                      <img
                        src={fullAnnouncementModal.photo_urls[currentPhotoIndex]}
                        alt={`Photo ${currentPhotoIndex + 1}`}
                        className="announcement-full-modal-img"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Close the announcement modal when opening image modal
                          setFullAnnouncementModal(null);
                          setModalImg(fullAnnouncementModal.photo_urls[currentPhotoIndex]);
                        }}
                      />
                      
                      {/* Navigation Arrows */}
                      {fullAnnouncementModal.photo_urls.length > 1 && (
                        <>
                          <button 
                            className="announcement-photo-nav-btn announcement-photo-nav-prev"
                            onClick={prevPhoto}
                          >
                            <FaChevronLeft />
                          </button>
                          <button 
                            className="announcement-photo-nav-btn announcement-photo-nav-next"
                            onClick={nextPhoto}
                          >
                            <FaChevronRight />
                          </button>
                        </>
                      )}
                      
                      {/* Photo Counter */}
                      {fullAnnouncementModal.photo_urls.length > 1 && (
                        <div className="announcement-photo-counter">
                          {currentPhotoIndex + 1} / {fullAnnouncementModal.photo_urls.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="announcements-flex">
            {/* Left: Static Card */}
            <AnnouncementsLeftCard />
            {/* Right: Announcements List */}
            <div className="announcements-right-col">
              {loading ? (
                <div className="announcements-loading">
                  <div className="announcements-loading-spinner"></div>
                  <div className="announcements-loading-text">Loading announcements...</div>
                </div>
              ) : announcements.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', background: '#fff', borderRadius: 10, padding: 32, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>No announcements yet.</div>
              ) : (
                announcements.map(a => (
                  <div 
                    key={a.id} 
                    className="announcement-card"
                    onClick={() => openFullModal(a)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Date/Time Row */}
                    <div className="announcement-datetime-row">
                      <div>
                        <span className="announcement-date-badge">
                          <span role="img" aria-label="calendar">📅</span> {new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="announcement-time-badge">
                          <span role="img" aria-label="clock">⏰</span> {new Date(a.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {/* Title/Content */}
                    <div className="announcement-content">
                      {a.title && <div className="announcement-title">{a.title}</div>}
                      {a.description && (
                        <div className="announcement-desc">
                          {truncateText(a.description)}
                          {needsTruncation(a.description) && (
                            <button 
                              className="announcement-see-more-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openFullModal(a);
                              }}
                            >
                              See more
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Show only first photo in card */}
                      {a.photo_urls && a.photo_urls.length > 0 && (
                        <div className="announcement-photos-wrapper">
                          <div className="announcement-img-wrapper" style={{ position: 'relative' }}>
                            <img
                              src={a.photo_urls[0]}
                              alt="Announcement"
                              className="announcement-img"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Close the announcement modal when opening image modal
                                setFullAnnouncementModal(null);
                                setModalImg(a.photo_urls[0]);
                              }}
                            />
                            {a.photo_urls.length > 1 && (
                              <div className="announcement-photos-indicator">
                                <span className="announcement-photos-count">+{a.photo_urls.length - 1} more</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AssociateLayout>
  );
}

export default Announcements; 
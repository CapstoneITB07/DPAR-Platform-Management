import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';
import axios from 'axios';
import '../css/Announcements.css';
import { FaFire, FaCheckDouble, FaWater, FaSnowflake, FaShieldAlt } from 'react-icons/fa';

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

  // Function to truncate text to 15 words
  const truncateText = (text, maxWords = 15) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  // Function to check if text needs truncation
  const needsTruncation = (text, maxWords = 15) => {
    if (!text) return false;
    const words = text.split(' ');
    return words.length > maxWords;
  };

  return (
    <AssociateLayout>
      <div className="announcements-bg">
        <div className="announcements-container">
          <h1 className="announcements-header">Important Updates & Announcements</h1>
          {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
          
          {/* Modal for image */}
          {modalImg && (
            <div className="announcements-modal" onClick={() => setModalImg(null)}>
              <img src={modalImg} alt="Announcement Large" className="announcements-modal-img" />
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
                {fullAnnouncementModal.photo_url && (
                  <div className="announcement-full-modal-image">
                    <img
                      src={fullAnnouncementModal.photo_url}
                      alt="Announcement"
                      className="announcement-full-modal-img"
                    />
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
                    onClick={() => setFullAnnouncementModal(a)}
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
                                setFullAnnouncementModal(a);
                              }}
                            >
                              See more
                            </button>
                          )}
                        </div>
                      )}
                      {a.photo_url && (
                        <div className="announcement-img-wrapper">
                          <img
                            src={a.photo_url}
                            alt="Announcement"
                            className="announcement-img"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImg(a.photo_url);
                            }}
                          />
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
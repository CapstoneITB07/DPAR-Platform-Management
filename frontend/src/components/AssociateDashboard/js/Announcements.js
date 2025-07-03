import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn, faCalendarAlt, faClock, faTimes, faChevronLeft, faChevronRight, faUsers, faShieldAlt, faHeart, faHandshake } from '@fortawesome/free-solid-svg-icons';
import '../css/Announcements.css';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalImg, setModalImg] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // DPAR Slideshow Content
  const dparSlides = [
    {
      id: 1,
      title: "Disaster Preparedness & Response",
      subtitle: "Protecting Communities, Saving Lives",
      description: "DPAR is dedicated to ensuring communities are prepared for disasters and equipped to respond effectively when emergencies occur.",
      image: "/Assets/disaster_logo.png",
      icon: faShieldAlt
    },
    {
      id: 2,
      title: "Volunteer Network",
      subtitle: "Community Heroes in Action",
      description: "Our network of dedicated volunteers works tirelessly to support disaster response efforts and community resilience programs.",
      image: "/Assets/disaster_logo.png",
      icon: faUsers
    },
    {
      id: 3,
      title: "Emergency Response",
      subtitle: "Rapid & Coordinated Action",
      description: "When disasters strike, our coordinated response teams provide immediate assistance and support to affected communities.",
      image: "/Assets/disaster_logo.png",
      icon: faHeart
    },
    {
      id: 4,
      title: "Community Partnership",
      subtitle: "Working Together for Safety",
      description: "We collaborate with local organizations, government agencies, and community leaders to build resilient communities.",
      image: "/Assets/disaster_logo.png",
      icon: faHandshake
    }
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % dparSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + dparSlides.length) % dparSlides.length);
  };

  if (loading) {
    return (
      <AssociateLayout>
        <div className="announcements-container">
          <div className="header-section">
            <div className="header-left">
              <h2>Announcements</h2>
            </div>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading announcements...</p>
          </div>
        </div>
      </AssociateLayout>
    );
  }

  return (
    <AssociateLayout>
      <div className="announcements-container">
        {/* Header Section */}
        <div className="header-section">
          <div className="header-left">
            <h2>Announcements</h2>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert-message error">
            <FontAwesomeIcon icon={faTimes} />
            {error}
          </div>
        )}

        {/* Image Modal */}
        {modalImg && (
          <div className="image-modal-overlay" onClick={() => setModalImg(null)}>
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="image-modal-close" onClick={() => setModalImg(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <img src={modalImg} alt="Announcement" className="modal-image" />
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="announcements-layout">
          {/* Left Column - DPAR Slideshow (65%) */}
          <div className="slideshow-column">
            <div className="slideshow-container">
              <div className="slideshow-image-container">
                <img
                  src={dparSlides[currentSlide]?.image}
                  alt="DPAR"
                  className="slideshow-image"
                  onClick={() => setModalImg(dparSlides[currentSlide]?.image)}
                />
                <div className="slideshow-overlay">
                  <div className="slideshow-info">
                    <div className="slideshow-icon">
                      <FontAwesomeIcon icon={dparSlides[currentSlide]?.icon} />
                    </div>
                    <h3>{dparSlides[currentSlide]?.title}</h3>
                    <h4>{dparSlides[currentSlide]?.subtitle}</h4>
                    <p>{dparSlides[currentSlide]?.description}</p>
                  </div>
                </div>

                {/* Navigation Controls INSIDE image container */}
                <button className="slideshow-nav prev" onClick={prevSlide}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button className="slideshow-nav next" onClick={nextSlide}>
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>

                {/* Dots Indicator INSIDE image container */}
                <div className="slideshow-dots">
                  {dparSlides.map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${index === currentSlide ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Announcements List (35%) */}
          <div className="announcements-column">
            <div className="announcements-list">
              {announcements.length === 0 ? (
                <div className="no-announcements">
                  <div className="no-announcements-content">
                    <FontAwesomeIcon icon={faBullhorn} />
                    <p>No announcements available</p>
                    <span>Check back later for updates</span>
                  </div>
                </div>
              ) : (
                announcements.map((announcement, index) => (
                  <div key={announcement.id} className="announcement-card">
                    {/* Card Header */}
                    <div className="announcement-header">
                      <div className="announcement-meta">
                        <div className="announcement-date">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          {formatDate(announcement.created_at)}
                        </div>
                        <div className="announcement-time">
                          <FontAwesomeIcon icon={faClock} />
                          {formatTime(announcement.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="announcement-content">
                      {announcement.title && (
                        <h3 className="announcement-title">{announcement.title}</h3>
                      )}
                      {announcement.description && (
                        <p className="announcement-description">{announcement.description}</p>
                      )}
                      {announcement.photo_url && (
                        <div className="announcement-image-container">
                          <img
                            src={announcement.photo_url}
                            alt="Announcement"
                            className="announcement-image"
                            onClick={() => setModalImg(announcement.photo_url)}
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
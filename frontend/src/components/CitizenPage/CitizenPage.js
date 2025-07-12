import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../logo.svg';
import axios from 'axios';
import { FaBullhorn } from 'react-icons/fa';
import './CitizenPage.css';

// Helper for formatting date
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function CitizenPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fade, setFade] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState(null);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState('');

  // For announcement modal
  const [modalAnn, setModalAnn] = useState(null);

  const handleDropdown = () => setDropdownOpen(!dropdownOpen);
  const closeDropdown = () => setDropdownOpen(false);

  // Animation and navigation for About Us
  const handleAboutClick = () => {
    setFade(true);
    setTimeout(() => {
      navigate('/citizen/about');
    }, 350);
  };

  // Determine if ABOUT US is active
  const isAboutActive = location.pathname === '/citizen/about';

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/training-programs');
      setPrograms(res.data);
    } catch (err) {
      setError('Failed to load training programs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch announcements (no auth)
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setAnnLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      setAnnError('Failed to load announcements');
    } finally {
      setAnnLoading(false);
    }
  };

  const openImageModal = (imgUrl) => {
    setModalImg(imgUrl);
    setModalOpen(true);
  };
  const closeImageModal = () => {
    setModalOpen(false);
    setModalImg(null);
  };

  // Helper to limit words
  function getPreview(text, wordLimit = 15) {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  }
  // Track which announcement is expanded
  const [expandedAnn, setExpandedAnn] = useState({});

  return (
    <div className="citizen-page-wrapper">
      {/* Navigation Bar */}
      <nav className="citizen-navbar">
        <div className="citizen-navbar-title">DPAR VOLUNTEER COALITION</div>
        <ul className="citizen-navbar-list">
          <li style={{ background: '#a52a1a' }}>HOME</li>
          <li className="citizen-navbar-dropdown" onMouseLeave={closeDropdown}>
            <span onClick={handleDropdown} style={{ background: dropdownOpen ? '#a52a1a' : 'transparent' }}>
              PREPAREDNESS <span style={{ fontSize: 12 }}>▼</span>
            </span>
            {dropdownOpen && (
              <ul className="citizen-navbar-dropdown-list">
                {['TYPHOON', 'PANDEMIC', 'FIRE', 'FLOOD'].map((item) => (
                  <li key={item} onClick={closeDropdown} onMouseDown={e => e.preventDefault()}>{item}</li>
                ))}
              </ul>
            )}
          </li>
          <li
            className={isAboutActive ? 'active' : ''}
            onClick={handleAboutClick}
          >
            ABOUT US
          </li>
        </ul>
      </nav>
      {/* Main Content: 3 Rows of Organization Logos */}
      <div className="citizen-logos-container" style={{ opacity: fade ? 0 : 1 }}>
        <div className="citizen-logos-row">
          {[
            'SPAG.png', 'RMFB.png', 'ALERT.png', 'MRAP.png', 'MSG - ERU.png',
            'DRRM - Y.png', 'AKLMV.png', 'JKM.png', 'KAIC.png', 'CCVOL.png',
            'FRONTLINER.png', 'CRRG.png', 'TF.png', 'SRG.png', 'PCGA 107th.png'
          ].map(img => (
            <img
              key={img}
              src={process.env.PUBLIC_URL + '/Assets/' + img}
              alt={img.replace('.png', '')}
              className="citizen-logo-img"
            />
          ))}
        </div>
      </div>

      {/* Announcements Section */}
      <div className="citizen-announcements-section">
        <h2 className="citizen-announcements-title">Announcements</h2>
        {annLoading ? (
          <div className="citizen-loading-message">Loading...</div>
        ) : annError ? (
          <div className="citizen-error-message">{annError}</div>
        ) : announcements.length === 0 ? (
          <p className="citizen-no-data-message">No announcements available.</p>
        ) : (
          <div className="citizen-announcements-grid">
            {announcements.map(a => {
              const isLong = a.description && a.description.split(' ').length > 15;
              return (
                <div
                  key={a.id}
                  className="citizen-announcement-card"
                >
                  {/* Image or Icon */}
                  {a.photo_url ? (
                    <div className="citizen-announcement-image-container">
                      <img
                        src={a.photo_url}
                        alt="Announcement"
                        className="citizen-announcement-img"
                        onClick={() => setModalAnn(a)}
                        title="Click to view larger"
                      />
                    </div>
                  ) : (
                    <div className="citizen-announcement-icon-container">
                      <FaBullhorn size={60} color="#a52a1a" className="citizen-announcement-icon" />
                    </div>
                  )}
                  {/* Date Badge */}
                  <div className="citizen-announcement-date-badge">{a.created_at && formatDate(a.created_at)}</div>
                  {/* Title/Description */}
                  <div className="citizen-announcement-content">
                    {a.title && <div className="citizen-announcement-title">{a.title}</div>}
                    {a.description && (
                      <div className="citizen-announcement-desc">
                        {getPreview(a.description, 15)}
                        {isLong && (
                          <button
                            className="citizen-announcement-see-more"
                            onClick={e => {
                              e.stopPropagation();
                              setModalAnn(a);
                            }}
                          >
                            See more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Training Programs as Posts */}
      <div className="citizen-training-section">
        <h2 className="citizen-training-title">Training Programs</h2>
        <div className="citizen-training-grid">
          {loading ? (
            <div className="citizen-loading-message">Loading...</div>
          ) : error ? (
            <div className="citizen-error-message">{error}</div>
          ) : programs.length === 0 ? (
            <p className="citizen-no-data-message">No training programs available.</p>
          ) : (
            programs.map((program) => (
              <div
                key={program.id}
                className="citizen-training-card"
              >
                {/* Date and Location Bar */}
                <div className="citizen-training-header">
                  {program.date && <span>{program.date}</span>}
                  {program.location && <span className="citizen-training-location">| {program.location}</span>}
                </div>
                {/* Title and Description */}
                <div className="citizen-training-content">
                  <div className="citizen-training-title-card">{program.name}</div>
                  <div className="citizen-training-date">{program.date}{program.location && <span> &bull; {program.location}</span>}</div>
                  <div className="citizen-training-desc">{program.description}</div>
                </div>
                {/* Post image */}
                {program.image_url && (
                  <img
                    src={program.image_url}
                    alt="Program"
                    className="citizen-training-img"
                    onClick={() => openImageModal(program.image_url)}
                    title="Click to view larger"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {/* Image Modal */}
      {modalOpen && (
        <div className="citizen-image-modal-overlay" onClick={closeImageModal}>
          <div className="citizen-image-modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={closeImageModal} className="citizen-image-modal-close">&times;</button>
            <img src={modalImg} alt="Large Program" className="citizen-image-modal-img" />
          </div>
        </div>
      )}
      {/* Announcement Modal */}
      {modalAnn && (
        <div className="citizen-modal-overlay" onClick={() => setModalAnn(null)}>
          <div className="citizen-modal-content" onClick={e => e.stopPropagation()}>
            <button className="citizen-modal-close" onClick={() => setModalAnn(null)}>&times;</button>
            {modalAnn.photo_url ? (
              <img src={modalAnn.photo_url} alt="Announcement" className="citizen-modal-img" />
            ) : (
              <FaBullhorn size={60} color="#a52a1a" className="citizen-announcement-icon" style={{ marginBottom: 18 }} />
            )}
            <div className="citizen-modal-title">{modalAnn.title}</div>
            <div className="citizen-modal-desc">{modalAnn.description}</div>
          </div>
        </div>
      )}
      {/* Footer always at the bottom */}
      <footer className="citizen-footer">
        <div className="citizen-footer-text">
          &copy; {new Date().getFullYear()} DPAR Volunteer Coalition. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default CitizenPage; 
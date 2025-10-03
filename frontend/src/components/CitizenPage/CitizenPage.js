import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../logo.svg';
import axios from 'axios';
import { FaBullhorn, FaShieldAlt, FaClipboardList, FaHandsHelping, FaRedo, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import './CitizenPage.css';
import { API_BASE } from '../../utils/url';

// Helper for formatting date
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function CitizenPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fade, setFade] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  // Associate groups state
  const [associateGroups, setAssociateGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // For training program modal
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleDropdown = () => setDropdownOpen(!dropdownOpen);
  const closeDropdown = () => setDropdownOpen(false);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => {
    setSidebarOpen(false);
    setSidebarDropdownOpen(false);
  };
  
  const toggleSidebarDropdown = () => setSidebarDropdownOpen(!sidebarDropdownOpen);

  // Animation and navigation for About Us
  const handleAboutClick = () => {
    setFade(true);
    setTimeout(() => {
      navigate('/citizen/about');
    }, 350);
  };

  // Navigation handlers for sidebar
  const handleHomeClick = () => {
    closeSidebar();
    setFade(true);
    setTimeout(() => {
      navigate('/citizen');
    }, 350);
  };

  const handleCategoryClick = (category) => {
    closeSidebar();
    setFade(true);
    setTimeout(() => {
      navigate(`/citizen/${category.toLowerCase()}`);
    }, 350);
  };

  // Determine if ABOUT US is active
  const isAboutActive = location.pathname === '/citizen/about';

  useEffect(() => {
    fetchPrograms();
    fetchAssociateGroups();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/training-programs`);
      setPrograms(res.data);
    } catch (err) {
      setError('Failed to load training programs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch associate groups (no auth required for public view)
  const fetchAssociateGroups = async () => {
    setGroupsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/associate-groups/public`);
      setAssociateGroups(res.data);
    } catch (err) {
      setGroupsError('Failed to load associate groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  // Fetch announcements (no auth)
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setAnnLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/announcements`);
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

  // Function to truncate description to 3 lines
  const truncateDescription = (text, maxLines = 3) => {
    if (!text) return '';
    
    // Split by both newlines and spaces to handle long text better
    const words = text.split(' ');
    const maxWords = 25; // Limit to approximately 3 lines
    
    if (words.length <= maxWords) return text;
    
    // Join first 25 words and add ellipsis
    return words.slice(0, maxWords).join(' ') + '...';
  };

  // Function to check if description needs truncation
  const needsTruncation = (text, maxLines = 3) => {
    if (!text) return false;
    
    // Check both word count and character length for better detection
    const words = text.split(' ');
    const charCount = text.length;
    
    return words.length > 25 || charCount > 120; // More lenient limits
  };

  // Track which announcement is expanded
  const [expandedAnn, setExpandedAnn] = useState({});

  // Helper function to get logo URL (similar to AssociateGroups.js)
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return `${window.location.origin}/Assets/disaster_logo.png`;
    
    // Handle storage URLs
    if (logoPath.startsWith('logos/')) {
      return `${API_BASE}/storage/${logoPath}`;
    }
    
    // Handle full URLs
    if (logoPath.startsWith('http')) {
      return logoPath;
    }
    
    // Handle storage paths
    if (logoPath.startsWith('/storage/')) {
      return `${API_BASE}${logoPath}`;
    }
    
    // Handle asset paths
    if (logoPath.startsWith('/Assets/')) {
      return `${window.location.origin}${logoPath}`;
    }
    
    // If it's just a filename, assume it's in storage
    if (!logoPath.includes('/')) {
      return `${API_BASE}/storage/logos/${logoPath}`;
    }
    
    return logoPath;
  };

  // Handle group click to show details
  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setShowGroupModal(true);
  };

  // Handle training program click to show details
  const handleProgramClick = (program) => {
    setSelectedProgram(program);
    setShowProgramModal(true);
    setCurrentPhotoIndex(0);
  };

  // Handle announcement click to show details
  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
    setCurrentPhotoIndex(0);
  };

  // Photo navigation functions - work with both training programs and announcements
  const nextPhoto = () => {
    const currentPhotos = selectedProgram?.photos || selectedAnnouncement?.photo_urls;
    if (currentPhotos && currentPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === currentPhotos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    const currentPhotos = selectedProgram?.photos || selectedAnnouncement?.photo_urls;
    if (currentPhotos && currentPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? currentPhotos.length - 1 : prev - 1
      );
    }
  };

  // Inline style for associate groups background image
  const logosBgStyle = {
    background: "url('/Assets/compiled_activities.jpg') no-repeat center center",
    backgroundSize: "cover",
    position: "relative",
    overflow: "hidden"
  };

  return (
    <div className="citizen-page-wrapper">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="citizen-sidebar-overlay" onClick={closeSidebar} />
      )}
      
      {/* Mobile Sidebar */}
      <nav className={`citizen-sidebar${sidebarOpen ? ' open' : ''}`}>
        <button className="citizen-sidebar-close" onClick={closeSidebar}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        {/* Removed sidebar header title */}
        <ul className="citizen-sidebar-nav">
          <li onClick={handleHomeClick}>HOME</li>
          <li className="citizen-sidebar-dropdown">
            <div className="citizen-sidebar-dropdown-header" onClick={toggleSidebarDropdown}>
              <span>CATEGORIES</span>
              <span className={`citizen-sidebar-dropdown-arrow${sidebarDropdownOpen ? ' open' : ''}`}>
                ▼
              </span>
            </div>
            {sidebarDropdownOpen && (
              <ul className="citizen-sidebar-dropdown-list">
                <li onClick={() => handleCategoryClick('mitigation')}>MITIGATION</li>
                <li onClick={() => handleCategoryClick('preparedness')}>PREPAREDNESS</li>
                <li onClick={() => handleCategoryClick('response')}>RESPONSE</li>
                <li onClick={() => handleCategoryClick('recovery')}>RECOVERY</li>
              </ul>
            )}
          </li>
          <li onClick={handleAboutClick}>ABOUT US</li>
        </ul>
      </nav>

      {/* Navigation Bar */}
      <nav className="citizen-navbar">
        <div className="citizen-navbar-title">DPAR VOLUNTEER COALITION</div>
        
        {/* Hamburger Menu for Mobile */}
        <button className="citizen-hamburger-btn" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        
        {/* Desktop Navigation */}
        <ul className="citizen-navbar-list">
          <li style={{ background: '#a52a1a' }}>HOME</li>
          <li className="citizen-navbar-dropdown" onMouseLeave={closeDropdown}>
            <span 
              onClick={handleDropdown} 
              className="citizen-dropdown-button"
              style={{ 
                background: dropdownOpen ? '#a52a1a' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                border: dropdownOpen ? '2px solid #fff' : '2px solid transparent',
                boxShadow: dropdownOpen ? '0 4px 12px rgba(165,42,26,0.3)' : 'none'
              }}
            >
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>CATEGORIES</span>
              <span 
                style={{ 
                  fontSize: '10px',
                  transition: 'transform 0.3s ease',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              >
                ▼
              </span>
            </span>
            {dropdownOpen && (
              <ul className="citizen-navbar-dropdown-list">
                <li onClick={() => {
                  closeDropdown();
                  setFade(true);
                  setTimeout(() => {
                    navigate('/citizen/mitigation');
                  }, 350);
                }}>MITIGATION</li>
                <li onClick={() => {
                  closeDropdown();
                  setFade(true);
                  setTimeout(() => {
                    navigate('/citizen/preparedness');
                  }, 350);
                }}>PREPAREDNESS</li>
                <li onClick={() => {
                  closeDropdown();
                  setFade(true);
                  setTimeout(() => {
                    navigate('/citizen/response');
                  }, 350);
                }}>RESPONSE</li>
                <li onClick={() => {
                  closeDropdown();
                  setFade(true);
                  setTimeout(() => {
                    navigate('/citizen/recovery');
                  }, 350);
                }}>RECOVERY</li>
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
      {/* Main Content: Dynamic Organization Logos */}
      <div className="citizen-logos-container" style={logosBgStyle}>
        {groupsLoading ? (
          <div className="citizen-loading-message">Loading organizations...</div>
        ) : groupsError ? (
          <div className="citizen-error-message">{groupsError}</div>
        ) : associateGroups.length === 0 ? (
          <div className="citizen-no-data-message">No organizations available.</div>
        ) : (
          <div className="citizen-logos-row">
            {associateGroups.map(group => (
              <img
                key={group.id}
                src={getLogoUrl(group.logo)}
                alt={group.name}
                className="citizen-logo-img"
                onClick={() => handleGroupClick(group)}
                style={{ cursor: 'pointer' }}
                onError={(e) => {
                  console.error('Error loading image:', e.target.src);
                  e.target.src = `${window.location.origin}/Assets/disaster_logo.png`;
                }}
                title={`Click to view ${group.name} details`}
              />
            ))}
          </div>
        )}
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
              return (
                <div
                  key={a.id}
                  className="citizen-announcement-card"
                >
                  {/* Image or Icon */}
                  {a.photo_urls && a.photo_urls.length > 0 ? (
                    <div className="citizen-announcement-image-container">
                      <img
                        src={a.photo_urls[0]}
                        alt="Announcement"
                        className="citizen-announcement-img"
                        onClick={() => handleAnnouncementClick(a)}
                        title="Click to view larger"
                      />
                      {a.photo_urls.length > 1 && (
                        <div className="citizen-announcement-photos-indicator">
                          <span>+{a.photo_urls.length - 1} more</span>
                        </div>
                      )}
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
                        {truncateDescription(a.description)}
                        {needsTruncation(a.description) && (
                          <button
                            className="citizen-announcement-see-more"
                            onClick={e => {
                              e.stopPropagation();
                              handleAnnouncementClick(a);
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
      {/* Phases Section: 4 Cards */}
      <div className="citizen-phases-section">
        <h2 className="citizen-phases-header">DPAR CATEGORIES</h2>
        <div className="citizen-phases-grid">
          <div className="citizen-phase-card" onClick={() => navigate('/citizen/mitigation')} tabIndex={0} role="button" aria-label="Mitigation">
            <FaShieldAlt className="citizen-phase-icon" />
            <div className="citizen-phase-label">MITIGATION</div>
          </div>
          <div className="citizen-phase-card" onClick={() => navigate('/citizen/preparedness')} tabIndex={0} role="button" aria-label="Preparedness">
            <FaClipboardList className="citizen-phase-icon" />
            <div className="citizen-phase-label">PREPAREDNESS</div>
          </div>
          <div className="citizen-phase-card" onClick={() => navigate('/citizen/response')} tabIndex={0} role="button" aria-label="Response">
            <FaHandsHelping className="citizen-phase-icon" />
            <div className="citizen-phase-label">RESPONSE</div>
          </div>
          <div className="citizen-phase-card" onClick={() => navigate('/citizen/recovery')} tabIndex={0} role="button" aria-label="Recovery">
            <FaRedo className="citizen-phase-icon" />
            <div className="citizen-phase-label">RECOVERY</div>
          </div>
        </div>
      </div>
      {/* Training Programs as Posts */}
      <div className="citizen-training-section">
        <div className="citizen-training-header">
          <h2 className="citizen-training-title">Training Programs</h2>
          <p className="citizen-training-subtitle">Enhance your skills with our comprehensive training programs</p>
        </div>
        <div className="citizen-training-card-grid">
          {loading ? (
            <div className="citizen-loading-container">
              <div className="citizen-loading-spinner"></div>
              <p className="citizen-loading-message">Loading training programs...</p>
            </div>
          ) : error ? (
            <div className="citizen-error-container">
              <p className="citizen-error-message">{error}</p>
            </div>
          ) : programs.length === 0 ? (
            <div className="citizen-empty-container">
              <h3 className="citizen-empty-title">No Training Programs Available</h3>
              <p className="citizen-empty-message">Check back later for new training opportunities.</p>
            </div>
          ) : (
            programs.map((program, index) => {
              const title = program.name || '';
              const description = program.description || '';
              const hasPhotos = program.photos && program.photos.length > 0;
              const photoCount = hasPhotos ? program.photos.length : 0;
              
              return (
                <div
                  key={program.id}
                  className="citizen-training-card"
                  onClick={() => handleProgramClick(program)}
                  style={{ 
                    cursor: 'pointer',
                    animationDelay: `${index * 0.1}s`
                  }}
                  onMouseOver={e => { 
                    e.currentTarget.classList.add('citizen-training-card-hover');
                    e.currentTarget.querySelector('.citizen-training-card-overlay').style.opacity = '1';
                  }}
                  onMouseOut={e => { 
                    e.currentTarget.classList.remove('citizen-training-card-hover');
                    e.currentTarget.querySelector('.citizen-training-card-overlay').style.opacity = '0';
                  }}
                >
                  {/* Card Header with Gradient */}
                  <div className="citizen-training-card-header">
                    <div className="citizen-training-card-category">
                      <span className="citizen-training-category-text">Training Program</span>
                    </div>
                    {hasPhotos && (
                      <div className="citizen-training-photo-count">
                        <span>{photoCount} Photos</span>
                      </div>
                    )}
                  </div>

                  {/* Date and Location Badges */}
                  <div className="citizen-training-badges">
                    {program.date && (
                      <div className="citizen-training-date-badge">
                        <span className="citizen-training-badge-text">
                          {new Date(program.date).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    {program.location && (
                      <div className="citizen-training-location-badge">
                        <span className="citizen-training-badge-text">{program.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="citizen-training-card-content">
                    {title && (
                      <h3 className="citizen-training-card-title">{title}</h3>
                    )}
                    
                    {description && (
                      <div className="citizen-training-card-description">
                        <p className="citizen-training-desc-text">
                          {program.photos && program.photos.length > 0 
                            ? description.length > 120 ? description.substring(0, 120) + '...' : description
                            : description.length > 200 ? description.substring(0, 200) + '...' : description
                          }
                        </p>
                        {description.length > (program.photos && program.photos.length > 0 ? 120 : 200) && (
                          <button 
                            className="citizen-training-read-more"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProgramClick(program);
                            }}
                          >
                            Read More
                            <span className="citizen-training-read-more-arrow">→</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Photo Display */}
                  {hasPhotos && (
                    <div className="citizen-training-card-image">
                      <div className="citizen-training-image-container">
                        <img
                          src={program.photos[0]}
                          alt="Training Program"
                          className="citizen-training-card-img"
                        />
                        {photoCount > 1 && (
                          <div className="citizen-training-more-photos">
                            <span className="citizen-training-more-photos-count">+{photoCount - 1}</span>
                          </div>
                        )}
                        <div className="citizen-training-image-overlay">
                          <span className="citizen-training-view-text">View Details</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="citizen-training-card-footer">
                    <div className="citizen-training-card-actions">
                      <button 
                        className="citizen-training-view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProgramClick(program);
                        }}
                      >
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="citizen-training-card-overlay"></div>
                </div>
              );
            })
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
      {selectedAnnouncement && (
        <div className="citizen-modal-overlay" onClick={() => setSelectedAnnouncement(null)}>
          <div className="citizen-modal-content" onClick={e => e.stopPropagation()}>
            <button className="citizen-modal-close" onClick={() => setSelectedAnnouncement(null)}>&times;</button>
            <div className="citizen-announcement-modal-header">
              <h3 className="citizen-announcement-modal-title">{selectedAnnouncement.title}</h3>
            </div>
            
            {/* Date and Location Section - Match Admin Design */}
            <div className="citizen-announcement-modal-meta">
              {selectedAnnouncement.date && (
                <div className="citizen-announcement-modal-date">
                  <strong>Date:</strong> {selectedAnnouncement.date}
                </div>
              )}
              {selectedAnnouncement.location && (
                <div className="citizen-announcement-modal-location">
                  <strong>Location:</strong> {selectedAnnouncement.location}
                </div>
              )}
            </div>
            
            {/* Description Section - Match Admin Design */}
            <div className="citizen-announcement-modal-description">
              <strong>Description:</strong>
              <p style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                maxWidth: '100%',
                wordBreak: 'break-word'
              }}>{selectedAnnouncement.description}</p>
            </div>
            
            {/* Photo Navigation (Instagram/Facebook style) */}
            {selectedAnnouncement.photo_urls && selectedAnnouncement.photo_urls.length > 0 && (
              <div className="citizen-announcement-photo-navigation">
                <div className="citizen-announcement-photo-container">
                  <img 
                    src={selectedAnnouncement.photo_urls[currentPhotoIndex]} 
                    alt={`Photo ${currentPhotoIndex + 1}`} 
                    className="citizen-announcement-modal-img" 
                  />
                  
                  {/* Navigation Arrows */}
                  {selectedAnnouncement.photo_urls.length > 1 && (
                    <>
                      <button 
                        className="citizen-announcement-photo-nav-btn citizen-announcement-photo-nav-prev"
                        onClick={prevPhoto}
                      >
                        <FaChevronLeft />
                      </button>
                      <button 
                        className="citizen-announcement-photo-nav-btn citizen-announcement-photo-nav-next"
                        onClick={nextPhoto}
                      >
                        <FaChevronRight />
                      </button>
                    </>
                  )}
                  
                  {/* Photo Counter */}
                  {selectedAnnouncement.photo_urls.length > 1 && (
                    <div className="citizen-announcement-photo-counter">
                      {currentPhotoIndex + 1} / {selectedAnnouncement.photo_urls.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Organization Details Modal */}
      {showGroupModal && selectedGroup && (
        <div className="citizen-modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="citizen-modal-content" onClick={e => e.stopPropagation()}>
            <button className="citizen-modal-close" onClick={() => setShowGroupModal(false)}>&times;</button>
            <div className="citizen-group-modal-header">
              <img
                src={getLogoUrl(selectedGroup.logo)}
                alt={selectedGroup.name}
                className="citizen-group-modal-logo"
                onError={(e) => {
                  e.target.src = `${window.location.origin}/Assets/disaster_logo.png`;
                }}
              />
              <h3 className="citizen-group-modal-title">{selectedGroup.name}</h3>
            </div>
            <div className="citizen-group-modal-info">
              <div className="citizen-group-info-row">
                <strong>Director:</strong> {selectedGroup.director}
              </div>
              <div className="citizen-group-info-row">
                <strong>Type:</strong> {selectedGroup.type}
              </div>
              <div className="citizen-group-info-row">
                <strong>Members:</strong> {selectedGroup.members_count || 0}
              </div>
            </div>
            <div className="citizen-group-modal-description">
              <strong>Description:</strong>
              <p>{selectedGroup.description}</p>
            </div>
          </div>
        </div>
      )}
      {/* Enhanced Training Program Details Modal */}
      {showProgramModal && selectedProgram && (
        <div className="citizen-training-modal-overlay" onClick={() => setShowProgramModal(false)}>
          <div className="citizen-training-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modern Modal Header */}
            <div className="citizen-training-modal-header">
              <div className="citizen-training-modal-header-content">
                <div className="citizen-training-modal-category">
                  <span className="citizen-training-modal-category-text">Training Program</span>
                </div>
                <div className="citizen-training-modal-meta">
                  {selectedProgram.date && (
                    <div className="citizen-training-modal-date">
                      <span className="citizen-training-modal-meta-label">Date:</span>
                      <span className="citizen-training-modal-meta-value">
                        {new Date(selectedProgram.date).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  {selectedProgram.location && (
                    <div className="citizen-training-modal-location">
                      <span className="citizen-training-modal-meta-label">Location:</span>
                      <span className="citizen-training-modal-meta-value">{selectedProgram.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                className="citizen-training-modal-close"
                onClick={() => setShowProgramModal(false)}
              >
                ×
              </button>
            </div>

            {/* Modal Title */}
            <div className="citizen-training-modal-title-section">
              <h2 className="citizen-training-modal-title">{selectedProgram.name}</h2>
            </div>
            
            {/* Scrollable content container */}
            <div className="citizen-training-modal-scrollable">
              {/* Description Section */}
              <div className="citizen-training-modal-description-section">
                <div className="citizen-training-modal-description-header">
                  <h3 className="citizen-training-modal-description-title">Program Description</h3>
                </div>
                <div className="citizen-training-modal-description-content">
                  <p className="citizen-training-modal-description-text">
                    {selectedProgram.description}
                  </p>
                </div>
              </div>
              
              {/* Enhanced Photo Gallery */}
              {selectedProgram.photos && selectedProgram.photos.length > 0 && (
                <div className="citizen-training-modal-gallery">
                  <div className="citizen-training-modal-gallery-header">
                    <h3 className="citizen-training-modal-gallery-title">Program Photos</h3>
                    {selectedProgram.photos.length > 1 && (
                      <div className="citizen-training-modal-gallery-counter">
                        {currentPhotoIndex + 1} of {selectedProgram.photos.length}
                      </div>
                    )}
                  </div>
                  
                  <div className="citizen-training-modal-gallery-container">
                    <div className="citizen-training-modal-image-wrapper">
                      <img
                        src={selectedProgram.photos[currentPhotoIndex]}
                        alt={`Training Program Photo ${currentPhotoIndex + 1}`}
                        className="citizen-training-modal-image"
                      />
                      
                      {/* Navigation Arrows */}
                      {selectedProgram.photos.length > 1 && (
                        <>
                          <button 
                            className="citizen-training-modal-nav-btn citizen-training-modal-nav-prev"
                            onClick={prevPhoto}
                          >
                            <FaChevronLeft />
                          </button>
                          <button 
                            className="citizen-training-modal-nav-btn citizen-training-modal-nav-next"
                            onClick={nextPhoto}
                          >
                            <FaChevronRight />
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Photo Thumbnails */}
                    {selectedProgram.photos.length > 1 && (
                      <div className="citizen-training-modal-thumbnails">
                        {selectedProgram.photos.map((photo, index) => (
                          <button
                            key={index}
                            className={`citizen-training-modal-thumbnail ${index === currentPhotoIndex ? 'active' : ''}`}
                            onClick={() => setCurrentPhotoIndex(index)}
                          >
                            <img src={photo} alt={`Thumbnail ${index + 1}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../logo.svg';
import axios from 'axios';
import { FaBullhorn, FaShieldAlt, FaClipboardList, FaHandsHelping, FaRedo } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import './CitizenPage.css';

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
  const [modalAnn, setModalAnn] = useState(null);

  // Associate groups state
  const [associateGroups, setAssociateGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // For training program modal
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showProgramModal, setShowProgramModal] = useState(false);

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
      const res = await axios.get('http://localhost:8000/api/training-programs');
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
      const res = await axios.get('http://localhost:8000/api/associate-groups/public');
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

  // Helper function to get logo URL (similar to AssociateGroups.js)
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return `${window.location.origin}/Assets/disaster_logo.png`;
    
    // Handle storage URLs
    if (logoPath.startsWith('logos/')) {
      return `http://localhost:8000/storage/${logoPath}`;
    }
    
    // Handle full URLs
    if (logoPath.startsWith('http')) {
      return logoPath;
    }
    
    // Handle storage paths
    if (logoPath.startsWith('/storage/')) {
      return `http://localhost:8000${logoPath}`;
    }
    
    // Handle asset paths
    if (logoPath.startsWith('/Assets/')) {
      return `${window.location.origin}${logoPath}`;
    }
    
    // If it's just a filename, assume it's in storage
    if (!logoPath.includes('/')) {
      return `http://localhost:8000/storage/logos/${logoPath}`;
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
        <h2 className="citizen-training-title">Training Programs</h2>
        <div className="citizen-training-grid">
          {loading ? (
            <div className="citizen-loading-message">Loading...</div>
          ) : error ? (
            <div className="citizen-error-message">{error}</div>
          ) : programs.length === 0 ? (
            <p className="citizen-no-data-message">No training programs available.</p>
          ) : (
            programs.map((program) => {
              const isLong = program.description && program.description.split(' ').length > 15;
              return (
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
                    <div className="citizen-training-desc">
                      {getPreview(program.description, 15)}
                      {isLong && (
                        <button
                          className="citizen-training-see-more"
                          onClick={e => {
                            e.stopPropagation();
                            handleProgramClick(program);
                          }}
                        >
                          See more
                        </button>
                      )}
                    </div>
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
      {/* Training Program Details Modal */}
      {showProgramModal && selectedProgram && (
        <div className="citizen-modal-overlay" onClick={() => setShowProgramModal(false)}>
          <div className="citizen-modal-content" onClick={e => e.stopPropagation()}>
            <button className="citizen-modal-close" onClick={() => setShowProgramModal(false)}>&times;</button>
            <div className="citizen-program-modal-header">
              <h3 className="citizen-program-modal-title">{selectedProgram.name}</h3>
            </div>
            <div className="citizen-program-modal-info">
              {selectedProgram.date && (
                <div className="citizen-program-info-row">
                  <strong>Date:</strong> {selectedProgram.date}
                </div>
              )}
              {selectedProgram.location && (
                <div className="citizen-program-info-row">
                  <strong>Location:</strong> {selectedProgram.location}
                </div>
              )}
            </div>
            <div className="citizen-program-modal-description">
              <strong>Description:</strong>
              <p>{selectedProgram.description}</p>
            </div>
            {selectedProgram.image_url && (
              <div className="citizen-program-modal-image">
                <img
                  src={selectedProgram.image_url}
                  alt="Training Program"
                  className="citizen-program-modal-img"
                  onClick={() => {
                    setShowProgramModal(false);
                    openImageModal(selectedProgram.image_url);
                  }}
                  title="Click to view larger"
                />
              </div>
            )}
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
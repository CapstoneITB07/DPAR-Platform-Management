import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../../logo.svg';
import axios from 'axios';
import { FaBullhorn, FaShieldAlt, FaClipboardList, FaHandsHelping, FaRedo, FaChevronLeft, FaChevronRight, FaBell, FaBellSlash } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../css/CitizenPage.css';
import LogosCarousel from './LogosCarousel';
import { API_BASE } from '../../../utils/url';
import { 
  isPushNotificationSupported, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed 
} from '../../../utils/pushNotifications';

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
    checkPushNotificationStatus();
  }, []);

  const checkPushNotificationStatus = async () => {
    const supported = isPushNotificationSupported();
    setPushNotificationsSupported(supported);
    
    if (supported) {
      const subscribed = await isPushNotificationSubscribed();
      setPushNotificationsEnabled(subscribed);
    }
  };

  const togglePushNotifications = async () => {
    try {
      if (pushNotificationsEnabled) {
        await unsubscribeFromPushNotifications();
        setPushNotificationsEnabled(false);
        alert('Push notifications disabled successfully');
      } else {
        await subscribeToPushNotifications();
        setPushNotificationsEnabled(true);
        alert('Push notifications enabled successfully! You will receive announcements and training program updates even when not on the site.');
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      alert('Failed to toggle push notifications. ' + error.message);
    }
  };

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

  // Push notification states
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [pushNotificationsSupported, setPushNotificationsSupported] = useState(false);
  const [showPushButton, setShowPushButton] = useState(true);

  // Carousel states for announcements
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

  // Carousel states for training programs
  const [currentProgramIndex, setCurrentProgramIndex] = useState(0);

  // Reset announcement index when announcements change
  useEffect(() => {
    if (currentAnnouncementIndex >= announcements.length && announcements.length > 0) {
      setCurrentAnnouncementIndex(0);
    }
  }, [announcements, currentAnnouncementIndex]);

  // Reset program index when programs change
  useEffect(() => {
    if (currentProgramIndex >= programs.length && programs.length > 0) {
      setCurrentProgramIndex(0);
    }
  }, [programs, currentProgramIndex]);

  // Navigation handlers for announcements carousel
  const goToPreviousAnnouncement = () => {
    setCurrentAnnouncementIndex((prev) => 
      prev === 0 ? announcements.length - 1 : prev - 1
    );
  };

  const goToNextAnnouncement = () => {
    setCurrentAnnouncementIndex((prev) => 
      prev === announcements.length - 1 ? 0 : prev + 1
    );
  };

  // Navigation handlers for training programs carousel
  const goToPreviousProgram = () => {
    setCurrentProgramIndex((prev) => 
      prev === 0 ? programs.length - 1 : prev - 1
    );
  };

  const goToNextProgram = () => {
    setCurrentProgramIndex((prev) => 
      prev === programs.length - 1 ? 0 : prev + 1
    );
  };

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
      {/* Main Content: Dynamic Organization Logos Carousel */}
      <div className="citizen-logos-container" style={logosBgStyle}>
        {groupsLoading ? (
          <div className="citizen-loading-message">Loading organizations...</div>
        ) : groupsError ? (
          <div className="citizen-error-message">{groupsError}</div>
        ) : associateGroups.length === 0 ? (
          <div className="citizen-no-data-message">No organizations available.</div>
        ) : (
          <LogosCarousel 
            logos={associateGroups.map(group => ({
              id: group.id,
              name: group.name,
              logo: getLogoUrl(group.logo),
              // Include all group data for the modal
              director: group.director,
              type: group.type,
              members_count: group.members_count,
              description: group.description
            }))}
            onLogoClick={handleGroupClick}
          />
        )}
      </div>

      {/* Side by Side Container for Announcements and Training Programs */}
      <div className="citizen-side-by-side-container" style={{
        display: 'flex',
        gap: '30px',
        padding: '30px 40px',
        maxWidth: '95%',
        margin: '0 auto',
        flexWrap: 'wrap',
        alignItems: 'flex-start'
      }}>
      {/* Announcements Section */}
        <div 
          className="citizen-announcements-section" 
          style={{
            flex: '1',
            minWidth: '300px',
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '3px solid transparent',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease, border 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            e.currentTarget.style.border = '3px solid #a52a1a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
            e.currentTarget.style.border = '3px solid transparent';
          }}
        >
          <h2 className="citizen-announcements-title" style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#a52a1a',
            margin: '0 0 20px 0',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            borderBottom: '3px solid #a52a1a',
            paddingBottom: '10px',
            lineHeight: '1.2'
          }}>Announcements</h2>
        {annLoading ? (
            <div className="citizen-loading-message" style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              fontSize: '1.1rem'
            }}>Loading...</div>
        ) : annError ? (
            <div className="citizen-error-message" style={{
              textAlign: 'center',
              padding: '40px',
              color: '#e53935',
              fontSize: '1.1rem'
            }}>{annError}</div>
        ) : announcements.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999'
            }}>
              <FaBullhorn size={80} color="#ddd" style={{ marginBottom: '20px' }} />
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '10px',
                margin: '0 0 10px 0'
              }}>No Announcements Available</h3>
              <p style={{
                fontSize: '1.1rem',
                color: '#999',
                margin: '0'
              }}>Check back later for new announcements.</p>
            </div>
          ) : (
            <div style={{ position: 'relative', minHeight: '400px' }}>
              {announcements.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousAnnouncement}
                    style={{
                      position: 'absolute',
                      left: '-15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      background: '#a52a1a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#8a2316';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#a52a1a';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={goToNextAnnouncement}
                    style={{
                      position: 'absolute',
                      right: '-15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      background: '#a52a1a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#8a2316';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#a52a1a';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
              
              {/* Display single announcement */}
              <div style={{ padding: '10px 0' }}>
                {announcements.map((a, index) => (
                <div
                  key={a.id}
                  className="citizen-announcement-card"
                    style={{
                      display: index === currentAnnouncementIndex ? 'block' : 'none',
                      transition: 'opacity 0.3s ease-in-out',
                      background: '#fff',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  >
                    {/* Date Badge */}
                    <div style={{
                      background: '#8B1409',
                      color: 'white',
                      padding: '8px 20px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'inline-block',
                      margin: '15px 0 0 15px'
                    }}>
                      {a.created_at && formatDate(a.created_at)}
                    </div>

                    {/* Main Content Container */}
                    <div style={{ padding: '20px 25px' }}>
                  {/* Image or Icon */}
                  {a.photo_urls && a.photo_urls.length > 0 ? (
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          height: '300px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          marginBottom: '20px',
                          cursor: 'pointer'
                        }}>
                      <img
                        src={a.photo_urls[0]}
                        alt="Announcement"
                        onClick={() => handleAnnouncementClick(a)}
                        title="Click to view larger"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      />
                      {a.photo_urls.length > 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: '600'
                            }}>
                              +{a.photo_urls.length - 1} Photos
                        </div>
                      )}
                    </div>
                  ) : (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '150px',
                          background: 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)',
                          borderRadius: '12px',
                          marginBottom: '20px'
                        }}>
                          <FaBullhorn size={70} color="#a52a1a" />
                    </div>
                  )}

                      {/* Title */}
                      {a.title && (
                        <h3 style={{
                          color: '#8B1409',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          marginBottom: '15px',
                          lineHeight: '1.4'
                        }}>
                          {a.title}
                        </h3>
                      )}

                      {/* Description */}
                    {a.description && (
                        <div style={{
                          color: '#555',
                          fontSize: '1rem',
                          lineHeight: '1.7',
                          marginBottom: '20px'
                        }}>
                        {truncateDescription(a.description)}
                        </div>
                      )}

                      {/* See More Button */}
                        {needsTruncation(a.description) && (
                          <button
                          onClick={(e) => {
                              e.stopPropagation();
                              handleAnnouncementClick(a);
                            }}
                          style={{
                            background: '#a52a1a',
                            color: 'white',
                            border: 'none',
                            padding: '12px 30px',
                            borderRadius: '25px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 10px rgba(165,42,26,0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#8a2316';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 15px rgba(165,42,26,0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#a52a1a';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 10px rgba(165,42,26,0.3)';
                          }}
                        >
                          See More →
                          </button>
                        )}
                      </div>
                  </div>
                ))}
                </div>

              {/* Carousel Indicators */}
              {announcements.length > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '15px'
                }}>
                  {announcements.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentAnnouncementIndex(index)}
                      style={{
                        width: index === currentAnnouncementIndex ? '30px' : '10px',
                        height: '10px',
                        borderRadius: '5px',
                        border: 'none',
                        background: index === currentAnnouncementIndex ? '#a52a1a' : '#ddd',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
          </div>
        )}
      </div>
          )}
          </div>

      {/* Training Programs as Posts */}
        <div 
          className="citizen-training-section" 
          style={{
            flex: '1',
            minWidth: '300px',
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '3px solid transparent',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease, border 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            e.currentTarget.style.border = '3px solid #a52a1a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
            e.currentTarget.style.border = '3px solid transparent';
          }}
        >
          <h2 className="citizen-training-title" style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#a52a1a',
            margin: '0 0 20px 0',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            borderBottom: '3px solid #a52a1a',
            paddingTop: '30px',
            paddingBottom: '10px',
            lineHeight: '1.2'
          }}>Training Programs</h2>
        <div>
          {loading ? (
            <div className="citizen-loading-container" style={{
              textAlign: 'center',
              padding: '40px'
            }}>
              <div className="citizen-loading-spinner"></div>
              <p className="citizen-loading-message" style={{
                color: '#666',
                fontSize: '1.1rem'
              }}>Loading training programs...</p>
            </div>
          ) : error ? (
            <div className="citizen-error-container" style={{
              textAlign: 'center',
              padding: '40px'
            }}>
              <p className="citizen-error-message" style={{
                color: '#e53935',
                fontSize: '1.1rem'
              }}>{error}</p>
            </div>
          ) : programs.length === 0 ? (
            <div className="citizen-empty-container" style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999'
            }}>
              <FaClipboardList size={80} color="#ddd" style={{ marginBottom: '20px' }} />
              <h3 className="citizen-empty-title" style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#333',
                margin: '0 0 10px 0'
              }}>No Training Programs Available</h3>
              <p className="citizen-empty-message" style={{
                fontSize: '1.1rem',
                color: '#999',
                margin: '0'
              }}>Check back later for new training opportunities.</p>
            </div>
          ) : (
            <div style={{ position: 'relative', minHeight: '350px' }}>
              {programs.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousProgram}
                    style={{
                      position: 'absolute',
                      left: '-15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      background: '#a52a1a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#8a2316';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#a52a1a';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={goToNextProgram}
                    style={{
                      position: 'absolute',
                      right: '-15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      background: '#a52a1a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#8a2316';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#a52a1a';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
              
              {/* Display single training program */}
              <div style={{ padding: '10px 0' }}>
              {programs.map((program, index) => {
              const title = program.name || '';
              const description = program.description || '';
              const hasPhotos = program.photos && program.photos.length > 0;
              const photoCount = hasPhotos ? program.photos.length : 0;
              
              return (
                <div
                  key={program.id}
                  className="citizen-training-card"
                  style={{ 
                    display: index === currentProgramIndex ? 'block' : 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.3s ease-in-out',
                    background: '#fff',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                  onClick={() => handleProgramClick(program)}
                >
                  {/* Header Badge */}
                  <div style={{
                    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                    color: 'white',
                    padding: '15px 25px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '1rem' }}>Training Program</span>
                    {hasPhotos && (
                      <span style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '4px 12px',
                        borderRadius: '15px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
                      </span>
                    )}
                  </div>

                  {/* Main Content Container */}
                  <div style={{ padding: '15px 20px' }}>
                  {/* Date and Location Badges */}
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      flexWrap: 'wrap',
                      marginBottom: '15px'
                    }}>
                    {program.date && (
                        <div style={{
                          background: '#8B1409',
                          color: 'white',
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          {new Date(program.date).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                      </div>
                    )}
                    {program.location && (
                        <div style={{
                          background: '#e3f2fd',
                          color: '#1976d2',
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          📍 {program.location}
                      </div>
                    )}
                  </div>

                    {/* Title */}
                    {title && (
                      <h3 style={{
                        color: '#8B1409',
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        marginBottom: '12px',
                        lineHeight: '1.3'
                      }}>
                        {title}
                      </h3>
                    )}

                    {/* Description */}
                    {description && (
                      <div style={{
                        color: '#555',
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        marginBottom: '15px'
                      }}>
                          {program.photos && program.photos.length > 0 
                            ? description.length > 100 ? description.substring(0, 100) + '...' : description
                            : description.length > 150 ? description.substring(0, 150) + '...' : description
                          }
                      </div>
                    )}

                  {/* Photo Display */}
                  {hasPhotos && (
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '310px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: '20px'
                      }}>
                        <img
                          src={program.photos[0]}
                          alt="Training Program"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        />
                        {photoCount > 1 && (
                          <div style={{
                            position: 'absolute',
                            bottom: '15px',
                            right: '15px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '25px',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}>
                            +{photoCount - 1} More
                          </div>
                        )}
                    </div>
                  )}

                    {/* View Details Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProgramClick(program);
                        }}
                      style={{
                        background: '#a52a1a',
                        color: 'white',
                        border: 'none',
                        padding: '12px 30px',
                        borderRadius: '25px',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 10px rgba(165,42,26,0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#8a2316';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 15px rgba(165,42,26,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#a52a1a';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 10px rgba(165,42,26,0.3)';
                      }}
                    >
                      View Details →
                      </button>
                    </div>
                </div>
              );
            })}
                  </div>

              {/* Carousel Indicators */}
              {programs.length > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '15px'
                }}>
                  {programs.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentProgramIndex(index)}
                      style={{
                        width: index === currentProgramIndex ? '30px' : '10px',
                        height: '10px',
                        borderRadius: '5px',
                        border: 'none',
                        background: index === currentProgramIndex ? '#a52a1a' : '#ddd',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>
          )}
        </div>
          )}
      </div>
        </div>
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
      {/* Floating Push Notification Button */}
      {pushNotificationsSupported && showPushButton && (
        <button
          className="citizen-push-notification-fab"
          onClick={togglePushNotifications}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: pushNotificationsEnabled ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            transition: 'all 0.3s ease',
            zIndex: 1000,
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          }}
          title={pushNotificationsEnabled ? 'Push Notifications ON - Click to disable' : 'Push Notifications OFF - Click to enable'}
        >
          {pushNotificationsEnabled ? <FaBell /> : <FaBellSlash />}
        </button>
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
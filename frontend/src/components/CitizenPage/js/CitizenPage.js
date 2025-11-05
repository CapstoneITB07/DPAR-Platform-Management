import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../../logo.svg';
import axios from 'axios';
import { FaBullhorn, FaShieldAlt, FaClipboardList, FaHandsHelping, FaRedo, FaChevronLeft, FaChevronRight, FaBell, FaBellSlash, FaUserTie, FaUsers } from 'react-icons/fa';
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
    
    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
    setError(''); // Clear previous errors
    try {
      const res = await axios.get(`${API_BASE}/api/training-programs`);
      setPrograms(res.data || []);
    } catch (err) {
      // Check if it's a network error (offline) - service worker should handle caching
      if (!navigator.onLine || err.code === 'ERR_NETWORK' || err.message?.includes('Network') || err.response?.status === 503) {
        // Service worker should serve cached data, but if it doesn't, show empty state
        setPrograms([]); // Show empty state instead of error
        setError(''); // Don't show error message when offline - cached data will show if available
      } else {
        // For other errors, show error message
        setError('Failed to load training programs');
        setPrograms([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch associate groups (no auth required for public view)
  const fetchAssociateGroups = async () => {
    setGroupsLoading(true);
    setGroupsError(''); // Clear previous errors
    try {
      const res = await axios.get(`${API_BASE}/api/associate-groups/public`);
      setAssociateGroups(res.data || []);
    } catch (err) {
      // Check if it's a network error (offline) - service worker should handle caching
      if (!navigator.onLine || err.code === 'ERR_NETWORK' || err.message?.includes('Network') || err.response?.status === 503) {
        // Service worker should serve cached data, but if it doesn't, show empty state
        setAssociateGroups([]); // Show empty state instead of error
        setGroupsError(''); // Don't show error message when offline - cached data will show if available
      } else {
        // For other errors, show error message
        setGroupsError('Failed to load associate groups');
        setAssociateGroups([]);
      }
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
    setAnnError(''); // Clear previous errors
    try {
      const res = await axios.get(`${API_BASE}/api/announcements`);
      setAnnouncements(res.data || []);
    } catch (err) {
      // Check if it's a network error (offline) - service worker should handle caching
      if (!navigator.onLine || err.code === 'ERR_NETWORK' || err.message?.includes('Network') || err.response?.status === 503) {
        // Service worker should serve cached data, but if it doesn't, show empty state
        setAnnouncements([]); // Show empty state instead of error
        setAnnError(''); // Don't show error message when offline - cached data will show if available
      } else {
        // For other errors, show error message
        setAnnError('Failed to load announcements');
        setAnnouncements([]);
      }
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
  
  // Offline state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  // Auto-play carousel for announcements
  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAnnouncementIndex((prev) => 
          prev === announcements.length - 1 ? 0 : prev + 1
        );
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [announcements.length]);

  // Auto-play carousel for training programs
  useEffect(() => {
    if (programs.length > 1) {
      const interval = setInterval(() => {
        setCurrentProgramIndex((prev) => 
          prev === programs.length - 1 ? 0 : prev + 1
        );
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [programs.length]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAnnouncementModal || showProgramModal || showGroupModal || modalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAnnouncementModal, showProgramModal, showGroupModal, modalOpen]);

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

  // Swipe gesture handlers for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextPhoto();
    } else if (isRightSwipe) {
      prevPhoto();
    }
    
    // Reset
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Background image style moved to CSS

  return (
    <div className={`citizen-page-wrapper ${isOffline ? 'offline-mode' : ''}`}>
      {/* Offline Indicator */}
      {isOffline && (
        <div className="citizen-offline-banner">
          <span className="citizen-offline-icon">📡</span>
          <span className="citizen-offline-text">You are offline. Showing cached content.</span>
        </div>
      )}
      
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
          <li className="home-active">HOME</li>
          <li className="citizen-navbar-dropdown" onMouseLeave={closeDropdown}>
            <span 
              onClick={handleDropdown} 
              className={`citizen-dropdown-button ${dropdownOpen ? 'open' : ''}`}
            >
              <span className="citizen-dropdown-text">CATEGORIES</span>
              <span className={`citizen-dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>
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
      <div className="citizen-logos-container">
        {groupsLoading ? (
          <div className="organization-loading-container">
            <div className="organization-loading-top-line"></div>
            <div className="organization-loading-dots">
              <div className="organization-loading-dot"></div>
              <div className="organization-loading-dot"></div>
              <div className="organization-loading-dot"></div>
            </div>
            <div className="organization-loading-title">LOADING ASSOCIATE GROUPS</div>
            <div className="organization-loading-subtitle">Fetching associate group data and applications...</div>
          </div>
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
      <div className="citizen-side-by-side-container">
        <div className="citizen-content-columns">
          {/* Announcements Section */}
          <div className="citizen-announcements-section">
          <h2 className="citizen-announcements-title">Announcements</h2>
        {annLoading ? (
            <div className="citizen-loading-container">
              <div className="citizen-loading-spinner"></div>
              <p className="citizen-loading-message">Loading announcements...</p>
            </div>
        ) : annError ? (
            <div className="citizen-error-text">{annError}</div>
        ) : announcements.length === 0 ? (
            <div className="citizen-no-announcements-container">
              <FaBullhorn size={80} color="#ddd" className="citizen-icon-margin" />
              <h3 className="citizen-no-announcements-title">No Announcements Available</h3>
              <p className="citizen-no-announcements-message">Check back later for new announcements.</p>
            </div>
          ) : (
            <div className="citizen-announcement-carousel-container">
              {announcements.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousAnnouncement}
                    className="citizen-announcement-carousel-nav-btn citizen-announcement-carousel-nav-btn-left"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={goToNextAnnouncement}
                    className="citizen-announcement-carousel-nav-btn citizen-announcement-carousel-nav-btn-right"
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
              
              {/* Display single announcement */}
              <div className="citizen-announcement-carousel-content">
                {announcements.map((a, index) => (
                <div
                  key={a.id}
                  className="citizen-announcement-card-wrapper"
                  style={{ display: index === currentAnnouncementIndex ? 'block' : 'none' }}
                  >
                    {/* Date Badge */}
                    <div className="citizen-announcement-date-badge-inline">
                      {a.created_at && formatDate(a.created_at)}
                    </div>

                    {/* Main Content Container */}
                    <div className="citizen-announcement-main-content">
                  {/* Image or Icon */}
                  {a.photo_urls && a.photo_urls.length > 0 ? (
                        <div className="citizen-announcement-image-wrapper">
                      <img
                        src={a.photo_urls[0]}
                        alt="Announcement"
                        onClick={() => handleAnnouncementClick(a)}
                        title="Click to view larger"
                        className="citizen-announcement-image-main"
                      />
                      {a.photo_urls.length > 1 && (
                            <div className="citizen-announcement-photo-badge">
                              +{a.photo_urls.length - 1} Photos
                        </div>
                      )}
                    </div>
                  ) : (
                        <div className="citizen-announcement-no-image">
                          <FaBullhorn size={70} color="#a52a1a" />
                    </div>
                  )}

                      {/* Title */}
                      {a.title && (
                        <h3 className="citizen-announcement-title-inline">
                          {a.title}
                        </h3>
                      )}

                      {/* Description */}
                    {a.description && (
                        <div className="citizen-announcement-description-inline">
                          {a.photo_urls && a.photo_urls.length > 0 
                            ? a.description.length > 100 ? a.description.substring(0, 100) + '...' : a.description
                            : a.description.length > 150 ? a.description.substring(0, 150) + '...' : a.description
                          }
                        </div>
                      )}

                      {/* See More Button */}
                        {a.description && (
                          (a.photo_urls && a.photo_urls.length > 0 && a.description.length > 100) ||
                          ((!a.photo_urls || a.photo_urls.length === 0) && a.description.length > 150)
                        ) && (
                          <button
                          onClick={(e) => {
                              e.stopPropagation();
                              handleAnnouncementClick(a);
                            }}
                          className="citizen-announcement-see-more-btn"
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
                <div className="citizen-announcement-indicators">
                  {announcements.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentAnnouncementIndex(index)}
                      className={`citizen-announcement-indicator ${
                        index === currentAnnouncementIndex 
                          ? 'citizen-announcement-indicator-active' 
                          : 'citizen-announcement-indicator-inactive'
                      }`}
                    />
                  ))}
          </div>
        )}
      </div>
          )}
          </div>

      {/* Training Programs as Posts */}
        <div className="citizen-training-section">
          <h2 className="citizen-training-title">Training Programs</h2>
        <div>
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
            <div className="citizen-no-training-container">
              <FaClipboardList size={80} color="#ddd" className="citizen-icon-margin" />
              <h3 className="citizen-no-training-title">No Training Programs Available</h3>
              <p className="citizen-no-training-message">Check back later for new training opportunities.</p>
            </div>
          ) : (
            <div className="citizen-training-carousel-container">
              {programs.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousProgram}
                    className="citizen-training-carousel-nav-btn citizen-training-carousel-nav-btn-left"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={goToNextProgram}
                    className="citizen-training-carousel-nav-btn citizen-training-carousel-nav-btn-right"
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
              
              {/* Display single training program */}
              <div className="citizen-training-carousel-content">
              {programs.map((program, index) => {
              const title = program.name || '';
              const description = program.description || '';
              const hasPhotos = program.photos && program.photos.length > 0;
              const photoCount = hasPhotos ? program.photos.length : 0;
              
              return (
                <div
                  key={program.id}
                  className="citizen-training-card-wrapper"
                  style={{ display: index === currentProgramIndex ? 'block' : 'none' }}
                  onClick={() => handleProgramClick(program)}
                >
                  {/* Main Content Container */}
                  <div className="citizen-training-card-main-content">
                  {/* Date and Location Badges */}
                    <div className="citizen-training-badges-wrapper">
                    {program.date && (
                        <div className="citizen-training-date-badge-inline">
                          {new Date(program.date).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                      </div>
                    )}
                    {program.location && (
                        <div className="citizen-training-location-badge-inline">
                          📍 {program.location}
                      </div>
                    )}
                  </div>

                    {/* Title */}
                    {title && (
                      <h3 className="citizen-training-title-inline">
                        {title}
                      </h3>
                    )}

                    {/* Description */}
                    {description && (
                      <div className="citizen-training-description-inline">
                          {program.photos && program.photos.length > 0 
                            ? description.length > 100 ? description.substring(0, 100) + '...' : description
                            : description.length > 150 ? description.substring(0, 150) + '...' : description
                          }
                      </div>
                    )}

                  {/* Photo Display */}
                  {hasPhotos && (
                      <div className="citizen-training-image-wrapper-inline">
                        <img
                          src={program.photos[0]}
                          alt="Training Program"
                          className="citizen-training-image-main"
                        />
                        {photoCount > 1 && (
                          <div className="citizen-training-more-photos-badge">
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
                      className="citizen-training-view-details-btn"
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
                <div className="citizen-training-indicators">
                  {programs.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentProgramIndex(index)}
                      className={`citizen-training-indicator ${
                        index === currentProgramIndex 
                          ? 'citizen-training-indicator-active' 
                          : 'citizen-training-indicator-inactive'
                      }`}
                    />
                  ))}
                </div>
          )}
        </div>
          )}
      </div>
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
        <div className="citizen-image-modal-overlay">
          <div className="citizen-image-modal-content">
            <button onClick={closeImageModal} className="citizen-image-modal-close">&times;</button>
            <img src={modalImg} alt="Large Program" className="citizen-image-modal-img" />
          </div>
        </div>
      )}
      {/* Announcement Modal */}
      {showAnnouncementModal && selectedAnnouncement && (
        <div className="citizen-modal-overlay" onClick={() => {
          setShowAnnouncementModal(false);
          setSelectedAnnouncement(null);
        }}>
          <div className="citizen-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="citizen-modal-close" onClick={() => {
              setShowAnnouncementModal(false);
              setSelectedAnnouncement(null);
            }}>&times;</button>
            <div className="citizen-announcement-modal-header">
              <h3 className="citizen-announcement-modal-title">{selectedAnnouncement.title}</h3>
            </div>
            
            {/* Date and Location Section - Match Admin Design */}
            {(selectedAnnouncement.date || selectedAnnouncement.location) && (
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
            )}
            
            {/* Scrollable Body Content */}
            <div className="citizen-modal-body">
              {/* Description Section - Match Admin Design */}
              <div className="citizen-announcement-modal-description">
                <strong>Description:</strong>
                <p>{selectedAnnouncement.description}</p>
              </div>
              
              {/* Photo Navigation (Instagram/Facebook style) */}
              {selectedAnnouncement.photo_urls && selectedAnnouncement.photo_urls.length > 0 && (
                <div className="citizen-announcement-photo-navigation">
                <div 
                  className="citizen-announcement-photo-container"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
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
        </div>
      )}
      {/* Organization Details Modal */}
      {showGroupModal && selectedGroup && (
        <div className="citizen-modal-overlay" onClick={() => {
          setShowGroupModal(false);
          setSelectedGroup(null);
        }}>
          <div className="citizen-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="citizen-modal-close" onClick={() => {
              setShowGroupModal(false);
              setSelectedGroup(null);
            }}>&times;</button>
            {/* Modal Header with Gradient Background */}
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
            
            {/* Scrollable Body Content */}
            <div className="citizen-modal-body">
              {/* Information Cards Section */}
              <div className="citizen-group-modal-info">
                <div className="citizen-group-info-card">
                  <div className="citizen-group-info-icon">
                    <FaUserTie />
                  </div>
                  <div className="citizen-group-info-content">
                    <div className="citizen-group-info-label">Director</div>
                    <div className="citizen-group-info-value">{selectedGroup.director || 'N/A'}</div>
                  </div>
                </div>
                <div className="citizen-group-info-card">
                  <div className="citizen-group-info-icon">🏢</div>
                  <div className="citizen-group-info-content">
                    <div className="citizen-group-info-label">Type</div>
                    <div className="citizen-group-info-value">{selectedGroup.type || 'N/A'}</div>
                  </div>
                </div>
                <div className="citizen-group-info-card">
                  <div className="citizen-group-info-icon">
                    <FaUsers />
                  </div>
                  <div className="citizen-group-info-content">
                    <div className="citizen-group-info-label">Members</div>
                    <div className="citizen-group-info-value">{selectedGroup.members_count || 0}</div>
                  </div>
                </div>
              </div>
              
              {/* Description Section */}
              <div className="citizen-group-modal-description">
                <div className="citizen-group-description-header">
                  <div className="citizen-group-description-icon">📋</div>
                  <strong>Description</strong>
                </div>
                <div className="citizen-group-description-content">
                  <p>{selectedGroup.description || 'No description available.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Enhanced Training Program Details Modal */}
      {showProgramModal && selectedProgram && (
        <div className="citizen-modal-overlay" onClick={() => {
          setShowProgramModal(false);
          setSelectedProgram(null);
        }}>
          <div className="citizen-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="citizen-modal-close" onClick={() => {
              setShowProgramModal(false);
              setSelectedProgram(null);
            }}>&times;</button>
            
            {/* Modal Header */}
            <div className="citizen-training-modal-header">
              <h3 className="citizen-training-modal-title">{selectedProgram.name}</h3>
            </div>
            
            {/* Date and Location Section */}
            {(selectedProgram.date || selectedProgram.location) && (
              <div className="citizen-training-modal-meta">
                {selectedProgram.date && (
                  <div className="citizen-training-modal-date">
                    <strong>Date:</strong> {new Date(selectedProgram.date).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
                {selectedProgram.location && (
                  <div className="citizen-training-modal-location">
                    <strong>Location:</strong> {selectedProgram.location}
                  </div>
                )}
              </div>
            )}
            
            {/* Scrollable Body Content */}
            <div className="citizen-modal-body">
              {/* Description Section */}
              <div className="citizen-training-modal-description">
                <strong>Description:</strong>
                <p>{selectedProgram.description}</p>
              </div>
              
              {/* Photo Navigation (Instagram/Facebook style) */}
              {selectedProgram.photos && selectedProgram.photos.length > 0 && (
                <div className="citizen-training-photo-navigation">
                  <div 
                    className="citizen-training-photo-container"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    <img 
                      src={selectedProgram.photos[currentPhotoIndex]} 
                      alt={`Photo ${currentPhotoIndex + 1}`} 
                      className="citizen-training-modal-img" 
                    />
                    
                    {/* Navigation Arrows */}
                    {selectedProgram.photos.length > 1 && (
                      <>
                        <button 
                          className="citizen-training-photo-nav-btn citizen-training-photo-nav-prev"
                          onClick={prevPhoto}
                        >
                          <FaChevronLeft />
                        </button>
                        <button 
                          className="citizen-training-photo-nav-btn citizen-training-photo-nav-next"
                          onClick={nextPhoto}
                        >
                          <FaChevronRight />
                        </button>
                      </>
                    )}
                    
                    {/* Photo Counter */}
                    {selectedProgram.photos.length > 1 && (
                      <div className="citizen-training-photo-counter">
                        {currentPhotoIndex + 1} / {selectedProgram.photos.length}
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
          className={`citizen-push-notification-fab ${
            pushNotificationsEnabled 
              ? 'citizen-push-notification-fab-enabled' 
              : 'citizen-push-notification-fab-disabled'
          }`}
          onClick={togglePushNotifications}
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
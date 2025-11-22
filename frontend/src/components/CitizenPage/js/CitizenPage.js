import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../../logo.svg';
import axios from 'axios';
import { FaBullhorn, FaShieldAlt, FaClipboardList, FaHandsHelping, FaRedo, FaChevronLeft, FaChevronRight, FaBell, FaBellSlash, FaUserTie, FaUsers, FaSearch } from 'react-icons/fa';
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
import { trackCitizenView } from '../../../utils/citizenTracking';

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

  // For image viewer modal
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState([]);
  const [viewerCurrentIndex, setViewerCurrentIndex] = useState(0);

  // Unified search state
  const [unifiedSearchTerm, setUnifiedSearchTerm] = useState('');

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
    // Track page view
    trackCitizenView('/citizen');
    
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
      const isOfflineError = !navigator.onLine || err.code === 'ERR_NETWORK' || err.message?.includes('Network') || err.response?.status === 503;
      
      if (isOfflineError) {
        // Service worker should serve cached data if available (returns 200, not error)
        // If we get here, it means no cache was available (503 from service worker)
        // Preserve existing data if available, otherwise show empty state
        if (programs.length === 0) {
          setPrograms([]); // Show empty state only if no existing data
        }
        // Don't show error message when offline - user will see offline banner
        setError('');
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
      const isOfflineError = !navigator.onLine || err.code === 'ERR_NETWORK' || err.message?.includes('Network') || err.response?.status === 503;
      
      if (isOfflineError) {
        // Service worker should serve cached data if available (returns 200, not error)
        // If we get here, it means no cache was available (503 from service worker)
        // Preserve existing data if available, otherwise show empty state
        if (associateGroups.length === 0) {
          setAssociateGroups([]); // Show empty state only if no existing data
        }
        // Don't show error message when offline - user will see offline banner
        setGroupsError('');
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
      const isOfflineError = !navigator.onLine || err.code === 'ERR_NETWORK' || err.message?.includes('Network') || err.response?.status === 503;
      
      if (isOfflineError) {
        // Service worker should serve cached data if available (returns 200, not error)
        // If we get here, it means no cache was available (503 from service worker)
        // Preserve existing data if available, otherwise show empty state
        if (announcements.length === 0) {
          setAnnouncements([]); // Show empty state only if no existing data
        }
        // Don't show error message when offline - user will see offline banner
        setAnnError('');
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

  // Scroll position for announcements list (vertical scrollable list)
  const [announcementsScrollIndex, setAnnouncementsScrollIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Number of items to show at once

  // Carousel state for announcements
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselAutoPlay, setCarouselAutoPlay] = useState(true);
  const carouselContentRef = useRef(null);
  const [carouselItemsPerView, setCarouselItemsPerView] = useState(3); // Responsive items per view

  // Carousel state for training programs
  const [programCarouselIndex, setProgramCarouselIndex] = useState(0);
  const [programCarouselAutoPlay, setProgramCarouselAutoPlay] = useState(true);
  const programCarouselContentRef = useRef(null);

  // Update items per page based on screen size
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(3); // Mobile: 3 items
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(4); // Tablet: 4 items
      } else {
        setItemsPerPage(5); // Desktop: 5 items
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  // Update carousel items per view based on screen size
  const [carouselGap, setCarouselGap] = useState(15); // Gap between items
  
  useEffect(() => {
    const updateCarouselItemsPerView = () => {
      if (window.innerWidth < 768) {
        setCarouselItemsPerView(1); // Mobile: 1 item
        setCarouselGap(0);
      } else if (window.innerWidth < 1024) {
        setCarouselItemsPerView(2); // Tablet: 2 items
        setCarouselGap(12);
      } else {
        setCarouselItemsPerView(3); // Desktop/Laptop: 3 items
        setCarouselGap(15);
      }
    };

    updateCarouselItemsPerView();
    window.addEventListener('resize', updateCarouselItemsPerView);
    return () => window.removeEventListener('resize', updateCarouselItemsPerView);
  }, []);

  // Check if user is searching
  const isSearching = unifiedSearchTerm.trim().length > 0;

  // Sort announcements: featured first, then by date (latest first)
  let sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    const dateA = new Date(a.created_at || a.date || 0);
    const dateB = new Date(b.created_at || b.date || 0);
    return dateB - dateA;
  });

  // Sort training programs: featured first, then by date (latest first)
  let sortedPrograms = [...programs].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    const dateA = new Date(a.date || a.created_at || 0);
    const dateB = new Date(b.date || b.created_at || 0);
    return dateB - dateA;
  });

  // Filter by unified search term
  let filteredAnnouncements = sortedAnnouncements;
  let filteredPrograms = sortedPrograms;
  
  if (isSearching) {
    const searchLower = unifiedSearchTerm.toLowerCase();
    filteredAnnouncements = sortedAnnouncements.filter(a => 
      (a.title && a.title.toLowerCase().includes(searchLower)) ||
      (a.description && a.description.toLowerCase().includes(searchLower))
    );
    filteredPrograms = sortedPrograms.filter(p => 
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.description && p.description.toLowerCase().includes(searchLower)) ||
      (p.location && p.location.toLowerCase().includes(searchLower))
    );
  }

  // For non-search mode, use the original featured/list structure
  const featuredAnnouncement = !isSearching ? (filteredAnnouncements.find(a => a.featured) || (filteredAnnouncements.length > 0 ? filteredAnnouncements[0] : null)) : null;
  const listAnnouncements = !isSearching ? filteredAnnouncements.filter(a => a.id !== featuredAnnouncement?.id).slice(0, 3) : [];
  const carouselAnnouncements = !isSearching ? filteredAnnouncements.filter(a => a.id !== featuredAnnouncement?.id).slice(3) : [];

  const featuredProgram = !isSearching ? (filteredPrograms.find(p => p.featured) || (filteredPrograms.length > 0 ? filteredPrograms[0] : null)) : null;
  const listPrograms = !isSearching ? filteredPrograms.filter(p => p.id !== featuredProgram?.id).slice(0, 3) : [];
  const carouselPrograms = !isSearching ? filteredPrograms.filter(p => p.id !== featuredProgram?.id).slice(3) : [];

  // Navigation handlers for announcements list (scroll through list)
  const goToPreviousAnnouncement = () => {
    if (listAnnouncements.length === 0) return;
    setAnnouncementsScrollIndex((prev) => 
      Math.max(0, prev - itemsPerPage)
    );
  };

  const goToNextAnnouncement = () => {
    if (listAnnouncements.length === 0) return;
    setAnnouncementsScrollIndex((prev) => 
      Math.min(listAnnouncements.length - itemsPerPage, prev + itemsPerPage)
    );
  };

  // Carousel navigation handlers - move by 1 item at a time
  const carouselNext = () => {
    if (carouselAnnouncements.length === 0) return;
    const maxIndex = Math.max(0, carouselAnnouncements.length - carouselItemsPerView);
    setCarouselIndex((prev) => 
      prev >= maxIndex ? 0 : prev + 1
    );
  };

  const carouselPrev = () => {
    if (carouselAnnouncements.length === 0) return;
    const maxIndex = Math.max(0, carouselAnnouncements.length - carouselItemsPerView);
    setCarouselIndex((prev) => 
      prev <= 0 ? maxIndex : prev - 1
    );
  };

  // Auto-play carousel - move by 1 item at a time
  useEffect(() => {
    if (!carouselAutoPlay || carouselAnnouncements.length === 0) return;
    if (carouselAnnouncements.length <= carouselItemsPerView) return;
    
    const interval = setInterval(() => {
      const maxIndex = Math.max(0, carouselAnnouncements.length - carouselItemsPerView);
      setCarouselIndex((prev) => 
        prev >= maxIndex ? 0 : prev + 1
      );
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [carouselAutoPlay, carouselAnnouncements.length]);

  // Carousel navigation handlers for training programs - move by 1 item at a time
  const programCarouselNext = () => {
    if (carouselPrograms.length === 0) return;
    const maxIndex = Math.max(0, carouselPrograms.length - carouselItemsPerView);
    setProgramCarouselIndex((prev) => 
      prev >= maxIndex ? 0 : prev + 1
    );
  };

  const programCarouselPrev = () => {
    if (carouselPrograms.length === 0) return;
    const maxIndex = Math.max(0, carouselPrograms.length - carouselItemsPerView);
    setProgramCarouselIndex((prev) => 
      prev <= 0 ? maxIndex : prev - 1
    );
  };

  // Auto-play carousel for training programs - move by 1 item at a time
  useEffect(() => {
    if (!programCarouselAutoPlay || carouselPrograms.length === 0) return;
    if (carouselPrograms.length <= carouselItemsPerView) return;
    
    const interval = setInterval(() => {
      const maxIndex = Math.max(0, carouselPrograms.length - carouselItemsPerView);
      setProgramCarouselIndex((prev) => 
        prev >= maxIndex ? 0 : prev + 1
      );
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [programCarouselAutoPlay, carouselPrograms.length]);

  // Get visible announcements for list (paginated)
  const getVisibleAnnouncements = () => {
    if (listAnnouncements.length === 0) return [];
    const endIndex = Math.min(announcementsScrollIndex + itemsPerPage, listAnnouncements.length);
    return listAnnouncements.slice(announcementsScrollIndex, endIndex);
  };

  // Get visible carousel announcements (3 at a time)
  const getVisibleCarouselAnnouncements = () => {
    if (carouselAnnouncements.length === 0) return [];
    const endIndex = Math.min(carouselIndex + 3, carouselAnnouncements.length);
    return carouselAnnouncements.slice(carouselIndex, endIndex);
  };


  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAnnouncementModal || showProgramModal || showGroupModal || modalOpen || showImageViewer) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAnnouncementModal, showProgramModal, showGroupModal, modalOpen, showImageViewer]);

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
    // Track training program view
    if (program.id) {
      trackCitizenView('/citizen', 'training_program', program.id);
    }
  };

  // Handle announcement click to show details
  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
    setCurrentPhotoIndex(0);
    // Track announcement view
    if (announcement.id) {
      trackCitizenView('/citizen', 'announcement', announcement.id);
    }
  };

  // Handle image click to open viewer
  const handleImageClick = (announcement, photoIndex = 0) => {
    if (announcement.photo_urls && announcement.photo_urls.length > 0) {
      setViewerPhotos(announcement.photo_urls);
      setViewerCurrentIndex(photoIndex);
      setShowImageViewer(true);
    }
  };

  // Image viewer navigation
  const viewerNextPhoto = () => {
    setViewerCurrentIndex((prev) => 
      prev === viewerPhotos.length - 1 ? 0 : prev + 1
    );
  };

  const viewerPrevPhoto = () => {
    setViewerCurrentIndex((prev) => 
      prev === 0 ? viewerPhotos.length - 1 : prev - 1
    );
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    setViewerPhotos([]);
    setViewerCurrentIndex(0);
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
      
      {/* Unified Search Bar */}
      <div style={{ 
        width: '100%',
        margin: '20px 0 30px', 
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'flex-end',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          position: 'relative',
          maxWidth: '600px',
          minWidth: '300px',
          marginRight: '40px'
        }}>
          <FaSearch style={{ 
            position: 'absolute', 
            left: '16px', 
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            zIndex: 1,
            fontSize: '18px'
          }} />
          <input
            type="text"
            placeholder="Search announcements and training programs..."
            value={unifiedSearchTerm}
            onChange={(e) => setUnifiedSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px 14px 50px',
              border: '2px solid #a52a1a',
              borderRadius: '30px',
              fontSize: '16px',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(165, 42, 26, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 4px 12px rgba(165, 42, 26, 0.2)';
              e.target.style.borderColor = '#8b1f1a';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = '0 2px 8px rgba(165, 42, 26, 0.1)';
              e.target.style.borderColor = '#a52a1a';
            }}
          />
          {unifiedSearchTerm && (
            <button
              onClick={() => setUnifiedSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

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

      {/* Vertical Container for Announcements and Training Programs */}
      <div className="citizen-side-by-side-container">
        <div className="citizen-content-columns">
          {/* Search Results View */}
          {isSearching ? (
            <div style={{ width: '100%', padding: '0 20px' }}>
              {/* Search Results Header */}
              <div style={{ 
                marginBottom: '30px',
                textAlign: 'center'
              }}>
                <h2 style={{ 
                  color: '#a52a1a', 
                  fontSize: '24px', 
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  Search Results
                </h2>
                <p style={{ 
                  color: '#666', 
                  fontSize: '14px'
                }}>
                  Found {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''} and {filteredPrograms.length} training program{filteredPrograms.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Combined Results */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px',
                maxWidth: '900px',
                margin: '0 auto',
                padding: '0 10px'
              }}>
                {/* Announcements Results */}
                {filteredAnnouncements.length > 0 && (
                  <div>
                    <h3 style={{ 
                      color: '#a52a1a', 
                      fontSize: '20px', 
                      marginBottom: '15px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}>
                      <FaBullhorn /> Announcements ({filteredAnnouncements.length})
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                      gap: '20px'
                    }}
                    >
                      {filteredAnnouncements.map((a) => (
                        <div
                          key={a.id}
                          onClick={() => handleAnnouncementClick(a)}
                          style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '1px solid #f0f0f0'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(165, 42, 26, 0.15)';
                            e.currentTarget.style.borderColor = '#a52a1a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = '#f0f0f0';
                          }}
                        >
                          {a.photo_urls && a.photo_urls.length > 0 && (
                            <img
                              src={a.photo_urls[0]}
                              alt="Announcement"
                              style={{
                                width: '100%',
                                height: '180px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                marginBottom: '12px'
                              }}
                            />
                          )}
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#888', 
                            marginBottom: '8px' 
                          }}>
                            {formatDate(a.created_at)}
                          </div>
                          <h4 style={{ 
                            color: '#333', 
                            fontSize: '18px', 
                            marginBottom: '10px',
                            fontWeight: '600'
                          }}>
                            {a.title || 'Untitled Announcement'}
                          </h4>
                          <p style={{ 
                            color: '#666', 
                            fontSize: '14px',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {a.description || 'No description'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Training Programs Results */}
                {filteredPrograms.length > 0 && (
                  <div>
                    <h3 style={{ 
                      color: '#a52a1a', 
                      fontSize: '20px', 
                      marginBottom: '15px',
                      marginTop: filteredAnnouncements.length > 0 ? '30px' : '0',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}>
                      <FaClipboardList /> Training Programs ({filteredPrograms.length})
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                      gap: '20px'
                    }}
                    >
                      {filteredPrograms.map((program) => (
                        <div
                          key={program.id}
                          onClick={() => handleProgramClick(program)}
                          style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '1px solid #f0f0f0'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(165, 42, 26, 0.15)';
                            e.currentTarget.style.borderColor = '#a52a1a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = '#f0f0f0';
                          }}
                        >
                          {program.photos && program.photos.length > 0 && (
                            <img
                              src={program.photos[0]}
                              alt="Training Program"
                              style={{
                                width: '100%',
                                height: '180px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                marginBottom: '12px'
                              }}
                            />
                          )}
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#888', 
                            marginBottom: '8px',
                            display: 'flex',
                            gap: '15px',
                            flexWrap: 'wrap'
                          }}>
                            {program.date && (
                              <span>{new Date(program.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            )}
                            {program.location && (
                              <span>📍 {program.location}</span>
                            )}
                          </div>
                          <h4 style={{ 
                            color: '#333', 
                            fontSize: '18px', 
                            marginBottom: '10px',
                            fontWeight: '600'
                          }}>
                            {program.name || 'Untitled Training Program'}
                          </h4>
                          <p style={{ 
                            color: '#666', 
                            fontSize: '14px',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {program.description || 'No description'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {filteredAnnouncements.length === 0 && filteredPrograms.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 20px',
                    color: '#999'
                  }}>
                    <FaSearch size={60} style={{ marginBottom: '20px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#666' }}>
                      No results found
                    </h3>
                    <p style={{ fontSize: '14px' }}>
                      Try different keywords or check your spelling
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
          {/* Announcements Section - Normal View */}
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
            <div className="citizen-announcements-layout-container">
              {/* Featured Announcement (Left Side) */}
              {featuredAnnouncement && (
                <div className="citizen-announcement-featured-container">
                  {/* NEW Badge - Only show if announcement is less than 7 days old */}
                  {(() => {
                    const announcementDate = new Date(featuredAnnouncement.created_at || featuredAnnouncement.date);
                    const daysSinceCreation = (Date.now() - announcementDate.getTime()) / (1000 * 60 * 60 * 24);
                    return daysSinceCreation <= 7 ? (
                      <div className="citizen-announcement-new-badge">
                        <span className="citizen-announcement-new-text">NEW</span>
                      </div>
                    ) : null;
                  })()}
                  <div className="citizen-announcement-card-wrapper citizen-announcement-featured-card" onClick={() => handleAnnouncementClick(featuredAnnouncement)}>
                    {/* Image or Icon */}
                    {featuredAnnouncement.photo_urls && featuredAnnouncement.photo_urls.length > 0 ? (
                      <div className="citizen-announcement-featured-image-wrapper">
                        <img
                          src={featuredAnnouncement.photo_urls[0]}
                          alt="Announcement"
                          className="citizen-announcement-featured-image"
                          style={{ cursor: 'pointer' }}
                        />
                        {featuredAnnouncement.photo_urls.length > 1 && (
                          <div className="citizen-announcement-photo-badge">
                            +{featuredAnnouncement.photo_urls.length - 1} Photos
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="citizen-announcement-featured-no-image">
                        <FaBullhorn size={80} color="#a52a1a" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="citizen-announcement-featured-content">
                      {/* Date Badge */}
                      <div className="citizen-announcement-date-badge-inline">
                        {featuredAnnouncement.created_at && formatDate(featuredAnnouncement.created_at)}
                      </div>

                      {/* Title */}
                      {featuredAnnouncement.title && (
                        <h3 className="citizen-announcement-featured-title">
                          {featuredAnnouncement.title}
                        </h3>
                      )}

                      {/* Description */}
                      {featuredAnnouncement.description && (
                        <div className="citizen-announcement-featured-description">
                          {featuredAnnouncement.description.length > 200 
                            ? featuredAnnouncement.description.substring(0, 200) + '...' 
                            : featuredAnnouncement.description
                          }
                        </div>
                      )}

                      {/* See More Button */}
                      {featuredAnnouncement.description && featuredAnnouncement.description.length > 200 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnnouncementClick(featuredAnnouncement);
                          }}
                          className="citizen-announcement-see-more-btn"
                        >
                          See More →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Announcements List (Right Side) - 2nd, 3rd, 4th only */}
              {listAnnouncements.length > 0 && (
                <div className="citizen-announcements-list-container">
                  {/* Vertical List of Announcements */}
                  <div className="citizen-announcements-list">
                    {listAnnouncements.map((a) => (
                      <div
                        key={a.id}
                        className="citizen-announcement-list-item"
                        onClick={() => handleAnnouncementClick(a)}
                      >
                        {/* Image - Left Side */}
                        {a.photo_urls && a.photo_urls.length > 0 ? (
                          <div className="citizen-announcement-list-image">
                            <img
                              src={a.photo_urls[0]}
                              alt="Announcement"
                              className="citizen-announcement-list-img"
                            />
                            {a.photo_urls.length > 1 && (
                              <div className="citizen-announcement-list-photo-badge">
                                +{a.photo_urls.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="citizen-announcement-list-image citizen-announcement-list-no-image">
                            <FaBullhorn size={40} color="#a52a1a" />
                          </div>
                        )}

                        {/* Content - Right Side */}
                        <div className="citizen-announcement-list-content">
                          {/* Date */}
                          {a.created_at && (
                            <div className="citizen-announcement-list-date">
                              {formatDate(a.created_at)}
                            </div>
                          )}

                          {/* Title */}
                          {a.title && (
                            <h4 className="citizen-announcement-list-title">
                              {a.title}
                            </h4>
                          )}

                          {/* Description with ellipses */}
                          {a.description && (
                            <p className="citizen-announcement-list-description">
                              {a.description.length > 100 
                                ? a.description.substring(0, 100) + '...' 
                                : a.description
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* More Announcements Section with Carousel */}
          {carouselAnnouncements.length > 0 && (
            <div className="citizen-announcements-carousel-section">
              <h3 className="citizen-announcements-carousel-title">More Announcements</h3>
              <div className="citizen-announcement-carousel-container-static">
                <div className="citizen-announcement-carousel-content" ref={carouselContentRef}>
                  <div 
                    className="citizen-announcement-carousel-slider"
                    style={{
                      transform: carouselItemsPerView === 1 
                        ? `translateX(-${carouselIndex * 100}%)`
                        : carouselItemsPerView === 2
                        ? `translateX(calc(-${carouselIndex} * ((100% - ${carouselGap}px) / ${carouselItemsPerView} + ${carouselGap}px)))`
                        : `translateX(calc(-${carouselIndex} * ((100% - ${carouselGap * (carouselItemsPerView - 1)}px) / ${carouselItemsPerView} + ${carouselGap}px)))`,
                      transition: 'transform 0.5s ease-in-out'
                    }}
                  >
                  {carouselAnnouncements.map((a) => (
                    <div
                      key={a.id}
                      className="citizen-announcement-carousel-item"
                      onClick={() => handleAnnouncementClick(a)}
                    >
                      {/* Image - Left Side */}
                      {a.photo_urls && a.photo_urls.length > 0 ? (
                        <div className="citizen-announcement-list-image">
                          <img
                            src={a.photo_urls[0]}
                            alt="Announcement"
                            className="citizen-announcement-list-img"
                          />
                          {a.photo_urls.length > 1 && (
                            <div className="citizen-announcement-list-photo-badge">
                              +{a.photo_urls.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="citizen-announcement-list-image citizen-announcement-list-no-image">
                          <FaBullhorn size={40} color="#a52a1a" />
                        </div>
                      )}

                      {/* Content - Right Side */}
                      <div className="citizen-announcement-list-content">
                        {/* Date */}
                        {a.created_at && (
                          <div className="citizen-announcement-list-date">
                            {formatDate(a.created_at)}
                          </div>
                        )}

                        {/* Title */}
                        {a.title && (
                          <h4 className="citizen-announcement-list-title">
                            {a.title}
                          </h4>
                        )}

                        {/* Description with ellipses */}
                        {a.description && (
                          <p className="citizen-announcement-list-description">
                            {a.description.length > 100 
                              ? a.description.substring(0, 100) + '...' 
                              : a.description
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
                <div className="citizen-announcement-carousel-nav-buttons-wrapper">
                  <button
                    onClick={carouselPrev}
                    className="citizen-announcement-carousel-nav-btn citizen-announcement-carousel-nav-btn-left"
                    aria-label="Previous announcements"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={carouselNext}
                    className="citizen-announcement-carousel-nav-btn citizen-announcement-carousel-nav-btn-right"
                    aria-label="Next announcements"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
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
            <div className="citizen-training-layout-container">
              {/* Featured Training Program (Left Side) */}
              {featuredProgram && (
                <div className="citizen-training-featured-container">
                  <div className="citizen-training-card-wrapper citizen-training-featured-card" onClick={() => handleProgramClick(featuredProgram)}>
                    {/* Image */}
                    {featuredProgram.photos && featuredProgram.photos.length > 0 ? (
                      <div className="citizen-training-featured-image-wrapper">
                        <img
                          src={featuredProgram.photos[0]}
                          alt="Training Program"
                          className="citizen-training-featured-image"
                        />
                        {featuredProgram.photos.length > 1 && (
                          <div className="citizen-training-more-photos-badge">
                            +{featuredProgram.photos.length - 1} More
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="citizen-training-featured-no-image">
                        <FaClipboardList size={80} color="#a52a1a" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="citizen-training-featured-content">
                      {/* Date and Location Badges */}
                      <div className="citizen-training-badges-wrapper">
                        {featuredProgram.date && (
                          <div className="citizen-training-date-badge-inline">
                            {new Date(featuredProgram.date).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                        {featuredProgram.location && (
                          <div className="citizen-training-location-badge-inline">
                            📍 {featuredProgram.location}
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      {featuredProgram.name && (
                        <h3 className="citizen-training-featured-title">
                          {featuredProgram.name}
                        </h3>
                      )}

                      {/* Description */}
                      {featuredProgram.description && (
                        <div className="citizen-training-featured-description">
                          {featuredProgram.description.length > 200 
                            ? featuredProgram.description.substring(0, 200) + '...' 
                            : featuredProgram.description
                          }
                        </div>
                      )}

                      {/* View Details Button */}
                      {featuredProgram.description && featuredProgram.description.length > 200 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProgramClick(featuredProgram);
                          }}
                          className="citizen-training-view-details-btn"
                        >
                          View Details →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Training Programs List (Right Side) - 2nd, 3rd, 4th only */}
              {listPrograms.length > 0 && (
                <div className="citizen-training-list-container">
                  {/* Vertical List of Training Programs */}
                  <div className="citizen-training-list">
                    {listPrograms.map((program) => {
                      const title = program.name || '';
                      const description = program.description || '';
                      const hasPhotos = program.photos && program.photos.length > 0;
                      
                      return (
                        <div
                          key={program.id}
                          className="citizen-training-list-item"
                          onClick={() => handleProgramClick(program)}
                        >
                          {/* Image - Left Side */}
                          {hasPhotos ? (
                            <div className="citizen-training-list-image">
                              <img
                                src={program.photos[0]}
                                alt="Training Program"
                                className="citizen-training-list-img"
                              />
                              {program.photos.length > 1 && (
                                <div className="citizen-training-list-photo-badge">
                                  +{program.photos.length - 1}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="citizen-training-list-image citizen-training-list-no-image">
                              <FaClipboardList size={40} color="#a52a1a" />
                            </div>
                          )}

                          {/* Content - Right Side */}
                          <div className="citizen-training-list-content">
                            {/* Date and Location */}
                            <div className="citizen-training-list-meta">
                              {program.date && (
                                <span className="citizen-training-list-date">
                                  {new Date(program.date).toLocaleDateString(undefined, { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                              {program.location && (
                                <span className="citizen-training-list-location">
                                  📍 {program.location}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            {title && (
                              <h4 className="citizen-training-list-title">
                                {title}
                              </h4>
                            )}

                            {/* Description with ellipses */}
                            {description && (
                              <p className="citizen-training-list-description">
                                {description.length > 100 
                                  ? description.substring(0, 100) + '...' 
                                  : description
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* More Training Programs Section with Carousel */}
          {!isSearching && carouselPrograms.length > 0 && (
            <div className="citizen-announcements-carousel-section">
              <h3 className="citizen-announcements-carousel-title">More Training Programs</h3>
              <div className="citizen-announcement-carousel-container-static">
                <div className="citizen-announcement-carousel-content" ref={programCarouselContentRef}>
                  <div 
                    className="citizen-announcement-carousel-slider"
                    style={{
                      transform: carouselItemsPerView === 1 
                        ? `translateX(-${programCarouselIndex * 100}%)`
                        : carouselItemsPerView === 2
                        ? `translateX(calc(-${programCarouselIndex} * ((100% - ${carouselGap}px) / ${carouselItemsPerView} + ${carouselGap}px)))`
                        : `translateX(calc(-${programCarouselIndex} * ((100% - ${carouselGap * (carouselItemsPerView - 1)}px) / ${carouselItemsPerView} + ${carouselGap}px)))`,
                      transition: 'transform 0.5s ease-in-out'
                    }}
                  >
                  {carouselPrograms.map((program) => {
                    const title = program.name || '';
                    const description = program.description || '';
                    const hasPhotos = program.photos && program.photos.length > 0;
                    
                    return (
                      <div
                        key={program.id}
                        className="citizen-announcement-carousel-item"
                        onClick={() => handleProgramClick(program)}
                      >
                        {/* Image - Left Side */}
                        {hasPhotos ? (
                          <div className="citizen-announcement-list-image">
                            <img
                              src={program.photos[0]}
                              alt="Training Program"
                              className="citizen-announcement-list-img"
                            />
                            {program.photos.length > 1 && (
                              <div className="citizen-announcement-list-photo-badge">
                                +{program.photos.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="citizen-announcement-list-image citizen-announcement-list-no-image">
                            <FaClipboardList size={40} color="#a52a1a" />
                          </div>
                        )}

                        {/* Content - Right Side */}
                        <div className="citizen-announcement-list-content">
                          {/* Date */}
                          {program.date && (
                            <div className="citizen-announcement-list-date">
                              {new Date(program.date).toLocaleDateString(undefined, { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                          {program.location && (
                            <div className="citizen-training-list-location" style={{ marginTop: '4px', fontSize: '0.85rem', color: '#666' }}>
                              📍 {program.location}
                            </div>
                          )}

                          {/* Title */}
                          {title && (
                            <h4 className="citizen-announcement-list-title">
                              {title}
                            </h4>
                          )}

                          {/* Description with ellipses */}
                          {description && (
                            <p className="citizen-announcement-list-description">
                              {description.length > 100 
                                ? description.substring(0, 100) + '...' 
                                : description
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
                <div className="citizen-announcement-carousel-nav-buttons-wrapper">
                  <button
                    onClick={programCarouselPrev}
                    className="citizen-announcement-carousel-nav-btn citizen-announcement-carousel-nav-btn-left"
                    aria-label="Previous training programs"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={programCarouselNext}
                    className="citizen-announcement-carousel-nav-btn citizen-announcement-carousel-nav-btn-right"
                    aria-label="Next training programs"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
        </div>
            </>
          )}
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
                >
                  <img 
                    src={selectedAnnouncement.photo_urls[currentPhotoIndex]} 
                    alt={`Photo ${currentPhotoIndex + 1}`} 
                    className="citizen-announcement-modal-img"
                    onClick={() => handleImageClick(selectedAnnouncement, currentPhotoIndex)}
                    style={{ cursor: 'pointer' }}
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
          title={pushNotificationsEnabled ? 'Notifications ON - Click to disable' : 'Notifications OFF - Click to enable'}
        >
          {pushNotificationsEnabled ? <FaBell /> : <FaBellSlash />}
        </button>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && viewerPhotos.length > 0 && (
        <div className="citizen-image-viewer-overlay" onClick={closeImageViewer}>
          <div className="citizen-image-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="citizen-image-viewer-close" onClick={closeImageViewer}>&times;</button>
            
            {/* Image Container */}
            <div className="citizen-image-viewer-image-container">
              <img 
                src={viewerPhotos[viewerCurrentIndex]} 
                alt={`Photo ${viewerCurrentIndex + 1}`} 
                className="citizen-image-viewer-img" 
              />
            </div>

            {/* Navigation Buttons Below Image */}
            {viewerPhotos.length > 1 && (
              <div className="citizen-image-viewer-nav-buttons">
                <button 
                  className="citizen-image-viewer-nav-btn citizen-image-viewer-nav-prev"
                  onClick={viewerPrevPhoto}
                >
                  <FaChevronLeft /> Previous
                </button>
                
                {/* Photo Counter */}
                <div className="citizen-image-viewer-counter">
                  {viewerCurrentIndex + 1} / {viewerPhotos.length}
                </div>
                
                <button 
                  className="citizen-image-viewer-nav-btn citizen-image-viewer-nav-next"
                  onClick={viewerNextPhoto}
                >
                  Next <FaChevronRight />
                </button>
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
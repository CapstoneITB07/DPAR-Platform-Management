import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/Announcements.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn, faSearch, faTrash, faCalendar, faImage, faEye, faEyeSlash, faStar, faSync, faTimes, faUser, faChevronLeft, faChevronRight, faUndo, faBan, faExclamationTriangle, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [permanentDeletingId, setPermanentDeletingId] = useState(null);

  const fetchAnnouncements = React.useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 15,
        ...(searchTerm && { search: searchTerm }),
        ...(dateFilter && { date: dateFilter })
      });
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/announcements?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setError('');
    } catch (err) {
      setError('Failed to fetch announcements');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, dateFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAnnouncements(false);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [fetchAnnouncements]);

  const handleRefresh = () => {
    fetchAnnouncements(true);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation(); // Prevent modal from opening
    if (!window.confirm('Are you sure you want to delete this announcement? It can be restored later.')) {
      return;
    }

    try {
      setDeletingId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update the announcement to show as deleted
      setAnnouncements(announcements.map(a => 
        a.id === id ? { ...a, deleted_at: new Date().toISOString() } : a
      ));
      if (selectedAnnouncement && selectedAnnouncement.id === id) {
        setSelectedAnnouncement({ ...selectedAnnouncement, deleted_at: new Date().toISOString() });
      }
      setSuccess('Announcement deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete announcement');
      console.error('Error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      setRestoringId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.post(`${API_BASE}/api/superadmin/announcements/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update the announcement to remove deleted_at
      setAnnouncements(announcements.map(a => 
        a.id === id ? { ...a, deleted_at: null } : a
      ));
      if (selectedAnnouncement && selectedAnnouncement.id === id) {
        setSelectedAnnouncement({ ...selectedAnnouncement, deleted_at: null });
      }
      setSuccess('Announcement restored successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to restore announcement');
      console.error('Error:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this announcement? This action cannot be undone!')) {
      return;
    }

    try {
      setPermanentDeletingId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/announcements/${id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove from list
      setAnnouncements(announcements.filter(a => a.id !== id));
      if (selectedAnnouncement && selectedAnnouncement.id === id) {
        setShowModal(false);
        setSelectedAnnouncement(null);
      }
      setSuccess('Announcement permanently deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to permanently delete announcement');
      console.error('Error:', err);
    } finally {
      setPermanentDeletingId(null);
    }
  };

  const handleToggleVisibility = async (id, currentVisibility, e) => {
    if (e) e.stopPropagation(); // Prevent modal from opening
    try {
      setUpdatingId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.put(`${API_BASE}/api/superadmin/announcements/${id}/visibility`, 
        { visible: !currentVisibility },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Announcement ${!currentVisibility ? 'shown' : 'hidden'} from citizens`);
      setAnnouncements(announcements.map(a => 
        a.id === id ? { ...a, visible_to_citizens: !currentVisibility } : a
      ));
      if (selectedAnnouncement && selectedAnnouncement.id === id) {
        setSelectedAnnouncement({ ...selectedAnnouncement, visible_to_citizens: !currentVisibility });
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update visibility');
      console.error('Error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleFeatured = async (id, currentFeatured, e) => {
    if (e) e.stopPropagation(); // Prevent modal from opening
    try {
      setUpdatingId(id);
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.put(`${API_BASE}/api/superadmin/announcements/${id}/featured`, 
        { featured: !currentFeatured },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newFeaturedStatus = response.data.featured ?? !currentFeatured;
      setSuccess(`Announcement ${newFeaturedStatus ? 'featured' : 'unfeatured'}`);
      setAnnouncements(announcements.map(a => 
        a.id === id ? { ...a, featured: Boolean(newFeaturedStatus) } : a
      ));
      if (selectedAnnouncement && selectedAnnouncement.id === id) {
        setSelectedAnnouncement({ ...selectedAnnouncement, featured: Boolean(newFeaturedStatus) });
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update featured status');
      console.error('Error:', err);
      // Refresh to get latest data
      fetchAnnouncements(true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
    setShowAllPhotos(false);
    setSelectedPhotoIndex(null);
  };

  const handlePhotoClick = (index) => {
    setSelectedPhotoIndex(index);
  };

  const closePhotoViewer = () => {
    setSelectedPhotoIndex(null);
  };

  const navigatePhoto = (direction) => {
    if (selectedPhotoIndex === null) return;
    const totalPhotos = selectedAnnouncement?.photo_urls?.length || 0;
    if (direction === 'next') {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % totalPhotos);
    } else {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + totalPhotos) % totalPhotos);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && announcements.length === 0) {
    return (
      <SuperAdminLayout>
        <div className="sa-announcements-container">
          <div className="sa-announcements-loading">Loading announcements...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-announcements-container">
        <div className="sa-announcements-page-header">
          <div>
            <h1><FontAwesomeIcon icon={faBullhorn} /> Announcements Management</h1>
            <p>View and manage all platform announcements visible to citizens</p>
          </div>
          <button 
            className="sa-announcements-btn-refresh" 
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <FontAwesomeIcon icon={faSync} spin={refreshing} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <div className="sa-announcements-error-message">{error}</div>}
        {success && <div className="sa-announcements-success-message">{success}</div>}

        <div className="sa-announcements-filters-section">
          <div className="sa-announcements-search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search announcements by title or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="sa-announcements-search-box" style={{ maxWidth: '200px' }}>
            <FontAwesomeIcon icon={faCalendarAlt} />
            <input
              type="date"
              placeholder="Filter by date..."
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '4px 8px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  zIndex: 2
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="sa-announcements-list">
          {announcements.length === 0 ? (
            <div className="sa-announcements-empty-state">
              <FontAwesomeIcon icon={faBullhorn} />
              <p>No announcements found</p>
            </div>
          ) : (
            announcements.map((announcement) => {
              const isDeleted = announcement.deleted_at !== null && announcement.deleted_at !== undefined;
              return (
              <div 
                key={announcement.id} 
                className={`sa-announcements-card ${isDeleted ? 'sa-announcements-card-deleted' : ''}`}
                onClick={() => handleAnnouncementClick(announcement)}
              >
                <div className="sa-announcements-card-header">
                  <div className="sa-announcements-title-section">
                    <div className="sa-announcements-title-wrapper">
                      <h3>{announcement.title || 'Untitled Announcement'}</h3>
                      {isDeleted && (
                        <span className="sa-announcements-deleted-badge">
                          <FontAwesomeIcon icon={faExclamationTriangle} /> Deleted
                        </span>
                      )}
                    </div>
                    <div className="sa-announcements-badges">
                      {announcement.featured && (
                        <span className="sa-announcements-badge sa-announcements-badge-featured">
                          <FontAwesomeIcon icon={faStar} /> Featured
                        </span>
                      )}
                      {!announcement.visible_to_citizens && (
                        <span className="sa-announcements-badge sa-announcements-badge-hidden">
                          <FontAwesomeIcon icon={faEyeSlash} /> Hidden
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="sa-announcements-actions" onClick={(e) => e.stopPropagation()}>
                    {isDeleted ? (
                      <>
                        <button
                          className="sa-announcements-action-btn sa-announcements-restore-btn"
                          onClick={(e) => handleRestore(announcement.id, e)}
                          disabled={restoringId === announcement.id}
                          title="Restore announcement"
                        >
                          <FontAwesomeIcon icon={faUndo} />
                          {restoringId === announcement.id ? 'Restoring...' : 'Restore'}
                        </button>
                        <button
                          className="sa-announcements-action-btn sa-announcements-permanent-delete-btn"
                          onClick={(e) => handlePermanentDelete(announcement.id, e)}
                          disabled={permanentDeletingId === announcement.id}
                          title="Permanently delete (cannot be restored)"
                        >
                          <FontAwesomeIcon icon={faBan} />
                          {permanentDeletingId === announcement.id ? 'Deleting...' : 'Permanent Delete'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`sa-announcements-action-btn sa-announcements-visibility-btn ${announcement.visible_to_citizens ? 'visible' : 'hidden'}`}
                          onClick={(e) => handleToggleVisibility(announcement.id, announcement.visible_to_citizens, e)}
                          disabled={updatingId === announcement.id}
                          title={announcement.visible_to_citizens ? 'Hide from citizens' : 'Show to citizens'}
                        >
                          <FontAwesomeIcon icon={announcement.visible_to_citizens ? faEye : faEyeSlash} />
                        </button>
                        <button
                          className={`sa-announcements-action-btn sa-announcements-featured-btn ${announcement.featured ? 'active' : ''}`}
                          onClick={(e) => handleToggleFeatured(announcement.id, announcement.featured, e)}
                          disabled={updatingId === announcement.id}
                          title={announcement.featured ? 'Unfeature (remove from featured section)' : 'Feature (show prominently to citizens)'}
                        >
                          <FontAwesomeIcon icon={faStar} />
                        </button>
                        <button
                          className="sa-announcements-action-btn sa-announcements-delete-btn"
                          onClick={(e) => handleDelete(announcement.id, e)}
                          disabled={deletingId === announcement.id}
                          title="Delete announcement"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="sa-announcements-meta">
                  <span>
                    <FontAwesomeIcon icon={faCalendar} />
                    {formatDate(announcement.created_at)}
                  </span>
                </div>
                <div className="sa-announcements-card-body">
                  <p className="sa-announcements-description">
                    {announcement.description || 'No description'}
                  </p>
                  {announcement.photo_urls && announcement.photo_urls.length > 0 && (
                    <div className="sa-announcements-photos">
                      <div className="sa-announcements-photos-header">
                        <FontAwesomeIcon icon={faImage} />
                        <span>{announcement.photo_urls.length} photo(s)</span>
                      </div>
                      <div className="sa-announcements-photos-grid">
                        {announcement.photo_urls.slice(0, 3).map((photoUrl, idx) => (
                          <img key={idx} src={photoUrl} alt={`Announcement ${idx + 1}`} />
                        ))}
                        {announcement.photo_urls.length > 3 && (
                          <div className="sa-announcements-photos-more">
                            +{announcement.photo_urls.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="sa-announcements-card-footer">
                  <span className="sa-announcements-view-details">Click to view details →</span>
                </div>
              </div>
            );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="sa-announcements-pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Modal for viewing full announcement details */}
        {showModal && selectedAnnouncement && (
          <div className="sa-announcements-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="sa-announcements-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="sa-announcements-modal-header">
                <h2>{selectedAnnouncement.title || 'Untitled Announcement'}</h2>
                <button 
                  className="sa-announcements-modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="sa-announcements-modal-body">
                <div className="sa-announcements-modal-section">
                  <h3>Description</h3>
                  <p>{selectedAnnouncement.description || 'No description provided'}</p>
                </div>
                
                <div className="sa-announcements-modal-section">
                  <h3>Details</h3>
                  <div className="sa-announcements-modal-details">
                    <div>
                      <strong>Created at:</strong> {formatDate(selectedAnnouncement.created_at)}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span className={`sa-announcements-badge ${selectedAnnouncement.visible_to_citizens ? 'sa-announcements-badge-visible' : 'sa-announcements-badge-hidden'}`}>
                        {selectedAnnouncement.visible_to_citizens ? 'Visible' : 'Hidden'}
                      </span>
                      {selectedAnnouncement.featured && (
                        <span className="sa-announcements-badge sa-announcements-badge-featured">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedAnnouncement.photo_urls && selectedAnnouncement.photo_urls.length > 0 && (
                  <div className="sa-announcements-modal-section">
                    <div className="sa-announcements-photos-header-section">
                      <h3>Photos ({selectedAnnouncement.photo_urls.length})</h3>
                      {selectedAnnouncement.photo_urls.length > 6 && (
                        <button
                          className="sa-announcements-show-all-photos-btn"
                          onClick={() => setShowAllPhotos(!showAllPhotos)}
                        >
                          {showAllPhotos ? 'Show Less' : `Show All (${selectedAnnouncement.photo_urls.length})`}
                        </button>
                      )}
                    </div>
                    <div className="sa-announcements-modal-photos-grid">
                      {(showAllPhotos ? selectedAnnouncement.photo_urls : selectedAnnouncement.photo_urls.slice(0, 6)).map((photoUrl, idx) => {
                        const actualIndex = showAllPhotos ? idx : idx; // When showing all, idx is correct; when showing 6, idx is also correct (0-5)
                        return (
                          <img 
                            key={idx} 
                            src={photoUrl} 
                            alt={`Announcement photo ${actualIndex + 1}`}
                            onClick={() => handlePhotoClick(actualIndex)}
                            className="sa-announcements-photo-thumbnail"
                          />
                        );
                      })}
                    </div>
                    {!showAllPhotos && selectedAnnouncement.photo_urls.length > 6 && (
                      <div className="sa-announcements-photos-more-indicator">
                        +{selectedAnnouncement.photo_urls.length - 6} more photos (click "Show All" to view)
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="sa-announcements-modal-footer">
                <button
                  className={`sa-announcements-modal-btn sa-announcements-modal-visibility-btn ${selectedAnnouncement.visible_to_citizens ? 'visible' : 'hidden'}`}
                  onClick={(e) => {
                    handleToggleVisibility(selectedAnnouncement.id, selectedAnnouncement.visible_to_citizens, e);
                  }}
                  disabled={updatingId === selectedAnnouncement.id}
                >
                  <FontAwesomeIcon icon={selectedAnnouncement.visible_to_citizens ? faEye : faEyeSlash} />
                  {selectedAnnouncement.visible_to_citizens ? 'Hide from Citizens' : 'Show to Citizens'}
                </button>
                <button
                  className={`sa-announcements-modal-btn sa-announcements-modal-featured-btn ${selectedAnnouncement.featured ? 'active' : ''}`}
                  onClick={(e) => {
                    handleToggleFeatured(selectedAnnouncement.id, selectedAnnouncement.featured, e);
                  }}
                  disabled={updatingId === selectedAnnouncement.id}
                >
                  <FontAwesomeIcon icon={faStar} />
                  {selectedAnnouncement.featured ? 'Unfeature' : 'Feature'}
                </button>
                {selectedAnnouncement.deleted_at ? (
                  <>
                    <button
                      className="sa-announcements-modal-btn sa-announcements-modal-restore-btn"
                      onClick={(e) => {
                        handleRestore(selectedAnnouncement.id, e);
                        setShowModal(false);
                      }}
                      disabled={restoringId === selectedAnnouncement.id}
                    >
                      <FontAwesomeIcon icon={faUndo} />
                      {restoringId === selectedAnnouncement.id ? 'Restoring...' : 'Restore Announcement'}
                    </button>
                    <button
                      className="sa-announcements-modal-btn sa-announcements-modal-permanent-delete-btn"
                      onClick={(e) => {
                        handlePermanentDelete(selectedAnnouncement.id, e);
                        setShowModal(false);
                      }}
                      disabled={permanentDeletingId === selectedAnnouncement.id}
                    >
                      <FontAwesomeIcon icon={faBan} />
                      {permanentDeletingId === selectedAnnouncement.id ? 'Deleting...' : 'Permanent Delete'}
                    </button>
                  </>
                ) : (
                  <button
                    className="sa-announcements-modal-btn sa-announcements-modal-delete-btn"
                    onClick={(e) => {
                      handleDelete(selectedAnnouncement.id, e);
                      setShowModal(false);
                    }}
                    disabled={deletingId === selectedAnnouncement.id}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    {deletingId === selectedAnnouncement.id ? 'Deleting...' : 'Delete Announcement'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photo Viewer Modal - Full Screen Image Viewer */}
        {selectedPhotoIndex !== null && selectedAnnouncement && (
          <div className="sa-announcements-photo-viewer-overlay" onClick={closePhotoViewer}>
            <div className="sa-announcements-photo-viewer-content" onClick={(e) => e.stopPropagation()}>
              <button className="sa-announcements-photo-viewer-close" onClick={closePhotoViewer}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <button 
                className="sa-announcements-photo-viewer-nav sa-announcements-photo-viewer-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto('prev');
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <img 
                src={selectedAnnouncement.photo_urls[selectedPhotoIndex]} 
                alt={`Photo ${selectedPhotoIndex + 1} of ${selectedAnnouncement.photo_urls.length}`}
                className="sa-announcements-photo-viewer-image"
              />
              <button 
                className="sa-announcements-photo-viewer-nav sa-announcements-photo-viewer-next"
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto('next');
                }}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
              <div className="sa-announcements-photo-viewer-info">
                Photo {selectedPhotoIndex + 1} of {selectedAnnouncement.photo_urls.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export default Announcements;

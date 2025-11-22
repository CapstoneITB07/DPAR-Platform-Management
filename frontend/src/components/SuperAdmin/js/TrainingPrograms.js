import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/TrainingPrograms.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faSearch, faTrash, faCalendar, faMapMarkerAlt, faImage, faEye, faEyeSlash, faStar, faSync, faTimes, faUndo, faBan, faExclamationTriangle, faChevronLeft, faChevronRight, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';

function TrainingPrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [permanentDeletingId, setPermanentDeletingId] = useState(null);

  const fetchPrograms = React.useCallback(async (isRefresh = false) => {
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
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/training-programs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrograms(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setError('');
    } catch (err) {
      setError('Failed to fetch training programs');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, dateFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPrograms(false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchPrograms]);

  const handleRefresh = () => {
    fetchPrograms(true);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this training program? It can be restored later.')) {
      return;
    }

    try {
      setDeletingId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/training-programs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update the program to show as deleted
      setPrograms(programs.map(p => 
        p.id === id ? { ...p, deleted_at: new Date().toISOString() } : p
      ));
      if (selectedProgram && selectedProgram.id === id) {
        setSelectedProgram({ ...selectedProgram, deleted_at: new Date().toISOString() });
      }
      setSuccess('Training program deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete training program');
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
      await axiosInstance.post(`${API_BASE}/api/superadmin/training-programs/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update the program to remove deleted_at
      setPrograms(programs.map(p => 
        p.id === id ? { ...p, deleted_at: null } : p
      ));
      if (selectedProgram && selectedProgram.id === id) {
        setSelectedProgram({ ...selectedProgram, deleted_at: null });
      }
      setSuccess('Training program restored successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to restore training program');
      console.error('Error:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this training program? This action cannot be undone!')) {
      return;
    }

    try {
      setPermanentDeletingId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.delete(`${API_BASE}/api/superadmin/training-programs/${id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove from list
      setPrograms(programs.filter(p => p.id !== id));
      if (selectedProgram && selectedProgram.id === id) {
        setShowModal(false);
        setSelectedProgram(null);
      }
      setSuccess('Training program permanently deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to permanently delete training program');
      console.error('Error:', err);
    } finally {
      setPermanentDeletingId(null);
    }
  };

  const handleToggleVisibility = async (id, currentVisibility, e) => {
    if (e) e.stopPropagation();
    try {
      setUpdatingId(id);
      const token = localStorage.getItem('authToken');
      await axiosInstance.put(`${API_BASE}/api/superadmin/training-programs/${id}/visibility`, 
        { visible: !currentVisibility },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Training program ${!currentVisibility ? 'shown' : 'hidden'} from citizens`);
      setPrograms(programs.map(p => 
        p.id === id ? { ...p, visible_to_citizens: !currentVisibility } : p
      ));
      if (selectedProgram && selectedProgram.id === id) {
        setSelectedProgram({ ...selectedProgram, visible_to_citizens: !currentVisibility });
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
    if (e) e.stopPropagation();
    try {
      setUpdatingId(id);
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.put(`${API_BASE}/api/superadmin/training-programs/${id}/featured`, 
        { featured: !currentFeatured },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newFeaturedStatus = response.data.featured ?? !currentFeatured;
      setSuccess(`Training program ${newFeaturedStatus ? 'featured' : 'unfeatured'}`);
      setPrograms(programs.map(p => 
        p.id === id ? { ...p, featured: Boolean(newFeaturedStatus) } : p
      ));
      if (selectedProgram && selectedProgram.id === id) {
        setSelectedProgram({ ...selectedProgram, featured: Boolean(newFeaturedStatus) });
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update featured status');
      console.error('Error:', err);
      fetchPrograms(true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProgramClick = (program) => {
    setSelectedProgram(program);
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
    const totalPhotos = selectedProgram?.photos?.length || 0;
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

  const isUpcoming = (dateString) => {
    return new Date(dateString) >= new Date();
  };

  if (loading && programs.length === 0) {
    return (
      <SuperAdminLayout>
        <div className="sa-trainingprograms-container">
          <div className="sa-trainingprograms-loading">Loading training programs...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-trainingprograms-container">
        <div className="sa-trainingprograms-page-header">
          <div>
            <h1>
              <FontAwesomeIcon icon={faGraduationCap} />
              Training Programs Management
            </h1>
            <p>View and manage all training programs visible to citizens</p>
          </div>
          <button 
            className="sa-trainingprograms-btn-refresh" 
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <FontAwesomeIcon icon={faSync} spin={refreshing} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <div className="sa-trainingprograms-error-message">{error}</div>}
        {success && <div className="sa-trainingprograms-success-message">{success}</div>}

        <div className="sa-trainingprograms-filters-section">
          <div className="sa-trainingprograms-search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search training programs by name, description, or location..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="sa-trainingprograms-search-box" style={{ maxWidth: '200px' }}>
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

        <div className="sa-trainingprograms-list">
          {programs.length === 0 ? (
            <div className="sa-trainingprograms-empty-state">
              <FontAwesomeIcon icon={faGraduationCap} />
              <p>No training programs found</p>
            </div>
          ) : (
            programs.map((program) => {
              const isDeleted = program.deleted_at !== null && program.deleted_at !== undefined;
              return (
              <div 
                key={program.id} 
                className={`sa-trainingprograms-card ${isDeleted ? 'sa-trainingprograms-card-deleted' : ''}`}
                onClick={() => handleProgramClick(program)}
              >
                <div className="sa-trainingprograms-card-header">
                  <div className="sa-trainingprograms-title-section">
                    <div className="sa-trainingprograms-title-wrapper">
                      <h3>{program.name || 'Untitled Training Program'}</h3>
                      {isDeleted && (
                        <span className="sa-trainingprograms-deleted-badge">
                          <FontAwesomeIcon icon={faExclamationTriangle} /> Deleted
                        </span>
                      )}
                    </div>
                    <div className="sa-trainingprograms-badges">
                      {program.featured && (
                        <span className="sa-trainingprograms-badge sa-trainingprograms-badge-featured">
                          <FontAwesomeIcon icon={faStar} /> Featured
                        </span>
                      )}
                      {!program.visible_to_citizens && (
                        <span className="sa-trainingprograms-badge sa-trainingprograms-badge-hidden">
                          <FontAwesomeIcon icon={faEyeSlash} /> Hidden
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="sa-trainingprograms-actions" onClick={(e) => e.stopPropagation()}>
                    {isDeleted ? (
                      <>
                        <button
                          className="sa-trainingprograms-action-btn sa-trainingprograms-restore-btn"
                          onClick={(e) => handleRestore(program.id, e)}
                          disabled={restoringId === program.id}
                          title="Restore training program"
                        >
                          <FontAwesomeIcon icon={faUndo} />
                          {restoringId === program.id ? 'Restoring...' : 'Restore'}
                        </button>
                        <button
                          className="sa-trainingprograms-action-btn sa-trainingprograms-permanent-delete-btn"
                          onClick={(e) => handlePermanentDelete(program.id, e)}
                          disabled={permanentDeletingId === program.id}
                          title="Permanently delete (cannot be restored)"
                        >
                          <FontAwesomeIcon icon={faBan} />
                          {permanentDeletingId === program.id ? 'Deleting...' : 'Permanent Delete'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`sa-trainingprograms-action-btn sa-trainingprograms-visibility-btn ${program.visible_to_citizens ? 'visible' : 'hidden'}`}
                          onClick={(e) => handleToggleVisibility(program.id, program.visible_to_citizens, e)}
                          disabled={updatingId === program.id}
                          title={program.visible_to_citizens ? 'Hide from citizens' : 'Show to citizens'}
                        >
                          <FontAwesomeIcon icon={program.visible_to_citizens ? faEye : faEyeSlash} />
                        </button>
                        <button
                          className={`sa-trainingprograms-action-btn sa-trainingprograms-featured-btn ${program.featured ? 'active' : ''}`}
                          onClick={(e) => handleToggleFeatured(program.id, program.featured, e)}
                          disabled={updatingId === program.id}
                          title={program.featured ? 'Unfeature (remove from featured section)' : 'Feature (show prominently to citizens)'}
                        >
                          <FontAwesomeIcon icon={faStar} />
                        </button>
                        <button
                          className="sa-trainingprograms-action-btn sa-trainingprograms-delete-btn"
                          onClick={(e) => handleDelete(program.id, e)}
                          disabled={deletingId === program.id}
                          title="Delete training program"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="sa-trainingprograms-meta">
                  <span>
                    <FontAwesomeIcon icon={faCalendar} />
                    {formatDate(program.date)}
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    {program.location || 'No location'}
                  </span>
                  <span className={`sa-trainingprograms-status-badge ${isUpcoming(program.date) ? 'upcoming' : 'past'}`}>
                    {isUpcoming(program.date) ? 'Upcoming' : 'Past'}
                  </span>
                </div>
                <div className="sa-trainingprograms-card-body">
                  <p className="sa-trainingprograms-description">
                    {program.description || 'No description'}
                  </p>
                  {program.photos && program.photos.length > 0 && (
                    <div className="sa-trainingprograms-photos">
                      <div className="sa-trainingprograms-photos-header">
                        <FontAwesomeIcon icon={faImage} />
                        <span>{program.photos.length} photo(s)</span>
                      </div>
                      <div className="sa-trainingprograms-photos-grid">
                        {program.photos.slice(0, 3).map((photoUrl, idx) => (
                          <img key={idx} src={photoUrl} alt={`Training ${idx + 1}`} />
                        ))}
                        {program.photos.length > 3 && (
                          <div className="sa-trainingprograms-photos-more">
                            +{program.photos.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="sa-trainingprograms-card-footer">
                  <span className="sa-trainingprograms-view-details">Click to view details →</span>
                </div>
              </div>
            );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="sa-trainingprograms-pagination">
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

        {/* Modal for viewing full training program details */}
        {showModal && selectedProgram && (
          <div className="sa-trainingprograms-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="sa-trainingprograms-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="sa-trainingprograms-modal-header">
                <h2>{selectedProgram.name || 'Untitled Training Program'}</h2>
                <button 
                  className="sa-trainingprograms-modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="sa-trainingprograms-modal-body">
                <div className="sa-trainingprograms-modal-section">
                  <h3>Description</h3>
                  <p>{selectedProgram.description || 'No description provided'}</p>
                </div>
                
                <div className="sa-trainingprograms-modal-section">
                  <h3>Details</h3>
                  <div className="sa-trainingprograms-modal-details">
                    <div>
                      <strong>Date:</strong> {formatDate(selectedProgram.date)}
                    </div>
                    <div>
                      <strong>Location:</strong> {selectedProgram.location || 'No location'}
                    </div>
                    <div>
                      <strong>Status:</strong> 
                      <span className={`sa-trainingprograms-status-badge ${isUpcoming(selectedProgram.date) ? 'upcoming' : 'past'}`}>
                        {isUpcoming(selectedProgram.date) ? 'Upcoming' : 'Past'}
                      </span>
                    </div>
                    <div>
                      <strong>Created at:</strong> {formatDate(selectedProgram.created_at)}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span className={`sa-trainingprograms-badge ${selectedProgram.visible_to_citizens ? 'sa-trainingprograms-badge-visible' : 'sa-trainingprograms-badge-hidden'}`}>
                        {selectedProgram.visible_to_citizens ? 'Visible' : 'Hidden'}
                      </span>
                      {selectedProgram.featured && (
                        <span className="sa-trainingprograms-badge sa-trainingprograms-badge-featured">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedProgram.photos && selectedProgram.photos.length > 0 && (
                  <div className="sa-trainingprograms-modal-section">
                    <div className="sa-trainingprograms-photos-header-section">
                      <h3>Photos ({selectedProgram.photos.length})</h3>
                      {selectedProgram.photos.length > 6 && (
                        <button
                          className="sa-trainingprograms-show-all-photos-btn"
                          onClick={() => setShowAllPhotos(!showAllPhotos)}
                        >
                          {showAllPhotos ? 'Show Less' : `Show All (${selectedProgram.photos.length})`}
                        </button>
                      )}
                    </div>
                    <div className="sa-trainingprograms-modal-photos-grid">
                      {(showAllPhotos ? selectedProgram.photos : selectedProgram.photos.slice(0, 6)).map((photoUrl, displayIdx) => {
                        const actualIndex = showAllPhotos ? displayIdx : displayIdx;
                        return (
                          <img 
                            key={displayIdx} 
                            src={photoUrl} 
                            alt={`Training program photo ${actualIndex + 1}`}
                            onClick={() => handlePhotoClick(actualIndex)}
                            className="sa-trainingprograms-photo-thumbnail"
                          />
                        );
                      })}
                    </div>
                    {!showAllPhotos && selectedProgram.photos.length > 6 && (
                      <div className="sa-trainingprograms-photos-more-indicator">
                        +{selectedProgram.photos.length - 6} more photos (click "Show All" to view)
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="sa-trainingprograms-modal-footer">
                <button
                  className={`sa-trainingprograms-modal-btn sa-trainingprograms-modal-visibility-btn ${selectedProgram.visible_to_citizens ? 'visible' : 'hidden'}`}
                  onClick={(e) => {
                    handleToggleVisibility(selectedProgram.id, selectedProgram.visible_to_citizens, e);
                  }}
                  disabled={updatingId === selectedProgram.id}
                >
                  <FontAwesomeIcon icon={selectedProgram.visible_to_citizens ? faEye : faEyeSlash} />
                  {selectedProgram.visible_to_citizens ? 'Hide from Citizens' : 'Show to Citizens'}
                </button>
                <button
                  className={`sa-trainingprograms-modal-btn sa-trainingprograms-modal-featured-btn ${selectedProgram.featured ? 'active' : ''}`}
                  onClick={(e) => {
                    handleToggleFeatured(selectedProgram.id, selectedProgram.featured, e);
                  }}
                  disabled={updatingId === selectedProgram.id}
                >
                  <FontAwesomeIcon icon={faStar} />
                  {selectedProgram.featured ? 'Unfeature' : 'Feature'}
                </button>
                {selectedProgram.deleted_at ? (
                  <>
                    <button
                      className="sa-trainingprograms-modal-btn sa-trainingprograms-modal-restore-btn"
                      onClick={(e) => {
                        handleRestore(selectedProgram.id, e);
                        setShowModal(false);
                      }}
                      disabled={restoringId === selectedProgram.id}
                    >
                      <FontAwesomeIcon icon={faUndo} />
                      {restoringId === selectedProgram.id ? 'Restoring...' : 'Restore Training Program'}
                    </button>
                    <button
                      className="sa-trainingprograms-modal-btn sa-trainingprograms-modal-permanent-delete-btn"
                      onClick={(e) => {
                        handlePermanentDelete(selectedProgram.id, e);
                        setShowModal(false);
                      }}
                      disabled={permanentDeletingId === selectedProgram.id}
                    >
                      <FontAwesomeIcon icon={faBan} />
                      {permanentDeletingId === selectedProgram.id ? 'Deleting...' : 'Permanent Delete'}
                    </button>
                  </>
                ) : (
                  <button
                    className="sa-trainingprograms-modal-btn sa-trainingprograms-modal-delete-btn"
                    onClick={(e) => {
                      handleDelete(selectedProgram.id, e);
                      setShowModal(false);
                    }}
                    disabled={deletingId === selectedProgram.id}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    {deletingId === selectedProgram.id ? 'Deleting...' : 'Delete Training Program'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photo Viewer Modal - Full Screen Image Viewer */}
        {selectedPhotoIndex !== null && selectedProgram && (
          <div className="sa-trainingprograms-photo-viewer-overlay" onClick={closePhotoViewer}>
            <div className="sa-trainingprograms-photo-viewer-content" onClick={(e) => e.stopPropagation()}>
              <button className="sa-trainingprograms-photo-viewer-close" onClick={closePhotoViewer}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <button 
                className="sa-trainingprograms-photo-viewer-nav sa-trainingprograms-photo-viewer-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto('prev');
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <img 
                src={selectedProgram.photos[selectedPhotoIndex]} 
                alt={`Photo ${selectedPhotoIndex + 1} of ${selectedProgram.photos.length}`}
                className="sa-trainingprograms-photo-viewer-image"
              />
              <button 
                className="sa-trainingprograms-photo-viewer-nav sa-trainingprograms-photo-viewer-next"
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto('next');
                }}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
              <div className="sa-trainingprograms-photo-viewer-info">
                Photo {selectedPhotoIndex + 1} of {selectedProgram.photos.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export default TrainingPrograms;

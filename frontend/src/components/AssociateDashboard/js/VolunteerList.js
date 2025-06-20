import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import AssociateLayout from './AssociateLayout';
import '../css/VolunteerList.css';

function VolunteerList() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    expertise: '',
    gender: ''
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    address: '',
    contact_info: '',
    expertise: '',
    location: ''
  });

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:8000/api/volunteers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVolunteers(response.data);
    } catch (err) {
      setError('Failed to fetch volunteers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const dataToSubmit = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        contact_info: formData.contact_info.replace(/\D/g, '').slice(0, 11)
      };

      if (selectedVolunteer) {
        await axios.put(`http://localhost:8000/api/volunteers/${selectedVolunteer.id}`, dataToSubmit, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:8000/api/volunteers', dataToSubmit, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      setSelectedVolunteer(null);
      setFormData({
        firstName: '',
        lastName: '',
        gender: '',
        address: '',
        contact_info: '',
        expertise: '',
        location: ''
      });
      fetchVolunteers();
    } catch (err) {
      setError('Failed to save volunteer');
    }
  };

  const handleEdit = (volunteer) => {
    const [firstName = '', lastName = ''] = volunteer.name.split(' ');
    setSelectedVolunteer(volunteer);
    setFormData({
      firstName,
      lastName,
      gender: volunteer.gender,
      address: volunteer.address,
      contact_info: volunteer.contact_info,
      expertise: volunteer.expertise,
      location: volunteer.location
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this volunteer?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`http://localhost:8000/api/volunteers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchVolunteers();
    } catch (err) {
      setError('Failed to delete volunteer');
    }
  };

  // Get unique values for filters
  const getUniqueValues = (field) => {
    return [...new Set(volunteers.map(v => v[field]).filter(Boolean))];
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = volunteer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !filters.location || volunteer.location === filters.location;
    const matchesExpertise = !filters.expertise || volunteer.expertise === filters.expertise;
    const matchesGender = !filters.gender || volunteer.gender === filters.gender;
    return matchesSearch && matchesLocation && matchesExpertise && matchesGender;
  });

  // Add this new function to handle contact number input
  const handleContactChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData({ ...formData, contact_info: value });
  };

  return (
    <AssociateLayout>
      <div className="volunteer-list-container">
        <div className="header-section">
          <h2>VOLUNTEER LIST</h2>
          <div className="filters">
            <div className="search-bar">
              <FontAwesomeIcon icon={faSearch} />
              <input
                type="text"
                placeholder="Search volunteers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            >
              <option value="">GENDER</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            >
              <option value="">LOCATION</option>
              {getUniqueValues('location').map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            <select
              value={filters.expertise}
              onChange={(e) => setFilters({ ...filters, expertise: e.target.value })}
            >
              <option value="">EXPERTISE</option>
              {getUniqueValues('expertise').map(expertise => (
                <option key={expertise} value={expertise}>{expertise}</option>
              ))}
            </select>
          </div>
          <button className="add-member-btn" onClick={() => setShowModal(true)}>
            + Add Member
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <table className="volunteer-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Address</th>
                <th>Contact Info</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVolunteers.map(volunteer => (
                <tr key={volunteer.id}>
                  <td>{volunteer.name}</td>
                  <td>{volunteer.gender}</td>
                  <td>{volunteer.address}</td>
                  <td>{volunteer.contact_info}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(volunteer)}>
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(volunteer.id)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{selectedVolunteer ? 'Edit Volunteer' : 'Add New Volunteer'}</h3>
                <button className="modal-close" onClick={() => {
                  setShowModal(false);
                  setSelectedVolunteer(null);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    gender: '',
                    address: '',
                    contact_info: '',
                    expertise: '',
                    location: ''
                  });
                }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Info</label>
                  <input
                    type="text"
                    value={formData.contact_info}
                    onChange={handleContactChange}
                    required
                    maxLength="11"
                    placeholder="Enter 11-digit number"
                    pattern="[0-9]{11}"
                    title="Please enter exactly 11 digits"
                  />
                </div>
                <div className="form-group">
                  <label>Expertise</label>
                  <input
                    type="text"
                    value={formData.expertise}
                    onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="save-btn">
                    {selectedVolunteer ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AssociateLayout>
  );
}

export default VolunteerList; 
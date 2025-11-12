import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/AllUsers.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faSearch, faUserShield, faUser, faBuilding } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';

function AllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 5,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      });
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setError('');
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'superadmin': return faUserShield;
      case 'head_admin': return faUserShield;
      case 'associate_group_leader': return faBuilding;
      default: return faUser;
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      'superadmin': 'sa-allusers-badge-superadmin',
      'head_admin': 'sa-allusers-badge-headadmin',
      'associate_group_leader': 'sa-allusers-badge-associate'
    };
    return badges[role] || 'sa-allusers-badge-default';
  };

  if (loading && users.length === 0) {
    return (
      <SuperAdminLayout>
        <div className="sa-allusers-container">
          <div className="sa-allusers-loading">Loading users...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-allusers-container">
        <div className="sa-allusers-page-header">
          <h1><FontAwesomeIcon icon={faUsers} /> All Users</h1>
        </div>

        <div className="sa-allusers-filters-section">
          <div className="sa-allusers-search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <select
            className="sa-allusers-role-filter"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="head_admin">Head Admin</option>
            <option value="associate_group_leader">Associate Group Leader</option>
          </select>
        </div>

        {error && <div className="sa-allusers-error-message">{error}</div>}

        <div className="sa-allusers-table-container">
          <table className="sa-allusers-table">
            <colgroup>
              <col className="sa-allusers-col-name" />
              <col className="sa-allusers-col-username" />
              <col className="sa-allusers-col-email" />
              <col className="sa-allusers-col-role" />
              <col className="sa-allusers-col-org" />
              <col className="sa-allusers-col-created" />
            </colgroup>
            <thead className="sa-allusers-table-header">
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Organization</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody className="sa-allusers-table-body">
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="sa-allusers-user-cell">
                      <FontAwesomeIcon icon={getRoleIcon(user.role)} className="sa-allusers-user-icon" />
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>@{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`sa-allusers-role-badge ${getRoleBadge(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>{user.organization || '-'}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="sa-allusers-empty-state">
            <FontAwesomeIcon icon={faUsers} />
            <p>No users found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="sa-allusers-pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="sa-allusers-page-btn"
            >
              Previous
            </button>
            <span className="sa-allusers-page-info">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="sa-allusers-page-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export default AllUsers;


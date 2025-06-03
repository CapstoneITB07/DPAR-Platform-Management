import React, { useState } from 'react';
import './AdminDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEdit, faTachometerAlt, faUsers, faBell, faCheckCircle, faBullhorn, faGraduationCap, faChartBar, faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';

function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const isActive = (route) => location.pathname === route;

  return (
    <div className="admin-dashboard-container">
      {/* Header Bar */}
      <header className="header">
        <div className="header-left">
          <div className="burger-icon" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBars} />
          </div>
          <span className="dpar-text">DPAR</span>
        </div>
        <div className="header-right">
          <div className="notification-icon"><FontAwesomeIcon icon={faBell} /></div>
        </div>
      </header>
      <div className="content-wrapper">
        <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}> 
          <div className="sidebar-header">
            {isSidebarOpen && (
              <div className="user-profile">
                <FontAwesomeIcon icon={faUserCircle} className="profile-icon" />
                <div className="user-info">
                  <p className="user-name">Admin</p>
                  <p className="edit-profile"><FontAwesomeIcon icon={faEdit} /> Edit Profile</p>
                </div>
              </div>
            )}
          </div>
          <nav className="sidebar-nav">
            <ul>
              {isSidebarOpen && (
                <>
                  <li className={isActive('/admin/dashboard') ? 'active' : ''} onClick={() => navigate('/admin/dashboard')}><FontAwesomeIcon icon={faTachometerAlt} /> DASHBOARD</li>
                  <li className={isActive('/admin/associate-groups') ? 'active' : ''} onClick={() => navigate('/admin/associate-groups')}><FontAwesomeIcon icon={faUsers} /> ASSOCIATE GROUPS</li>
                  <li className={isActive('/admin/notifications') ? 'active' : ''} onClick={() => navigate('/admin/notifications')}><FontAwesomeIcon icon={faBell} /> NOTIFICATIONS</li>
                  <li className={isActive('/admin/approval-aor') ? 'active' : ''} onClick={() => navigate('/admin/approval-aor')}><FontAwesomeIcon icon={faCheckCircle} /> APPROVAL/AOR</li>
                  <li className={isActive('/admin/announcement') ? 'active' : ''} onClick={() => navigate('/admin/announcement')}><FontAwesomeIcon icon={faBullhorn} /> ANNOUNCEMENT</li>
                  <li className={isActive('/admin/training-program') ? 'active' : ''} onClick={() => navigate('/admin/training-program')}><FontAwesomeIcon icon={faGraduationCap} /> TRAINING PROGRAM</li>
                  <li className={isActive('/admin/evaluation') ? 'active' : ''} onClick={() => navigate('/admin/evaluation')}><FontAwesomeIcon icon={faChartBar} /> EVALUATION</li>
                </>
              )}
              {!isSidebarOpen && (
                <>
                  <li className={isActive('/admin/dashboard') ? 'active' : ''} onClick={() => navigate('/admin/dashboard')}><FontAwesomeIcon icon={faTachometerAlt} /></li>
                  <li className={isActive('/admin/associate-groups') ? 'active' : ''} onClick={() => navigate('/admin/associate-groups')}><FontAwesomeIcon icon={faUsers} /></li>
                  <li className={isActive('/admin/notifications') ? 'active' : ''} onClick={() => navigate('/admin/notifications')}><FontAwesomeIcon icon={faBell} /></li>
                  <li className={isActive('/admin/approval-aor') ? 'active' : ''} onClick={() => navigate('/admin/approval-aor')}><FontAwesomeIcon icon={faCheckCircle} /></li>
                  <li className={isActive('/admin/announcement') ? 'active' : ''} onClick={() => navigate('/admin/announcement')}><FontAwesomeIcon icon={faBullhorn} /></li>
                  <li className={isActive('/admin/training-program') ? 'active' : ''} onClick={() => navigate('/admin/training-program')}><FontAwesomeIcon icon={faGraduationCap} /></li>
                  <li className={isActive('/admin/evaluation') ? 'active' : ''} onClick={() => navigate('/admin/evaluation')}><FontAwesomeIcon icon={faChartBar} /></li>
                </>
              )}
            </ul>
          </nav>
          <div className="sidebar-footer">
            {isSidebarOpen && (
              <button className="logout-button" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Logout
              </button>
            )}
            {!isSidebarOpen && (
              <button className="logout-button-icon-only" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            )}
          </div>
        </div>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout; 
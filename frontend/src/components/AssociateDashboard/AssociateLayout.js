import React, { useState } from 'react';
import './AssociateDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEdit, faBullhorn, faUsers, faBell, faChartBar, faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';

function AssociateLayout({ children }) {
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
    <div className="associate-dashboard-container">
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
                  <p className="user-name">Group Leader</p>
                  <p className="edit-profile"><FontAwesomeIcon icon={faEdit} /> Edit Profile</p>
                </div>
              </div>
            )}
          </div>
          <nav className="sidebar-nav">
            <ul>
              {isSidebarOpen && (
                <>
                  <li className={isActive('/associate/announcements') ? 'active' : ''} onClick={() => navigate('/associate/announcements')}><FontAwesomeIcon icon={faBullhorn} /> ANNOUNCEMENTS</li>
                  <li className={isActive('/associate/volunteer-list') ? 'active' : ''} onClick={() => navigate('/associate/volunteer-list')}><FontAwesomeIcon icon={faUsers} /> VOLUNTEER LIST</li>
                  <li className={isActive('/associate/notification') ? 'active' : ''} onClick={() => navigate('/associate/notification')}><FontAwesomeIcon icon={faBell} /> NOTIFICATION</li>
                  <li className={isActive('/associate/reports') ? 'active' : ''} onClick={() => navigate('/associate/reports')}><FontAwesomeIcon icon={faChartBar} /> REPORTS</li>
                </>
              )}
              {!isSidebarOpen && (
                <>
                  <li className={isActive('/associate/announcements') ? 'active' : ''} onClick={() => navigate('/associate/announcements')}><FontAwesomeIcon icon={faBullhorn} /></li>
                  <li className={isActive('/associate/volunteer-list') ? 'active' : ''} onClick={() => navigate('/associate/volunteer-list')}><FontAwesomeIcon icon={faUsers} /></li>
                  <li className={isActive('/associate/notification') ? 'active' : ''} onClick={() => navigate('/associate/notification')}><FontAwesomeIcon icon={faBell} /></li>
                  <li className={isActive('/associate/reports') ? 'active' : ''} onClick={() => navigate('/associate/reports')}><FontAwesomeIcon icon={faChartBar} /></li>
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

export default AssociateLayout; 
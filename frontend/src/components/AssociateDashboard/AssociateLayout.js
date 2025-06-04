import React, { useState, useEffect } from 'react';
import './AssociateDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEdit, faBullhorn, faUsers, faEnvelope, faChartBar, faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';

function AssociateLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = Number(localStorage.getItem('userId'));
  const NOTIF_READ_KEY = `associateNotifRead_${userId}`;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const isActive = (route) => location.pathname === route;

  const fetchNotifications = async () => {
    const res = await fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
    const data = await res.json();
    const readIds = JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || '[]');
    const unread = Array.isArray(data)
      ? data.filter(n => {
          const myRecipient = n.recipients && n.recipients.find(r => r.user_id === userId);
          return myRecipient && !myRecipient.response && !readIds.includes(n.id);
        }).length
      : 0;
    setUnreadCount(unread);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.pathname === '/associate/notification') {
      fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const readIds = data.map(n => n.id);
            localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(readIds));
            setUnreadCount(0);
          }
        });
    }
  }, [location.pathname, NOTIF_READ_KEY]);

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
          <div className="notification-icon" onClick={() => navigate('/associate/notification')} style={{ cursor: 'pointer', position: 'relative' }}>
            <FontAwesomeIcon icon={faEnvelope} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
            )}
          </div>
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
                  <li className={isActive('/associate/notification') ? 'active' : ''} onClick={() => navigate('/associate/notification')} style={{ position: 'relative' }}>
                    <span onClick={() => navigate('/associate/notification')}><FontAwesomeIcon icon={faEnvelope} /> NOTIFICATION</span>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: 2, right: 0, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
                    )}
                  </li>
                  <li className={isActive('/associate/reports') ? 'active' : ''} onClick={() => navigate('/associate/reports')}><FontAwesomeIcon icon={faChartBar} /> REPORTS</li>
                </>
              )}
              {!isSidebarOpen && (
                <>
                  <li className={isActive('/associate/announcements') ? 'active' : ''} onClick={() => navigate('/associate/announcements')}><FontAwesomeIcon icon={faBullhorn} /></li>
                  <li className={isActive('/associate/volunteer-list') ? 'active' : ''} onClick={() => navigate('/associate/volunteer-list')}><FontAwesomeIcon icon={faUsers} /></li>
                  <li className={isActive('/associate/notification') ? 'active' : ''} onClick={() => navigate('/associate/notification')} style={{ position: 'relative' }}>
                    <span onClick={() => navigate('/associate/notification')}><FontAwesomeIcon icon={faEnvelope} /></span>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: 2, right: 0, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
                    )}
                  </li>
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
import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEdit, faTachometerAlt, faUsers, faBell, faCheckCircle, faBullhorn, faGraduationCap, faChartBar, faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';

function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const ADMIN_NOTIF_RESPONSE_KEY = 'adminNotifResponseViewed';

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
    const viewed = JSON.parse(localStorage.getItem(ADMIN_NOTIF_RESPONSE_KEY) || '{}');
    let unread = 0;
    if (Array.isArray(data)) {
      data.forEach(n => {
        if (!n.recipients) return;
        n.recipients.forEach(r => {
          if (r.response && r.responded_at) {
            if (!viewed[n.id] || viewed[n.id][r.user_id] !== r.responded_at) {
              unread++;
            }
          }
        });
      });
    }
    setUnreadCount(unread);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin/notifications') {
      fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const viewed = JSON.parse(localStorage.getItem(ADMIN_NOTIF_RESPONSE_KEY) || '{}');
            data.forEach(n => {
              if (!n.recipients) return;
              n.recipients.forEach(r => {
                if (r.response && r.responded_at) {
                  if (!viewed[n.id]) viewed[n.id] = {};
                  viewed[n.id][r.user_id] = r.responded_at;
                }
              });
            });
            localStorage.setItem(ADMIN_NOTIF_RESPONSE_KEY, JSON.stringify(viewed));
            setUnreadCount(0);
          }
        });
    }
  }, [location.pathname]);

  return (
    <div className="admin-dashboard-fixed-layout" style={{ minHeight: '100vh', background: '#f4f4f4', height: '100vh' }}>
      {/* Header Bar */}
      <header className="header">
        <div className="header-left">
          <div className="burger-icon" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBars} />
          </div>
          <span className="dpar-text">DPAR</span>
        </div>
        <div className="header-right">
          <div className="notification-icon" onClick={() => navigate('/admin/notifications')} style={{ cursor: 'pointer', position: 'relative' }}>
            <FontAwesomeIcon icon={faBell} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
            )}
          </div>
        </div>
      </header>
      <div style={{ display: 'flex' }}>
        <div
          className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: isSidebarOpen ? 240 : 60,
            zIndex: 100,
            background: '#fff',
            boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'width 0.2s',
          }}
        >
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
                  <li className={isActive('/admin/notifications') ? 'active' : ''} onClick={() => navigate('/admin/notifications')} style={{ position: 'relative' }}>
                    <span onClick={() => navigate('/admin/notifications')}><FontAwesomeIcon icon={faBell} /> NOTIFICATIONS</span>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: 2, right: 0, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
                    )}
                  </li>
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
                  <li className={isActive('/admin/notifications') ? 'active' : ''} onClick={() => navigate('/admin/notifications')} style={{ position: 'relative' }}>
                    <span onClick={() => navigate('/admin/notifications')}><FontAwesomeIcon icon={faBell} /></span>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: 2, right: 0, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</span>
                    )}
                  </li>
                  <li className={isActive('/admin/approval-aor') ? 'active' : ''} onClick={() => navigate('/admin/approval-aor')}><FontAwesomeIcon icon={faCheckCircle} /></li>
                  <li className={isActive('/admin/announcement') ? 'active' : ''} onClick={() => navigate('/admin/announcement')}><FontAwesomeIcon icon={faBullhorn} /></li>
                  <li className={isActive('/admin/training-program') ? 'active' : ''} onClick={() => navigate('/admin/training-program')}><FontAwesomeIcon icon={faGraduationCap} /></li>
                  <li className={isActive('/admin/evaluation') ? 'active' : ''} onClick={() => navigate('/admin/evaluation')}><FontAwesomeIcon icon={faChartBar} /></li>
                </>
              )}
            </ul>
          </nav>
          <div className="sidebar-footer" style={{ marginTop: 'auto', marginBottom: 24 }}>
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
        <main className="main-content" style={{ marginLeft: isSidebarOpen ? 240 : 60, width: isSidebarOpen ? 'calc(100% - 240px)' : 'calc(100% - 60px)', transition: 'margin-left 0.2s, width 0.2s', minHeight: 'calc(100vh - 56px)', background: 'transparent' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout; 
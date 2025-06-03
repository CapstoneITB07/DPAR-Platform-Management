import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import './AssociateGroups.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEdit, faTachometerAlt, faUsers, faBell, faCheckCircle, faBullhorn, faGraduationCap, faChartBar, faSignOutAlt, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

function AssociateGroups() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <AdminLayout>
      <h2>Associate Groups</h2>
      <button onClick={togglePopup}>Show RMFB4A Info</button>
      {isPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-card">
            <div className="popup-header">
              <h3>Rectangle 205</h3>
              <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={togglePopup} />
            </div>
            <div className="popup-content">
              <div className="org-info-section">
                <div className="org-logo">LOGO</div>
                <div className="org-details">
                  <p><strong>Name:</strong> Regional Mobile Force Battalion 4A</p>
                  <p><strong>Type of Organization:</strong> Unit within the Philippine National Police (PNP)</p>
                </div>
              </div>
              <p><strong>Regional Director:</strong> PBGEN John Doe</p>
              <div className="description-section">
                <p><strong>Description:</strong></p>
                <p>RMFB4A stands for Regional Mobile Force Battalion 4A. It is a unit within the Philippine National Police (PNP) that operates in the CALABARZON region (Region 4A). RMFB4A is responsible for Internal Security Operations (ISO) and Public Safety Functions (PSAF).</p>
                <button className="edit-info-button">Edit Info</button>
              </div>
              <div className="stats-contact-message">
                <div className="stats">
                  <p><strong>No. of Members:</strong></p>
                  <button>View all members</button>
                  <p>500 members</p>
                </div>
                <div className="contact-info">
                  <p><strong>Contact Information:</strong></p>
                  <p><FontAwesomeIcon icon={faBell} /> example@gmail.com</p>
                  <p><FontAwesomeIcon icon={faBell} /> +63 9123456780</p>
                </div>
                <div className="message-box">
                  <p><strong>Send Message:</strong></p>
                  <textarea placeholder="Type your message here..."></textarea>
                  <button className="send-button">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AssociateGroups; 
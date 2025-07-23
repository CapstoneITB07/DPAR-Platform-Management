import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import './CitizenPage.css';

function Mitigation() {
  const navigate = useNavigate();
  const [fade, setFade] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const location = useLocation();

  const handleDropdown = () => setDropdownOpen(!dropdownOpen);
  const closeDropdown = () => setDropdownOpen(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => {
    setSidebarOpen(false);
    setSidebarDropdownOpen(false);
  };
  const toggleSidebarDropdown = () => setSidebarDropdownOpen(!sidebarDropdownOpen);

  const handleHomeClick = () => {
    closeSidebar();
    setFade(true);
    setTimeout(() => {
      navigate('/citizen');
    }, 350);
  };

  const handleAboutClick = () => {
    closeSidebar();
    setFade(true);
    setTimeout(() => {
      navigate('/citizen/about');
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

  return (
    <div className="citizen-page-wrapper" style={{ opacity: fade ? 0 : 1 }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="citizen-sidebar-overlay" onClick={closeSidebar} />
      )}
      {/* Mobile Sidebar */}
      <nav className={`citizen-sidebar${sidebarOpen ? ' open' : ''}`}>
        <button className="citizen-sidebar-close" onClick={closeSidebar}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <ul className="citizen-sidebar-nav">
          <li onClick={handleHomeClick}>HOME</li>
          <li className="citizen-sidebar-dropdown">
            <div className="citizen-sidebar-dropdown-header" onClick={toggleSidebarDropdown}>
              <span>CATEGORIES</span>
              <span className={`citizen-sidebar-dropdown-arrow${sidebarDropdownOpen ? ' open' : ''}`}>▼</span>
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
          <li onClick={handleHomeClick}>HOME</li>
          <li className="citizen-navbar-dropdown" onMouseLeave={closeDropdown}>
            <span 
              onClick={handleDropdown} 
              className="citizen-dropdown-button"
              style={{ 
                background: dropdownOpen ? '#a52a1a' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                border: dropdownOpen ? '2px solid #fff' : '2px solid transparent',
                boxShadow: dropdownOpen ? '0 4px 12px rgba(165,42,26,0.3)' : 'none'
              }}
            >
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>CATEGORIES</span>
              <span 
                style={{ 
                  fontSize: '10px',
                  transition: 'transform 0.3s ease',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              >
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
                }} className="active" data-tooltip="Prevent and reduce disaster risks through long-term strategies">MITIGATION</li>
                <li onClick={() => {
                  closeDropdown();
                  setFade(true);
                  setTimeout(() => {
                    navigate('/citizen/preparedness');
                  }, 350);
                }} data-tooltip="Develop plans and acquire resources for effective disaster response">PREPAREDNESS</li>
                <li onClick={() => {
                  closeDropdown();
                  setFade(true);
                  setTimeout(() => {
                    navigate('/citizen/response');
                  }, 350);
                }} data-tooltip="Immediate actions during disasters to save lives and protect property">RESPONSE</li>
                <li onClick={() => {
                  closeDropdown();
                  setFade(true);
                  setTimeout(() => {
                    navigate('/citizen/recovery');
                  }, 350);
                }} data-tooltip="Long-term rebuilding and restoration of communities">RECOVERY</li>
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

      {/* Main Content */}
      <div className="citizen-content-container">
        <div className="citizen-phase-header">
          <h1>MITIGATION</h1>
          <p className="citizen-phase-subtitle">Preventing and Reducing Disaster Risks</p>
        </div>

        <div className="citizen-phase-content">
          <div className="citizen-phase-section">
            <h2>What is Mitigation?</h2>
            <p>
              Mitigation involves actions taken to prevent or reduce the severity of disasters before they occur. 
              It focuses on long-term strategies to minimize the impact of natural and human-made hazards on communities.
              This proactive approach saves lives, reduces property damage, and creates more resilient communities.
            </p>
            <div className="citizen-phase-highlight">
              <strong>💡 Key Insight:</strong> Every $1 spent on mitigation saves $6 in disaster recovery costs.
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Key Mitigation Strategies</h2>
            <div className="citizen-strategies-grid">
              <div className="citizen-strategy-card">
                <h3>Building Codes & Standards</h3>
                <p>Implementing and enforcing construction standards that make buildings more resistant to earthquakes, floods, and other hazards.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Land Use Planning</h3>
                <p>Zoning regulations that prevent development in high-risk areas like floodplains, fault lines, or coastal erosion zones.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Infrastructure Protection</h3>
                <p>Strengthening critical infrastructure like bridges, roads, and utilities to withstand disaster impacts.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Environmental Conservation</h3>
                <p>Protecting natural barriers like wetlands, forests, and coral reefs that provide natural disaster protection.</p>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Community Mitigation Actions</h2>
            <ul className="citizen-action-list">
              <li>Participate in community risk assessments</li>
              <li>Support local building code enforcement</li>
              <li>Volunteer for environmental conservation projects</li>
              <li>Advocate for disaster-resistant infrastructure</li>
              <li>Educate others about hazard risks in your area</li>
              <li>Support local emergency planning initiatives</li>
            </ul>
          </div>

          <div className="citizen-phase-section">
            <h2>Individual Mitigation Steps</h2>
            <div className="citizen-individual-steps">
              <div className="citizen-step-item">
                <h4>Home Safety</h4>
                <p>Secure heavy furniture, install smoke detectors, and maintain emergency supplies.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Insurance</h4>
                <p>Obtain appropriate insurance coverage for your property and belongings.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Documentation</h4>
                <p>Keep important documents in a safe, accessible location or digital backup.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Communication Plan</h4>
                <p>Establish family communication protocols for emergency situations.</p>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Benefits of Mitigation</h2>
            <div className="citizen-benefits-grid">
              <div className="citizen-benefit-item">
                <strong>Lives Saved:</strong> Proper mitigation can prevent casualties during disasters.
              </div>
              <div className="citizen-benefit-item">
                <strong>Cost Reduction:</strong> Every dollar spent on mitigation saves $6 in recovery costs.
              </div>
              <div className="citizen-benefit-item">
                <strong>Faster Recovery:</strong> Mitigated communities bounce back more quickly after disasters.
              </div>
              <div className="citizen-benefit-item">
                <strong>Community Resilience:</strong> Stronger, more prepared communities overall.
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Success Stories</h2>
            <div className="citizen-success-stories">
              <div className="citizen-story-card">
                <h3>🏗️ Building Code Enforcement</h3>
                <p>Communities with strict building codes experienced 40% less damage during earthquakes compared to those without proper regulations.</p>
              </div>
              <div className="citizen-story-card">
                <h3>🌳 Natural Barriers</h3>
                <p>Coastal communities with preserved mangrove forests saw 80% reduction in storm surge damage during typhoons.</p>
              </div>
              <div className="citizen-story-card">
                <h3>🏘️ Land Use Planning</h3>
                <p>Proper zoning prevented development in flood-prone areas, saving millions in potential damages.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="citizen-footer">
        <div className="citizen-footer-text">
          &copy; {new Date().getFullYear()} DPAR Volunteer Coalition. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Mitigation; 
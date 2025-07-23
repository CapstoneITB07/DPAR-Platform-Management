import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import './CitizenPage.css';

function Recovery() {
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
                }} data-tooltip="Prevent and reduce disaster risks through long-term strategies">MITIGATION</li>
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
                }} className="active" data-tooltip="Long-term rebuilding and restoration of communities">RECOVERY</li>
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
          <h1>RECOVERY</h1>
          <p className="citizen-phase-subtitle">Rebuilding and Restoring Communities</p>
        </div>

        <div className="citizen-phase-content">
          <div className="citizen-phase-section">
            <h2>What is Recovery?</h2>
            <p>
              Recovery is the long-term process of rebuilding, restoring, and improving communities 
              after a disaster. It involves physical reconstruction, economic revitalization, 
              and social healing to create more resilient communities. The goal is to "build back better."
            </p>
            <div className="citizen-phase-highlight">
              <strong>🏗️ Build Back Better:</strong> Recovery should make communities stronger than before the disaster.
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Phases of Recovery</h2>
            <div className="citizen-strategies-grid">
              <div className="citizen-strategy-card">
                <h3>Short-term Recovery</h3>
                <p>Immediate restoration of essential services, debris removal, and temporary housing solutions.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Medium-term Recovery</h3>
                <p>Rebuilding infrastructure, restoring businesses, and addressing community needs.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Long-term Recovery</h3>
                <p>Comprehensive rebuilding with improved resilience and community development.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Sustainable Recovery</h3>
                <p>Building back better with enhanced disaster resistance and community resilience.</p>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Recovery Priorities</h2>
            <div className="citizen-recovery-priorities">
              <div className="citizen-priority-category">
                <h3>Immediate Needs (0-30 days)</h3>
                <ul className="citizen-action-list">
                  <li>Emergency shelter and housing</li>
                  <li>Food and water distribution</li>
                  <li>Medical and mental health services</li>
                  <li>Debris removal and cleanup</li>
                  <li>Restoration of basic utilities</li>
                  <li>Emergency financial assistance</li>
                </ul>
              </div>
              <div className="citizen-priority-category">
                <h3>Short-term Recovery (1-6 months)</h3>
                <ul className="citizen-action-list">
                  <li>Permanent housing solutions</li>
                  <li>Business reopening and job restoration</li>
                  <li>Infrastructure repair and rebuilding</li>
                  <li>Community services restoration</li>
                  <li>Economic recovery programs</li>
                  <li>Mental health and social support</li>
                </ul>
              </div>
              <div className="citizen-priority-category">
                <h3>Long-term Recovery (6+ months)</h3>
                <ul className="citizen-action-list">
                  <li>Comprehensive rebuilding with improved standards</li>
                  <li>Economic development and diversification</li>
                  <li>Enhanced disaster preparedness</li>
                  <li>Community resilience building</li>
                  <li>Environmental restoration</li>
                  <li>Social cohesion and community healing</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Community Recovery Actions</h2>
            <div className="citizen-individual-steps">
              <div className="citizen-step-item">
                <h4>Volunteer Cleanup</h4>
                <p>Participate in community cleanup efforts and debris removal operations.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Support Local Businesses</h4>
                <p>Patronize local businesses to help restore the local economy and create jobs.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Community Meetings</h4>
                <p>Attend recovery planning meetings and provide input on community priorities.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Mental Health Support</h4>
                <p>Offer emotional support to neighbors and connect people with counseling services.</p>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Building Back Better</h2>
            <div className="citizen-benefits-grid">
              <div className="citizen-benefit-item">
                <strong>Improved Infrastructure:</strong> Rebuild with stronger, more disaster-resistant materials and designs.
              </div>
              <div className="citizen-benefit-item">
                <strong>Enhanced Preparedness:</strong> Integrate better warning systems and emergency response capabilities.
              </div>
              <div className="citizen-benefit-item">
                <strong>Economic Diversification:</strong> Develop new industries and job opportunities to reduce vulnerability.
              </div>
              <div className="citizen-benefit-item">
                <strong>Community Resilience:</strong> Strengthen social networks and community support systems.
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Individual Recovery Steps</h2>
            <ul className="citizen-action-list">
              <li>Document all damage with photos and videos for insurance claims</li>
              <li>Contact your insurance company as soon as possible</li>
              <li>Apply for disaster assistance programs if eligible</li>
              <li>Keep all receipts for recovery-related expenses</li>
              <li>Seek mental health support if needed</li>
              <li>Stay connected with family, friends, and community</li>
              <li>Participate in community recovery activities</li>
              <li>Plan for future disasters while rebuilding</li>
            </ul>
          </div>

          <div className="citizen-phase-section">
            <h2>Volunteer Recovery Roles</h2>
            <div className="citizen-volunteer-roles">
              <div className="citizen-role-item">
                <h4>Cleanup Teams</h4>
                <p>Assist with debris removal, property cleanup, and environmental restoration.</p>
              </div>
              <div className="citizen-role-item">
                <h4>Support Services</h4>
                <p>Provide meals, childcare, transportation, and other support to affected families.</p>
              </div>
              <div className="citizen-role-item">
                <h4>Rebuilding Assistance</h4>
                <p>Help with home repairs, construction, and rebuilding efforts for vulnerable populations.</p>
              </div>
              <div className="citizen-role-item">
                <h4>Community Outreach</h4>
                <p>Connect people with resources, services, and support networks during recovery.</p>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Mental Health and Emotional Recovery</h2>
            <p>
              Recovery isn't just about physical rebuilding—it's also about emotional healing. 
              Disasters can cause trauma, stress, and grief. It's important to:
            </p>
            <ul className="citizen-action-list">
              <li>Recognize that emotional reactions are normal after disasters</li>
              <li>Seek professional help if you're struggling with trauma or depression</li>
              <li>Support children and elderly family members who may be particularly affected</li>
              <li>Stay connected with your community and support networks</li>
              <li>Practice self-care and stress management techniques</li>
              <li>Be patient with yourself and others during the recovery process</li>
            </ul>
          </div>

          <div className="citizen-phase-section">
            <h2>Recovery Success Stories</h2>
            <div className="citizen-success-stories">
              <div className="citizen-story-card">
                <h3>🏘️ Community Rebuilding</h3>
                <p>Communities that involved residents in recovery planning rebuilt 50% faster than those that didn't.</p>
              </div>
              <div className="citizen-story-card">
                <h3>💼 Economic Recovery</h3>
                <p>Local businesses with disaster recovery plans reopened 3x faster than those without plans.</p>
              </div>
              <div className="citizen-story-card">
                <h3>🌱 Sustainable Recovery</h3>
                <p>Communities that incorporated green infrastructure in recovery saw 30% reduction in future flood damage.</p>
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

export default Recovery; 
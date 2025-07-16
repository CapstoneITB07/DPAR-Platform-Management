import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CitizenPage.css';

function Preparedness() {
  const navigate = useNavigate();
  const [fade, setFade] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const handleDropdown = () => setDropdownOpen(!dropdownOpen);
  const closeDropdown = () => setDropdownOpen(false);

  const handleHomeClick = () => {
    setFade(true);
    setTimeout(() => {
      navigate('/citizen');
    }, 350);
  };

  const handleAboutClick = () => {
    setFade(true);
    setTimeout(() => {
      navigate('/citizen/about');
    }, 350);
  };

  // Determine if ABOUT US is active
  const isAboutActive = location.pathname === '/citizen/about';

  return (
    <div className="citizen-page-wrapper" style={{ opacity: fade ? 0 : 1 }}>
      {/* Navigation Bar */}
      <nav className="citizen-navbar">
        <div className="citizen-navbar-title">DPAR VOLUNTEER COALITION</div>
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
                }} className="active" data-tooltip="Develop plans and acquire resources for effective disaster response">PREPAREDNESS</li>
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
          <h1>PREPAREDNESS</h1>
          <p className="citizen-phase-subtitle">Getting Ready for Disasters</p>
        </div>

        <div className="citizen-phase-content">
          <div className="citizen-phase-section">
            <h2>What is Preparedness?</h2>
            <p>
              Preparedness involves developing plans, acquiring resources, and training people to respond effectively 
              when disasters occur. It's about being ready to act quickly and safely during emergency situations.
              The goal is to minimize response time and maximize effectiveness when disasters strike.
            </p>
            <div className="citizen-phase-highlight">
              <strong>⏰ Critical Factor:</strong> Prepared communities respond 3x faster than unprepared ones.
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Essential Preparedness Components</h2>
            <div className="citizen-strategies-grid">
              <div className="citizen-strategy-card">
                <h3>Emergency Plans</h3>
                <p>Develop family and community emergency response plans with clear evacuation routes and meeting points.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Emergency Kits</h3>
                <p>Assemble disaster supply kits with food, water, first aid, and essential items for at least 72 hours.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Communication Systems</h3>
                <p>Establish reliable communication methods and backup systems for emergency situations.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Training & Education</h3>
                <p>Learn first aid, CPR, and other emergency response skills through certified training programs.</p>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Family Preparedness Checklist</h2>
            <div className="citizen-checklist-grid">
              <div className="citizen-checklist-category">
                <h3>Emergency Supplies</h3>
                <ul className="citizen-action-list">
                  <li>3-day supply of non-perishable food</li>
                  <li>1 gallon of water per person per day</li>
                  <li>First aid kit and medications</li>
                  <li>Flashlights and extra batteries</li>
                  <li>Portable phone charger</li>
                  <li>Important documents in waterproof container</li>
                </ul>
              </div>
              <div className="citizen-checklist-category">
                <h3>Communication Plan</h3>
                <ul className="citizen-action-list">
                  <li>Designate emergency contacts</li>
                  <li>Establish meeting locations</li>
                  <li>Learn emergency alert systems</li>
                  <li>Keep contact information updated</li>
                  <li>Practice evacuation drills</li>
                  <li>Know local emergency numbers</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Community Preparedness Actions</h2>
            <div className="citizen-individual-steps">
              <div className="citizen-step-item">
                <h4>Volunteer Training</h4>
                <p>Join local emergency response teams and participate in disaster preparedness training programs.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Community Drills</h4>
                <p>Participate in evacuation drills and emergency response exercises in your neighborhood.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Neighborhood Networks</h4>
                <p>Build relationships with neighbors to support each other during emergencies.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Local Knowledge</h4>
                <p>Learn about specific hazards in your area and appropriate response actions.</p>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Special Considerations</h2>
            <div className="citizen-benefits-grid">
              <div className="citizen-benefit-item">
                <strong>Elderly & Disabled:</strong> Ensure accessibility and special needs are addressed in emergency plans.
              </div>
              <div className="citizen-benefit-item">
                <strong>Pets:</strong> Include pet supplies and evacuation plans for animal companions.
              </div>
              <div className="citizen-benefit-item">
                <strong>Children:</strong> Teach children emergency procedures and include comfort items in kits.
              </div>
              <div className="citizen-benefit-item">
                <strong>Medical Needs:</strong> Maintain extra medications and medical equipment for chronic conditions.
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Staying Informed</h2>
            <ul className="citizen-action-list">
              <li>Sign up for local emergency alerts and notifications</li>
              <li>Follow official social media accounts of emergency management agencies</li>
              <li>Have a battery-powered or hand-crank radio for emergency broadcasts</li>
              <li>Learn to recognize warning signs of different types of disasters</li>
              <li>Stay updated on weather forecasts and hazard conditions</li>
              <li>Know the difference between watches and warnings</li>
            </ul>
          </div>

          <div className="citizen-phase-section">
            <h2>Preparedness Success Stories</h2>
            <div className="citizen-success-stories">
              <div className="citizen-story-card">
                <h3>📱 Early Warning Systems</h3>
                <p>Communities with early warning systems had 90% evacuation success rates during flash floods.</p>
              </div>
              <div className="citizen-story-card">
                <h3>🏠 Emergency Kits</h3>
                <p>Families with emergency kits were able to shelter in place for 72+ hours during extended power outages.</p>
              </div>
              <div className="citizen-story-card">
                <h3>👥 Community Drills</h3>
                <p>Regular evacuation drills reduced evacuation time by 60% during actual emergencies.</p>
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

export default Preparedness; 
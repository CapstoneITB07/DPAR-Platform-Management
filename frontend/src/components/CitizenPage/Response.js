import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CitizenPage.css';

function Response() {
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
                }} data-tooltip="Develop plans and acquire resources for effective disaster response">PREPAREDNESS</li>
                <li onClick={() => {
                  closeDropdown();
                  setFade(true);
                  setTimeout(() => {
                    navigate('/citizen/response');
                  }, 350);
                }} className="active" data-tooltip="Immediate actions during disasters to save lives and protect property">RESPONSE</li>
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
          <h1>RESPONSE</h1>
          <p className="citizen-phase-subtitle">Immediate Actions During Disasters</p>
        </div>

        <div className="citizen-phase-content">
          <div className="citizen-phase-section">
            <h2>What is Response?</h2>
            <p>
              Response involves immediate actions taken during and immediately after a disaster to save lives, 
              protect property, and meet basic human needs. It focuses on emergency services, evacuation, 
              and immediate relief efforts. Speed and coordination are critical during this phase.
            </p>
            <div className="citizen-phase-highlight">
              <strong>🚨 Golden Hour:</strong> The first 60 minutes after a disaster are crucial for saving lives.
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Immediate Response Actions</h2>
            <div className="citizen-strategies-grid">
              <div className="citizen-strategy-card">
                <h3>Emergency Services</h3>
                <p>Fire, police, and medical personnel provide immediate assistance and rescue operations.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Evacuation</h3>
                <p>Orderly evacuation of affected areas to safe locations with proper coordination.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Search & Rescue</h3>
                <p>Locating and rescuing trapped or injured individuals from disaster sites.</p>
              </div>
              <div className="citizen-strategy-card">
                <h3>Emergency Communications</h3>
                <p>Maintaining communication systems to coordinate response efforts and provide public information.</p>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>What to Do During Different Disasters</h2>
            <div className="citizen-disaster-types">
              <div className="citizen-disaster-type">
                <h3>Earthquakes</h3>
                <ul className="citizen-action-list">
                  <li>Drop, Cover, and Hold On</li>
                  <li>Stay indoors until shaking stops</li>
                  <li>Stay away from windows and heavy objects</li>
                  <li>Check for injuries and damage after</li>
                  <li>Listen to emergency broadcasts</li>
                </ul>
              </div>
              <div className="citizen-disaster-type">
                <h3>Floods</h3>
                <ul className="citizen-action-list">
                  <li>Move to higher ground immediately</li>
                  <li>Never walk or drive through floodwaters</li>
                  <li>Follow evacuation orders</li>
                  <li>Stay informed about water levels</li>
                  <li>Avoid electrical equipment in wet areas</li>
                </ul>
              </div>
              <div className="citizen-disaster-type">
                <h3>Typhoons/Hurricanes</h3>
                <ul className="citizen-action-list">
                  <li>Stay indoors in a secure location</li>
                  <li>Stay away from windows and doors</li>
                  <li>Listen to weather updates</li>
                  <li>Have emergency supplies ready</li>
                  <li>Follow evacuation orders if issued</li>
                </ul>
              </div>
              <div className="citizen-disaster-type">
                <h3>Fires</h3>
                <ul className="citizen-action-list">
                  <li>Get out immediately</li>
                  <li>Call emergency services</li>
                  <li>Stay low to avoid smoke</li>
                  <li>Never use elevators</li>
                  <li>Meet at designated assembly points</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Emergency Communication</h2>
            <div className="citizen-individual-steps">
              <div className="citizen-step-item">
                <h4>Emergency Numbers</h4>
                <p>Know and use the correct emergency numbers: 911 for general emergencies, local numbers for specific services.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Stay Informed</h4>
                <p>Listen to official broadcasts and follow instructions from emergency management authorities.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Check on Others</h4>
                <p>Check on family, neighbors, and vulnerable community members after ensuring your own safety.</p>
              </div>
              <div className="citizen-step-item">
                <h4>Report Damage</h4>
                <p>Report damage and hazards to appropriate authorities to help coordinate response efforts.</p>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Volunteer Response Roles</h2>
            <div className="citizen-benefits-grid">
              <div className="citizen-benefit-item">
                <strong>First Aid:</strong> Provide immediate medical assistance to injured individuals.
              </div>
              <div className="citizen-benefit-item">
                <strong>Evacuation Support:</strong> Help guide people to safety and assist with evacuation efforts.
              </div>
              <div className="citizen-benefit-item">
                <strong>Communication:</strong> Relay information between response teams and affected communities.
              </div>
              <div className="citizen-benefit-item">
                <strong>Logistics:</strong> Assist with distribution of emergency supplies and equipment.
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Safety During Response</h2>
            <ul className="citizen-action-list">
              <li>Always prioritize your own safety first</li>
              <li>Follow official instructions and orders</li>
              <li>Wear appropriate protective equipment</li>
              <li>Work in teams when possible</li>
              <li>Stay hydrated and take breaks</li>
              <li>Report dangerous conditions immediately</li>
              <li>Don't enter unstable or dangerous structures</li>
              <li>Be aware of secondary hazards (aftershocks, flooding, etc.)</li>
            </ul>
          </div>

          <div className="citizen-phase-section">
            <h2>Psychological First Aid</h2>
            <p>
              During and after disasters, people may experience stress, anxiety, or trauma. 
              Provide emotional support by listening, offering comfort, and connecting people 
              with professional mental health services when needed.
            </p>
          </div>

          <div className="citizen-phase-section">
            <h2>Response Success Stories</h2>
            <div className="citizen-success-stories">
              <div className="citizen-story-card">
                <h3>🚑 Rapid Response Teams</h3>
                <p>Well-trained response teams reduced rescue time by 70% during urban flooding incidents.</p>
              </div>
              <div className="citizen-story-card">
                <h3>📞 Emergency Communications</h3>
                <p>Backup communication systems kept emergency coordination active during cellular network failures.</p>
              </div>
              <div className="citizen-story-card">
                <h3>🏃‍♂️ Evacuation Protocols</h3>
                <p>Pre-planned evacuation routes enabled 95% of residents to reach safety within 30 minutes.</p>
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

export default Response; 
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import './CitizenPage.css';
import './AboutUs.css';
// import disasterLogo from '../../../public/Assets/disaster_logo.png';

function AboutUs() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fade, setFade] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDropdown = () => setDropdownOpen(!dropdownOpen);
  const closeDropdown = () => setDropdownOpen(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => {
    setSidebarOpen(false);
    setSidebarDropdownOpen(false);
  };
  const toggleSidebarDropdown = () => setSidebarDropdownOpen(!sidebarDropdownOpen);

  // Animation and navigation for About Us
  const handleAboutClick = () => {
    closeSidebar();
    if (location.pathname === '/citizen/about') return;
    setFade(true);
    setTimeout(() => {
      navigate('/citizen/about');
    }, 350);
  };

  // Animation and navigation for Home
  const handleHomeClick = () => {
    closeSidebar();
    if (location.pathname === '/citizen') return;
    setFade(true);
    setTimeout(() => {
      navigate('/citizen');
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
  const isHomeActive = location.pathname === '/citizen';

  return (
    <div className="about-page-wrapper">
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
          <li className={isHomeActive ? 'active' : ''} onClick={handleHomeClick}>HOME</li>
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
                }} data-tooltip="Long-term rebuilding and restoration of communities">RECOVERY</li>
              </ul>
            )}
          </li>
          <li className={isAboutActive ? 'active' : ''} onClick={handleAboutClick}>ABOUT US</li>
        </ul>
      </nav>

      {/* Hero Section */}
      <div className="about-hero">
        <img 
          src="/Assets/disaster_logo.png" 
          alt="Disaster Preparedness and Response Logo" 
          className="about-hero-logo"
          style={{ objectFit: 'contain', margin: '0 auto 16px', display: 'block' }}
        />
        <h1 className="about-hero-title">About DPAR VOLUNTEER COALITION</h1>
        <p className="about-hero-subtitle">
          Empowering communities through volunteer-driven disaster preparedness and response initiatives
        </p>
      </div>

      {/* Main Content */}
      <div className="about-main-content" style={{ opacity: fade ? 0 : 1 }}>
        {/* Timeline Section */}
        <div className="about-section">
          <div className="about-section-header">
            <h2 className="about-section-title">Our Journey</h2>
            <div className="about-section-divider"></div>
            <p className="about-section-description">
              From our humble beginnings to becoming a leading force in disaster preparedness and response, 
              DPAR Volunteer Coalition has grown through dedication, innovation, and community support.
            </p>
          </div>

          <div className="about-timeline-container">
            {/* Vertical line with gradient and animated dots */}
            <div className="about-timeline-line">
              {/* Animated dots along the timeline */}
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className="about-timeline-dot"
                  style={{ top: `${(i * 100) / 5}%` }}
                ></div>
              ))}
            </div>

            {/* Timeline events */}
            {[
              {
                year: '2023',
                title: 'The Beginning',
                desc: 'DPAR Volunteer Coalition was founded with a vision to create a unified network of volunteers dedicated to disaster preparedness and response.',
                achievements: ['Established core volunteer team', 'Developed initial response protocols', 'Created first community partnerships'],
                impact: 'Laid the foundation for community-based disaster response',
                side: 'left',
              },
              {
                year: '2024',
                title: 'Building Partnerships',
                desc: 'Established crucial partnerships with local government units, NGOs, and community organizations to strengthen our disaster response capabilities.',
                achievements: ['Partnered with 15 local organizations', 'Launched first training programs', 'Developed emergency response network'],
                impact: 'Expanded reach to 5 major communities',
                side: 'right',
              },
              {
                year: '2025',
                title: 'Digital Transformation',
                desc: 'Launched innovative digital platforms and training programs to enhance volunteer coordination and community preparedness.',
                achievements: ['Developed mobile response app', 'Created online training portal', 'Implemented real-time tracking system'],
                impact: 'Increased response efficiency by 60%',
                side: 'right',
              },
              {
                year: '2025',
                title: 'Expanding Impact',
                desc: 'Grew our volunteer network to over 5,000 members, implementing comprehensive disaster risk reduction programs across multiple communities.',
                achievements: ['Covered 25+ communities', 'Conducted 100+ training sessions', 'Responded to 50+ emergencies'],
                impact: 'Reduced emergency response time by 40%',
                side: 'left',
              },
              
            ].map((event, idx) => (
              <div key={event.year} className={`about-timeline-event ${event.side}`}>
                {event.side === 'left' && (
                  <div className="about-timeline-content">
                    <div className="about-timeline-card">
                      <div className="about-timeline-card-title">{event.title}</div>
                      <div className="about-timeline-card-desc">{event.desc}</div>
                      <div className="about-achievements-box">
                        <div className="about-achievements-title">Key Achievements:</div>
                        <ul className="about-achievements-list">
                          {event.achievements.map((achievement, i) => (
                            <li key={i} className="about-achievements-item">{achievement}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="about-impact-box">
                        <div className="about-impact-title">Impact:</div>
                        <div className="about-impact-text">{event.impact}</div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Timeline marker and year */}
                <div className="about-timeline-marker">
                  <div className="about-timeline-year">{event.year}</div>
                  <div className="about-timeline-dot-large"></div>
                  {idx !== 5 && <div className="about-timeline-connector"></div>}
                </div>
                {event.side === 'right' && (
                  <div className="about-timeline-content right">
                    <div className="about-timeline-card">
                      <div className="about-timeline-card-title">{event.title}</div>
                      <div className="about-timeline-card-desc">{event.desc}</div>
                      <div className="about-achievements-box">
                        <div className="about-achievements-title">Key Achievements:</div>
                        <ul className="about-achievements-list">
                          {event.achievements.map((achievement, i) => (
                            <li key={i} className="about-achievements-item">{achievement}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="about-impact-box">
                        <div className="about-impact-title">Impact:</div>
                        <div className="about-impact-text">{event.impact}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mission Section */}
        <div className="about-section">
          <div className="about-section-header">
            <h2 className="about-section-title">Our Mission</h2>
            <div className="about-section-divider"></div>
          </div>
          <div className="about-mission-content">
            <p className="about-mission-text">
              DPAR Volunteer Coalition is dedicated to building resilient communities through volunteer-driven initiatives. 
              We unite passionate individuals and organizations to prepare for, respond to, and recover from disasters, 
              ensuring that no community faces emergencies alone.
            </p>
            <div className="about-mission-grid">
              {[
                {
                  title: 'Community Protection',
                  desc: 'Safeguarding communities through proactive disaster preparedness and rapid response initiatives.',
                  icon: '🛡️',
                  stats: '25+ Communities Protected'
                },
                {
                  title: 'Volunteer Empowerment',
                  desc: 'Equipping volunteers with the skills, knowledge, and resources needed to make a difference.',
                  icon: '👥',
                  stats: '5,000+ Empowered Volunteers'
                },
                {
                  title: 'Sustainable Impact',
                  desc: 'Creating lasting positive change through continuous improvement and community engagement.',
                  icon: '🌱',
                  stats: '100+ Successful Programs'
                }
              ].map((item, idx) => (
                <div key={idx} className="about-mission-card">
                  <div className="about-mission-icon">{item.icon}</div>
                  <h3 className="about-mission-card-title">{item.title}</h3>
                  <p className="about-mission-card-desc">{item.desc}</p>
                  <div className="about-mission-stats">{item.stats}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="about-section">
          <div className="about-section-header">
            <h2 className="about-section-title">Our Core Values</h2>
            <div className="about-section-divider"></div>
            <p className="about-section-description">
              These core values guide our actions and decisions, shaping how we serve our communities and work together.
            </p>
          </div>
          <div className="about-values-grid">
            {[
              {
                title: 'Community First',
                desc: 'We prioritize the needs and well-being of our communities in everything we do.',
                icon: '🏘️',
                principles: ['Local Focus', 'Community Voice', 'Inclusive Approach']
              },
              {
                title: 'Volunteer Spirit',
                desc: 'We believe in the power of volunteerism and the impact of dedicated individuals.',
                icon: '🤝',
                principles: ['Dedication', 'Collaboration', 'Service Excellence']
              },
              {
                title: 'Innovation',
                desc: 'We continuously seek new and better ways to serve our communities.',
                icon: '💡',
                principles: ['Creative Solutions', 'Adaptive Learning', 'Forward Thinking']
              },
            ].map((value, idx) => (
              <div key={idx} className="about-value-card">
                <div className="about-value-icon">{value.icon}</div>
                <h3 className="about-value-title">{value.title}</h3>
                <p className="about-value-desc">{value.desc}</p>
                <div className="about-principles-box">
                  <div className="about-principles-title">Key Principles:</div>
                  <ul className="about-principles-list">
                    {value.principles.map((principle, i) => (
                      <li key={i} className="about-principles-item">{principle}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-footer-text">
          &copy; {new Date().getFullYear()} DPAR Volunteer Coalition. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default AboutUs;
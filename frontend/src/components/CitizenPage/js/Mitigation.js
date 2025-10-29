import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../css/CitizenPage.css';
import '../css/Mitigation.css';

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
          <p className="citizen-phase-subtitle">Disaster Preparedness and Response</p>
        </div>

        <div className="citizen-phase-content">
          {/* Hero Introduction */}
          <div className="mitigation-hero-section">
            <div className="mitigation-hero-content">
              <div className="mitigation-hero-icon">🛡️</div>
              <h2 className="mitigation-hero-title">Building Resilience Before Disaster Strikes</h2>
              <p className="mitigation-hero-description">
                Mitigation is the foundation of disaster preparedness—proactive measures that save lives, 
                protect communities, and reduce the devastating impacts of natural and human-caused disasters.
              </p>
            </div>
          </div>

          {/* Objectives Section */}
          <div className="citizen-phase-section mitigation-objectives-section">
            <h2 className="mitigation-section-header">
              Core Objectives of Mitigation
            </h2>
            <p className="mitigation-section-intro">
              Effective disaster mitigation pursues multiple interconnected goals that work together to create safer, more resilient communities capable of withstanding and recovering from disasters.
            </p>
            <div className="citizen-benefits-grid mitigation-objectives-grid">
              {[
                { 
                  icon: '💔', 
                  title: 'Protect Human Life', 
                  desc: 'Minimize casualties, injuries, and loss of life through preventive measures, early warning systems, and safe infrastructure design.', 
                  color: '#e53935',
                  gradient: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)'
                },
                { 
                  icon: '💰', 
                  title: 'Preserve Economic Stability', 
                  desc: 'Reduce economic disruption, protect livelihoods, and minimize the financial burden of disaster recovery on communities and governments.', 
                  color: '#43a047',
                  gradient: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)'
                },
                { 
                  icon: '🏘️', 
                  title: 'Build Community Resilience', 
                  desc: 'Strengthen the capacity of communities to anticipate, prepare for, and adapt to changing conditions while recovering quickly from disasters.', 
                  color: '#1e88e5',
                  gradient: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)'
                },
                { 
                  icon: '🌱', 
                  title: 'Ensure Environmental Sustainability', 
                  desc: 'Protect ecosystems, preserve natural resources, and promote development practices that work with nature rather than against it.', 
                  color: '#00897b',
                  gradient: 'linear-gradient(135deg, #00897b 0%, #00695c 100%)'
                },
                { 
                  icon: '⏰', 
                  title: 'Establish Long-term Preparedness', 
                  desc: 'Create lasting systems and infrastructure that provide continuous protection against recurring hazards and future risks.', 
                  color: '#fb8c00',
                  gradient: 'linear-gradient(135deg, #fb8c00 0%, #e65100 100%)'
                },
                { 
                  icon: '🏛️', 
                  title: 'Safeguard Critical Infrastructure', 
                  desc: 'Protect essential facilities like hospitals, schools, power systems, and transportation networks that communities depend on.', 
                  color: '#5e35b1',
                  gradient: 'linear-gradient(135deg, #5e35b1 0%, #4527a0 100%)'
                }
              ].map((obj, idx) => (
                <div 
                  key={idx}
                  className="mitigation-objective-card" 
                  style={{ borderTop: `5px solid ${obj.color}` }}
                  data-color={obj.color}
                >
                  <div className="mitigation-objective-icon-bg" style={{ background: obj.gradient }}>
                    <div className="mitigation-objective-icon">{obj.icon}</div>
                  </div>
                  <strong className="mitigation-objective-title" style={{ color: obj.color }}>{obj.title}</strong>
                  <span className="mitigation-objective-desc">{obj.desc}</span>
              </div>
              ))}
              </div>
              </div>

          {/* Types of Mitigation Measures */}
          <div className="citizen-phase-section mitigation-types-section">
            <h2 className="mitigation-section-header">
              Categories of Mitigation Measures
            </h2>
            <p className="mitigation-section-intro">
              Mitigation strategies are broadly classified into structural and non-structural approaches. The most effective mitigation programs combine both types to create comprehensive protection systems.
            </p>
            
            <div className="mitigation-type-card mitigation-type-structural">
              <div className="mitigation-type-watermark">🏗️</div>
              <div className="mitigation-type-badge">Structural</div>
              <h3 className="mitigation-type-heading">
                <span className="mitigation-type-emoji">🏗️</span>
                Structural Mitigation
              </h3>
              <p className="mitigation-type-description">
                Physical constructions and engineering solutions designed to resist, redirect, or absorb the forces of natural hazards. These are tangible modifications to buildings, infrastructure, and the environment.
              </p>
              <div className="mitigation-type-examples">
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">🌊</div>
                  <div className="mitigation-example-content">
                    <strong>Flood Control Structures</strong>
                    <span>Levees, floodwalls, dams, retention basins, and improved drainage systems</span>
                  </div>
                </div>
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">🏢</div>
                  <div className="mitigation-example-content">
                    <strong>Earthquake-Resistant Design</strong>
                    <span>Seismic retrofitting, base isolation, reinforced concrete, and flexible joints</span>
                  </div>
                </div>
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">🔥</div>
                  <div className="mitigation-example-content">
                    <strong>Fire Protection Systems</strong>
                    <span>Sprinkler systems, fire-resistant materials, firebreaks, and safe rooms</span>
                  </div>
                </div>
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">🌪️</div>
                  <div className="mitigation-example-content">
                    <strong>Wind-Resistant Construction</strong>
                    <span>Hurricane straps, impact-resistant windows, reinforced roofing, and storm shelters</span>
                  </div>
                </div>
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">⛰️</div>
                  <div className="mitigation-example-content">
                    <strong>Slope Stabilization</strong>
                    <span>Retaining walls, soil anchors, terracing, and vegetation barriers</span>
                  </div>
                </div>
              </div>
              </div>

            <div className="mitigation-type-card mitigation-type-nonstructural">
              <div className="mitigation-type-watermark">📜</div>
              <div className="mitigation-type-badge">Non-Structural</div>
              <h3 className="mitigation-type-heading">
                <span className="mitigation-type-emoji">📜</span>
                Non-Structural Mitigation
              </h3>
              <p className="mitigation-type-description">
                Policies, regulations, planning, and practices that reduce vulnerability without physical construction. These measures often complement structural solutions and can be more cost-effective.
              </p>
              <div className="mitigation-type-examples">
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">🗺️</div>
                  <div className="mitigation-example-content">
                    <strong>Land Use Planning & Zoning</strong>
                    <span>Restricting development in flood zones, fault lines, and high-risk areas</span>
                  </div>
                </div>
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">📋</div>
                  <div className="mitigation-example-content">
                    <strong>Building Codes & Standards</strong>
                    <span>Enforcing construction regulations and safety requirements for new development</span>
                  </div>
                </div>
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">🌳</div>
                  <div className="mitigation-example-content">
                    <strong>Environmental Conservation</strong>
                    <span>Mangrove restoration, reforestation, wetland preservation, and ecosystem protection</span>
                  </div>
                </div>
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">⚠️</div>
                  <div className="mitigation-example-content">
                    <strong>Early Warning Systems</strong>
                    <span>Monitoring networks, alert systems, and risk communication protocols</span>
                  </div>
                </div>
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">📚</div>
                  <div className="mitigation-example-content">
                    <strong>Education & Awareness</strong>
                    <span>Public campaigns, disaster drills, training programs, and community engagement</span>
                  </div>
                </div>
                <div className="mitigation-example-item">
                  <div className="mitigation-example-icon">💵</div>
                  <div className="mitigation-example-content">
                    <strong>Financial Mechanisms</strong>
                    <span>Insurance programs, disaster funds, risk transfer, and economic incentives</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Mitigation Strategies by Disaster Type */}
          <div className="citizen-phase-section mitigation-disaster-section">
            <h2 className="mitigation-section-header">
              Hazard-Specific Mitigation Strategies
            </h2>
            <p className="mitigation-section-intro">
              Different disasters require tailored mitigation approaches. Understanding the unique characteristics of each hazard enables communities to implement the most effective protective measures.
            </p>
            
            <div className="citizen-strategies-grid mitigation-disaster-grid">
              {/* Flood */}
              <div className="mitigation-disaster-card mitigation-disaster-flood">
                <h3 className="mitigation-disaster-heading">
                  <span className="mitigation-disaster-emoji">🌊</span>
                  Flood Mitigation
                </h3>
                <ul className="citizen-action-list mitigation-disaster-list">
                  <li>Construct flood barriers, levees, and drainage systems</li>
                  <li>Maintain rivers and canals to prevent blockage</li>
                  <li>Relocate communities from flood-prone zones</li>
                  <li>Reforest upland areas and restore wetlands</li>
                  <li>Implement proper waste disposal to avoid clogging waterways</li>
                </ul>
              </div>

              {/* Volcanic */}
              <div className="mitigation-disaster-card mitigation-disaster-volcanic">
                <h3 className="mitigation-disaster-heading">
                  <span className="mitigation-disaster-emoji">🌋</span>
                  Volcanic Eruption Mitigation
                </h3>
                <ul className="citizen-action-list mitigation-disaster-list">
                  <li>Establish permanent no-build zones around volcanoes</li>
                  <li>Install volcanic monitoring systems and early warnings</li>
                  <li>Prepare evacuation routes and safe zones</li>
                  <li>Educate communities about volcanic hazards</li>
                </ul>
              </div>

              {/* Typhoon */}
              <div className="mitigation-disaster-card mitigation-disaster-typhoon">
                <h3 className="mitigation-disaster-heading">
                  <span className="mitigation-disaster-emoji">🌪️</span>
                  Typhoon / Cyclone Mitigation
                </h3>
                <ul className="citizen-action-list mitigation-disaster-list">
                  <li>Build storm-resistant structures</li>
                  <li>Enforce building codes for roofing and windows</li>
                  <li>Develop reliable early warning and evacuation plans</li>
                  <li>Maintain emergency kits and community shelters</li>
                  <li>Encourage tree planting as windbreakers</li>
            </ul>
          </div>

              {/* Earthquake */}
              <div className="mitigation-disaster-card mitigation-disaster-earthquake">
                <h3 className="mitigation-disaster-heading">
                  <span className="mitigation-disaster-emoji">🌍</span>
                  Earthquake Mitigation
                </h3>
                <ul className="citizen-action-list mitigation-disaster-list">
                  <li>Retrofit old buildings and infrastructure</li>
                  <li>Conduct regular earthquake drills and awareness campaigns</li>
                  <li>Avoid constructing on fault lines</li>
                  <li>Secure heavy furniture and equipment indoors</li>
                  <li>Establish rapid response and recovery systems</li>
                </ul>
              </div>

              {/* Fire */}
              <div className="mitigation-disaster-card mitigation-disaster-fire">
                <h3 className="mitigation-disaster-heading">
                  <span className="mitigation-disaster-emoji">🔥</span>
                  Fire Mitigation
                </h3>
                <ul className="citizen-action-list mitigation-disaster-list">
                  <li>Implement strict fire safety codes and inspections</li>
                  <li>Provide accessible fire extinguishers and alarms</li>
                  <li>Conduct community fire safety training</li>
                  <li>Maintain vegetation control in wildfire-prone areas</li>
                  <li>Ensure accessible fire hydrants and emergency exits</li>
                </ul>
              </div>

              {/* Landslide */}
              <div className="mitigation-disaster-card mitigation-disaster-landslide">
                <h3 className="mitigation-disaster-heading">
                  <span className="mitigation-disaster-emoji">🚨</span>
                  Landslide Mitigation
                </h3>
                <ul className="citizen-action-list mitigation-disaster-list">
                  <li>Construct retaining walls and slope drainage</li>
                  <li>Restrict construction in steep or unstable slopes</li>
                  <li>Reforest hill and mountain areas to stabilize soil</li>
                  <li>Use slope monitoring and warning systems</li>
                  <li>Properly manage land excavation and mining</li>
                </ul>
              </div>

              {/* Pandemic */}
              <div className="mitigation-disaster-card mitigation-disaster-pandemic">
                <h3 className="mitigation-disaster-heading">
                  <span className="mitigation-disaster-emoji">🦠</span>
                  Pandemic Mitigation
                </h3>
                <ul className="citizen-action-list mitigation-disaster-list">
                  <li>Strengthen healthcare systems and disease surveillance</li>
                  <li>Implement sanitation and hygiene campaigns</li>
                  <li>Enforce quarantine and social distancing measures</li>
                  <li>Promote vaccination and medical readiness</li>
                  <li>Secure food supply chains and public support systems</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Human-Caused Disasters */}
          <div className="citizen-phase-section mitigation-human-section">
            <h2 className="mitigation-section-header">
              Mitigation for Human-Caused Disasters
            </h2>
            
            <div className="citizen-strategies-grid mitigation-human-grid">
              {/* Industrial Accidents */}
              <div className="mitigation-disaster-card mitigation-human-industrial">
                <h3 className="mitigation-disaster-heading">
                  <span className="mitigation-disaster-emoji">💥</span>
                  Industrial Accidents
                </h3>
                <ul className="citizen-action-list mitigation-disaster-list">
                  <li>Enforce workplace safety standards and risk assessments</li>
                  <li>Provide emergency training for employees</li>
                  <li>Maintain fire suppression and spill containment systems</li>
                  <li>Store hazardous materials safely with proper labels</li>
                  <li>Develop contingency plans and immediate response procedures</li>
                </ul>
              </div>

              {/* Chemical Spills */}
              <div className="mitigation-disaster-card mitigation-human-chemical">
                <h3 className="mitigation-disaster-heading">
                  <span className="mitigation-disaster-emoji">☣️</span>
                  Chemical Spills and Toxic Leaks
                </h3>
                <ul className="citizen-action-list mitigation-disaster-list">
                  <li>Strengthen hazardous waste management protocols</li>
                  <li>Establish buffer zones around industrial areas</li>
                  <li>Ensure availability of protective gear and decontamination facilities</li>
                  <li>Regularly inspect and maintain chemical storage facilities</li>
                  <li>Train emergency responders for chemical handling</li>
                </ul>
              </div>

              {/* Transportation */}
              <div className="mitigation-disaster-card mitigation-human-transportation">
                <h3 className="mitigation-disaster-heading">
                  <span className="mitigation-disaster-emoji">⚠️</span>
                  Transportation Accidents
                </h3>
                <ul className="citizen-action-list mitigation-disaster-list">
                  <li>Enforce traffic and vehicle safety regulations</li>
                  <li>Improve road design, signage, and lighting</li>
                  <li>Educate drivers about defensive driving</li>
                  <li>Install barriers and railings in high-risk areas</li>
                  <li>Develop quick-response medical and rescue teams</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Community-Based Mitigation */}
          <div className="citizen-phase-section mitigation-community-section">
            <h2 className="mitigation-section-header">
              Community-Based Mitigation
            </h2>
            <div className="mitigation-community-grid">
              {[
                { icon: '👥', title: 'Local Committees', desc: 'Organize local disaster risk reduction committees.', color: '#1976d2' },
                { icon: '🗺️', title: 'Hazard Mapping', desc: 'Conduct hazard mapping and risk assessment at the barangay level.', color: '#388e3c' },
                { icon: '🎓', title: 'Volunteer Training', desc: 'Train volunteers for first aid, search and rescue, and evacuation.', color: '#d32f2f' },
                { icon: '📢', title: 'Communication', desc: 'Establish clear communication lines among local officials and residents.', color: '#f57c00' },
                { icon: '🔄', title: 'Regular Drills', desc: 'Conduct regular community disaster drills.', color: '#7b1fa2' }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="mitigation-community-card" 
                  style={{ 
                    borderLeft: `5px solid ${item.color}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(10px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                  }}
                >
                  <h4 className="mitigation-community-card-title" style={{ color: item.color }}>
                    <span className="mitigation-community-card-icon">{item.icon}</span>
                    {item.title}
                  </h4>
                  <p className="mitigation-community-card-desc">{item.desc}</p>
                </div>
              ))}
              </div>
              </div>

          {/* Importance of Mitigation */}
          <div className="citizen-phase-section mitigation-importance-section">
            <h2 className="mitigation-section-header">
              Importance of Mitigation
            </h2>
            <div className="mitigation-importance-grid">
              {[
                { icon: '💚', title: 'Saves Lives', desc: 'Mitigation actions save lives and reduce injuries during disasters.', bgColor: 'linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)', color: '#2e7d32', shadow: 'rgba(46,125,50,0.2)' },
                { icon: '🏢', title: 'Protects Property', desc: 'Prevents or minimizes damage to property and infrastructure.', bgColor: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)', color: '#1565c0', shadow: 'rgba(21,101,192,0.2)' },
                { icon: '💰', title: 'Reduces Costs', desc: 'Reduces recovery time and financial burden after disasters.', bgColor: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)', color: '#e65100', shadow: 'rgba(230,81,0,0.2)' },
                { icon: '🏘️', title: 'Builds Resilience', desc: 'Promotes a culture of preparedness and resilience.', bgColor: 'linear-gradient(135deg, #fce4ec 0%, #ffffff 100%)', color: '#c2185b', shadow: 'rgba(194,24,91,0.2)' },
                { icon: '🌱', title: 'Protects Environment', desc: 'Protects the environment and supports sustainable development.', bgColor: 'linear-gradient(135deg, #e0f2f1 0%, #ffffff 100%)', color: '#00695c', shadow: 'rgba(0,105,92,0.2)' }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="mitigation-importance-card" 
                  style={{ 
                    background: item.bgColor,
                    border: `3px solid ${item.color}`,
                    boxShadow: `0 6px 25px ${item.shadow}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px) rotate(2deg)';
                    e.currentTarget.style.boxShadow = `0 15px 40px ${item.shadow.replace('0.2', '0.35')}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) rotate(0deg)';
                    e.currentTarget.style.boxShadow = `0 6px 25px ${item.shadow}`;
                  }}
                >
                  <div className="mitigation-importance-watermark">{item.icon}</div>
                  <h3 className="mitigation-importance-card-title" style={{ color: item.color }}>
                    <span className="mitigation-importance-card-emoji">{item.icon}</span>
                    {item.title}
                  </h3>
                  <p className="mitigation-importance-card-desc">{item.desc}</p>
              </div>
              ))}
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
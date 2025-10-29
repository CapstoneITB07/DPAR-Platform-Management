import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../css/CitizenPage.css';
import '../css/Preparedness.css';

function Preparedness() {
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
    <div className={`citizen-page-wrapper preparedness-wrapper${fade ? ' fade-out' : ''}`}>
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
              className={`citizen-dropdown-button preparedness-dropdown-button${dropdownOpen ? ' active' : ''}`}
            >
              <span className="preparedness-dropdown-button-text">CATEGORIES</span>
              <span className={`preparedness-dropdown-arrow${dropdownOpen ? ' rotated' : ''}`}>
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
          <p className="citizen-phase-subtitle">Be Ready, Stay Safe: Planning Today for Tomorrow's Emergencies</p>
        </div>

        <div className="citizen-phase-content">

          {/* Objectives Section */}
          <div className="citizen-phase-section prep-objectives-section">
            <h2 className="prep-section-header-main">
              Core Objectives of Preparedness
            </h2>
            <p className="prep-section-intro-main">
              Effective disaster preparedness pursues multiple interconnected goals that work together to ensure readiness, reduce risks, and build resilient communities capable of responding to and recovering from disasters.
            </p>
            <div className="citizen-benefits-grid prep-objectives-grid">
              {[
                { 
                  icon: '💔', 
                  title: 'Save Lives and Reduce Casualties', 
                  desc: 'Ensure quick, organized response to minimize injuries and loss of life through early warning systems, evacuation plans, and emergency protocols.', 
                  color: '#e53935',
                  gradient: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)'
                },
                { 
                  icon: '⚡', 
                  title: 'Enable Fast and Organized Response', 
                  desc: 'Establish clear procedures and coordination systems to ensure rapid, efficient action when emergencies strike.', 
                  color: '#43a047',
                  gradient: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)'
                },
                { 
                  icon: '🏘️', 
                  title: 'Minimize Damage to Property and Infrastructure', 
                  desc: 'Protect physical assets, buildings, and critical infrastructure through preventive measures and strategic planning.', 
                  color: '#1e88e5',
                  gradient: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)'
                },
                { 
                  icon: '🧠', 
                  title: 'Enhance Community Awareness and Readiness', 
                  desc: 'Educate and train communities to recognize risks, understand procedures, and act confidently during emergencies.', 
                  color: '#00897b',
                  gradient: 'linear-gradient(135deg, #00897b 0%, #00695c 100%)'
                },
                { 
                  icon: '🛡️', 
                  title: 'Build Resilience and Self-Reliance', 
                  desc: 'Strengthen the capacity of individuals and institutions to withstand shocks and recover quickly from disasters.', 
                  color: '#fb8c00',
                  gradient: 'linear-gradient(135deg, #fb8c00 0%, #e65100 100%)'
                },
                { 
                  icon: '🤝', 
                  title: 'Establish Effective Coordination', 
                  desc: 'Foster collaboration and communication between government agencies, organizations, and the public for seamless disaster response.', 
                  color: '#5e35b1',
                  gradient: 'linear-gradient(135deg, #5e35b1 0%, #4527a0 100%)'
                }
              ].map((obj, idx) => (
                <div 
                  key={idx}
                  className="prep-objective-card" 
                  style={{ borderTop: `5px solid ${obj.color}` }}
                  data-color={obj.color}
                >
                  <div className="prep-objective-icon-bg" style={{ background: obj.gradient }}>
                    <div className="prep-objective-icon">{obj.icon}</div>
                  </div>
                  <strong className="prep-objective-title" style={{ color: obj.color }}>{obj.title}</strong>
                  <span className="prep-objective-desc">{obj.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="citizen-phase-section prep-components-section">
            <div className="prep-section-header">
              <span className="prep-header-number">01</span>
              <h2>Key Components of Preparedness</h2>
            </div>
            <p className="prep-section-intro">Preparedness involves multiple coordinated activities designed to improve readiness. These include:</p>
            
            <div className="citizen-strategies-grid">
              <div className="citizen-strategy-card prep-component-card">
                <div className="prep-card-badge">Essential</div>
                <div className="prep-icon-wrapper prep-icon-blue">
                  <span className="prep-card-icon">🧭</span>
                </div>
                <h3>Planning</h3>
                <p className="prep-card-desc">Strategic roadmap for disaster response and recovery</p>
                <ul>
                  <li>Develop disaster risk management and contingency plans.</li>
                  <li>Identify evacuation routes, safe zones, and shelters.</li>
                  <li>Assign roles and responsibilities to response teams.</li>
                  <li>Prepare standard operating procedures (SOPs) for emergencies.</li>
                  <li>Establish communication and command systems (ICS).</li>
                </ul>
              </div>
              
              <div className="citizen-strategy-card prep-component-card">
                <div className="prep-card-badge">Critical</div>
                <div className="prep-icon-wrapper prep-icon-blue">
                  <span className="prep-card-icon">🧰</span>
                </div>
                <h3>Resource Management</h3>
                <p className="prep-card-desc">Stockpile and maintain emergency supplies and equipment</p>
                <ul>
                  <li>Prepare emergency kits (first aid, food, water, flashlight, batteries).</li>
                  <li>Ensure stockpiles of medical supplies and protective gear.</li>
                  <li>Maintain transportation vehicles and rescue equipment.</li>
                  <li>Secure backup communication and power systems.</li>
                  <li>Identify available personnel and emergency volunteers.</li>
                </ul>
              </div>
              
              <div className="citizen-strategy-card prep-component-card">
                <div className="prep-card-badge">Vital</div>
                <div className="prep-icon-wrapper prep-icon-blue">
                  <span className="prep-card-icon">📣</span>
                </div>
                <h3>Training and Drills</h3>
                <p className="prep-card-desc">Build skills and test response capabilities regularly</p>
                <ul>
                  <li>Conduct regular fire, earthquake, and evacuation drills.</li>
                  <li>Train first responders and community volunteers in first aid, rescue, and relief.</li>
                  <li>Simulate various disaster scenarios to test readiness.</li>
                  <li>Evaluate and improve preparedness plans after each drill.</li>
                  <li>Strengthen leadership and coordination skills.</li>
                </ul>
              </div>
              
              <div className="citizen-strategy-card prep-component-card">
                <div className="prep-card-badge">Priority</div>
                <div className="prep-icon-wrapper prep-icon-blue">
                  <span className="prep-card-icon">📡</span>
                </div>
                <h3>Early Warning Systems</h3>
                <p className="prep-card-desc">Timely alerts to save lives and reduce impact</p>
                <ul>
                  <li>Set up weather monitoring and hazard alert systems.</li>
                  <li>Use sirens, SMS alerts, and social media for quick warnings.</li>
                  <li>Educate the public on how to respond to different warning signals.</li>
                  <li>Maintain communication networks between agencies and communities.</li>
                </ul>
              </div>
              
              <div className="citizen-strategy-card prep-component-card">
                <div className="prep-card-badge">Key</div>
                <div className="prep-icon-wrapper prep-icon-blue">
                  <span className="prep-card-icon">🗺️</span>
                </div>
                <h3>Information & Education</h3>
                <p className="prep-card-desc">Empower communities through knowledge and awareness</p>
                <ul>
                  <li>Conduct awareness campaigns on disaster risks and safety practices.</li>
                  <li>Teach schools and families about emergency procedures.</li>
                  <li>Distribute informational materials (posters, flyers, online guides).</li>
                  <li>Promote community participation and cooperation.</li>
                  <li>Encourage households to have personal emergency plans.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section prep-types-section">
            <div className="prep-section-header">
              <span className="prep-header-number">02</span>
              <h2>Types of Preparedness</h2>
            </div>
            
            <div className="citizen-individual-steps">
              <div className="citizen-step-item prep-type-card">
                <div className="prep-type-badge">Personal</div>
                <div className="prep-icon-wrapper prep-icon-green">
                  <span className="prep-card-icon">🌎</span>
                </div>
                <h4>Individual Preparedness</h4>
                <p className="prep-card-desc">Personal readiness starts with you and your family</p>
                <ul>
                  <li>Keep an emergency "Go Bag" with basic needs (food, medicine, flashlight, IDs).</li>
                  <li>Know escape routes and emergency contact numbers.</li>
                  <li>Secure and reinforce your home (check gas, electric, and water lines).</li>
                  <li>Participate in community training and drills.</li>
                  <li>Stay informed through local news and government advisories.</li>
                </ul>
              </div>
              
              <div className="citizen-step-item prep-type-card">
                <div className="prep-type-badge">Collective</div>
                <div className="prep-icon-wrapper prep-icon-green">
                  <span className="prep-card-icon">🏘️</span>
                </div>
                <h4>Community Preparedness</h4>
                <p className="prep-card-desc">Stronger together: neighborhood resilience and cooperation</p>
                <ul>
                  <li>Organize Barangay Disaster Risk Reduction and Management Committees (BDRRMC).</li>
                  <li>Map out hazard-prone areas and vulnerable populations.</li>
                  <li>Designate evacuation centers and stockpile relief goods.</li>
                  <li>Train local volunteers for search, rescue, and relief.</li>
                  <li>Establish a community-based early warning system.</li>
                </ul>
              </div>
              
              <div className="citizen-step-item prep-type-card">
                <div className="prep-type-badge">Corporate</div>
                <div className="prep-icon-wrapper prep-icon-green">
                  <span className="prep-card-icon">🏢</span>
                </div>
                <h4>Organizational Preparedness</h4>
                <p className="prep-card-desc">Business continuity and workplace safety measures</p>
                <ul>
                  <li>Develop emergency and continuity of operations plans.</li>
                  <li>Conduct regular safety inspections and drills.</li>
                  <li>Designate an Emergency Response Team (ERT).</li>
                  <li>Coordinate with local government units (LGUs) and responders.</li>
                  <li>Ensure employee awareness of evacuation and communication protocols.</li>
                </ul>
              </div>
              
              <div className="citizen-step-item prep-type-card">
                <div className="prep-type-badge">Systemic</div>
                <div className="prep-icon-wrapper prep-icon-green">
                  <span className="prep-card-icon">🏛️</span>
                </div>
                <h4>Government Preparedness</h4>
                <p className="prep-card-desc">National and local frameworks for disaster management</p>
                <ul>
                  <li>Formulate national and local disaster management plans.</li>
                  <li>Create and fund disaster management agencies (e.g., NDRRMC in the Philippines).</li>
                  <li>Preposition emergency supplies in strategic areas.</li>
                  <li>Develop infrastructure for quick evacuation and relief.</li>
                  <li>Integrate preparedness into education and urban planning policies.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section disaster-types-section">
            <h2>Preparedness Strategies by Disaster Type</h2>
            
            <div className="citizen-strategies-grid">
              <div className="citizen-strategy-card">
                <h3>🌋 Volcanic Eruption</h3>
                <ul>
                  <li>Identify danger zones and conduct evacuation drills.</li>
                  <li>Prepare masks, goggles, and water containers.</li>
                  <li>Stay informed via PHIVOLCS updates or local alerts.</li>
                  <li>Secure livestock and crops ahead of time.</li>
                  <li>Avoid river valleys where lahar may flow.</li>
                </ul>
              </div>
              
              <div className="citizen-strategy-card">
                <h3>🌊 Flood</h3>
                <ul>
                  <li>Elevate valuables and electrical equipment.</li>
                  <li>Prepare flotation devices or life vests.</li>
                  <li>Know nearby evacuation routes and centers.</li>
                  <li>Store clean water and food in waterproof containers.</li>
                  <li>Avoid crossing rivers during heavy rains.</li>
                </ul>
              </div>
              
              <div className="citizen-strategy-card">
                <h3>🌪️ Typhoon</h3>
                <ul>
                  <li>Board up windows and reinforce roofs.</li>
                  <li>Charge phones, flashlights, and backup batteries.</li>
                  <li>Prepare a list of emergency contacts.</li>
                  <li>Stay tuned to PAGASA warnings and advisories.</li>
                  <li>Secure loose outdoor objects that can become projectiles.</li>
                </ul>
              </div>
              
              <div className="citizen-strategy-card">
                <h3>🌍 Earthquake</h3>
                <ul>
                  <li>Practice "Duck, Cover, and Hold" regularly.</li>
                  <li>Identify safe spots in every room (under sturdy furniture).</li>
                  <li>Keep first aid kits and flashlights within reach.</li>
                  <li>Secure heavy objects and shelves to walls.</li>
                  <li>Designate a family meeting point after evacuation.</li>
                </ul>
              </div>
              
              <div className="citizen-strategy-card">
                <h3>🔥 Fire</h3>
                <ul>
                  <li>Learn how to use a fire extinguisher.</li>
                  <li>Identify escape routes and exits.</li>
                  <li>Install smoke alarms and fire sprinklers.</li>
                  <li>Avoid overloading outlets and extension cords.</li>
                  <li>Prepare important documents in a fireproof container.</li>
                </ul>
              </div>
              
              <div className="citizen-strategy-card">
                <h3>🦠 Pandemic / Disease Outbreak</h3>
                <ul>
                  <li>Maintain hygiene and sanitation (wash hands regularly).</li>
                  <li>Stock up on medical supplies and food.</li>
                  <li>Follow government health advisories and vaccination campaigns.</li>
                  <li>Prepare isolation areas at home for sick members.</li>
                  <li>Ensure continuity of education and work remotely if needed.</li>
                </ul>
              </div>
              
              <div className="citizen-strategy-card">
                <h3>⛰️ Landslide</h3>
                <ul>
                  <li>Avoid building homes on steep slopes or near cliffs.</li>
                  <li>Watch for early signs (cracks, tilting trees, sudden water seepage).</li>
                  <li>Prepare early evacuation routes.</li>
                  <li>Plant trees and vegetation to stabilize soil.</li>
                  <li>Coordinate with LGU for hazard assessment.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section">
            <h2>Preparedness for Human-Caused Disasters</h2>
            
            <div className="citizen-checklist-grid">
              <div className="citizen-checklist-category">
                <h3>⚙️ Industrial / Chemical Accidents</h3>
                <ul className="citizen-action-list">
                  <li>Identify potential hazards in nearby factories or facilities.</li>
                  <li>Conduct regular chemical safety training.</li>
                  <li>Prepare emergency showers and spill kits.</li>
                  <li>Evacuate immediately in case of toxic leaks.</li>
                  <li>Coordinate with local responders for containment.</li>
                </ul>
              </div>
              
              <div className="citizen-checklist-category">
                <h3>🚗 Transportation Accidents</h3>
                <ul className="citizen-action-list">
                  <li>Train emergency teams for mass casualty management.</li>
                  <li>Prepare first aid and trauma kits in vehicles.</li>
                  <li>Mark clear emergency exits in terminals and stations.</li>
                  <li>Establish clear communication systems for rapid response.</li>
                  <li>Maintain rescue equipment such as stretchers and extinguishers.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="citizen-phase-section prep-importance-section">
            <div className="prep-importance-header">
              <h2>IMPORTANCE OF PREPAREDNESS</h2>
            </div>
            <div className="prep-importance-grid">
              <div className="prep-importance-card prep-importance-calm">
                <div className="prep-importance-watermark">🧘</div>
                <div className="prep-importance-card-title">
                  <span className="prep-importance-card-emoji">🧘</span>
                  <span className="prep-importance-heading">Reduces Panic</span>
                </div>
                <p className="prep-importance-card-desc">
                  Reduces panic and confusion during emergencies.
                </p>
              </div>
              
              <div className="prep-importance-card prep-importance-lives">
                <div className="prep-importance-watermark">💚</div>
                <div className="prep-importance-card-title">
                  <span className="prep-importance-card-emoji">💚</span>
                  <span className="prep-importance-heading">Saves Lives</span>
                </div>
                <p className="prep-importance-card-desc">
                  Saves lives by enabling fast and organized response.
                </p>
              </div>
              
              <div className="prep-importance-card prep-importance-costs">
                <div className="prep-importance-watermark">💰</div>
                <div className="prep-importance-card-title">
                  <span className="prep-importance-card-emoji">💰</span>
                  <span className="prep-importance-heading">Minimizes Damage</span>
                </div>
                <p className="prep-importance-card-desc">
                  Minimizes damage and economic losses.
                </p>
              </div>
              
              <div className="prep-importance-card prep-importance-resilience">
                <div className="prep-importance-watermark">🏠</div>
                <div className="prep-importance-card-title">
                  <span className="prep-importance-card-emoji">🏠</span>
                  <span className="prep-importance-heading">Builds Confidence</span>
                </div>
                <p className="prep-importance-card-desc">
                  Builds confidence and self-reliance in communities.
                </p>
              </div>
              
              <div className="prep-importance-card prep-importance-coordination">
                <div className="prep-importance-watermark">🤝</div>
                <div className="prep-importance-card-title">
                  <span className="prep-importance-card-emoji">🤝</span>
                  <span className="prep-importance-heading">Strengthens Coordination</span>
                </div>
                <p className="prep-importance-card-desc">
                  Strengthens coordination among response agencies.
                </p>
              </div>
              
              <div className="prep-importance-card prep-importance-environment">
                <div className="prep-importance-watermark">🌱</div>
                <div className="prep-importance-card-title">
                  <span className="prep-importance-card-emoji">🌱</span>
                  <span className="prep-importance-heading">Promotes Resilience</span>
                </div>
                <p className="prep-importance-card-desc">
                  Promotes long-term resilience and recovery.
                </p>
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
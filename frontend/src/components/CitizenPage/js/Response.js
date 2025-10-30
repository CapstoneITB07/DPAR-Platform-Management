import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../css/CitizenPage.css';
import '../css/Response.css';

function Response() {
  const navigate = useNavigate();
  const [fade, setFade] = useState(false);
  const [currentObjectiveSlide, setCurrentObjectiveSlide] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const location = useLocation();

  // Objectives data
  const objectives = [
    { 
      icon: '💔', 
      title: 'Save Lives and Reduce Suffering', 
      desc: 'Implement immediate life-saving measures and provide emergency medical care to minimize casualties and injuries.', 
      color: '#e53935',
      gradient: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
      bgGradient: 'linear-gradient(135deg, #ffebee 0%, #ffffff 100%)'
    },
    { 
      icon: '🆘', 
      title: 'Provide Emergency Relief', 
      desc: 'Distribute essential supplies including food, water, medical care, and shelter to affected populations.', 
      color: '#fb8c00',
      gradient: 'linear-gradient(135deg, #fb8c00 0%, #e65100 100%)',
      bgGradient: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)'
    },
    { 
      icon: '🏘️', 
      title: 'Protect Property and Infrastructure', 
      desc: 'Safeguard vital infrastructure, prevent further damage, and secure essential facilities and services.', 
      color: '#1e88e5',
      gradient: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
      bgGradient: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)'
    },
    { 
      icon: '🛑', 
      title: 'Stabilize the Situation', 
      desc: 'Control the disaster scene, prevent escalation, and eliminate secondary hazards that threaten safety.', 
      color: '#c62828',
      gradient: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)',
      bgGradient: 'linear-gradient(135deg, #fce4ec 0%, #ffffff 100%)'
    },
    { 
      icon: '🤝', 
      title: 'Ensure Coordination', 
      desc: 'Facilitate seamless collaboration among responders, agencies, and stakeholders under unified command.', 
      color: '#00897b',
      gradient: 'linear-gradient(135deg, #00897b 0%, #00695c 100%)',
      bgGradient: 'linear-gradient(135deg, #e0f2f1 0%, #ffffff 100%)'
    },
    { 
      icon: '📋', 
      title: 'Begin Recovery Planning', 
      desc: 'Conduct rapid assessments, document damage, and initiate strategies for rehabilitation and recovery.', 
      color: '#5e35b1',
      gradient: 'linear-gradient(135deg, #5e35b1 0%, #4527a0 100%)',
      bgGradient: 'linear-gradient(135deg, #ede7f6 0%, #ffffff 100%)'
    }
  ];

  // Auto-rotation effect for carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentObjectiveSlide((prev) => (prev + 1) % objectives.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [objectives.length]);

  // Carousel navigation functions
  const nextSlide = () => {
    setCurrentObjectiveSlide((prev) => (prev + 1) % objectives.length);
  };

  const prevSlide = () => {
    setCurrentObjectiveSlide((prev) => (prev - 1 + objectives.length) % objectives.length);
  };

  const goToSlide = (index) => {
    setCurrentObjectiveSlide(index);
  };

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
              className={`citizen-dropdown-button${dropdownOpen ? ' open' : ''}`}
            >
              <span className="citizen-dropdown-button-text">CATEGORIES</span>
              <span className={`citizen-dropdown-arrow${dropdownOpen ? ' open' : ''}`}>
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
          <p className="citizen-phase-subtitle">Disaster Preparedness and Response</p>
        </div>

        <div className="citizen-phase-content">
          {/* Objectives and Principles - Two Column Layout */}
          <div className="response-objectives-principles-container">
            {/* Objectives Section - Carousel */}
            <div className="citizen-phase-section response-objectives-section">
              <h2 className="response-section-header">
                Objectives of Disaster Response
              </h2>
              <p className="response-section-intro">
                Disaster response aims to minimize casualties, provide immediate assistance, and create 
                the foundation for recovery through rapid, coordinated action.
              </p>
              
              <div className="response-objectives-carousel">
                <div className="carousel-container">
                  <div 
                    className="carousel-track"
                    style={{ transform: `translateX(-${currentObjectiveSlide * 100}%)` }}
                  >
                    {objectives.map((obj, idx) => (
                      <div 
                        key={`objective-${idx}-${obj.title}`}
                        className="carousel-slide"
                      >
                        <div 
                          className="response-objective-card-carousel"
                          style={{ background: obj.bgGradient }}
                        >
                          <div className="response-objective-watermark">{obj.icon}</div>
                          <div className="response-objective-icon-wrapper" style={{ background: obj.gradient }}>
                            <div className="response-objective-icon">{obj.icon}</div>
                          </div>
                          <h3 className="response-objective-title" style={{ color: obj.color }}>{obj.title}</h3>
                          <p className="response-objective-desc">{obj.desc}</p>
                          <div className="response-objective-number" style={{ color: obj.color }}>
                            {(idx + 1).toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <button 
                    className="carousel-button carousel-button-prev"
                    onClick={prevSlide}
                    aria-label="Previous objective"
                  >
                    ‹
                  </button>
                  <button 
                    className="carousel-button carousel-button-next"
                    onClick={nextSlide}
                    aria-label="Next objective"
                  >
                    ›
                  </button>
                </div>

                {/* Dots Indicator */}
                <div className="carousel-dots">
                  {objectives.map((_, idx) => (
                    <button
                      key={`dot-${idx}`}
                      className={`carousel-dot ${idx === currentObjectiveSlide ? 'active' : ''}`}
                      onClick={() => goToSlide(idx)}
                      aria-label={`Go to objective ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Key Principles Section */}
            <div className="citizen-phase-section response-principles-section">
              <h2 className="response-section-header">
                Key Principles of Effective Response
              </h2>
              <div className="response-principles-grid">
                {[
                  { icon: '⚡', title: 'Speed and Efficiency', desc: 'Actions must be immediate and organized to maximize life-saving potential.', variant: 'speed' },
                  { icon: '📡', title: 'Coordination and Communication', desc: 'Agencies must work together under a clear chain of command and maintain constant communication.', variant: 'coordination' },
                  { icon: '🎯', title: 'Prioritization', desc: 'Focus on life-saving measures first, then move to stabilization and relief activities.', variant: 'prioritization' },
                  { icon: '📦', title: 'Resource Optimization', desc: 'Use available resources effectively and prevent duplication of efforts.', variant: 'resource' },
                  { icon: '✅', title: 'Accountability and Safety', desc: 'Ensure responders and affected people are protected throughout operations.', variant: 'accountability' },
                  { icon: '🕊️', title: 'Humanitarian Consideration', desc: 'Respect dignity, culture, and basic rights of all victims during response operations.', variant: 'humanitarian' }
                ].map((principle, idx) => (
                  <div key={`principle-${idx}-${principle.title}`} className={`response-principle-card response-principle-${principle.variant}`}>
                    <div className="response-principle-watermark">{principle.icon}</div>
                    <div className="response-principle-icon-wrapper">
                      <div className="response-principle-icon">{principle.icon}</div>
                    </div>
                    <h3 className="response-principle-title">{principle.title}</h3>
                    <p className="response-principle-desc">{principle.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Response Cycle Section */}
          <div className="citizen-phase-section response-cycle-section">
            <h2 className="response-section-header">
              The Disaster Response Cycle
            </h2>
            <p className="response-section-intro">
              The response stage follows a systematic progression of four main steps, 
              each critical to effective disaster management.
            </p>

            <div className="response-cycle-steps">
              {/* Step 1: Alert and Warning */}
              <div className="response-cycle-step response-step-warning">
                <div className="response-step-number">01</div>
                <div className="response-step-badge">Step 1</div>
                <div className="response-step-watermark">⚠️</div>
                <div className="response-step-icon-wrapper">
                  <div className="response-step-icon">⚠️</div>
                </div>
                <div className="response-step-content">
                  <h3 className="response-step-title">Alert and Warning</h3>
                  <p className="response-step-description">
                    Issuing timely warnings and mobilizing response teams to prepare for immediate action.
                  </p>
                  <ul className="response-step-list">
                    <li>Issuing official warnings from government or disaster agencies</li>
                    <li>Disseminating alerts through sirens, text messages, or broadcasts</li>
                    <li>Mobilizing responders and volunteers for action</li>
                    <li>Activating emergency communication networks</li>
                  </ul>
                </div>
              </div>

              {/* Step 2: Immediate Rescue */}
              <div className="response-cycle-step response-step-rescue">
                <div className="response-step-number">02</div>
                <div className="response-step-badge">Step 2</div>
                <div className="response-step-watermark">🚨</div>
                <div className="response-step-icon-wrapper">
                  <div className="response-step-icon">🚨</div>
                </div>
                <div className="response-step-content">
                  <h3 className="response-step-title">Immediate Rescue and Evacuation</h3>
                  <p className="response-step-description">
                    Life-saving operations to locate, evacuate, and provide medical care to victims.
                  </p>
                  <ul className="response-step-list">
                    <li>Search and rescue (SAR) operations to locate trapped or injured victims</li>
                    <li>Evacuation to safe shelters or designated areas</li>
                    <li>Providing first aid, triage, and emergency medical care</li>
                    <li>Ensuring the safety of responders during operations</li>
                  </ul>
                </div>
              </div>

              {/* Step 3: Relief Operations */}
              <div className="response-cycle-step response-step-relief">
                <div className="response-step-number">03</div>
                <div className="response-step-badge">Step 3</div>
                <div className="response-step-watermark">🏕️</div>
                <div className="response-step-icon-wrapper">
                  <div className="response-step-icon">🏕️</div>
                </div>
                <div className="response-step-content">
                  <h3 className="response-step-title">Relief Operations</h3>
                  <p className="response-step-description">
                    Providing essential supplies, shelter, and support services to affected populations.
                  </p>
                  <ul className="response-step-list">
                    <li>Distribution of food, clean water, clothing, and hygiene kits</li>
                    <li>Setting up temporary shelters and relief centers</li>
                    <li>Providing psychosocial support and counseling for trauma victims</li>
                    <li>Restoring communication lines and basic services (electricity, transportation)</li>
                  </ul>
                </div>
              </div>

              {/* Step 4: Damage Assessment */}
              <div className="response-cycle-step response-step-assessment">
                <div className="response-step-number">04</div>
                <div className="response-step-badge">Step 4</div>
                <div className="response-step-watermark">📋</div>
                <div className="response-step-icon-wrapper">
                  <div className="response-step-icon">📋</div>
                </div>
                <div className="response-step-content">
                  <h3 className="response-step-title">Damage Assessment and Initial Recovery</h3>
                  <p className="response-step-description">
                    Evaluating impact and beginning the transition to recovery and rehabilitation.
                  </p>
                  <ul className="response-step-list">
                    <li>Conducting Rapid Damage and Needs Assessment (RDNA)</li>
                    <li>Recording affected populations, casualties, and property loss</li>
                    <li>Prioritizing rehabilitation of critical infrastructure (roads, hospitals)</li>
                    <li>Coordinating with NGOs and other agencies for ongoing aid</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Types of Response Activities */}
          <div className="citizen-phase-section response-activities-section">
            <h2 className="response-section-header">
              Types of Response Activities
            </h2>
            <p className="response-section-intro">
              Response operations encompass various specialized activities, each playing a vital role 
              in the overall emergency response effort.
            </p>

            <div className="response-activities-grid">
              {/* Life-Saving Operations */}
              <div className="response-activity-card response-activity-lifesaving">
                <div className="response-activity-badge">Critical</div>
                <div className="response-activity-watermark">🧭</div>
                <div className="response-activity-icon-wrapper">
                  <div className="response-activity-icon">🧭</div>
                </div>
                <h3 className="response-activity-title">Life-Saving Operations</h3>
                <p className="response-activity-desc">Immediate actions to save lives and rescue victims</p>
                <ul className="response-activity-list">
                  <li>Search and rescue (SAR)</li>
                  <li>Emergency medical response</li>
                  <li>Evacuation and transportation of injured persons</li>
                  <li>Clearing debris and providing access routes</li>
                </ul>
              </div>

              {/* Relief and Humanitarian */}
              <div className="response-activity-card response-activity-humanitarian">
                <div className="response-activity-badge">Essential</div>
                <div className="response-activity-watermark">🩹</div>
                <div className="response-activity-icon-wrapper">
                  <div className="response-activity-icon">🩹</div>
                </div>
                <h3 className="response-activity-title">Relief and Humanitarian Assistance</h3>
                <p className="response-activity-desc">Providing essential aid and support to affected populations</p>
                <ul className="response-activity-list">
                  <li>Distribution of relief goods (food, water, blankets)</li>
                  <li>Medical missions and mobile health units</li>
                  <li>Establishing temporary housing and sanitation facilities</li>
                  <li>Providing emotional and psychological support</li>
                </ul>
              </div>

              {/* Coordination and Command */}
              <div className="response-activity-card response-activity-coordination">
                <div className="response-activity-badge">Vital</div>
                <div className="response-activity-watermark">🏢</div>
                <div className="response-activity-icon-wrapper">
                  <div className="response-activity-icon">🏢</div>
                </div>
                <h3 className="response-activity-title">Coordination and Command</h3>
                <p className="response-activity-desc">Organizing and directing response operations effectively</p>
                <ul className="response-activity-list">
                  <li>Establishing the Incident Command System (ICS)</li>
                  <li>Setting up Emergency Operations Centers (EOCs)</li>
                  <li>Coordinating between local and national agencies</li>
                  <li>Assigning specific roles: rescue, logistics, health, communication, security</li>
                </ul>
              </div>

              {/* Communication */}
              <div className="response-activity-card response-activity-communication">
                <div className="response-activity-badge">Priority</div>
                <div className="response-activity-watermark">📞</div>
                <div className="response-activity-icon-wrapper">
                  <div className="response-activity-icon">📞</div>
                </div>
                <h3 className="response-activity-title">Communication and Information Management</h3>
                <p className="response-activity-desc">Ensuring clear and accurate information flow during crisis</p>
                <ul className="response-activity-list">
                  <li>Disseminating accurate updates to the public</li>
                  <li>Maintaining contact with media, government, and volunteers</li>
                  <li>Preventing misinformation and panic</li>
                  <li>Reporting ongoing activities and progress to central command</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Natural Disaster Response */}
          <div className="citizen-phase-section response-disaster-section">
            <h2 className="response-section-header">
              Response in Different Disaster Situations
            </h2>
            <p className="response-section-intro">
              Each type of disaster requires specialized response protocols tailored to its unique 
              characteristics and hazards.
            </p>
            <h3 className="response-subsection-title">Natural Disasters</h3>
            <div className="response-disaster-grid">
              {/* Volcanic Eruption */}
              <div className="response-disaster-card response-disaster-volcanic">
                <div className="response-disaster-icon">🌋</div>
                <h4 className="response-disaster-heading">Volcanic Eruption Response</h4>
                <ul className="response-disaster-list">
                  <li>Issue evacuation orders in coordination with PHIVOLCS</li>
                  <li>Provide face masks and goggles to protect from ashfall</li>
                  <li>Set up evacuation centers outside danger zones</li>
                  <li>Distribute water and food, especially to affected farming areas</li>
                  <li>Monitor air quality and lahar flow after eruption</li>
                </ul>
              </div>

              {/* Flood */}
              <div className="response-disaster-card response-disaster-flood">
                <div className="response-disaster-icon">🌊</div>
                <h4 className="response-disaster-heading">Flood Response</h4>
                <ul className="response-disaster-list">
                  <li>Deploy rescue boats and flotation devices</li>
                  <li>Evacuate residents to higher ground</li>
                  <li>Provide blankets, clean water, and food in shelters</li>
                  <li>Set up medical stations to prevent waterborne diseases</li>
                  <li>Clear debris and check bridges and roads for safety</li>
                </ul>
              </div>

              {/* Typhoon */}
              <div className="response-disaster-card response-disaster-typhoon">
                <div className="response-disaster-icon">🌪️</div>
                <h4 className="response-disaster-heading">Typhoon Response</h4>
                <ul className="response-disaster-list">
                  <li>Evacuate communities in coastal or landslide-prone areas</li>
                  <li>Establish communication with local disaster councils</li>
                  <li>Deploy emergency power generators and water filters</li>
                  <li>Conduct search and rescue for missing individuals</li>
                  <li>Provide psychological first aid for victims</li>
                </ul>
              </div>

              {/* Earthquake */}
              <div className="response-disaster-card response-disaster-earthquake">
                <div className="response-disaster-icon">🌍</div>
                <h4 className="response-disaster-heading">Earthquake Response</h4>
                <ul className="response-disaster-list">
                  <li>Conduct immediate search and rescue under collapsed structures</li>
                  <li>Prioritize treatment of injured and trapped individuals</li>
                  <li>Prevent secondary hazards (fires, gas leaks)</li>
                  <li>Secure critical buildings (hospitals, evacuation centers)</li>
                  <li>Set up temporary shelters for displaced families</li>
                </ul>
              </div>

              {/* Fire */}
              <div className="response-disaster-card response-disaster-fire">
                <div className="response-disaster-icon">🔥</div>
                <h4 className="response-disaster-heading">Fire Response</h4>
                <ul className="response-disaster-list">
                  <li>Evacuate affected individuals quickly and safely</li>
                  <li>Extinguish fire using appropriate suppression tools</li>
                  <li>Administer first aid for burns and smoke inhalation</li>
                  <li>Secure surrounding areas from reignition</li>
                  <li>Coordinate with medical facilities for treatment</li>
                </ul>
            </div>

              {/* Landslide */}
              <div className="response-disaster-card response-disaster-landslide">
                <div className="response-disaster-icon">⛰️</div>
                <h4 className="response-disaster-heading">Landslide Response</h4>
                <ul className="response-disaster-list">
                  <li>Conduct rapid rescue operations using heavy machinery if possible</li>
                  <li>Evacuate nearby residents due to risk of secondary slides</li>
                  <li>Provide trauma and injury care for survivors</li>
                  <li>Assess slope stability before resettlement</li>
                  <li>Coordinate clearing operations and road reopening</li>
                </ul>
          </div>

              {/* Pandemic */}
              <div className="response-disaster-card response-disaster-pandemic">
                <div className="response-disaster-icon">🦠</div>
                <h4 className="response-disaster-heading">Pandemic / Disease Outbreak Response</h4>
                <ul className="response-disaster-list">
                  <li>Implement quarantine and isolation procedures</li>
                  <li>Distribute PPE, medicine, and hygiene supplies</li>
                  <li>Conduct mass testing and contact tracing</li>
                  <li>Provide mental health support and accurate public information</li>
                  <li>Mobilize healthcare workers and medical volunteers</li>
                </ul>
              </div>
            </div>

            {/* Human-Caused Disasters */}
            <h3 className="response-subsection-title">Human-Caused Disasters</h3>
            <div className="response-disaster-grid response-human-disaster-grid">
              {/* Industrial Accidents */}
              <div className="response-disaster-card response-disaster-industrial">
                <div className="response-disaster-icon">⚙️</div>
                <h4 className="response-disaster-heading">Industrial or Chemical Accidents</h4>
                <ul className="response-disaster-list">
                  <li>Evacuate the area immediately</li>
                  <li>Deploy hazardous material (HAZMAT) response teams</li>
                  <li>Isolate and contain the chemical spill</li>
                  <li>Administer decontamination procedures</li>
                  <li>Monitor air and water quality for contamination</li>
                </ul>
              </div>

              {/* Terrorist Attacks */}
              <div className="response-disaster-card response-disaster-terrorism">
                <div className="response-disaster-icon">💣</div>
                <h4 className="response-disaster-heading">Terrorist Attacks or Explosions</h4>
                <ul className="response-disaster-list">
                  <li>Prioritize evacuation and medical assistance</li>
                  <li>Secure the area for safety and evidence preservation</li>
                  <li>Coordinate law enforcement and emergency medical services</li>
                  <li>Establish crisis hotlines for affected families</li>
                  <li>Provide trauma counseling and victim identification support</li>
                </ul>
              </div>

              {/* Transportation Accidents */}
              <div className="response-disaster-card response-disaster-transportation">
                <div className="response-disaster-icon">🚗</div>
                <h4 className="response-disaster-heading">Transportation Accidents</h4>
                <ul className="response-disaster-list">
                  <li>Conduct triage for mass casualties</li>
                  <li>Provide medical evacuation and trauma care</li>
                  <li>Secure the area to prevent secondary accidents</li>
                  <li>Coordinate rescue with transport authorities</li>
                  <li>Document injuries and casualties for reporting</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Challenges Section */}
          <div className="citizen-phase-section response-challenges-section">
            <h2 className="response-section-header">
              Challenges in Response Operations
            </h2>
            <p className="response-section-intro">
              Response teams face numerous obstacles that can hinder effective disaster management 
              and must be addressed through planning and adaptation.
            </p>
            <div className="response-challenges-grid">
              {[
                { icon: '🚧', challenge: 'Limited Access', desc: 'Limited access to disaster-affected areas due to infrastructure damage' },
                { icon: '📡', challenge: 'Communication Breakdown', desc: 'Breakdown of communication systems hampering coordination' },
                { icon: '📦', challenge: 'Resource Shortage', desc: 'Shortage of rescue equipment and emergency supplies' },
                { icon: '🏥', challenge: 'Overwhelmed Facilities', desc: 'Overwhelmed medical facilities unable to handle casualties' },
                { icon: '📢', challenge: 'Misinformation', desc: 'Misinformation and panic spreading among the public' },
                { icon: '🤝', challenge: 'Coordination Difficulties', desc: 'Coordination difficulties between multiple agencies and organizations' }
              ].map((item, idx) => (
                <div key={`challenge-${idx}-${item.challenge}`} className="response-challenge-card">
                  <div className="response-challenge-icon">{item.icon}</div>
                  <h4 className="response-challenge-title">{item.challenge}</h4>
                  <p className="response-challenge-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Importance Section */}
          <div className="citizen-phase-section response-importance-section">
            <div className="response-importance-header">
              <h2>IMPORTANCE OF RESPONSE</h2>
            </div>
            <div className="response-importance-grid">
              <div className="response-importance-card response-importance-lives">
                <div className="response-importance-watermark">💖</div>
                <div className="response-importance-card-title">
                  <span className="response-importance-card-emoji">💖</span>
                  <span className="response-importance-heading">Saves Lives</span>
                </div>
                <p className="response-importance-card-desc">
                  Saves lives and minimizes casualties through immediate action and medical intervention.
                </p>
              </div>

              <div className="response-importance-card response-importance-prevents">
                <div className="response-importance-watermark">🛡️</div>
                <div className="response-importance-card-title">
                  <span className="response-importance-card-emoji">🛡️</span>
                  <span className="response-importance-heading">Prevents Secondary Hazards</span>
                </div>
                <p className="response-importance-card-desc">
                  Prevents the spread of diseases and secondary hazards that could cause additional harm.
                </p>
              </div>

              <div className="response-importance-card response-importance-safety">
                <div className="response-importance-watermark">🔒</div>
                <div className="response-importance-card-title">
                  <span className="response-importance-card-emoji">🔒</span>
                  <span className="response-importance-heading">Restores Safety</span>
                </div>
                <p className="response-importance-card-desc">
                  Restores order and public safety in chaotic and dangerous post-disaster environments.
                </p>
              </div>

              <div className="response-importance-card response-importance-trust">
                <div className="response-importance-watermark">🤝</div>
                <div className="response-importance-card-title">
                  <span className="response-importance-card-emoji">🤝</span>
                  <span className="response-importance-heading">Builds Trust</span>
                </div>
                <p className="response-importance-card-desc">
                  Builds public trust and morale during crisis through visible, effective action.
                </p>
              </div>

              <div className="response-importance-card response-importance-recovery">
                <div className="response-importance-watermark">🏗️</div>
                <div className="response-importance-card-title">
                  <span className="response-importance-card-emoji">🏗️</span>
                  <span className="response-importance-heading">Enables Recovery</span>
                </div>
                <p className="response-importance-card-desc">
                  Provides a stable foundation for the recovery and rehabilitation phase to begin.
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

export default Response; 

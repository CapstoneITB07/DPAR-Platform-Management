import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../css/CitizenPage.css';
import '../css/Recovery.css';

function Recovery() {
  const navigate = useNavigate();
  const [fade, setFade] = useState(false);
  const [currentObjectiveSlide, setCurrentObjectiveSlide] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Reset loading when location changes
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Objectives data
  const objectives = [
    { 
      icon: '🏡', 
      title: 'Restore Normal Living Conditions', 
      desc: 'To restore normal living conditions and community functions for all affected populations.', 
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
      bgGradient: 'linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)'
    },
    { 
      icon: '🏗️', 
      title: 'Rebuild Infrastructure', 
      desc: 'To rebuild damaged infrastructure, homes, and services to pre-disaster or better conditions.', 
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
      bgGradient: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)'
    },
    { 
      icon: '💼', 
      title: 'Revive Local Economy', 
      desc: 'To revive local economy, agriculture, and employment opportunities for sustainable livelihoods.', 
      color: '#f57c00',
      gradient: 'linear-gradient(135deg, #fb8c00 0%, #e65100 100%)',
      bgGradient: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)'
    },
    { 
      icon: '❤️', 
      title: 'Provide Long-term Care', 
      desc: 'To provide long-term care and rehabilitation for affected populations.', 
      color: '#c62828',
      gradient: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
      bgGradient: 'linear-gradient(135deg, #ffebee 0%, #ffffff 100%)'
    },
    { 
      icon: '🧠', 
      title: 'Address Psychological Impacts', 
      desc: 'To address psychological and social impacts on survivors and promote healing.', 
      color: '#7b1fa2',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
      bgGradient: 'linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%)'
    },
    { 
      icon: '🛡️', 
      title: 'Integrate Resilience', 
      desc: 'To integrate resilience and disaster risk reduction in reconstruction efforts.', 
      color: '#00796b',
      gradient: 'linear-gradient(135deg, #009688 0%, #00695c 100%)',
      bgGradient: 'linear-gradient(135deg, #e0f2f1 0%, #ffffff 100%)'
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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
    const targetPath = `/citizen/${category.toLowerCase()}`;
    // Don't navigate if already on the same page
    if (location.pathname === targetPath) {
      return;
    }
    setFade(true);
    setTimeout(() => {
      navigate(targetPath);
    }, 350);
  };

  // Determine if ABOUT US is active
  const isAboutActive = location.pathname === '/citizen/about';

  if (isLoading) {
    return (
      <div className="page-loading-container">
        <div className="page-loading-top-line"></div>
        <div className="page-loading-dots">
          <div className="page-loading-dot"></div>
          <div className="page-loading-dot"></div>
          <div className="page-loading-dot"></div>
        </div>
        <div className="page-loading-title">LOADING RECOVERY</div>
        <div className="page-loading-subtitle">Loading page content...</div>
      </div>
    );
  }

  return (
    <div className={`citizen-page-wrapper recovery-page-wrapper`} style={{ opacity: fade ? 0 : 1 }}>
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
              className={`citizen-dropdown-button${dropdownOpen ? ' active' : ''}`}
            >
              <span className="citizen-dropdown-button-text">CATEGORIES</span>
              <span className={`citizen-dropdown-button-arrow${dropdownOpen ? ' open' : ''}`}>
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
                  if (location.pathname === '/citizen/recovery') {
                    return;
                  }
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
          {/* Objectives and Principles - Two Column Layout */}
          <div className="recovery-objectives-principles-container">
            {/* Objectives Section - Carousel */}
            <div className="citizen-phase-section recovery-objectives-section">
              <h2 className="recovery-section-header">
                Objectives of Recovery
              </h2>
              <p className="recovery-section-intro">
                Recovery aims to restore communities to normalcy while building resilience and 
                reducing future disaster risks through comprehensive reconstruction efforts.
              </p>
              
              <div className="recovery-objectives-carousel">
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
                          className="recovery-objective-card-carousel"
                          style={{ background: obj.bgGradient }}
                        >
                          <div className="recovery-objective-watermark">{obj.icon}</div>
                          <div className="recovery-objective-icon-wrapper" style={{ background: obj.gradient }}>
                            <div className="recovery-objective-icon">{obj.icon}</div>
                          </div>
                          <h3 className="recovery-objective-title" style={{ color: obj.color }}>{obj.title}</h3>
                          <p className="recovery-objective-desc">{obj.desc}</p>
                          <div className="recovery-objective-number" style={{ color: obj.color }}>
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
            <div className="citizen-phase-section recovery-principles-section">
              <h2 className="recovery-section-header">
                Key Principles of Recovery
              </h2>
              <div className="recovery-principles-grid">
                {[
                  { icon: '🏗️', title: 'Build Back Better', desc: 'Rebuild in a safer and more sustainable way.', variant: 'build' },
                  { icon: '🤝', title: 'Community Participation', desc: 'Involve local residents in planning and rebuilding.', variant: 'participation' },
                  { icon: '⚖️', title: 'Equity and Inclusiveness', desc: 'Address the needs of all, especially the most vulnerable.', variant: 'equity' },
                  { icon: '🔗', title: 'Coordination and Cooperation', desc: 'Align government, NGOs, and international aid efforts.', variant: 'coordination' },
                  { icon: '🌱', title: 'Sustainability', desc: 'Incorporate environmental protection and long-term resilience.', variant: 'sustainability' },
                  { icon: '✅', title: 'Transparency and Accountability', desc: 'Ensure fair use of recovery funds and aid.', variant: 'transparency' }
                ].map((principle, idx) => (
                  <div key={`principle-${idx}-${principle.title}`} className={`recovery-principle-card recovery-principle-${principle.variant}`}>
                    <div className="recovery-principle-watermark">{principle.icon}</div>
                    <div className="recovery-principle-icon-wrapper">
                      <div className="recovery-principle-icon">{principle.icon}</div>
                    </div>
                    <h3 className="recovery-principle-title">{principle.title}</h3>
                    <p className="recovery-principle-desc">{principle.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Stages of Recovery Section */}
          <div className="citizen-phase-section recovery-stages-section">
            <h2 className="recovery-section-header">
              Stages of Recovery
            </h2>
            <p className="recovery-section-intro">
              Recovery happens in two main phases, each with distinct goals and activities.
            </p>

            <div className="recovery-stages-steps">
              {/* Short-term Recovery */}
              <div className="recovery-stage-step recovery-stage-short">
                <div className="recovery-stage-badge">Immediate Restoration</div>
                <div className="recovery-stage-watermark">🩹</div>
                <div className="recovery-stage-icon-wrapper">
                  <div className="recovery-stage-icon">🩹</div>
                </div>
                <div className="recovery-stage-content">
                  <h3 className="recovery-stage-title">Short-Term Recovery</h3>
                  <p className="recovery-stage-description">
                    Focuses on immediate needs after the response phase
                  </p>
                  <ul className="recovery-stage-list">
                    <li>Clearing debris and repairing essential services (water, power, transport)</li>
                    <li>Providing temporary shelters and housing</li>
                    <li>Offering financial assistance or cash-for-work programs</li>
                    <li>Reopening schools, hospitals, and government offices</li>
                    <li>Continuing medical and psychosocial care for victims</li>
                  </ul>
                </div>
              </div>

              {/* Long-term Recovery */}
              <div className="recovery-stage-step recovery-stage-long">
                <div className="recovery-stage-badge">Rehabilitation & Reconstruction</div>
                <div className="recovery-stage-watermark">🏠</div>
                <div className="recovery-stage-icon-wrapper">
                  <div className="recovery-stage-icon">🏠</div>
                </div>
                <div className="recovery-stage-content">
                  <h3 className="recovery-stage-title">Long-Term Recovery</h3>
                  <p className="recovery-stage-description">
                    Focuses on rebuilding and development for sustainable future
                  </p>
                  <ul className="recovery-stage-list">
                    <li>Reconstructing permanent housing and infrastructure</li>
                    <li>Reviving agriculture, businesses, and local economy</li>
                    <li>Strengthening public facilities and utilities</li>
                    <li>Implementing livelihood and training programs</li>
                    <li>Developing policies to prevent similar disasters in the future</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Key Components of Recovery Section */}
          <div className="citizen-phase-section recovery-components-section">
            <h2 className="recovery-section-header">
              Key Components of Recovery
            </h2>
            <p className="recovery-section-intro">
              Recovery encompasses various specialized activities working together to restore and strengthen communities.
            </p>

            <div className="recovery-components-grid">
              {/* Infrastructure and Housing */}
              <div className="recovery-component-card recovery-component-infrastructure">
                <div className="recovery-component-badge">Critical</div>
                <div className="recovery-component-watermark">🏘️</div>
                <div className="recovery-component-icon-wrapper">
                  <div className="recovery-component-icon">🏘️</div>
                </div>
                <h3 className="recovery-component-title">Infrastructure and Housing Rehabilitation</h3>
                <ul className="recovery-component-list">
                  <li>Repairing or rebuilding homes, schools, hospitals, roads, and bridges</li>
                  <li>Upgrading designs to meet disaster-resistant standards</li>
                  <li>Relocating communities away from high-risk areas</li>
                  <li>Ensuring access to clean water, electricity, and sanitation</li>
                </ul>
              </div>

              {/* Economic Recovery */}
              <div className="recovery-component-card recovery-component-economic">
                <div className="recovery-component-badge">Essential</div>
                <div className="recovery-component-watermark">💼</div>
                <div className="recovery-component-icon-wrapper">
                  <div className="recovery-component-icon">💼</div>
                </div>
                <h3 className="recovery-component-title">Economic Recovery</h3>
                <ul className="recovery-component-list">
                  <li>Providing livelihood programs for displaced workers</li>
                  <li>Offering financial aid, microloans, or grants for small businesses</li>
                  <li>Reestablishing markets and supply chains</li>
                  <li>Restoring agricultural production and fisheries</li>
                  <li>Encouraging investment in resilient industries</li>
                </ul>
              </div>

              {/* Psychosocial and Health */}
              <div className="recovery-component-card recovery-component-psychosocial">
                <div className="recovery-component-badge">Vital</div>
                <div className="recovery-component-watermark">❤️</div>
                <div className="recovery-component-icon-wrapper">
                  <div className="recovery-component-icon">❤️</div>
                </div>
                <h3 className="recovery-component-title">Psychosocial and Health Recovery</h3>
                <ul className="recovery-component-list">
                  <li>Providing mental health support and trauma counseling</li>
                  <li>Continuing medical care for injured individuals</li>
                  <li>Implementing health surveillance to prevent disease outbreaks</li>
                  <li>Promoting community healing and social cohesion</li>
                  <li>Offering community recreation and education programs</li>
                </ul>
              </div>

              {/* Environmental Recovery */}
              <div className="recovery-component-card recovery-component-environmental">
                <div className="recovery-component-badge">Priority</div>
                <div className="recovery-component-watermark">🧭</div>
                <div className="recovery-component-icon-wrapper">
                  <div className="recovery-component-icon">🧭</div>
                </div>
                <h3 className="recovery-component-title">Environmental Recovery</h3>
                <ul className="recovery-component-list">
                  <li>Conducting cleanup and waste management operations</li>
                  <li>Rehabilitating damaged forests, coastal areas, and rivers</li>
                  <li>Managing hazardous debris and contamination</li>
                  <li>Replanting trees and restoring ecosystems</li>
                  <li>Incorporating green and climate-smart infrastructure</li>
                </ul>
              </div>

              {/* Governance and Institutional */}
              <div className="recovery-component-card recovery-component-governance">
                <div className="recovery-component-badge">Strategic</div>
                <div className="recovery-component-watermark">🏛️</div>
                <div className="recovery-component-icon-wrapper">
                  <div className="recovery-component-icon">🏛️</div>
                </div>
                <h3 className="recovery-component-title">Governance and Institutional Recovery</h3>
                <ul className="recovery-component-list">
                  <li>Rebuilding local government offices and systems</li>
                  <li>Updating land use plans and disaster management policies</li>
                  <li>Training officials in risk reduction and recovery management</li>
                  <li>Strengthening coordination between agencies and communities</li>
                  <li>Enhancing early warning and communication systems</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recovery Strategies by Disaster Type */}
          <div className="citizen-phase-section recovery-disaster-section">
            <h2 className="recovery-section-header">
              Recovery Strategies by Disaster Type
            </h2>
            <p className="recovery-section-intro">
              Each type of disaster requires specialized recovery strategies tailored to its unique 
              impacts and challenges.
            </p>

            <h3 className="recovery-subsection-title">Natural Disasters</h3>
            <div className="recovery-disaster-grid">
              {/* Volcanic Eruption */}
              <div className="recovery-disaster-card recovery-disaster-volcanic">
                <div className="recovery-disaster-icon">🌋</div>
                <h4 className="recovery-disaster-heading">Volcanic Eruption Recovery</h4>
                <ul className="recovery-disaster-list">
                  <li>Clean up ashfall and rebuild damaged roofs and crops</li>
                  <li>Provide long-term relocation for displaced residents</li>
                  <li>Support farmers with seeds and new farmland</li>
                  <li>Establish lahar diversion and monitoring systems</li>
                  <li>Replant forests destroyed by eruptions</li>
                </ul>
              </div>

              {/* Flood */}
              <div className="recovery-disaster-card recovery-disaster-flood">
                <div className="recovery-disaster-icon">🌊</div>
                <h4 className="recovery-disaster-heading">Flood Recovery</h4>
                <ul className="recovery-disaster-list">
                  <li>Repair drainage systems and river embankments</li>
                  <li>Clean and disinfect flood-affected homes</li>
                  <li>Restore water supply, sanitation, and road networks</li>
                  <li>Offer livelihood recovery programs for affected families</li>
                  <li>Promote flood-resistant housing and elevated structures</li>
                </ul>
              </div>

              {/* Typhoon */}
              <div className="recovery-disaster-card recovery-disaster-typhoon">
                <div className="recovery-disaster-icon">🌪️</div>
                <h4 className="recovery-disaster-heading">Typhoon Recovery</h4>
                <ul className="recovery-disaster-list">
                  <li>Reconstruct homes using storm-resistant materials</li>
                  <li>Restore power, water, and telecommunication lines</li>
                  <li>Provide psychosocial support to affected families</li>
                  <li>Rebuild schools and health facilities</li>
                  <li>Develop coastal protection and mangrove reforestation</li>
                </ul>
              </div>

              {/* Earthquake */}
              <div className="recovery-disaster-card recovery-disaster-earthquake">
                <div className="recovery-disaster-icon">🌍</div>
                <h4 className="recovery-disaster-heading">Earthquake Recovery</h4>
                <ul className="recovery-disaster-list">
                  <li>Rebuild using earthquake-resistant designs</li>
                  <li>Reconstruct bridges, roads, and public utilities</li>
                  <li>Provide trauma care and rehabilitation for the injured</li>
                  <li>Restore government and business operations</li>
                  <li>Update building codes and urban plans for safety</li>
                </ul>
              </div>

              {/* Fire */}
              <div className="recovery-disaster-card recovery-disaster-fire">
                <div className="recovery-disaster-icon">🔥</div>
                <h4 className="recovery-disaster-heading">Fire Recovery</h4>
                <ul className="recovery-disaster-list">
                  <li>Provide temporary shelters and financial support for rebuilding</li>
                  <li>Replace lost documents and identification</li>
                  <li>Offer livelihood assistance for affected families</li>
                  <li>Implement fire safety awareness and training programs</li>
                  <li>Improve firefighting infrastructure and hydrant systems</li>
                </ul>
              </div>

              {/* Landslide */}
              <div className="recovery-disaster-card recovery-disaster-landslide">
                <div className="recovery-disaster-icon">⛰️</div>
                <h4 className="recovery-disaster-heading">Landslide Recovery</h4>
                <ul className="recovery-disaster-list">
                  <li>Relocate residents to safer zones</li>
                  <li>Stabilize slopes through reforestation and engineering structures</li>
                  <li>Repair damaged roads and utilities</li>
                  <li>Support agriculture and replanting efforts</li>
                  <li>Install monitoring systems to prevent future landslides</li>
                </ul>
              </div>

              {/* Pandemic */}
              <div className="recovery-disaster-card recovery-disaster-pandemic">
                <div className="recovery-disaster-icon">🦠</div>
                <h4 className="recovery-disaster-heading">Pandemic / Disease Outbreak Recovery</h4>
                <ul className="recovery-disaster-list">
                  <li>Rehabilitate healthcare systems and hospitals</li>
                  <li>Support affected families with income restoration</li>
                  <li>Continue vaccination and preventive programs</li>
                  <li>Provide mental health counseling and social support</li>
                  <li>Rebuild confidence in public gatherings and education</li>
                </ul>
              </div>
            </div>

            <h3 className="recovery-subsection-title">Human-Caused Disasters</h3>
            <div className="recovery-disaster-grid recovery-human-disaster-grid">
              {/* Industrial Accidents */}
              <div className="recovery-disaster-card recovery-disaster-industrial">
                <div className="recovery-disaster-icon">⚙️</div>
                <h4 className="recovery-disaster-heading">Industrial Accidents Recovery</h4>
                <ul className="recovery-disaster-list">
                  <li>Decontaminate polluted sites and rebuild safe workplaces</li>
                  <li>Provide compensation and healthcare to affected workers</li>
                  <li>Review safety regulations and upgrade facilities</li>
                  <li>Rebuild public trust through transparency and monitoring</li>
                  <li>Conduct re-skilling programs for displaced workers</li>
                </ul>
              </div>

              {/* Terrorist Attacks */}
              <div className="recovery-disaster-card recovery-disaster-terrorism">
                <div className="recovery-disaster-icon">💣</div>
                <h4 className="recovery-disaster-heading">Terrorist Attacks / Explosions Recovery</h4>
                <ul className="recovery-disaster-list">
                  <li>Rebuild damaged structures and memorialize victims</li>
                  <li>Offer trauma counseling and community healing</li>
                  <li>Improve public security and emergency response systems</li>
                  <li>Strengthen counterterrorism awareness and resilience</li>
                  <li>Support economic and tourism recovery in affected areas</li>
                </ul>
              </div>

              {/* Transportation Accidents */}
              <div className="recovery-disaster-card recovery-disaster-transportation">
                <div className="recovery-disaster-icon">🚗</div>
                <h4 className="recovery-disaster-heading">Transportation Accidents Recovery</h4>
                <ul className="recovery-disaster-list">
                  <li>Repair transportation infrastructure (roads, railways, airports)</li>
                  <li>Improve safety measures and emergency systems</li>
                  <li>Provide compensation and aid to victims' families</li>
                  <li>Review and strengthen safety protocols</li>
                  <li>Train responders for mass casualty recovery management</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Challenges Section */}
          <div className="citizen-phase-section recovery-challenges-section">
            <h2 className="recovery-section-header">
              Challenges in Recovery
            </h2>
            <p className="recovery-section-intro">
              Recovery efforts face numerous obstacles that must be addressed through careful 
              planning, coordination, and community engagement.
            </p>
            <div className="recovery-challenges-grid">
              {[
                { icon: '💰', challenge: 'Limited Funding', desc: 'Limited funding or delayed financial aid hampering recovery efforts' },
                { icon: '📋', challenge: 'Bureaucratic Processes', desc: 'Bureaucratic processes and corruption slowing down recovery' },
                { icon: '🤝', challenge: 'Lack of Coordination', desc: 'Lack of coordination between agencies and organizations' },
                { icon: '😔', challenge: 'Psychological Trauma', desc: 'Psychological trauma and loss of motivation in victims' },
                { icon: '🌊', challenge: 'Environmental Degradation', desc: 'Environmental degradation and recurring hazards' },
                { icon: '⚖️', challenge: 'Inequitable Distribution', desc: 'Inequitable distribution of aid and opportunities' }
              ].map((item, idx) => (
                <div key={`challenge-${idx}-${item.challenge}`} className="recovery-challenge-card">
                  <div className="recovery-challenge-icon">{item.icon}</div>
                  <h4 className="recovery-challenge-title">{item.challenge}</h4>
                  <p className="recovery-challenge-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Importance Section */}
          <div className="citizen-phase-section recovery-importance-section">
            <div className="recovery-importance-header">
              <h2>IMPORTANCE OF RECOVERY</h2>
            </div>
            <div className="recovery-importance-grid">
              <div className="recovery-importance-card recovery-importance-dignity">
                <div className="recovery-importance-watermark">🏡</div>
                <div className="recovery-importance-card-title">
                  <span className="recovery-importance-card-emoji">🏡</span>
                  <span className="recovery-importance-heading">Restores Dignity and Stability</span>
                </div>
                <p className="recovery-importance-card-desc">
                  Restores dignity, safety, and stability to affected people and communities.
                </p>
              </div>

              <div className="recovery-importance-card recovery-importance-infrastructure">
                <div className="recovery-importance-watermark">🏗️</div>
                <div className="recovery-importance-card-title">
                  <span className="recovery-importance-card-emoji">🏗️</span>
                  <span className="recovery-importance-heading">Rebuilds Infrastructure</span>
                </div>
                <p className="recovery-importance-card-desc">
                  Rebuilds infrastructure and economic stability for sustainable development.
                </p>
              </div>

              <div className="recovery-importance-card recovery-importance-healing">
                <div className="recovery-importance-watermark">❤️</div>
                <div className="recovery-importance-card-title">
                  <span className="recovery-importance-card-emoji">❤️</span>
                  <span className="recovery-importance-heading">Promotes Healing</span>
                </div>
                <p className="recovery-importance-card-desc">
                  Promotes emotional healing and community unity through support and engagement.
                </p>
              </div>

              <div className="recovery-importance-card recovery-importance-resilient">
                <div className="recovery-importance-watermark">🛡️</div>
                <div className="recovery-importance-card-title">
                  <span className="recovery-importance-card-emoji">🛡️</span>
                  <span className="recovery-importance-heading">Creates Resilience</span>
                </div>
                <p className="recovery-importance-card-desc">
                  Creates safer and more resilient communities prepared for future disasters.
                </p>
              </div>

              <div className="recovery-importance-card recovery-importance-lessons">
                <div className="recovery-importance-watermark">📚</div>
                <div className="recovery-importance-card-title">
                  <span className="recovery-importance-card-emoji">📚</span>
                  <span className="recovery-importance-heading">Transforms Lessons</span>
                </div>
                <p className="recovery-importance-card-desc">
                  Transforms lessons learned into future risk reduction actions and policies.
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

      {/* Scroll to Top Button */}
      <button 
        className={`about-scroll-to-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </div>
  );
}

export default Recovery; 
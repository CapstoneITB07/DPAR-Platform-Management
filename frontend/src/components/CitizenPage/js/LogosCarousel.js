import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../css/LogosCarousel.css';

const LogosCarousel = ({ logos, onLogoClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isHovered && logos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % logos.length);
      }, 5000); // Change slide every 5 seconds
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isHovered, logos.length]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + logos.length) % logos.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % logos.length);
  };

  const handleLogoClick = (logo, index) => {
    setCurrentIndex(index);
    onLogoClick(logo);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Get visible logos (current + 2 on each side)
  const getVisibleLogos = () => {
    const visibleLogos = [];
    const totalLogos = logos.length;
    
    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + totalLogos) % totalLogos;
      visibleLogos.push({
        ...logos[index],
        originalIndex: index,
        position: i
      });
    }
    
    return visibleLogos;
  };

  if (!logos || logos.length === 0) {
    return (
      <div className="logos-carousel-container">
        <div className="logos-carousel-empty">
          <p>No organizations available.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="netflix-carousel-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel Title */}
      <div className="netflix-carousel-title">
        <h2>Helping Hands, Ready Hearts</h2>
      </div>

      {/* Navigation Controls */}
      <div className="netflix-controls">
        <button 
          className="netflix-control-btn netflix-prev"
          onClick={handlePrev}
          aria-label="Previous logo"
        >
          <FaChevronLeft />
        </button>
        
        <button 
          className="netflix-control-btn netflix-next"
          onClick={handleNext}
          aria-label="Next logo"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Netflix-style Logo Row */}
      <div className="netflix-logos-row" ref={carouselRef}>
        {getVisibleLogos().map((logo, index) => (
          <div 
            key={`logo-${logo.id || 'unknown'}-${logo.originalIndex}-${logo.position}-${index}`}
            className={`netflix-logo-item ${logo.position === 0 ? 'center' : ''} ${logo.position === -1 || logo.position === 1 ? 'side' : ''} ${logo.position === -2 || logo.position === 2 ? 'edge' : ''}`}
            onClick={() => handleLogoClick(logo, logo.originalIndex)}
          >
            <img
              src={logo.logo}
              alt={logo.name}
              className="netflix-logo-img"
              onError={(e) => {
                e.target.src = `${window.location.origin}/Assets/disaster_logo.png`;
              }}
              title={`Click to view ${logo.name} details`}
            />
            {logo.position === 0 && (
              <div className="netflix-logo-label">
                {logo.name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      {logos.length > 1 && (
        <div className="netflix-progress">
          <div className="netflix-progress-track">
            {logos.map((logo, index) => (
              <div
                key={`progress-dot-${logo.id || index}-${index}`}
                className={`netflix-progress-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogosCarousel;

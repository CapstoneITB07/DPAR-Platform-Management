import React from 'react';
import '../css/MaintenancePage.css';

function MaintenancePage() {

  return (
    <div className="maintenance-page">
      <div className="maintenance-container">
        <div className="maintenance-icon">🔧</div>
        <h1>We'll be right back!</h1>
        <p>We're currently performing scheduled maintenance. We'll be back shortly.</p>
        <button 
          className="maintenance-retry-btn" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default MaintenancePage;


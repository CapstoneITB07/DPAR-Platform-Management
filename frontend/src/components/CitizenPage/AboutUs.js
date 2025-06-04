import React from 'react';

function AboutUs() {
  return (
    <div style={{ 
      padding: '40px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 60px)',
      background: '#fff'
    }}>
      <h1 style={{ 
        color: '#8B1409',
        textAlign: 'center',
        marginBottom: '40px',
        fontSize: '2.5rem'
      }}>
        About DPAR Volunteer Coalition
      </h1>
      
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '40px'
      }}>
        <h2 style={{ color: '#8B1409', marginBottom: '20px' }}>Our Mission</h2>
        <p style={{ 
          fontSize: '1.1rem',
          lineHeight: '1.6',
          color: '#333',
          marginBottom: '20px'
        }}>
          The DPAR Volunteer Coalition is dedicated to strengthening disaster preparedness and response capabilities 
          through community engagement and volunteer coordination. We work under the framework of Republic Act 10121 
          (Philippine Disaster Risk Reduction and Management Act of 2010) to build resilient communities.
        </p>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '40px'
      }}>
        <h2 style={{ color: '#8B1409', marginBottom: '20px' }}>Our Vision</h2>
        <p style={{ 
          fontSize: '1.1rem',
          lineHeight: '1.6',
          color: '#333',
          marginBottom: '20px'
        }}>
          We envision a community where every citizen is prepared, informed, and empowered to respond effectively 
          to disasters and emergencies. Through collaboration with various organizations and dedicated volunteers, 
          we strive to create a safer and more resilient society.
        </p>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#8B1409', marginBottom: '20px' }}>Our Partners</h2>
        <p style={{ 
          fontSize: '1.1rem',
          lineHeight: '1.6',
          color: '#333',
          marginBottom: '20px'
        }}>
          We work closely with various organizations including SPAG, RMFB, ALERT, MRAP, MSG-ERU, and many others 
          to coordinate disaster response efforts and provide comprehensive support to our community.
        </p>
      </div>
    </div>
  );
}

export default AboutUs;
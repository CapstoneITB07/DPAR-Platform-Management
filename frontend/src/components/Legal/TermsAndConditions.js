import React from 'react';
import './LegalDocuments.css';

function TermsAndConditions({ onClose }) {
  return (
    <div className="legal-document-container">
      <div className="legal-document-content">
        <div className="legal-document-header">
          <h1>Terms and Conditions</h1>
          <p className="legal-document-subtitle">Disaster Preparedness and Response (DPAR) Platform</p>
          <p className="legal-document-date">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="legal-document-body">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Disaster Preparedness and Response (DPAR) Platform ("Platform"), 
              you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions 
              and all applicable laws and regulations of the Republic of the Philippines. If you do not agree 
              with any of these terms, you are prohibited from using or accessing this Platform.
            </p>
          </section>

          <section>
            <h2>2. Platform Description</h2>
            <p>
              The DPAR Platform is a digital system designed to facilitate disaster preparedness, response, 
              and recovery efforts in the Philippines. The Platform connects volunteer organizations, 
              government agencies, and citizens to coordinate disaster management activities.
            </p>
          </section>

          <section>
            <h2>3. User Registration and Account</h2>
            <h3>3.1 Eligibility</h3>
            <p>
              To use this Platform, you must be a legitimate organization registered in the Philippines, 
              or an authorized representative of such organization. You must provide accurate, current, 
              and complete information during registration.
            </p>
            <h3>3.2 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and 
              for all activities that occur under your account. You agree to immediately notify the 
              Platform administrators of any unauthorized use of your account.
            </p>
            <h3>3.3 Account Approval</h3>
            <p>
              All registration applications are subject to review and approval by Platform administrators. 
              The Platform reserves the right to reject any application without providing a reason.
            </p>
          </section>

          <section>
            <h2>4. User Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Violate any laws, regulations, or ordinances in the Philippines</li>
              <li>Transmit any malicious code, viruses, or harmful content</li>
              <li>Impersonate any person or entity or falsely state your affiliation</li>
              <li>Interfere with or disrupt the Platform's operation</li>
              <li>Collect or store personal data of other users without authorization</li>
              <li>Use automated systems to access the Platform without permission</li>
              <li>Engage in any activity that could harm the Platform's reputation or functionality</li>
            </ul>
          </section>

          <section>
            <h2>5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Platform, including but not limited to text, 
              graphics, logos, and software, are the property of the DPAR Platform and are protected by 
              Philippine copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You may not reproduce, distribute, modify, or create derivative works from any content 
              on the Platform without prior written permission.
            </p>
          </section>

          <section>
            <h2>6. Data and Privacy</h2>
            <p>
              Your use of the Platform is also governed by our Data Privacy Policy, which complies with 
              the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines. By using the 
              Platform, you consent to the collection, use, and disclosure of your information as described 
              in the Data Privacy Policy.
            </p>
          </section>

          <section>
            <h2>7. Disclaimers</h2>
            <h3>7.1 Platform Availability</h3>
            <p>
              The Platform is provided "as is" and "as available." We do not guarantee that the Platform 
              will be uninterrupted, error-free, or completely secure.
            </p>
            <h3>7.2 Information Accuracy</h3>
            <p>
              While we strive to provide accurate information, we do not warrant the accuracy, completeness, 
              or usefulness of any information on the Platform. You rely on such information at your own risk.
            </p>
            <h3>7.3 Third-Party Content</h3>
            <p>
              The Platform may contain links to third-party websites or content. We are not responsible for 
              the content, privacy policies, or practices of third-party sites.
            </p>
          </section>

          <section>
            <h2>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by Philippine law, the DPAR Platform, its administrators, 
              and affiliates shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages, including but not limited to loss of profits, data, or use, arising 
              out of or relating to your use of the Platform.
            </p>
          </section>

          <section>
            <h2>9. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless the DPAR Platform, its administrators, 
              officers, employees, and agents from any claims, damages, losses, liabilities, and expenses 
              (including legal fees) arising out of or relating to your use of the Platform or violation 
              of these Terms and Conditions.
            </p>
          </section>

          <section>
            <h2>10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account and access to the Platform at any 
              time, with or without notice, for any reason, including but not limited to violation of 
              these Terms and Conditions or applicable laws.
            </p>
          </section>

          <section>
            <h2>11. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms and Conditions at any time. Material changes 
              will be notified to users via email or through the Platform. Your continued use of the 
              Platform after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2>12. Governing Law</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws 
              of the Republic of the Philippines. Any disputes arising from or relating to these terms 
              shall be subject to the exclusive jurisdiction of the courts of the Philippines.
            </p>
          </section>

          <section>
            <h2>13. Severability</h2>
            <p>
              If any provision of these Terms and Conditions is found to be invalid or unenforceable, 
              the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section>
            <h2>14. Contact Information</h2>
            <p>
              For questions or concerns regarding these Terms and Conditions, please contact the Platform 
              administrators through the official communication channels provided on the Platform.
            </p>
          </section>

          <section>
            <h2>15. Entire Agreement</h2>
            <p>
              These Terms and Conditions, together with the Data Privacy Policy, constitute the entire 
              agreement between you and the DPAR Platform regarding your use of the Platform.
            </p>
          </section>
        </div>

        {onClose && (
          <div className="legal-document-footer">
            <button onClick={onClose} className="legal-document-close-btn">Close</button>
          </div>
        )}
        
        {/* Close button in header for better UX */}
        {onClose && (
          <button 
            onClick={onClose} 
            className="legal-document-header-close"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default TermsAndConditions;


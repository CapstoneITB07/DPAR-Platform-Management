import React from 'react';
import './LegalDocuments.css';

function DataPrivacyPolicy({ onClose }) {
  return (
    <div className="legal-document-container">
      <div className="legal-document-content">
        <div className="legal-document-header">
          <h1>Data Privacy Policy</h1>
          <p className="legal-document-subtitle">Disaster Preparedness and Response (DPAR) Platform</p>
          <p className="legal-document-date">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="legal-document-notice">
            This Privacy Policy complies with the Data Privacy Act of 2012 (Republic Act No. 10173) 
            of the Philippines.
          </p>
        </div>

        <div className="legal-document-body">
          <section>
            <h2>1. Introduction</h2>
            <p>
              The Disaster Preparedness and Response (DPAR) Platform ("we," "us," or "our") is committed 
              to protecting your privacy and personal data. This Data Privacy Policy explains how we 
              collect, use, disclose, and safeguard your personal information in compliance with the 
              Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines.
            </p>
          </section>

          <section>
            <h2>2. Data Controller</h2>
            <p>
              The DPAR Platform is the data controller responsible for the processing of your personal 
              data. For inquiries regarding this Privacy Policy or your personal data, please contact 
              us through the official communication channels provided on the Platform.
            </p>
          </section>

          <section>
            <h2>3. Information We Collect</h2>
            <h3>3.1 Personal Information</h3>
            <p>We may collect the following types of personal information:</p>
            <ul>
              <li><strong>Registration Information:</strong> Organization name, organization type, director name, username, email address, phone number, SEC registration number (if applicable), and organization description</li>
              <li><strong>Account Information:</strong> Login credentials, profile information, and account settings</li>
              <li><strong>Activity Data:</strong> Logs of your activities, reports submitted, volunteers recruited, and system interactions</li>
              <li><strong>Communication Data:</strong> Messages, notifications, and correspondence with Platform administrators and other users</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage statistics</li>
              <li><strong>Volunteer Information:</strong> Information about volunteers registered through your organization</li>
            </ul>
            <h3>3.2 Sensitive Personal Information</h3>
            <p>
              In certain circumstances, we may process sensitive personal information as defined under 
              the Data Privacy Act, such as information about disaster response activities, which is 
              necessary for the Platform's disaster management functions.
            </p>
          </section>

          <section>
            <h2>4. How We Collect Information</h2>
            <p>We collect information through:</p>
            <ul>
              <li>Direct submission when you register or use the Platform</li>
              <li>Automatic collection through cookies and similar technologies</li>
              <li>Third-party sources (with your consent) for verification purposes</li>
              <li>Communication channels when you contact us</li>
            </ul>
          </section>

          <section>
            <h2>5. Purpose of Data Processing</h2>
            <p>We process your personal data for the following purposes:</p>
            <ul>
              <li>To provide and maintain the Platform's services</li>
              <li>To verify your identity and organization legitimacy</li>
              <li>To process and manage your registration and account</li>
              <li>To facilitate disaster preparedness and response coordination</li>
              <li>To send important notifications and updates</li>
              <li>To improve the Platform's functionality and user experience</li>
              <li>To comply with legal obligations under Philippine law</li>
              <li>To prevent fraud and ensure Platform security</li>
              <li>To generate reports and analytics for disaster management purposes</li>
            </ul>
          </section>

          <section>
            <h2>6. Legal Basis for Processing</h2>
            <p>We process your personal data based on:</p>
            <ul>
              <li><strong>Consent:</strong> When you provide explicit consent for specific processing activities</li>
              <li><strong>Contractual Necessity:</strong> To fulfill our obligations under the Terms and Conditions</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
              <li><strong>Legitimate Interest:</strong> For disaster management, Platform security, and service improvement</li>
              <li><strong>Public Interest:</strong> For disaster preparedness and response activities in the public interest</li>
            </ul>
          </section>

          <section>
            <h2>7. Data Sharing and Disclosure</h2>
            <p>We may share your personal data with:</p>
            <ul>
              <li><strong>Government Agencies:</strong> Relevant Philippine government agencies involved in disaster management, as required by law</li>
              <li><strong>Service Providers:</strong> Third-party service providers who assist in Platform operations (under strict confidentiality agreements)</li>
              <li><strong>Other Organizations:</strong> Other registered organizations on the Platform for coordination purposes (limited information only)</li>
              <li><strong>Legal Authorities:</strong> When required by law, court order, or government regulation</li>
            </ul>
            <p>
              We do not sell, rent, or trade your personal data to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2>8. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal 
              data against unauthorized access, alteration, disclosure, or destruction, including:
            </p>
            <ul>
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure data storage and backup systems</li>
              <li>Staff training on data protection</li>
            </ul>
            <p>
              However, no method of transmission over the internet or electronic storage is 100% secure. 
              While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>9. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to fulfill the purposes outlined 
              in this Privacy Policy, unless a longer retention period is required or permitted by law. 
              When data is no longer needed, we will securely delete or anonymize it in accordance with 
              our data retention policies.
            </p>
          </section>

          <section>
            <h2>10. Your Rights Under the Data Privacy Act</h2>
            <p>As a data subject, you have the following rights:</p>
            <ul>
              <li><strong>Right to be Informed:</strong> You have the right to be informed about the collection and processing of your personal data</li>
              <li><strong>Right to Access:</strong> You may request access to your personal data and obtain a copy</li>
              <li><strong>Right to Object:</strong> You may object to the processing of your personal data for certain purposes</li>
              <li><strong>Right to Erasure or Blocking:</strong> You may request the deletion or blocking of your personal data under certain circumstances</li>
              <li><strong>Right to Damages:</strong> You may claim damages if you suffer due to inaccurate, incomplete, outdated, false, or unlawfully obtained personal data</li>
              <li><strong>Right to Data Portability:</strong> You may request a copy of your data in a structured, commonly used format</li>
              <li><strong>Right to File a Complaint:</strong> You may file a complaint with the National Privacy Commission (NPC) if you believe your rights have been violated</li>
            </ul>
            <p>
              To exercise these rights, please contact us through the official communication channels 
              provided on the Platform.
            </p>
          </section>

          <section>
            <h2>11. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience on the Platform. 
              You can control cookie preferences through your browser settings. However, disabling cookies 
              may affect Platform functionality.
            </p>
          </section>

          <section>
            <h2>12. Children's Privacy</h2>
            <p>
              The Platform is not intended for individuals under 18 years of age. We do not knowingly 
              collect personal information from minors. If we become aware that we have collected personal 
              information from a minor, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2>13. International Data Transfers</h2>
            <p>
              Your personal data is primarily stored and processed within the Philippines. If we need 
              to transfer data outside the Philippines, we will ensure appropriate safeguards are in 
              place to protect your data in accordance with the Data Privacy Act.
            </p>
          </section>

          <section>
            <h2>14. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be notified 
              to you via email or through the Platform. Your continued use of the Platform after such 
              changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2>15. Contact Information</h2>
            <p>
              For questions, concerns, or to exercise your rights under the Data Privacy Act, please 
              contact us through the official communication channels provided on the Platform or:
            </p>
            <p>
              <strong>Data Protection Officer</strong><br />
              Disaster Preparedness and Response (DPAR) Platform<br />
              [Contact information to be provided]
            </p>
            <p>
              You may also file a complaint with the National Privacy Commission (NPC) at:
            </p>
            <p>
              <strong>National Privacy Commission</strong><br />
              PICC Complex, Roxas Boulevard<br />
              Pasay City, Metro Manila 1307<br />
              Philippines<br />
              Website: <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer">www.privacy.gov.ph</a>
            </p>
          </section>

          <section>
            <h2>16. Consent</h2>
            <p>
              By using the DPAR Platform, you acknowledge that you have read and understood this 
              Data Privacy Policy and consent to the collection, use, and disclosure of your personal 
              data as described herein.
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

export default DataPrivacyPolicy;


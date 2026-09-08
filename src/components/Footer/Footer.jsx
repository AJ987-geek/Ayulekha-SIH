import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col">
            <span className="footer-col-label font-mono">ABDM Compliance</span>
            <p className="footer-col-text">
              Fully compliant with Ayushman Bharat Digital Mission (ABDM) standards for secure digital health record orchestration and patient-mediated consent architecture.
            </p>
          </div>
          <div className="footer-col">
            <span className="footer-col-label font-mono">National Health Authority</span>
            <p className="footer-col-text">
              Endorsed by the National Health Authority (NHA) &amp; Ministry of Health and Family Welfare (MoHFW), Government of India for AIIMS OPD operations.
            </p>
          </div>
          <div className="footer-col">
            <span className="footer-col-label font-mono">Clinical Security Notice</span>
            <p className="footer-col-text">
              256-bit cryptographic transport security. Health records are encrypted at rest and transmitted strictly via authorized FHIR/HL7 clinical interfaces.
            </p>
          </div>
        </div>

        <div className="footer-bar">
          <span className="footer-copy font-mono">© 2025 AYULEKHA · ALL INDIA INSTITUTE OF MEDICAL SCIENCES</span>
          <div className="footer-links font-mono">
            <a className="footer-link" href="#">Privacy Policy</a>
            <a className="footer-link" href="#">Consent Charter</a>
            <a className="footer-link" href="#">System Status</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

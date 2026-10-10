import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer({ onNavigate }) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  return (
    <footer className="site-footer">
      <div className="footer-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Col 1 */}
        <div className="footer-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div className="logo-icon" style={{ width: '30px', height: '30px', fontSize: '14px' }}>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
                <circle cx="11" cy="11" r="2" fill="#E8631A"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, color: 'white', fontSize: 'var(--text-md)' }}>AyuLekha</span>
          </div>
          <p style={{ marginBottom: '10px' }}>
            {isHi
              ? "आयुष्मान भारत डिजिटल मिशन के अंतर्गत भारत का आधिकारिक नागरिक स्वास्थ्य रिकॉर्ड पोर्टल। प्रत्येक भारतीय को उनके स्वास्थ्य डेटा से सशक्त बनाना।"
              : "India's official citizen health record portal under Ayushman Bharat Digital Mission. Empowering every Indian with their health data."}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
              ISO 27001
            </span>
            <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
              DPDP 2023
            </span>
            <span style={{ background: 'rgba(232,99,26,0.25)', color: '#FBA07A', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
              NHA Certified
            </span>
          </div>
        </div>

        {/* Col 2 */}
        <div className="footer-col">
          <h6>{isHi ? 'आपातकालीन एवं नागरिक सहायता' : 'Emergency & Citizen Support'}</h6>
          <ul style={{ marginTop: '6px', listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '5px' }}>
              📞 <strong>1075</strong> — {isHi ? 'NDHM हेल्पलाइन (टोल-फ्री)' : 'NDHM Helpline (Toll-Free)'}
            </li>
            <li style={{ marginBottom: '5px' }}>
              📞 <strong>1800-11-4477</strong> — {isHi ? 'आयुष्मान हेल्पलाइन' : 'Ayushman Helpline'}
            </li>
            <li style={{ marginBottom: '5px' }}>
              ✉️ <a href="mailto:help@ayulekha.gov.in" style={{ color: 'rgba(255,255,255,0.65)' }}>help@ayulekha.gov.in</a>
            </li>
            <li>
              ⏰ {isHi ? '24×7, 365 दिन उपलब्ध' : 'Available 24×7, 365 days'}
            </li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="footer-col">
          <h6>{isHi ? 'मानक एवं शासन' : 'Standards & Governance'}</h6>
          <a href="#">{isHi ? 'ABDM फ्रेमवर्क' : 'ABDM Framework'}</a>
          <a href="#">{isHi ? 'DPDP अधिनियम 2023 अनुपालन' : 'DPDP Act 2023 Compliance'}</a>
          <a href="#">{isHi ? 'UIDAI आधार दिशानिर्देश' : 'UIDAI Aadhaar Guidelines'}</a>
          <a href="#">{isHi ? 'ISO/IEC 27001 प्रमाण पत्र' : 'ISO/IEC 27001 Certificate'}</a>
          <a href="#">{isHi ? 'NHA डिजिटल स्वास्थ्य मानक' : 'NHA Digital Health Standards'}</a>
        </div>

        {/* Col 4 */}
        <div className="footer-col">
          <h6>{isHi ? 'त्वरित लिंक' : 'Quick Links'}</h6>
          <a 
            href="#register" 
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('identity');
            }}
          >
            {isHi ? 'नागरिक पंजीकरण' : 'Citizen Registration'}
          </a>
          <a 
            href="#records" 
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('records');
            }}
          >
            {isHi ? 'स्वास्थ्य रिकॉर्ड्स' : 'Health Records'}
          </a>
          <a 
            href="#appointments" 
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('new-appointment');
            }}
          >
            {isHi ? 'निकटतम अस्पताल खोजें' : 'Find Nearby Hospital'}
          </a>
          <a href="#">{isHi ? 'गोपनीयता नीति' : 'Privacy Policy'}</a>
          <a href="#">{isHi ? 'सेवा की शर्तें' : 'Terms of Service'}</a>
        </div>
      </div>

      <div className="footer-bottom" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p>
          {isHi 
            ? '© 2025 AyuLekha | स्वास्थ्य एवं परिवार कल्याण मंत्रालय | राष्ट्रीय स्वास्थ्य प्राधिकरण, भारत सरकार'
            : '© 2025 AyuLekha | Ministry of Health & Family Welfare | National Health Authority, Govt. of India'}
        </p>
        <div className="footer-links">
          <a href="#">{isHi ? 'सुगम्यता' : 'Accessibility Statement'}</a>
          <a href="#">{isHi ? 'गोपनीयता' : 'Privacy Policy'}</a>
          <a href="#">{isHi ? 'नियम व शर्तें' : 'Terms of Service'}</a>
        </div>
      </div>
    </footer>
  );
}

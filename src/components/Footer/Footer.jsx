import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer({ onNavigate }) {
  const { t } = useLanguage();

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
            {t('siteFooter.missionText', "India's official citizen health record portal under Ayushman Bharat Digital Mission. Empowering every Indian with their health data.")}
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
          <h6>{t('siteFooter.supportHeading', 'Emergency & Citizen Support')}</h6>
          <ul style={{ marginTop: '6px', listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '5px' }}>
              📞 <strong>1075</strong> — {t('siteFooter.ndhmHelpline', 'NDHM Helpline (Toll-Free)')}
            </li>
            <li style={{ marginBottom: '5px' }}>
              📞 <strong>1800-11-4477</strong> — {t('siteFooter.ayushmanHelpline', 'Ayushman Helpline')}
            </li>
            <li style={{ marginBottom: '5px' }}>
              ✉️ <a href="mailto:help@ayulekha.gov.in" style={{ color: 'rgba(255,255,255,0.65)' }}>help@ayulekha.gov.in</a>
            </li>
            <li>
              ⏰ {t('siteFooter.available24x7', 'Available 24×7, 365 days')}
            </li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="footer-col">
          <h6>{t('siteFooter.standardsHeading', 'Standards & Governance')}</h6>
          <a href="#">{t('siteFooter.abdmFramework', 'ABDM Framework')}</a>
          <a href="#">{t('siteFooter.dpdpCompliance', 'DPDP Act 2023 Compliance')}</a>
          <a href="#">{t('siteFooter.uidaiGuidelines', 'UIDAI Aadhaar Guidelines')}</a>
          <a href="#">{t('siteFooter.isoCert', 'ISO/IEC 27001 Certificate')}</a>
          <a href="#">{t('siteFooter.nhaStandards', 'NHA Digital Health Standards')}</a>
        </div>

        {/* Col 4 */}
        <div className="footer-col">
          <h6>{t('siteFooter.quickLinksHeading', 'Quick Links')}</h6>
          <a 
            href="#register" 
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('identity');
            }}
          >
            {t('siteFooter.citizenReg', 'Citizen Registration')}
          </a>
          <a 
            href="#records" 
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('records');
            }}
          >
            {t('siteFooter.healthRec', 'Health Records')}
          </a>
          <a 
            href="#appointments" 
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('new-appointment');
            }}
          >
            {t('siteFooter.findHospital', 'Find Nearby Hospital')}
          </a>
          <a href="#">{t('siteFooter.privacyPolicy', 'Privacy Policy')}</a>
          <a href="#">{t('siteFooter.termsOfService', 'Terms of Service')}</a>
        </div>
      </div>

      <div className="footer-bottom" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p>
          {t('footer.copy', '© 2025 AyuLekha | Ministry of Health & Family Welfare | National Health Authority, Govt. of India')}
        </p>
        <div className="footer-links">
          <a href="#">{t('footer.status', 'Accessibility Statement')}</a>
          <a href="#">{t('footer.privacy', 'Privacy Policy')}</a>
          <a href="#">{t('footer.consent', 'Terms of Service')}</a>
        </div>
      </div>
    </footer>
  );
}

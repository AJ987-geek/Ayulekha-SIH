import { useLanguage } from '../../contexts/LanguageContext';
import './TimelineNav.css';

export default function TimelineNav({ currentStep, onNavigate }) {
  const { t } = useLanguage();

  const handleNavClick = (e, targetStep) => {
    e.preventDefault();
    if (onNavigate && targetStep) {
      onNavigate(targetStep);
    }
  };

  return (
    <div className="timeline-nav-container">
      <nav className="timeline-nav font-mono">
        <a 
          href="#" 
          className={`timeline-item ${currentStep === 'identity' ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, 'identity')}
        >
          {t('informedConsent.nav1')}
        </a>
        
        <a 
          href="#" 
          className={`timeline-item ${currentStep === 'consent' ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, 'consent')}
        >
          {t('informedConsent.nav2')}
        </a>
        
        <a 
          href="#" 
          className={`timeline-item ${currentStep === 'records' ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, 'records')}
        >
          {t('informedConsent.nav3')}
        </a>
        
        <a 
          href="#" 
          className={`timeline-item ${currentStep === 'story' ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, 'story')}
        >
          {t('informedConsent.nav4')}
        </a>
        
        <a 
          href="#" 
          className={`timeline-item ${currentStep === 'doctor' ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, 'doctor')}
        >
          {t('informedConsent.nav5')}
        </a>
      </nav>
    </div>
  );
}

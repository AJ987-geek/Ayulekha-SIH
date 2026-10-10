import { useLanguage } from '../../../contexts/LanguageContext';
import './RedFlagAlert.css';

export default function RedFlagAlert() {
  const { t } = useLanguage();

  return (
    <div className="redflag-section">
      <div className="redflag-card">
        <div className="redflag-left">
          <div className="redflag-icon-wrap">
            <span className="material-symbols-outlined">e911_emergency</span>
          </div>
          <div className="redflag-content">
            <div className="redflag-header font-mono">
              <span className="redflag-alert-title">{t('redFlagAlert.alertTitle')}</span>
              <span className="redflag-sep">•</span>
              <span className="redflag-sub">{t('redFlagAlert.subTitle')}</span>
            </div>
            <p className="redflag-title">
              {t('redFlagAlert.title')}
            </p>
            <p className="redflag-desc">
              {t('redFlagAlert.desc')}
            </p>
          </div>
        </div>

        <a className="redflag-cta" href="tel:01126588500">
          <span className="material-symbols-outlined">call</span>
          <span>{t('redFlagAlert.cta')}</span>
        </a>
      </div>
    </div>
  );
}

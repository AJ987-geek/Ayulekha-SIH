import { useLanguage } from '../../../contexts/LanguageContext';
import './HeroSection.css';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <div className="hero-section">
      <div className="hero-inner">
        {/* Telemetry Bar */}
        <div className="telemetry-bar">
          <div className="telemetry-left font-mono">
            <span className="telemetry-dot" />
            <span className="telemetry-title">{t('hero.telemetryTitle')}</span>
            <span className="telemetry-sep">/</span>
            <span className="telemetry-sub">{t('hero.session')}</span>
          </div>
          <div className="telemetry-right font-mono">
            <span className="telemetry-badge">ABDM M1·M2·M3</span>
            <span className="telemetry-sep">•</span>
            <span>{t('hero.systemLoad')}</span>
            <span className="telemetry-sep">•</span>
            <span className="telemetry-ok">{t('hero.queueNormal')}</span>
          </div>
        </div>

        {/* Hero Body */}
        <div className="hero-body">
          <div className="hero-content">
            <div className="auth-badge font-mono">
              <span className="material-symbols-outlined auth-badge-icon">verified_user</span>
              <span>{t('hero.authBadge')}</span>
            </div>

            <h1 className="hero-title">
              {t('hero.title')}
            </h1>

            <p className="hero-desc">
              {t('hero.desc')}
            </p>
          </div>

          <div className="campus-node">
            <div className="campus-node-card">
              <div className="campus-node-icon">
                <span className="material-symbols-outlined">domain</span>
              </div>
              <div>
                <span className="campus-node-label font-mono">{t('hero.campusLabel')}</span>
                <span className="campus-node-name">{t('hero.campusName')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useLanguage } from '../../contexts/LanguageContext';
import './Footer.css';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col">
            <span className="footer-col-label font-mono">{t('footer.abdmLabel')}</span>
            <p className="footer-col-text">
              {t('footer.abdmText')}
            </p>
          </div>
          <div className="footer-col">
            <span className="footer-col-label font-mono">{t('footer.nhaLabel')}</span>
            <p className="footer-col-text">
              {t('footer.nhaText')}
            </p>
          </div>
          <div className="footer-col">
            <span className="footer-col-label font-mono">{t('footer.securityLabel')}</span>
            <p className="footer-col-text">
              {t('footer.securityText')}
            </p>
          </div>
        </div>

        <div className="footer-bar">
          <span className="footer-copy font-mono">{t('footer.copy')}</span>
          <div className="footer-links font-mono">
            <a className="footer-link" href="#">{t('footer.privacy')}</a>
            <a className="footer-link" href="#">{t('footer.consent')}</a>
            <a className="footer-link" href="#">{t('footer.status')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

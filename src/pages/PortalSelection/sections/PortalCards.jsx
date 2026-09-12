import { useLanguage } from '../../../contexts/LanguageContext';
import './PortalCards.css';

export default function PortalCards({ activeRole, onRoleSwitch, onNavigate }) {
  const { t } = useLanguage();

  const CARDS = [
    {
      id: 'patient',
      icon: 'personal_injury',
      tag: t('portalCards.patient.tag'),
      tagClass: 'tag-aubergine',
      roleLabel: t('portalCards.patient.roleLabel'),
      title: t('portalCards.patient.title'),
      desc: t('portalCards.patient.desc'),
      features: [
        { label: t('portalCards.patient.f1') },
        { label: t('portalCards.patient.f2') },
        { label: t('portalCards.patient.f3') },
      ],
      featuresLabel: t('portalCards.patient.featuresLabel'),
      featuresIconColor: 'icon-secondary',
      btnLabel: t('portalCards.patient.btnLabel'),
      btnNote: t('portalCards.patient.btnNote'),
    },
    {
      id: 'doctor',
      icon: 'stethoscope',
      tag: t('portalCards.doctor.tag'),
      tagClass: 'tag-brass',
      roleLabel: t('portalCards.doctor.roleLabel'),
      title: t('portalCards.doctor.title'),
      desc: t('portalCards.doctor.desc'),
      features: [
        { label: t('portalCards.doctor.f1') },
        { label: t('portalCards.doctor.f2') },
        { label: t('portalCards.doctor.f3') },
      ],
      featuresLabel: t('portalCards.doctor.featuresLabel'),
      featuresIconColor: 'icon-tertiary',
      btnLabel: t('portalCards.doctor.btnLabel'),
      btnNote: t('portalCards.doctor.btnNote'),
    },
    {
      id: 'admin',
      icon: 'point_of_sale',
      tag: t('portalCards.admin.tag'),
      tagClass: 'tag-aubergine',
      roleLabel: t('portalCards.admin.roleLabel'),
      title: t('portalCards.admin.title'),
      desc: t('portalCards.admin.desc'),
      features: [
        { label: t('portalCards.admin.f1') },
        { label: t('portalCards.admin.f2') },
        { label: t('portalCards.admin.f3') },
      ],
      featuresLabel: t('portalCards.admin.featuresLabel'),
      featuresIconColor: 'icon-secondary',
      btnLabel: t('portalCards.admin.btnLabel'),
      btnNote: t('portalCards.admin.btnNote'),
    },
  ];

  return (
    <div className="portal-cards-section">
      <div className="portal-cards-grid">
        {CARDS.map((card) => {
          const isActive = activeRole === card.id;
          return (
            <div
              key={card.id}
              className={`portal-card ${isActive ? 'active' : ''}`}
              onClick={() => onRoleSwitch(card.id)}
            >
              {isActive && (
                <div className="card-active-badge font-mono">{t('portalCards.activeSelection')}</div>
              )}

              <div className="card-body">
                <div className="card-top-row">
                  <div className="card-icon">
                    <span className="material-symbols-outlined">{card.icon}</span>
                  </div>
                  <span className={`card-tag font-mono ${card.tagClass}`}>{card.tag}</span>
                </div>

                <div className="card-info">
                  <span className="card-role-label font-mono">{card.roleLabel}</span>
                  <h2 className="card-title">
                    {card.title}
                  </h2>
                  <p className="card-desc">
                    {card.desc}
                  </p>
                </div>

                <div className="card-features">
                  <span className="features-label font-mono">{card.featuresLabel}</span>
                  <ul className="features-list">
                    {card.features.map((f, i) => (
                      <li key={i} className="feature-item">
                        <span className={`material-symbols-outlined feature-icon ${card.featuresIconColor}`}>check_circle</span>
                        <div>
                          <span>{f.label}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card-footer">
                <button 
                  className={`card-btn ${isActive ? 'btn-active' : 'btn-inactive'}`} 
                  type="button"
                  onClick={(e) => {
                    if (card.id === 'patient' && onNavigate) {
                      e.stopPropagation();
                      onNavigate('triage');
                    }
                  }}
                >
                  <span>{card.btnLabel}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <span className="card-btn-note font-mono">{card.btnNote}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import './PortalCards.css';

const CARDS = [
  {
    id: 'patient',
    icon: 'personal_injury',
    tag: 'Self Check-in · स्वयं चेक-इन',
    tagClass: 'tag-aubergine',
    roleLabel: 'Role 01 · भूमिका ०१',
    title: 'Patient / Citizen',
    titleHindi: '(मरीज़ / नागरिक)',
    desc: 'Check in with ABHA, UHID, or mobile number. Provide symptoms while waiting.',
    descHindi: 'आभा (ABHA), यूएचआईडी या मोबाइल नंबर से चेक-इन करें।',
    features: [
      { en: 'ABHA ID / 14-digit OTP', hi: 'आभा संख्या / 14-अंकीय ओटीपी' },
      { en: '10-Digit Mobile Token', hi: '10-अंकीय मोबाइल टोकन' },
      { en: 'Scan QR on Printed OPD Slip', hi: 'मुद्रित पर्ची पर क्यूआर स्कैन करें' },
    ],
    featuresLabel: 'Fast Access Methods · त्वरित माध्यम',
    featuresIconColor: 'icon-secondary',
    btnLabel: 'Patient  / मरीज़ प्रवेश',
    btnNote: 'No password required · Instant OTP / पासवर्ड मुक्त',
  },
  {
    id: 'doctor',
    icon: 'stethoscope',
    tag: 'Clinical Consult & EHR',
    tagClass: 'tag-brass',
    roleLabel: 'Role 02 · Recommended',
    title: 'Doctor / Clinician',
    titleHindi: '(चिकित्सक / डॉक्टर)',
    desc: 'Review pre-consult briefs, voice intake summaries, and sign clinical discharge.',
    descHindi: 'परामर्श-पूर्व विवरण और वॉयस सारांश देखें।',
    features: [
      { en: 'NMC / State Council Digital ID', hi: null },
      { en: 'AIIMS Intranet Kerberos SSO', hi: null },
      { en: 'Smart Card / FIDO2 USB Token', hi: null },
    ],
    featuresLabel: 'Institutional Gateway · संस्थागत प्रवेश',
    featuresIconColor: 'icon-tertiary',
    btnLabel: 'Doctor Register / डॉक्टर प्रवेश',
    btnNote: 'NMC registry verification active · एनएमसी सत्यापित',
  },
  {
    id: 'admin',
    icon: 'point_of_sale',
    tag: 'Counter & Triage Dispatch',
    tagClass: 'tag-aubergine',
    roleLabel: 'Role 03 · भूमिका ०३',
    title: 'OPD Admin & Desk',
    titleHindi: '(ओपीडी व्यवस्थापक एवं डेस्क)',
    desc: 'Operate token generation, thermal slip printing, and room day-board.',
    descHindi: 'टोकन जनरेशन, थर्मल पर्ची प्रिंटिंग और डे-बोर्ड प्रबंधन।',
    features: [
      { en: 'Terminal Station Key & PIN', hi: null },
      { en: 'Biometric Fingerprint Scanner', hi: null },
      { en: 'Supervisor Handover Pass', hi: null },
    ],
    featuresLabel: 'Desk Hardware Auth · हार्डवेयर प्रमाणीकरण',
    featuresIconColor: 'icon-secondary',
    btnLabel: 'Admin Desk Sign In / एडमिन प्रवेश',
    btnNote: 'Restricted to AIIMS LAN subnet · केवल एम्स लैन',
  },
];

export default function PortalCards({ activeRole, onRoleSwitch }) {
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
                <div className="card-active-badge font-mono">Active Selection · चयनित</div>
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
                    <span className="card-title-hindi">{card.titleHindi}</span>
                  </h2>
                  <p className="card-desc">
                    {card.desc}
                    <span className="card-desc-hindi">{card.descHindi}</span>
                  </p>
                </div>

                <div className="card-features">
                  <span className="features-label font-mono">{card.featuresLabel}</span>
                  <ul className="features-list">
                    {card.features.map((f, i) => (
                      <li key={i} className="feature-item">
                        <span className={`material-symbols-outlined feature-icon ${card.featuresIconColor}`}>check_circle</span>
                        <div>
                          <span>{f.en}</span>
                          {f.hi && <span className="feature-hi">{f.hi}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card-footer">
                <button className={`card-btn ${isActive ? 'btn-active' : 'btn-inactive'}`} type="button">
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

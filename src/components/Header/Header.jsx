import './Header.css';

const TICKER = [
  'AIIMS New Delhi · Central OPD Gateway / Session 2025-26',
  'ABHA RE-ENROL',
  'SYSTEM (OPD) 4/5 ACTIVE',
  'DUTY CHARGE 01/16',
  'AIIMS New Delhi · Central OPD Gateway / Session 2025-26',
  'ABHA RE-ENROL',
  'SYSTEM (OPD) 4/5 ACTIVE',
  'DUTY CHARGE 01/16',
];

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <div className="header-logo">
          <div className="logo-icon font-mono">AYU</div>
          <div className="logo-text">
            <span className="name">AYULEKHA</span>
            <span className="sub font-mono">AIIMS OPD HEALTH PORTAL</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="header-nav font-mono">
          <a className="nav-link active" href="#">Patient Portal</a>
          <a className="nav-link" href="#">OPD Schedule</a>
          <a className="nav-link" href="#">Verify ABHA</a>
          <a className="nav-link" href="#">Clinical Guidelines</a>
        </nav>

        {/* Right */}
        <div className="header-right">
          <div className="emergency-badge font-mono">
            <span className="em-label">Emergency</span>
            <span className="em-num">011-26588500 / 102</span>
          </div>
          <div className="lang-switch font-mono">
            <button className="lang-btn active">EN</button>
            <button className="lang-btn">हिंदी</button>
          </div>
          <div className="user-avatar">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="ticker-bar font-mono">

        <div className="ticker-track">
          {TICKER.map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

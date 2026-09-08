import './HeroSection.css';

export default function HeroSection() {
  return (
    <div className="hero-section">
      <div className="hero-inner">
        {/* Telemetry Bar */}
        <div className="telemetry-bar">
          <div className="telemetry-left font-mono">
            <span className="telemetry-dot" />
            <span className="telemetry-title">AIIMS NEW DELHI · CENTRAL OPD GATEWAY</span>
            <span className="telemetry-sep">/</span>
            <span className="telemetry-sub">SESSION 2025–26</span>
          </div>
          <div className="telemetry-right font-mono">
            <span className="telemetry-badge">ABDM M1·M2·M3</span>
            <span className="telemetry-sep">•</span>
            <span>SYSTEM LOAD: 41%</span>
            <span className="telemetry-sep">•</span>
            <span className="telemetry-ok">QUEUE ENGINE NORMAL</span>
          </div>
        </div>

        {/* Hero Body */}
        <div className="hero-body">
          <div className="hero-content">
            <div className="auth-badge font-mono">
              <span className="material-symbols-outlined auth-badge-icon">verified_user</span>
              <span>Clinical Auth Protocol v4.8 · नैदानिक प्रमाणीकरण</span>
            </div>

            <h1 className="hero-title">
              Select your portal to continue.
              <span className="hero-title-hindi">जारी रखने के लिए अपना पोर्टल चुनें।</span>
            </h1>

            <p className="hero-desc">
              Unified AIIMS outpatient check-in, clinical EHR consultation narrative, and counter terminal administration system.
              <span className="hero-desc-hindi">एम्स ओपीडी चेक-इन, इलेक्ट्रॉनिक स्वास्थ्य परामर्श और काउंटर टर्मिनल प्रबंधन प्रणाली।</span>
            </p>
          </div>

          <div className="campus-node">
            <div className="campus-node-card">
              <div className="campus-node-icon">
                <span className="material-symbols-outlined">domain</span>
              </div>
              <div>
                <span className="campus-node-label font-mono">Active Campus Node</span>
                <span className="campus-node-name">Ansari Nagar West</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

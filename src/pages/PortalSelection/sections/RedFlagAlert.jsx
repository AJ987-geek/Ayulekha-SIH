import './RedFlagAlert.css';

export default function RedFlagAlert() {
  return (
    <div className="redflag-section">
      <div className="redflag-card">
        <div className="redflag-left">
          <div className="redflag-icon-wrap">
            <span className="material-symbols-outlined">e911_emergency</span>
          </div>
          <div className="redflag-content">
            <div className="redflag-header font-mono">
              <span className="redflag-alert-title">Clinical Red-Flag Alert · आपातकालीन चेतावनी</span>
              <span className="redflag-sep">•</span>
              <span className="redflag-sub">Immediate Life Support / जीवन रक्षा सहायता</span>
            </div>
            <p className="redflag-title">
              Experiencing acute chest pain, severe breathlessness, stroke symptoms, or sudden trauma?
              <span className="redflag-title-hindi">क्या सीने में तेज़ दर्द, सांस लेने में अत्यधिक कठिनाई, स्ट्रोक के लक्षण या अचानक गंभीर चोट है?</span>
            </p>
            <p className="redflag-desc">
              Do not wait for online check-in or regular OPD token calls. Proceed directly to{' '}
              <strong>Emergency Triage (Ground Floor, Gate 2)</strong>{' '}
              or contact immediate casualty response at{' '}
              <span className="font-mono redflag-num">011-26588500</span>{' '}
              /{' '}
              <span className="font-mono redflag-num">102</span>.
              <span className="redflag-desc-hindi">ऑनलाइन चेक-इन या कतार की प्रतीक्षा न करें। तुरंत आपातकालीन वार्ड (भूतल, गेट 2) जाएं।</span>
            </p>
          </div>
        </div>

        <a className="redflag-cta" href="tel:01126588500">
          <span className="material-symbols-outlined">call</span>
          <span>Call Casualty 24/7 (011-26588500 / 102)</span>
        </a>
      </div>
    </div>
  );
}

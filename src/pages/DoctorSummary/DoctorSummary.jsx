import './DoctorSummary.css';

export default function DoctorSummary({ summary, onComplete }) {
  const speak = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance('This patient-reported summary is now visible to the doctor.'));
  };
  return <main className="doctor-page">
    <header><strong>AyuLekha</strong><span>DOCTOR VIEW · TEMPORARY SESSION</span></header>
    <section className="doctor-summary">
      <div className="doctor-banner"><span>✓ PATIENT CONFIRMED</span><button onClick={speak}>🔊 Read privacy notice</button></div>
      <h1>Physician-ready history</h1><p className="disclaimer">Patient-reported information. Clinical assessment and diagnosis remain the physician’s responsibility.</p>
      <div className="summary-grid">
        <article><h2>Chief Complaint</h2><p>{summary.chiefComplaint}</p></article>
        <article><h2>History of Present Illness · SOCRATES</h2><p>{summary.hpi}</p></article>
        <article><h2>Past Medical History</h2><p>{summary.pastMedicalHistory}</p></article><article><h2>Family History</h2><p>{summary.familyHistory}</p></article>
        <article><h2>Social History</h2><p>{summary.socialHistory}</p></article><article><h2>Review of Systems</h2><p>{summary.reviewOfSystems}</p></article>
      </div>
      <section className="reasoning"><h2>Clinical note & triage indicators</h2><p>{summary.clinicalNote}</p>{summary.triageIndicators.map((item) => <p className="triage-flag" key={item}>⚠ {item}</p>)}</section>
      <button className="new-session" onClick={onComplete}>OK — erase & start next interview</button>
      <p className="erase-note">This action clears the in-memory summary and begins a new blank interview. No data is stored.</p>
    </section>
  </main>;
}

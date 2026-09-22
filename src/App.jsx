import { useState } from 'react';

import './index.css';
import { PatientProvider } from './contexts/PatientContext';

import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

import PortalSelection from './pages/PortalSelection/PortalSelection';
import RapidTriage from './pages/RapidTriage/RapidTriage';
import EmergencyActive from './pages/EmergencyActive/EmergencyActive';
import PatientIdentity from './pages/PatientIdentity/PatientIdentity';
import InformedConsent from './pages/InformedConsent/InformedConsent';
import YourStory from './pages/YourStory/YourStory';
import DoctorSummary from './pages/DoctorSummary/DoctorSummary';
import Records from './pages/Records/Records';
import Done from './pages/Done/Done';
import PatientDashboard from './pages/PatientDashboard/PatientDashboard';
import NewAppointment from './pages/NewAppointment/NewAppointment';
import DoctorRegistration from './pages/DoctorRegistration/DoctorRegistration';
import DoctorOnboarding from './pages/DoctorOnboarding/DoctorOnboarding';
import DoctorDashboard from './pages/DoctorDashboard/DoctorDashboard';

function AppRoutes() {
  const [currentPage, setCurrentPage] = useState('portal');
  const [pageProps, setPageProps] = useState({});

  const handleNavigate = (page, props = {}) => {
    setCurrentPage(page);
    setPageProps(props);
  };

  // -----------------------------------------
  // PATIENT IDENTITY
  // -----------------------------------------

  if (currentPage === 'identity') {
    return (
      <div className="app-shell">
        <PatientIdentity onNavigate={handleNavigate} />
      </div>
    );
  }

  // -----------------------------------------
  // CONSENT
  // -----------------------------------------

  if (currentPage === 'consent') {
    return (
      <div className="app-shell">
        <InformedConsent
          onNavigate={handleNavigate}
          email={pageProps.email}
          patientId={pageProps.patientId}
          patient={pageProps.patient}
          medicalHistory={pageProps.medicalHistory}
        />
      </div>
    );
  }

  // -----------------------------------------
  // EMERGENCY
  // -----------------------------------------

  if (currentPage === 'emergency') {
    return (
      <div className="app-shell">
        <EmergencyActive symptoms={pageProps.symptoms} />
      </div>
    );
  }

  // -----------------------------------------
  // YOUR STORY
  // -----------------------------------------

  if (currentPage === 'story') {
    return (
      <div className="app-shell">
        <YourStory
          onNavigate={handleNavigate}
          email={pageProps.email}
          patientId={pageProps.patientId}
        />
      </div>
    );
  }

  // -----------------------------------------
  // DOCTOR SUMMARY
  // -----------------------------------------

  if (currentPage === 'doctor') {
    return (
      <div className="app-shell">
        <DoctorSummary
          summary={pageProps.summary}
          patientId={pageProps.patientId}
          onComplete={() => handleNavigate('identity')}
        />
      </div>
    );
  }

  // -----------------------------------------
  // RECORDS
  // -----------------------------------------

  if (currentPage === 'records') {
    return (
      <div className="app-shell">
        <Records
          onNavigate={handleNavigate}
          email={pageProps.email}
          patientId={pageProps.patientId}
        />
      </div>
    );
  }

  // -----------------------------------------
  // DONE
  // -----------------------------------------

  if (currentPage === 'done') {
    return (
      <div className="app-shell">
        <Done onNavigate={handleNavigate} />
      </div>
    );
  }

  // -----------------------------------------
  // PATIENT DASHBOARD
  // -----------------------------------------

  if (currentPage === 'dashboard') {
    return (
      <div className="app-shell">
        <PatientDashboard onNavigate={handleNavigate} />
      </div>
    );
  }

  // -----------------------------------------
  // NEW APPOINTMENT
  // -----------------------------------------

  if (currentPage === 'new-appointment') {
    return (
      <div className="app-shell">
        <NewAppointment onNavigate={handleNavigate} />
      </div>
    );
  }

  // -----------------------------------------
  // DOCTOR REGISTRATION
  // -----------------------------------------

  if (currentPage === 'doctor-registration') {
    return (
      <div className="app-shell">
        <DoctorRegistration onNavigate={handleNavigate} />
      </div>
    );
  }

  // -----------------------------------------
  // DOCTOR ONBOARDING
  // -----------------------------------------

  if (currentPage === 'doctor-onboarding') {
    return (
      <div className="app-shell">
        <DoctorOnboarding onNavigate={handleNavigate} />
      </div>
    );
  }

  // -----------------------------------------
  // DOCTOR DASHBOARD
  // -----------------------------------------

  if (currentPage === 'doctor-dashboard') {
    return (
      <div className="app-shell">
        <DoctorDashboard onNavigate={handleNavigate} />
      </div>
    );
  }

  // -----------------------------------------
  // RAPID TRIAGE
  // -----------------------------------------

  if (currentPage === 'triage') {
    return (
      <div className="app-shell">
        <RapidTriage onNavigate={handleNavigate} />
      </div>
    );
  }

  // -----------------------------------------
  // DEFAULT / PORTAL
  // -----------------------------------------

  return (
    <div className="app-shell">
      <Header />
      <PortalSelection onNavigate={handleNavigate} />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <PatientProvider>
      <AppRoutes />
    </PatientProvider>
  );
}

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

  if (currentPage === 'identity') {
    return (
      <div className="app-shell">
        <PatientIdentity onNavigate={handleNavigate} />
      </div>
    );
  }

 if (currentPage === 'consent') {
  return (
    <div className="app-shell">
      <InformedConsent
        onNavigate={handleNavigate}
        email={pageProps.email}
      />
    </div>
  );
}

  if (currentPage === 'emergency') {
    return (
      <div className="app-shell">
        <EmergencyActive symptoms={pageProps.symptoms} />
      </div>
    );
  }

  if (currentPage === 'story') {
    return (
      <div className="app-shell">
        <YourStory onNavigate={handleNavigate} />
      </div>
    );
  }

  if (currentPage === 'doctor') {
    return (
      <div className="app-shell">
        <DoctorSummary summary={pageProps.summary} onComplete={() => handleNavigate('records')} />
      </div>
    );
  }

  if (currentPage === 'records') {
    return (
      <div className="app-shell">
        <Records onNavigate={handleNavigate} />
      </div>
    );
  }

  if (currentPage === 'done') {
    return (
      <div className="app-shell">
        <Done onNavigate={handleNavigate} />
      </div>
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <div className="app-shell">
        <PatientDashboard onNavigate={handleNavigate} />
      </div>
    );
  }

  if (currentPage === 'new-appointment') {
    return (
      <div className="app-shell">
        <NewAppointment onNavigate={handleNavigate} />
      </div>
    );
  }

  if (currentPage === 'doctor-registration') {
    return (
      <div className="app-shell">
        <DoctorRegistration onNavigate={handleNavigate} />
      </div>
    );
  }

  if (currentPage === 'doctor-onboarding') {
    return (
      <div className="app-shell">
        <DoctorOnboarding onNavigate={handleNavigate} />
      </div>
    );
  }

  if (currentPage === 'doctor-dashboard') {
    return (
      <div className="app-shell">
        <DoctorDashboard onNavigate={handleNavigate} />
      </div>
    );
  }

  if (currentPage === 'triage') {
    return (
      <div className="app-shell">
        <RapidTriage onNavigate={handleNavigate} />
      </div>
    );
  }

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

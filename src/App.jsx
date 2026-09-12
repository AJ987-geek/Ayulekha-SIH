import { useState } from 'react';
import './index.css';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import PortalSelection from './pages/PortalSelection/PortalSelection';
import RapidTriage from './pages/RapidTriage/RapidTriage';
import EmergencyActive from './pages/EmergencyActive/EmergencyActive';
import PatientIdentity from './pages/PatientIdentity/PatientIdentity';
import InformedConsent from './pages/InformedConsent/InformedConsent';
import YourStory from './pages/YourStory/YourStory';
import Records from './pages/Records/Records';
import Done from './pages/Done/Done';

export default function App() {
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
        <InformedConsent onNavigate={handleNavigate} />
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

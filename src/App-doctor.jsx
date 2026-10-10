import { useState } from 'react';
import './styles/ayulekha-shared.css';
import './index.css';
import DoctorDashboard from './pages/DoctorDashboard/DoctorDashboard';
import PatientSummary from './pages/PatientSummary/PatientSummary';

function AppRoutes() {
  const [currentPage, setCurrentPage] = useState('doctor-dashboard');
  const [pageProps, setPageProps] = useState({});

  const handleNavigate = (page, props = {}) => {
    setCurrentPage(page);
    setPageProps(props);
  };

  if (currentPage === 'patient-summary') {
    return <PatientSummary onNavigate={handleNavigate} patientId={pageProps.patientId} />;
  }

  // DEFAULT
  return <DoctorDashboard onNavigate={handleNavigate} />;
}

export default function AppDoctor() {
  return (
    <AppRoutes />
  );
}

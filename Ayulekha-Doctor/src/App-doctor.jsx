import { useState } from 'react';
import './styles/ayulekha-shared.css';
import './index.css';
import DoctorDashboard from './pages/DoctorDashboard/DoctorDashboard';
import PatientSummary from './pages/PatientSummary/PatientSummary';
import DoctorAuthModal from './components/DoctorAuth/DoctorAuthModal';

function AppRoutes() {
  const [currentPage, setCurrentPage] = useState('doctor-dashboard');
  const [pageProps, setPageProps] = useState({});
  const [doctorLicense, setDoctorLicense] = useState(() => {
    return localStorage.getItem('ayulekha_doctor_license') || '';
  });
  const [doctorName, setDoctorName] = useState(() => {
    return localStorage.getItem('ayulekha_doctor_name') || '';
  });

  const handleNavigate = (page, props = {}) => {
    setCurrentPage(page);
    setPageProps(props);
  };

  const handleLicenseVerified = (credentials) => {
    if (typeof credentials === 'object' && credentials !== null) {
      setDoctorLicense(credentials.license || '');
      setDoctorName(credentials.doctorName || '');
    } else {
      setDoctorLicense(credentials || '');
    }
    setCurrentPage('doctor-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('ayulekha_doctor_license');
    localStorage.removeItem('ayulekha_doctor_name');
    setDoctorLicense('');
    setDoctorName('');
  };

  // Compulsory 5-digit license verification before moving to next page
  if (!doctorLicense || doctorLicense.length !== 5) {
    return <DoctorAuthModal onVerified={handleLicenseVerified} />;
  }

  if (currentPage === 'patient-summary') {
    return (
      <PatientSummary
        onNavigate={handleNavigate}
        patientId={pageProps.patientId}
        doctorLicense={doctorLicense}
        doctorName={doctorName}
        onLogout={handleLogout}
      />
    );
  }

  // DEFAULT DOCTOR DASHBOARD
  return (
    <DoctorDashboard
      onNavigate={handleNavigate}
      doctorLicense={doctorLicense}
      doctorName={doctorName}
      onLogout={handleLogout}
    />
  );
}

export default function AppDoctor() {
  return (
    <AppRoutes />
  );
}

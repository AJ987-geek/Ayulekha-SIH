import { useState } from 'react';
import HeroSection from './sections/HeroSection';
import PortalCards from './sections/PortalCards';
import InfoPanel from './sections/InfoPanel';
import './PortalSelection.css';

export default function PortalSelection() {
  const [activeRole, setActiveRole] = useState('patient');

  return (
    <main className="portal-main">
      <HeroSection />
      <PortalCards activeRole={activeRole} onRoleSwitch={setActiveRole} />
      <InfoPanel activeRole={activeRole} onRoleSwitch={setActiveRole} />
    </main>
  );
}

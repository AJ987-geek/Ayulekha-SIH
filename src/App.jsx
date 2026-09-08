import './index.css';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import PortalSelection from './pages/PortalSelection/PortalSelection';

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <PortalSelection />
      <Footer />
    </div>
  );
}

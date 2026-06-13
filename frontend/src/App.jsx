import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import ImpactDashboard from './pages/ImpactDashboard';
import Profile from './pages/Profile';

const AppContent = () => {
  const [activePage, setActivePage] = useState('home');
  const { user, loading } = useAuth();

  // Render the selected view conditionally
  const renderPage = () => {
    if (loading) {
      return (
        <div style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '80vh',
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          fontFamily: 'var(--font-display)',
        }}>
          <div>🌱 Initializing EcoConnect Ledger...</div>
        </div>
      );
    }

    switch (activePage) {
      case 'home':
        return <Home setActivePage={setActivePage} />;
      case 'login':
        return <Login setActivePage={setActivePage} />;
      case 'register':
        return <Register setActivePage={setActivePage} />;
      case 'impact':
        return <ImpactDashboard />;
      case 'dashboard':
        if (!user) {
          return <Login setActivePage={setActivePage} />;
        }
        return user.role === 'ngo' ? <NgoDashboard /> : <DonorDashboard />;
      case 'profile':
        if (!user) {
          return <Login setActivePage={setActivePage} />;
        }
        return <Profile />;
      default:
        return <Home setActivePage={setActivePage} />;
    }
  };

  return (
    <>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main style={{ minHeight: 'calc(100vh - 74px)' }}>
        {renderPage()}
      </main>
      
      {/* Visual Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '30px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        background: 'var(--bg)',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span>© 2026 EcoConnect Network. Open-Source Resource Sharing Initiative.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#privacy" style={{ hover: { color: '#fff' } }}>Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#github">GitHub Repository</a>
          </div>
        </div>
      </footer>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

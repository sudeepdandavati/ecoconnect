import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, LogOut, LogIn, User, BarChart2, Map, Clipboard } from 'lucide-react';

const Navbar = ({ activePage, setActivePage }) => {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '74px',
      background: 'rgba(9, 13, 16, 0.75)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 1000,
    }}>
      <div 
        onClick={() => setActivePage('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
        }}>
          <Leaf size={20} color="#0f172a" strokeWidth={2.5} />
        </div>
        <div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.25rem',
            background: 'linear-gradient(to right, #10b981, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
          }}>
            EcoConnect
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => setActivePage('home')}
          className={`btn btn-sm ${activePage === 'home' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Home
        </button>

        <button 
          onClick={() => setActivePage('impact')}
          className={`btn btn-sm ${activePage === 'impact' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BarChart2 size={16} />
          Impact
        </button>

        {user && (
          <>
            <button 
              onClick={() => setActivePage('dashboard')}
              className={`btn btn-sm ${activePage === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {user.role === 'ngo' ? (
                <>
                  <Map size={16} />
                  NGO Map
                </>
              ) : (
                <>
                  <Clipboard size={16} />
                  Donor Console
                </>
              )}
            </button>

            <button 
              onClick={() => setActivePage('profile')}
              className={`btn btn-sm ${activePage === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <User size={16} />
              Profile
            </button>
          </>
        )}

        <div style={{
          width: '1px',
          height: '24px',
          background: 'rgba(255, 255, 255, 0.1)',
          margin: '0 8px',
        }} />

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', display: 'none' /* Hide on mobile style */ }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
              <span style={{
                fontSize: '0.7rem',
                color: user.role === 'ngo' ? '#06b6d4' : '#10b981',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}>
                {user.role}
              </span>
            </div>
            <button 
              onClick={() => {
                logout();
                setActivePage('home');
              }}
              className="btn btn-sm btn-danger"
              title="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActivePage('login')}
              className="btn btn-sm btn-primary"
            >
              <LogIn size={16} />
              Login
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

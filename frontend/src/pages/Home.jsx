import React, { useState, useEffect } from 'react';
import { Leaf, Users, Heart, ArrowRight, ShieldCheck, Milestone, Share2, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = ({ setActivePage }) => {
  const { user, API_URL } = useAuth();
  const [stats, setStats] = useState({
    totalWeight: 0,
    co2Saved: 0,
    totalPeopleHelped: 0,
    donorCount: 0,
    ngoCount: 0,
  });

  // Fetch real platform-wide stats on load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats`);
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Error fetching landing stats:', err);
      }
    };
    fetchStats();
  }, [API_URL]);

  return (
    <div className="container page">
      {/* Hero Section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '40px',
        textAlign: 'center',
        padding: '60px 0 40px 0',
        position: 'relative',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#34d399',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '24px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}>
            <Globe size={14} />
            <span>SDGs 2, 11, 12, 13 & 17 Compliant</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
            lineHeight: 1.1,
            marginBottom: '20px',
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(to bottom, #ffffff 30%, #e2e8f0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Bridging Surplus Food with <span style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Sustainable Care</span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-muted)',
            marginBottom: '36px',
            lineHeight: 1.7,
            maxWidth: '680px',
            margin: '0 auto 36px auto',
          }}>
            EcoConnect is a resource sharing ecosystem matching hotels, food businesses, and households with local NGOs to redirect edible surplus and curb carbon emissions.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            {user ? (
              <button 
                onClick={() => setActivePage('dashboard')}
                className="btn btn-primary btn-lg"
              >
                Go to Dashboard
                <ArrowRight size={18} />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setActivePage('login')}
                  className="btn btn-primary btn-lg"
                >
                  Join as Donor / NGO
                  <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => setActivePage('impact')}
                  className="btn btn-secondary btn-lg"
                >
                  View Live Impact
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Quick Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        margin: '40px 0 60px 0',
      }}>
        <div className="card pulse-glow" style={{ textAlign: 'center', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(18, 24, 31, 0.7) 100%)' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)', display: 'block' }}>
            {stats.totalWeight ? `${stats.totalWeight.toLocaleString()} kg` : '0 kg'}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Food Saved from Landfills</span>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#22d3ee', fontFamily: 'var(--font-display)', display: 'block' }}>
            {stats.totalPeopleHelped ? stats.totalPeopleHelped.toLocaleString() : '0'}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>People Nourished</span>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-display)', display: 'block' }}>
            {stats.co2Saved ? `${stats.co2Saved.toLocaleString()} kg` : '0 kg'}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>CO2 Emissions Avoided</span>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#a7f3d0', fontFamily: 'var(--font-display)', display: 'block' }}>
            {(stats.donorCount + stats.ngoCount) || '0'}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Partner Organizations</span>
        </div>
      </section>

      {/* Feature Focus */}
      <section style={{ padding: '40px 0' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          marginBottom: '40px',
          fontFamily: 'var(--font-display)',
        }}>
          How EcoConnect Works
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '28px',
        }}>
          <div className="card">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'grid', placeItems: 'center', marginBottom: '20px', color: 'var(--primary)' }}>
              <Leaf size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#fff' }}>1. List Surplus</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Restaurants, hostlers, and households log leftover meals or groceries with quantities, food type, and expiry times.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', display: 'grid', placeItems: 'center', marginBottom: '20px', color: '#06b6d4' }}>
              <Share2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#fff' }}>2. Live Match Map</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              NGOs see nearby listings on an interactive map. They claim donations instantly, securing an agreement to pick up the food.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'grid', placeItems: 'center', marginBottom: '20px', color: '#f59e0b' }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#fff' }}>3. Distribute & Track</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              NGOs pick up and feed communities, logging metrics. The platform converts weight into offset statistics to gamify leaderboards!
            </p>
          </div>
        </div>
      </section>

      {/* Sustainable Goals Alignment */}
      <section className="card" style={{
        marginTop: '60px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', color: '#fff', fontFamily: 'var(--font-display)' }}>
            Aligned with UN SDGs
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '20px' }}>
            EcoConnect directly drives global actions towards Zero Hunger (SDG 2) and Climate Action (SDG 13). By transforming waste into food securities, we facilitate resilient communities.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <ShieldCheck size={16} /> SDG 2: Zero Hunger
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <ShieldCheck size={16} /> SDG 11: Sustainable Cities
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <ShieldCheck size={16} /> SDG 12: Responsible Consum.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <ShieldCheck size={16} /> SDG 13: Climate Action
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}>
          {/* Mock graphics/Grid of SDG blocks */}
          <div style={{ background: '#d97706', color: 'white', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100px', fontWeight: 'bold' }}>
            <span style={{ fontSize: '1.5rem' }}>2</span>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Zero Hunger</span>
          </div>
          <div style={{ background: '#f59e0b', color: 'white', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100px', fontWeight: 'bold' }}>
            <span style={{ fontSize: '1.5rem' }}>11</span>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Sustainable Cities</span>
          </div>
          <div style={{ background: '#eab308', color: 'white', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100px', fontWeight: 'bold' }}>
            <span style={{ fontSize: '1.5rem' }}>12</span>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Responsible Consum.</span>
          </div>
          <div style={{ background: '#15803d', color: 'white', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100px', fontWeight: 'bold', gridColumn: 'span 2' }}>
            <span style={{ fontSize: '1.5rem' }}>13</span>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Climate Action</span>
          </div>
          <div style={{ background: '#1e3a8a', color: 'white', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100px', fontWeight: 'bold' }}>
            <span style={{ fontSize: '1.5rem' }}>17</span>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Partnerships</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import { UserPlus, Mail, Lock, User, Phone, MapPin } from 'lucide-react';

const Register = ({ setActivePage }) => {
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor',
    phone: '',
    address: '',
    latitude: 12.9716,
    longitude: 77.5946,
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = (lat, lng, address) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.address) {
      setError('Please fill in all required fields (Name, Email, Password, Address)');
      return;
    }

    const res = await register(formData);
    if (res.success) {
      setActivePage('dashboard');
    } else {
      setError(res.message || 'Registration failed.');
    }
  };

  return (
    <div className="container page" style={{ display: 'grid', placeItems: 'center', minHeight: '80vh', paddingBottom: '80px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '540px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--primary)',
            marginBottom: '14px',
          }}>
            <UserPlus size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', fontFamily: 'var(--font-display)' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join as a food donor or NGO partner</p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">Register As</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                className={`btn ${formData.role === 'donor' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData({ ...formData, role: 'donor' })}
              >
                🥗 Food Donor
              </button>
              <button
                type="button"
                className={`btn ${formData.role === 'ngo' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData({ ...formData, role: 'ngo' })}
              >
                🏢 NGO / Volunteer
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name / Org Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  placeholder="e.g. Grand Plaza Hotel"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  name="phone"
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                name="email"
                className="form-input"
                style={{ paddingLeft: '42px' }}
                placeholder="contact@org.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password * (Min 6 chars)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                name="password"
                className="form-input"
                style={{ paddingLeft: '42px' }}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address / Landmark *</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                name="address"
                className="form-input"
                style={{ paddingLeft: '42px' }}
                placeholder="Street address, city"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Map Location Picker */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Confirm Location coordinates</label>
            <MapPicker
              defaultCoords={{ lat: formData.latitude, lng: formData.longitude }}
              onLocationSelect={handleLocationSelect}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Already have an account? </span>
          <button
            onClick={() => setActivePage('login')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Login here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;

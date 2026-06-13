import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import { User, Phone, MapPin, Mail, Lock, Check } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    latitude: user?.latitude || 12.9716,
    longitude: user?.longitude || 77.5946,
    password: '',
  });

  const [message, setMessage] = useState('');
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
    setMessage('');
    setError('');

    if (!formData.name || !formData.address) {
      setError('Name and Address are required.');
      return;
    }

    const res = await updateProfile(formData);
    if (res.success) {
      setMessage('Profile details updated successfully! Base settings saved.');
      // Clear password field
      setFormData(prev => ({ ...prev, password: '' }));
    } else {
      setError(res.message || 'Profile update failed.');
    }
  };

  return (
    <div className="container page" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#fff', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
          My Account Profile
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Manage your organizational contacts and default pickup/delivery mapping base.
        </p>

        {message && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Check size={16} /> {message}
          </div>
        )}

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Name / Org Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
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
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Read-only)</label>
            <div style={{ position: 'relative', opacity: 0.7 }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '42px', cursor: 'not-allowed' }}
                value={user?.email || ''}
                readOnly
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">New Password (Leave blank to keep current)</label>
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
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Address / Base Location</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                name="address"
                className="form-input"
                style={{ paddingLeft: '42px' }}
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Adjust Registered Coordinates base</label>
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
            {loading ? 'Saving updates...' : 'Save Profile Base'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Check, X, AlertTriangle, MessageSquare, Phone } from 'lucide-react';

// Distance calculation using Haversine formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const DonationCard = ({ donation, user, onClaim, onComplete, onCancel, onChatOpen }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // Expiration countdown effect
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(donation.expiryTime) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      let text = '';
      if (hours > 0) text += `${hours}h `;
      text += `${minutes}m left`;
      setTimeLeft(text);
      setIsExpired(false);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [donation.expiryTime]);

  const distance = getDistance(
    user?.latitude,
    user?.longitude,
    donation.latitude,
    donation.longitude
  );

  const getStatusBadge = () => {
    switch (donation.status) {
      case 'available':
        return <span className="badge badge-available">Available</span>;
      case 'requested':
      case 'accepted':
        return <span className="badge badge-requested">Claimed</span>;
      case 'completed':
        return <span className="badge badge-completed">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return null;
    }
  };

  const getFoodTypeBadge = () => {
    switch (donation.foodType) {
      case 'Veg':
        return <span className="badge badge-veg">Veg</span>;
      case 'Non-Veg':
        return <span className="badge badge-nonveg">Non-Veg</span>;
      case 'Vegan':
        return <span className="badge badge-vegan">Vegan</span>;
      default:
        return null;
    }
  };

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '16px',
      height: '100%',
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          {getFoodTypeBadge()}
          {getStatusBadge()}
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {donation.foodName}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            📦 <b>Qty:</b> {donation.quantity}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⚖️ <b>Weight:</b> {donation.weightKg} kg
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isExpired && donation.status === 'available' ? 'var(--danger)' : 'var(--text-muted)' }}>
            <Clock size={15} />
            <span>
              {donation.status === 'completed' ? (
                `Completed: ${new Date(donation.completedAt).toLocaleDateString()}`
              ) : (
                <>Expires: {new Date(donation.expiryTime).toLocaleDateString()} ({timeLeft})</>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-muted)' }}>
            <MapPin size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span>{donation.address}</span>
              {distance !== null && (
                <span style={{ display: 'block', color: 'var(--secondary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '2px' }}>
                  📍 {distance.toFixed(1)} km away
                </span>
              )}
            </div>
          </div>
        </div>

        {/* User Specific Contacts if claimed/accepted */}
        {donation.status === 'requested' && (
          <div style={{
            marginTop: '12px',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '6px',
            border: '1px solid var(--surface-border)',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            {user.role === 'donor' && donation.claimedBy && (
              <>
                <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>Claimed by NGO:</div>
                <div>🏢 {donation.claimedBy.name}</div>
                {donation.claimedBy.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} /> {donation.claimedBy.phone}
                  </div>
                )}
              </>
            )}
            {user.role === 'ngo' && donation.donor && (
              <>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Donor Details:</div>
                <div>🏢 {donation.donor.name}</div>
                {donation.donor.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} /> {donation.donor.phone}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {donation.status === 'completed' && donation.peopleHelped > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            borderRadius: '6px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '0.8rem',
            color: '#a7f3d0',
            fontWeight: 500,
          }}>
            🎉 Saved {donation.weightKg} kg of food and helped {donation.peopleHelped} people!
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        {user?.role === 'ngo' && donation.status === 'available' && !isExpired && (
          <button 
            onClick={() => onClaim(donation._id)}
            className="btn btn-primary btn-sm"
            style={{ width: '100%' }}
          >
            Claim Donation
          </button>
        )}

        {user?.role === 'ngo' && donation.status === 'requested' && (
          <>
            <button 
              onClick={() => onComplete(donation._id)}
              className="btn btn-primary btn-sm"
              style={{ flex: 2 }}
            >
              <Check size={14} /> Complete
            </button>
            <button 
              onClick={() => onChatOpen(donation)}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1.5 }}
              title="Chat Coordinator"
            >
              <MessageSquare size={14} /> Chat
            </button>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${donation.latitude},${donation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              title="Navigate to pickup"
            >
              🗺️ Directions
            </a>
            <button 
              onClick={() => onCancel(donation._id)}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              title="Release claim"
            >
              Release
            </button>
          </>
        )}

        {user?.role === 'donor' && donation.status === 'available' && (
          <button 
            onClick={() => onCancel(donation._id)}
            className="btn btn-danger btn-sm"
            style={{ width: '100%' }}
          >
            Cancel Listing
          </button>
        )}

        {user?.role === 'donor' && donation.status === 'requested' && (
          <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => onComplete(donation._id)}
              className="btn btn-primary btn-sm"
              style={{ flex: 2 }}
            >
              Confirm Handover
            </button>
            <button 
              onClick={() => onChatOpen(donation)}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1.5 }}
            >
              <MessageSquare size={14} /> Chat
            </button>
            <button 
              onClick={() => onCancel(donation._id)}
              className="btn btn-danger btn-sm"
              style={{ padding: '6px 10px' }}
              title="Cancel Listing"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationCard;

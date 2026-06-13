import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import DonationCard from '../components/DonationCard';
import Modal from '../components/Modal';
import ChatPanel from '../components/ChatPanel';
import { PlusCircle, ClipboardList, CheckCircle2, Leaf, Heart, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const DonorDashboard = () => {
  const { user, authFetch, showToast, socket } = useAuth();
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    foodName: '',
    quantity: '',
    weightKg: '',
    foodType: 'Veg',
    expiryTime: '',
    address: user?.address || '',
    latitude: user?.latitude || 12.9716,
    longitude: user?.longitude || 77.5946,
  });

  // Complete handover modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState(null);
  const [peopleHelpedInput, setPeopleHelpedInput] = useState('10');
  const [chatDonation, setChatDonation] = useState(null);

  // Trigger loading donor listings
  const fetchListings = async () => {
    try {
      setLoadingListings(true);
      const res = await authFetch('/donations');
      if (res.success) {
        setListings(res.data);
      }
    } catch (err) {
      console.error('Error fetching donor listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    fetchListings();
    
    // Set default expiry time to 4 hours from now
    const now = new Date();
    now.setHours(now.getHours() + 4);
    const tzoffset = now.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(now - tzoffset)).toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, expiryTime: localISOTime }));
  }, []);

  // Handle WebSockets claims/releases in real-time
  useEffect(() => {
    if (!socket) return;

    const handleClaimed = (claimedDonation) => {
      setListings((prev) =>
        prev.map((item) => (item._id === claimedDonation._id ? claimedDonation : item))
      );
    };

    const handleReleased = (data) => {
      setListings((prev) =>
        prev.map((item) =>
          item._id === data.donationId
            ? { ...item, status: 'available', claimedBy: null, claimedAt: null }
            : item
        )
      );
    };

    socket.on('donationClaimed', handleClaimed);
    socket.on('donationReleased', handleReleased);

    return () => {
      socket.off('donationClaimed', handleClaimed);
      socket.off('donationReleased', handleReleased);
    };
  }, [socket]);

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

  // Submit new food donation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.foodName || !formData.quantity || !formData.expiryTime || !formData.address) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      const res = await authFetch('/donations', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        showToast('Food donation listed successfully! 🌱');
        
        // Reset form name/qty, keep address/coords
        setFormData(prev => ({
          ...prev,
          foodName: '',
          quantity: '',
          weightKg: '',
        }));

        fetchListings();
      } else {
        showToast(res.message || 'Failed to list donation', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'error');
    }
  };

  // Open modal to confirm handover
  const openCompleteModal = (id) => {
    setSelectedDonationId(id);
    const donation = listings.find(l => l._id === id);
    // Rough estimate: 1kg = 2.5 meals/people helped
    const estimate = Math.ceil((donation?.weightKg || 1) * 2.5);
    setPeopleHelpedInput(estimate.toString());
    setIsModalOpen(true);
  };

  // Confirm Handover complete
  const handleConfirmComplete = async () => {
    try {
      const res = await authFetch(`/donations/${selectedDonationId}/complete`, {
        method: 'PUT',
        body: JSON.stringify({ peopleHelped: peopleHelpedInput }),
      });

      if (res.success) {
        setIsModalOpen(false);
        showToast('Donation completed! Thank you for making a difference. ❤️');
        
        // Trigger celebratory canvas-confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        fetchListings();
      } else {
        showToast(res.message || 'Failed to complete donation', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error completing donation', 'error');
    }
  };

  // Cancel listing
  const handleCancelListing = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this food listing?')) return;
    try {
      const res = await authFetch(`/donations/${id}/cancel`, {
        method: 'PUT',
      });

      if (res.success) {
        showToast('Listing cancelled successfully');
        fetchListings();
      } else {
        showToast(res.message || 'Failed to cancel listing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error cancelling listing', 'error');
    }
  };

  const activeDonations = listings.filter(l => l.status !== 'completed' && l.status !== 'cancelled');
  const pastDonations = listings.filter(l => l.status === 'completed' || l.status === 'cancelled');

  return (
    <div className="container page">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Left Side: Create Listing form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <PlusCircle size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.4rem', color: '#fff', fontFamily: 'var(--font-display)' }}>List Surplus Food</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Food Title / Item *</label>
              <input
                type="text"
                name="foodName"
                className="form-input"
                placeholder="e.g. Cooked rice, Bread rolls, Sandwich box"
                value={formData.foodName}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Quantity description *</label>
                <input
                  type="text"
                  name="quantity"
                  className="form-input"
                  placeholder="e.g. 15 meals, 3 big bowls, 5kg"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weight Estimate (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  name="weightKg"
                  className="form-input"
                  placeholder="e.g. 4.5"
                  value={formData.weightKg}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Food Type Selector */}
            <div className="form-group">
              <label className="form-label">Food Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['Veg', 'Non-Veg', 'Vegan'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`btn btn-sm ${formData.foodType === type ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFormData({ ...formData, foodType: type })}
                  >
                    {type === 'Veg' ? '🟢 Veg' : type === 'Non-Veg' ? '🔴 Non-Veg' : '🟡 Vegan'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Expiry Date & Time *</label>
              <input
                type="datetime-local"
                name="expiryTime"
                className="form-input"
                value={formData.expiryTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pickup Address *</label>
              <input
                type="text"
                name="address"
                className="form-input"
                placeholder="Street address for collection"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Select Precise Coordinate Pin</label>
              <MapPicker
                defaultCoords={{ lat: formData.latitude, lng: formData.longitude }}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              🌱 List Food Donation
            </button>
          </form>
        </div>

        {/* Right Side: Active Listings and History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Active Listings panel */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <ClipboardList size={22} color="var(--secondary)" />
              <h2 style={{ fontSize: '1.4rem', color: '#fff', fontFamily: 'var(--font-display)' }}>Active Donations</h2>
            </div>

            {loadingListings ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading active listings...</div>
            ) : activeDonations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                You have no active listings. Create one to support the community!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {activeDonations.map(donation => (
                  <DonationCard
                    key={donation._id}
                    donation={donation}
                    user={user}
                    onComplete={openCompleteModal}
                    onCancel={handleCancelListing}
                    onChatOpen={(d) => setChatDonation(d)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past/Completed listings */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <CheckCircle2 size={22} color="var(--primary)" />
              <h2 style={{ fontSize: '1.4rem', color: '#fff', fontFamily: 'var(--font-display)' }}>Completed History</h2>
            </div>

            {loadingListings ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
            ) : pastDonations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>No completed listings yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pastDonations.map(donation => (
                  <div 
                    key={donation._id}
                    style={{
                      padding: '14px 20px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{donation.foodName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Qty: {donation.quantity} • {new Date(donation.expiryTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      {donation.status === 'completed' ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          ❤️ Helped {donation.peopleHelped}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Food Handover"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Confirm that the NGO partner has successfully picked up the food. Record the number of people this batch is estimated to feed.
          </p>

          <div className="form-group">
            <label className="form-label">Estimated Number of People Helped *</label>
            <input
              type="number"
              className="form-input"
              value={peopleHelpedInput}
              onChange={(e) => setPeopleHelpedInput(e.target.value)}
              required
              min="1"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              onClick={handleConfirmComplete}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Handover Completed
            </button>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Chat Coordination Modal */}
      <Modal
        isOpen={!!chatDonation}
        onClose={() => setChatDonation(null)}
        title={`Coordination Chat: ${chatDonation?.foodName}`}
      >
        {chatDonation && (
          <ChatPanel 
            donationId={chatDonation._id}
            counterpartName={chatDonation.claimedBy?.name}
          />
        )}
      </Modal>
    </div>
  );
};

export default DonorDashboard;

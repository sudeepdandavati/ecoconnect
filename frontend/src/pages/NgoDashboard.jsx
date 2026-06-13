import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LeafletMap from '../components/LeafletMap';
import DonationCard from '../components/DonationCard';
import Modal from '../components/Modal';
import ChatPanel from '../components/ChatPanel';
import { Map, List, Truck, Heart, Search } from 'lucide-react';
import confetti from 'canvas-confetti';

// Haversine distance calculator
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const NgoDashboard = () => {
  const { user, authFetch, showToast, socket } = useAuth();
  
  const [allDonations, setAllDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [foodTypeFilter, setFoodTypeFilter] = useState('All');
  const [distanceFilter, setDistanceFilter] = useState(15); // max 15 km default
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI View State (Map vs List)
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'

  // Completion modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState(null);
  const [peopleHelpedInput, setPeopleHelpedInput] = useState('10');
  const [chatDonation, setChatDonation] = useState(null);

  // Load all listings
  const loadDonations = async () => {
    try {
      setLoading(true);
      // Fetch available listings with location search query params to trigger server-side geosort!
      const queryParams = user?.latitude && user?.longitude 
        ? `?lat=${user.latitude}&lng=${user.longitude}&maxDistance=${distanceFilter}`
        : '';
      const res = await authFetch(`/donations${queryParams}`);
      if (res.success) {
        setAllDonations(res.data);
      }
    } catch (err) {
      console.error('Error fetching donations for NGO:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, [distanceFilter]);

  // Handle Socket events for real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleNewDonation = (donation) => {
      // Append the new donation with all data
      setAllDonations((prev) => {
        if (prev.some((d) => d._id === donation._id)) return prev;
        return [donation, ...prev];
      });
    };

    const handleStatusChanged = (data) => {
      setAllDonations((prev) =>
        prev.map((d) =>
          d._id === data.donationId
            ? { ...d, status: data.status, peopleHelped: data.peopleHelped || d.peopleHelped }
            : d
        )
      );
    };

    socket.on('newDonation', handleNewDonation);
    socket.on('donationStatusChanged', handleStatusChanged);

    // If another NGO claims the item, update claimedBy
    socket.on('donationClaimed', (claimedDonation) => {
      setAllDonations((prev) =>
        prev.map((d) => (d._id === claimedDonation._id ? claimedDonation : d))
      );
    });

    return () => {
      socket.off('newDonation', handleNewDonation);
      socket.off('donationStatusChanged', handleStatusChanged);
      socket.off('donationClaimed');
    };
  }, [socket]);

  // Claim a donation
  const handleClaim = async (id) => {
    try {
      const res = await authFetch(`/donations/${id}/claim`, {
        method: 'PUT',
      });

      if (res.success) {
        showToast('Donation reserved successfully! Please coordinates pickup.');
        loadDonations();
      } else {
        showToast(res.message || 'Failed to claim donation', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error claiming donation', 'error');
    }
  };

  // Open complete popup
  const openCompleteModal = (id) => {
    setSelectedDonationId(id);
    const donation = allDonations.find(d => d._id === id);
    const estimate = Math.ceil((donation?.weightKg || 1) * 2.5);
    setPeopleHelpedInput(estimate.toString());
    setIsModalOpen(true);
  };

  // Complete pickup
  const handleConfirmComplete = async () => {
    try {
      const res = await authFetch(`/donations/${selectedDonationId}/complete`, {
        method: 'PUT',
        body: JSON.stringify({ peopleHelped: peopleHelpedInput }),
      });

      if (res.success) {
        setIsModalOpen(false);
        showToast('Pickup completed! Thank you for feeding the community.');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        loadDonations();
      } else {
        showToast(res.message || 'Failed to complete checkout', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error completing donation pickup', 'error');
    }
  };

  // Release claimed pickup
  const handleReleaseClaim = async (id) => {
    if (!window.confirm('Are you sure you want to release this claimed food? It will become available to other NGOs.')) return;
    try {
      const res = await authFetch(`/donations/${id}/cancel`, {
        method: 'PUT',
      });

      if (res.success) {
        showToast('Claim released');
        loadDonations();
      } else {
        showToast(res.message || 'Failed to release claim', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error releasing claim', 'error');
    }
  };

  // filter donations
  const availableDonations = allDonations.filter(d => {
    const isAvailable = d.status === 'available';
    const matchesFoodType = foodTypeFilter === 'All' || d.foodType === foodTypeFilter;
    
    // Distance filter
    const dist = getDistance(user?.latitude, user?.longitude, d.latitude, d.longitude);
    const matchesDistance = dist <= distanceFilter;

    // Search query matching
    const matchesSearch = d.foodName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.address.toLowerCase().includes(searchQuery.toLowerCase());

    return isAvailable && matchesFoodType && matchesDistance && matchesSearch;
  });

  const myClaimedPickups = allDonations.filter(d => d.status === 'requested' && d.claimedBy?._id === user?._id);

  return (
    <div className="container page">
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'flex-start', gridTemplateAreas: '"left right"' }} className="ngo-grid">
        
        {/* Left column: Map or Available Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#fff', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={18} color="var(--primary)" />
                  Find Surplus Food
                </h2>
              </div>
              
              {/* Toggle map/list */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setViewMode('map')} 
                  className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Map size={14} /> Map View
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <List size={14} /> List View
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '16px',
            }}>
              <div>
                <label className="form-label">Search</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search item or area..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Food Type</label>
                <select 
                  className="form-input form-select"
                  value={foodTypeFilter}
                  onChange={(e) => setFoodTypeFilter(e.target.value)}
                >
                  <option value="All">All Food Types</option>
                  <option value="Veg">🟢 Vegetarian</option>
                  <option value="Non-Veg">🔴 Non-Vegetarian</option>
                  <option value="Vegan">🟡 Vegan</option>
                </select>
              </div>

              <div>
                <label className="form-label">Distance: Within {distanceFilter} km</label>
                <input 
                  type="range" 
                  min="2" 
                  max="30" 
                  step="1"
                  className="form-input" 
                  style={{ padding: '0', background: 'transparent' }}
                  value={distanceFilter}
                  onChange={(e) => setDistanceFilter(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Main Visualizer */}
          {viewMode === 'map' ? (
            <div className="card" style={{ padding: '12px', height: '420px' }}>
              {loading ? (
                <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  Loading Leaflet Maps...
                </div>
              ) : (
                <LeafletMap 
                  donations={availableDonations} 
                  userCoords={{ lat: user?.latitude, lng: user?.longitude }}
                  onClaim={handleClaim}
                />
              )}
            </div>
          ) : (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Available Collections</h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading...</div>
              ) : availableDonations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  No available donations match your search parameters.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {availableDonations.map(donation => (
                    <DonationCard
                      key={donation._id}
                      donation={donation}
                      user={user}
                      onClaim={handleClaim}
                      onChatOpen={(d) => setChatDonation(d)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right column: NGO Claimed Pickups */}
        <div className="card" style={{ gridArea: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Truck size={22} color="var(--secondary)" />
            <h2 style={{ fontSize: '1.4rem', color: '#fff', fontFamily: 'var(--font-display)' }}>My Claimed Pickups</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading pickups...</div>
          ) : myClaimedPickups.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              border: '1px dashed rgba(255,255,255,0.06)',
              borderRadius: '12px',
            }}>
              📦 You have no claimed pickups. Claim a donation from the map or list!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myClaimedPickups.map(donation => (
                <DonationCard
                  key={donation._id}
                  donation={donation}
                  user={user}
                  onComplete={openCompleteModal}
                  onCancel={handleReleaseClaim}
                  onChatOpen={(d) => setChatDonation(d)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Complete pickup modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Pickup Delivery"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Confirm that the food has been collected and successfully distributed. Log the number of people who received a meal.
          </p>

          <div className="form-group">
            <label className="form-label">Beneficiary count (People Helped) *</label>
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
              Confirm Delivery
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

      {/* Chat Modal */}
      <Modal
        isOpen={!!chatDonation}
        onClose={() => setChatDonation(null)}
        title={`Coordination Chat: ${chatDonation?.foodName}`}
      >
        {chatDonation && (
          <ChatPanel 
            donationId={chatDonation._id}
            counterpartName={chatDonation.donor?.name}
          />
        )}
      </Modal>

      <style>{`
        @media (max-width: 960px) {
          .ngo-grid {
            grid-template-columns: 1fr;
            grid-template-areas: 
              "left"
              "right";
          }
        }
      `}</style>
    </div>
  );
};

export default NgoDashboard;

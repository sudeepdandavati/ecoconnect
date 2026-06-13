import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const LeafletMap = ({ donations, userCoords, onClaim }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroup = useRef(null);

  // Custom marker icon creator
  const createMarkerIcon = (color, emoji, pulse = false) => {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          position: relative;
          width: 36px;
          height: 36px;
        ">
          ${pulse ? `
            <div style="
              position: absolute;
              width: 48px;
              height: 48px;
              left: -6px;
              top: -6px;
              background-color: ${color};
              opacity: 0.35;
              border-radius: 50%;
              animation: map-ping 1.5s infinite ease-in-out;
              pointer-events: none;
            "></div>
          ` : ''}
          <div style="
            background-color: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
            transition: all 0.2s ease;
          ">
            <span style="
              transform: rotate(45deg);
              font-size: 18px;
              line-height: 1;
            ">${emoji}</span>
          </div>
        </div>
        <style>
          @keyframes map-ping {
            0% { transform: scale(0.6); opacity: 0.4; }
            100% { transform: scale(1.3); opacity: 0; }
          }
        </style>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Center map on user location or default (Bangalore)
    const centerLat = userCoords && userCoords.lat ? userCoords.lat : 12.9716;
    const centerLng = userCoords && userCoords.lng ? userCoords.lng : 77.5946;

    // Initialize map if not already initialized
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([centerLat, centerLng], 13);
      
      // Load OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance.current);

      markersGroup.current = L.layerGroup().addTo(mapInstance.current);
    } else {
      // If initialized, fly to the coordinates if they change
      mapInstance.current.setView([centerLat, centerLng], 13);
    }

    // Clean up
    return () => {
      // map remove is handled on unmount
    };
  }, [userCoords]);

  // Update markers when donations list changes
  useEffect(() => {
    if (!mapInstance.current || !markersGroup.current) return;

    // Clear existing markers
    markersGroup.current.clearLayers();

    // 1. Add User / NGO location marker
    if (userCoords && userCoords.lat && userCoords.lng) {
      const userMarker = L.marker([userCoords.lat, userCoords.lng], {
        icon: createMarkerIcon('#06b6d4', '🏠', false),
      });
      userMarker.bindPopup('<b style="color: #06b6d4;">Your Location</b><br/>My Registered Office / Current Center');
      markersGroup.current.addLayer(userMarker);
    }

    // 2. Add donation markers
    donations.forEach((donation) => {
      if (!donation.latitude || !donation.longitude) return;

      const isAvailable = donation.status === 'available';
      const isClaimedByMe = donation.status === 'requested'; // We only pass active claims or available to maps
      
      const pinColor = isAvailable ? '#10b981' : '#f59e0b';
      const pinEmoji = donation.foodType === 'Veg' ? '🟢' : donation.foodType === 'Non-Veg' ? '🔴' : '🟡';
      const pulse = isAvailable;

      const marker = L.marker([donation.latitude, donation.longitude], {
        icon: createMarkerIcon(pinColor, pinEmoji, pulse),
      });

      // Format expiry text
      const expiryText = new Date(donation.expiryTime).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Create a popup DOM node so we can attach an event listener
      const container = document.createElement('div');
      container.style.color = '#f3f4f6';
      container.style.width = '240px';
      
      container.innerHTML = `
        <div style="font-family: 'Inter', sans-serif;">
          <h4 style="margin: 0 0 6px 0; color: #10b981; font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 700;">
            ${donation.foodName}
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 0.85rem; color: #e2e8f0;">
            <b>Qty:</b> ${donation.quantity} (${donation.foodType})
          </p>
          <p style="margin: 0 0 4px 0; font-size: 0.85rem; color: #e2e8f0;">
            <b>Expires:</b> ${expiryText}
          </p>
          <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #94a3b8; line-height: 1.3;">
            <b>Address:</b> ${donation.address}
          </p>
          ${isAvailable ? `
            <button id="claim-btn-${donation._id}" style="
              width: 100%;
              background-color: #10b981;
              color: #0f172a;
              border: none;
              padding: 8px 12px;
              font-family: 'Outfit', sans-serif;
              font-weight: 600;
              font-size: 0.85rem;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
            ">Claim Donation</button>
          ` : `
            <div style="
              text-align: center;
              padding: 6px;
              background-color: rgba(245, 158, 11, 0.1);
              color: #f59e0b;
              border: 1px dashed rgba(245, 158, 11, 0.3);
              font-size: 0.8rem;
              border-radius: 6px;
              font-weight: 600;
            ">Reserved / Claimed</div>
          `}
        </div>
      `;

      marker.bindPopup(container);

      // Listen to popup open to attach event to button
      marker.on('popupopen', () => {
        const btn = document.getElementById(`claim-btn-${donation._id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            onClaim(donation._id);
            marker.closePopup();
          });
        }
      });

      markersGroup.current.addLayer(marker);
    });

  }, [donations, userCoords, onClaim]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', minHeight: '380px' }} />
    </div>
  );
};

export default LeafletMap;

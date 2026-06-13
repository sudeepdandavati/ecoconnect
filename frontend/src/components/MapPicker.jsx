import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const MapPicker = ({ defaultCoords, onLocationSelect }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  const [lat, setLat] = useState(defaultCoords?.lat || 12.9716);
  const [lng, setLng] = useState(defaultCoords?.lng || 77.5946);

  // Custom marker icon
  const customIcon = L.divIcon({
    className: 'custom-picker-marker',
    html: `
      <div style="
        background-color: #ef4444;
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: white;
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([lat, lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; contributors',
      }).addTo(mapInstance.current);

      // Create marker
      markerRef.current = L.marker([lat, lng], {
        icon: customIcon,
        draggable: true,
      }).addTo(mapInstance.current);

      const fetchAddress = async (latitude, longitude) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
              'User-Agent': 'EcoConnect-Food-Platform/1.0'
            }
          });
          const data = await res.json();
          if (data && data.display_name) {
            return data.display_name;
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
        }
        return '';
      };

      const handleLocationChange = async (latitude, longitude) => {
        setLat(latitude);
        setLng(longitude);
        markerRef.current.setLatLng([latitude, longitude]);
        
        // Fetch address in real-time
        const address = await fetchAddress(latitude, longitude);
        onLocationSelect(latitude, longitude, address);
      };

      // Listen for click on map
      mapInstance.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        handleLocationChange(lat, lng);
      });

      // Listen for marker dragend
      markerRef.current.on('dragend', (e) => {
        const position = markerRef.current.getLatLng();
        handleLocationChange(position.lat, position.lng);
      });
    }

    return () => {
      // map remove is handled on unmount
    };
  }, []);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        fontSize: '0.85rem',
        color: '#9ca3af',
      }}>
        <span>💡 Click map to set custom coordinates:</span>
        <span style={{ color: '#10b981', fontWeight: 600 }}>
          Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
        </span>
      </div>
      <div ref={mapRef} style={{ height: '260px', width: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }} />
    </div>
  );
};

export default MapPicker;

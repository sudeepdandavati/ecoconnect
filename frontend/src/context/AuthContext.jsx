import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [socket, setSocket] = useState(null);

  // API base URL (Vite environment variables, with fallback to relative paths in production)
  const API_URL = import.meta.env.VITE_API_URL || (window.location.origin === 'http://localhost:5173'
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`);

  // Show dynamic toast notifications
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Check if token exists and fetch user profile
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.success) {
          setUser(data);
        } else {
          // Token expired or invalid
          localStorage.removeItem('token');
          setToken('');
          setUser(null);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Handle WebSockets connections
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || (window.location.origin === 'http://localhost:5173'
      ? 'http://localhost:5000'
      : window.location.origin);
    const socketInstance = io(socketUrl);
    setSocket(socketInstance);

    // Join notification channels
    socketInstance.emit('joinUser', user._id);
    if (user.role === 'ngo') {
      socketInstance.emit('joinNgos');
    }

    // Set up listeners for live notifications
    socketInstance.on('newDonation', (donation) => {
      if (user.role === 'ngo') {
        showToast(`New donation listed: "${donation.foodName}" nearby! 🍲`);
      }
    });

    socketInstance.on('donationClaimed', (data) => {
      if (user.role === 'donor') {
        showToast(`NGO "${data.ngoName}" claimed your donation: "${data.foodName}"! 🚚`);
      }
    });

    socketInstance.on('donationReleased', (data) => {
      if (user.role === 'donor') {
        showToast(`NGO released claim on "${data.foodName}". Listing is available again.`);
      }
    });

    socketInstance.on('donationReleasedGlobal', (data) => {
      if (user.role === 'ngo' && user._id !== data.releasingNgoId) {
        showToast(`⚠️ NGO "${data.ngoName}" released claim on "${data.foodName}". It is available to be claimed again!`, 'error');
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // Register User
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data);
        showToast(`Welcome to EcoConnect, ${data.name}!`);
        return { success: true };
      } else {
        showToast(data.message || 'Registration failed', 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      showToast('Server connection failed. Make sure the backend is running.', 'error');
      return { success: false, message: 'Server connection failed' };
    } finally {
      setLoading(false);
    }
  };

  // Login User
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data);
        showToast(`Logged in successfully. Welcome back, ${data.name}!`);
        return { success: true };
      } else {
        showToast(data.message || 'Invalid email or password', 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      showToast('Server connection failed. Make sure the backend is running.', 'error');
      return { success: false, message: 'Server connection failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout User
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    showToast('Logged out successfully.');
  };

  // Update Profile
  const updateProfile = async (profileData) => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();

      if (data.success) {
        setUser(data);
        showToast('Profile updated successfully.');
        return { success: true };
      } else {
        showToast(data.message || 'Profile update failed', 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      showToast('Server connection failed.', 'error');
      return { success: false, message: 'Server connection failed' };
    }
  };

  // Helper for authenticated fetch calls
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
      });
      return await res.json();
    } catch (err) {
      console.error(`API Fetch Error (${url}):`, err);
      return { success: false, message: 'API connection failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateProfile,
        authFetch,
        showToast,
        toast,
        API_URL,
        socket,
      }}
    >
      {children}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
            <span>{toast.type === 'error' ? '❌' : '🌱'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

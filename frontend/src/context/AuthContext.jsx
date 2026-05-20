import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Restore session from localStorage on app load
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('mediease_token');
      const savedUser = localStorage.getItem('mediease_user');

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          
          // Verify session via profile fetch
          const res = await API.get('/users/profile');
          if (res.data.success) {
            setUser(res.data.profile);
            localStorage.setItem('mediease_user', JSON.stringify(res.data.profile));
            // Trigger initial notifications load
            fetchNotifications();
          }
        } catch (err) {
          console.error('[Session Restorer] Token verification failed:', err.message);
          logoutUser();
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    }
  };

  // Mark single notification read
  const markNotificationRead = async (id) => {
    try {
      const res = await API.put(`/notifications/read/${id}`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  // Mark all notifications read
  const markAllNotificationsRead = async () => {
    try {
      const res = await API.put('/notifications/read-all');
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  // Login action
  const loginUser = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: jwtToken, user: userData } = res.data;
        
        localStorage.setItem('mediease_token', jwtToken);
        localStorage.setItem('mediease_user', JSON.stringify(userData));
        
        setToken(jwtToken);
        setUser(userData);
        
        // Load detailed profile and notifications immediately
        setTimeout(() => {
          syncDetailedProfile();
          fetchNotifications();
        }, 100);

        return { success: true, user: userData };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Check your connection.',
      };
    }
  };

  // Fetch full details (joins patientDetails/doctorDetails)
  const syncDetailedProfile = async () => {
    try {
      const res = await API.get('/users/profile');
      if (res.data.success) {
        setUser(res.data.profile);
        localStorage.setItem('mediease_user', JSON.stringify(res.data.profile));
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  // Logout action
  const logoutUser = () => {
    localStorage.removeItem('mediease_token');
    localStorage.removeItem('mediease_user');
    setToken(null);
    setUser(null);
    setNotifications([]);
  };

  const value = {
    user,
    token,
    loading,
    notifications,
    loginUser,
    logoutUser,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    syncDetailedProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

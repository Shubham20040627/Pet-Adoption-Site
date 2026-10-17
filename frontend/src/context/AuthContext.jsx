import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { commonApi } from '../api/commonApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pawconnect_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('pawconnect_token') || null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync token and user to localStorage
  const saveAuthSession = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('pawconnect_token', newToken);
    localStorage.setItem('pawconnect_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setFavoriteIds([]);
    setUnreadCount(0);
    localStorage.removeItem('pawconnect_token');
    localStorage.removeItem('pawconnect_user');
  };

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    saveAuthSession(res.token, res.user);
    return res;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    saveAuthSession(res.token, res.user);
    return res;
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('pawconnect_user', JSON.stringify(updatedUser));
  };

  // Fetch initial notifications and favorites when logged in
  const fetchUserData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      // Refresh current profile
      const me = await authApi.getMe();
      updateUserProfile(me);

      // Refresh favorites if adopter
      if (me.role === 'adopter') {
        const favRes = await commonApi.getFavorites();
        setFavoriteIds(favRes.favorite_ids || []);
      }

      // Refresh notifications
      const notifRes = await commonApi.getNotifications();
      setUnreadCount(notifRes.unread_count || 0);
    } catch (err) {
      console.warn('Session refresh notice:', err?.response?.data?.error || err.message);
      if (err?.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const toggleFavorite = async (petId) => {
    if (!user) return false;
    try {
      const res = await commonApi.toggleFavorite(petId);
      if (res.is_favorite) {
        setFavoriteIds((prev) => [...prev, petId]);
      } else {
        setFavoriteIds((prev) => prev.filter((id) => id !== petId));
      }
      return res.is_favorite;
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      return false;
    }
  };

  const refreshNotifications = async () => {
    if (!token) return;
    try {
      const notifRes = await commonApi.getNotifications();
      setUnreadCount(notifRes.unread_count || 0);
    } catch (e) {
      // ignore
    }
  };

  const isFavorite = (petId) => favoriteIds.includes(petId);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdopter: user?.role === 'adopter',
    isShelter: user?.role === 'shelter',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUserProfile,
    favoriteIds,
    toggleFavorite,
    isFavorite,
    unreadCount,
    refreshNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

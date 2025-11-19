import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(null);

  const logout = useCallback(() => {
    setSessionTimeout(currentTimeout => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
      return null;
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete api.defaults.headers.common['x-access-token'];
    setUser(null);
  }, []);

  const resetSessionTimeout = useCallback(() => {
    setSessionTimeout(currentTimeout => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
      const newTimeout = setTimeout(logout, 8 * 60 * 60 * 1000); // 8 hours
      return newTimeout;
    });
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (token && userData) {
      try {
        const parsedData = JSON.parse(userData);
        api.defaults.headers.common['x-access-token'] = token;
        setUser(parsedData);
        if (sessionStorage.getItem('token')) {
          resetSessionTimeout();
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.clear();
        sessionStorage.clear();
      }
    }
    setLoading(false);
  }, [resetSessionTimeout]);

  const login = useCallback(async (loginIdentifier, password, keepLoggedIn = true) => {
    try {
      const response = await api.post('/auth/signin', {
        loginIdentifier,
        password,
        keepLoggedIn,
      });
      const { accessToken, ...userData } = response.data;
      const storage = keepLoggedIn ? localStorage : sessionStorage;
      
      storage.setItem('token', accessToken);
      storage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['x-access-token'] = accessToken;
      setUser(userData);

      if (!keepLoggedIn) {
        resetSessionTimeout();
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }, [resetSessionTimeout]);

  const register = useCallback(async (nombre, username, email, password) => {
    try {
      await api.post('/auth/signup', {
        nombre,
        username,
        email,
        password,
      });
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }, []);

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    resetSessionTimeout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
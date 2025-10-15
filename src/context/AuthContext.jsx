import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (token && userData) {
      api.defaults.headers.common['x-access-token'] = token;
      setUser(JSON.parse(userData));
    }
  }, []);

  const login = async (email, password, keepLoggedIn = true) => {
    try {
      const response = await api.post('/auth/signin', {
        email,
        password,
      });
      const { accessToken, ...userData } = response.data;
      const storage = keepLoggedIn ? localStorage : sessionStorage;
      
      storage.setItem('token', accessToken);
      storage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['x-access-token'] = accessToken;
      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      await api.post('/auth/signup', {
        username,
        email,
        password,
      });
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete api.defaults.headers.common['x-access-token'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
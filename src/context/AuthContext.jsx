import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carga

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (token && userData) {
      try {
        const parsedData = JSON.parse(userData);
        api.defaults.headers.common['x-access-token'] = token;
        setUser(parsedData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        // Opcional: Limpiar almacenamiento si los datos están corruptos
        localStorage.clear();
        sessionStorage.clear();
      }
    }
    setLoading(false); // Finaliza la carga
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
    loading, // Exponer el estado de carga
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
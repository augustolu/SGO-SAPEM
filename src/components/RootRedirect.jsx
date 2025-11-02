import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return user ? <Navigate to="/obras" /> : <Navigate to="/login" />;
};

export default RootRedirect;

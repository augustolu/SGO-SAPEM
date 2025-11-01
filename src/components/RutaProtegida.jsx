import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RutaProtegida = () => {
  const { user, loading } = useAuth(); // Obtener el estado de carga

  if (loading) {
    // Opcional: Mostrar un spinner o un componente de carga
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default RutaProtegida;

import React from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ListaActividades = ({ actividades = [], inspectorId, onComplete }) => {
  const { user } = useAuth();

  const handleComplete = async (actividadId) => {
    try {
      const response = await api.patch(`/actividades/${actividadId}/completar`);
      if (response.status === 200) {
        if (onComplete) {
          onComplete(actividadId);
        }
      }
    } catch (error) {
      console.error(`Error completingividad with id ${actividadId}:`, error);
    }
  };

  const isInspector = user && user.id === inspectorId;

  return (
    <div>
      <h3>Actividades</h3>
      <ul>
        {actividades.map((actividad) => (
          <li key={actividad.id}>
            {actividad.descripcion}
            <input
              type="checkbox"
              checked={actividad.completada}
              disabled={!isInspector || actividad.completada}
              onChange={() => handleComplete(actividad.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaActividades;

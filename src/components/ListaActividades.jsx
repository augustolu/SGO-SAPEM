import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ListaActividades = ({ actividades: initialActividades, inspectorId }) => {
  const [actividades, setActividades] = useState(initialActividades);
  const { user } = useAuth();

  useEffect(() => {
    setActividades(initialActividades);
  }, [initialActividades]);

  const handleComplete = async (actividadId) => {
    try {
      const response = await api.patch(`/actividades/${actividadId}/completar`);
      if (response.status === 200) {
        setActividades(actividades.map(act => 
          act.id === actividadId ? { ...act, completada: true } : act
        ));
      }
    } catch (error) {
      console.error(`Error completing actividad with id ${actividadId}:`, error);
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

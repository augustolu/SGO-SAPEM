import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AsignarInspector = ({ obraId }) => {
  const { user } = useAuth();
  const [inspectores, setInspectores] = useState([]);
  const [selectedInspector, setSelectedInspector] = useState('');

  useEffect(() => {
    const fetchInspectores = async () => {
      try {
        const response = await api.get('/usuarios/inspectores');
        setInspectores(response.data);
      } catch (error) {
        console.error('Error fetching inspectores:', error);
      }
    };

    if (user && user.roles.includes('Administrador General')) {
      fetchInspectores();
    }
  }, [user]);

  const handleAssign = async () => {
    if (!selectedInspector) return;
    try {
      await api.put(`/obras/${obraId}/asignar-inspector`, { inspectorId: selectedInspector });
      alert('Inspector asignado correctamente');
      // Optionally, update parent component state
    } catch (error) {
      console.error('Error assigning inspector:', error);
      alert('Error al asignar inspector');
    }
  };

  if (!user || !user.roles.includes('Administrador General')) {
    return null;
  }

  return (
    <div className="asignar-inspector">
      <h4>Asignar Inspector</h4>
      <select 
        value={selectedInspector} 
        onChange={(e) => setSelectedInspector(e.target.value)}
      >
        <option value="">Seleccione un inspector</option>
        {inspectores.map(inspector => (
          <option key={inspector.id} value={inspector.id}>
            {inspector.nombre}
          </option>
        ))}
      </select>
      <button onClick={handleAssign}>Asignar</button>
    </div>
  );
};

export default AsignarInspector;

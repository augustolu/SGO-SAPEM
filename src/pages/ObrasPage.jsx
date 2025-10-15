import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ObrasPage = () => {
  const [obras, setObras] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchObras = async () => {
      try {
        const response = await api.get('/obras');
        setObras(response.data);
      } catch (error) {
        console.error('Error fetching obras:', error);
      }
    };

    fetchObras();
  }, []);

    const isAdmin = user && user.roles && user.roles.includes('Administrador General');

  return (
    <div>
      <h1>Obras</h1>
      {isAdmin && <button>Crear Obra</button>}
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Estado</th>
            <th>Progreso</th>
            {isAdmin && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {obras.map((obra) => (
            <tr key={obra.id}>
              <td>
                <Link to={`/obras/${obra.id}`}>{obra.titulo}</Link>
              </td>
              <td>{obra.estado}</td>
              <td>
                <progress value={obra.progreso} max="100"></progress>
                {obra.progreso}%
              </td>
              {isAdmin && (
                <td>
                  <button>Editar</button>
                  <button>Eliminar</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ObrasPage;

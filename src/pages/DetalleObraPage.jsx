import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import GestionDocumentos from '../components/GestionDocumentos';
import TarjetaDetalleObra from '../components/TarjetaDetalleObra';
import './DetalleObraPage.css';

const DetalleObraPage = () => {
  const { id } = useParams();
  const [obra, setObra] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchObra = async () => {
      try {
        const response = await api.get(`/obras/${id}`);
        setObra(response.data);
      } catch (error) {
        console.error(`Error fetching obra with id ${id}:`, error);
      }
    };

    fetchObra();
  }, [id]);

  if (!obra) {
    return <div className="loading-screen">Cargando...</div>;
  }

  return (
    <div className="detalle-obra-page">
      <div className="detalle-obra-layout">
        <div className="columna-principal">
          <TarjetaDetalleObra obra={obra} />
        </div>
        <div className="columna-secundaria">
          {/* Futuro contenido de documentos y contratos */}
        </div>
      </div>
    </div>
  );
};

export default DetalleObraPage;
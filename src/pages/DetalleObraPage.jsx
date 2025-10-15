import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import InfoObra from '../components/InfoObra';
import ListaActividades from '../components/ListaActividades';
import GestionDocumentos from '../components/GestionDocumentos';
import AsignarInspector from '../components/AsignarInspector';

const DetalleObraPage = () => {
  const { id } = useParams();
  const [obra, setObra] = useState(null);

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
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <InfoObra obra={obra} />
      <ListaActividades actividades={obra.actividades} inspectorId={obra.inspectorId} />
      <GestionDocumentos obraId={obra.id} documentos={obra.documentos} />
      <AsignarInspector obraId={obra.id} />
    </div>
  );
};

export default DetalleObraPage;

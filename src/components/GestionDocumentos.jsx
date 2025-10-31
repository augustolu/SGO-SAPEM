import React, { useState, useCallback } from 'react';
import api from '../services/api';
import './GestionDocumentos.css';

const GestionDocumentos = ({ obraId, documentos: initialDocumentos = [] }) => {
  const [documentos, setDocumentos] = useState(initialDocumentos);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      const formData = new FormData();
      formData.append('file', files[0]);
      try {
        const response = await api.post(`/obras/${obraId}/documentos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setDocumentos([...documentos, response.data]);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  }, [obraId, documentos]);

  const handleDelete = async (documentoId) => {
    try {
      await api.delete(`/documentos/${documentoId}`);
      setDocumentos(documentos.filter(doc => doc.id !== documentoId));
    } catch (error) {
      console.error(`Error deleting documento with id ${documentoId}:`, error);
    }
  };

  return (
    <div className="gestion-documentos">
      <h4>Gestión de Documentos</h4>
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        Arrastra y suelta un archivo aquí para subirlo
      </div>
      <ul>
        {documentos.map(doc => (
          <li key={doc.id}>
            <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.nombre}</a>
            <button onClick={() => handleDelete(doc.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GestionDocumentos;

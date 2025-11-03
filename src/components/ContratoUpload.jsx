import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ContratoUpload = ({ obraId, cantidadContratosMax }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContratos();
  }, [obraId]);

  const fetchContratos = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/obras/${obraId}/contratos`);
      setContratos(response.data);
    } catch (err) {
      setError('Error al cargar los contratos.');
      console.error('Error fetching contratos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo PDF.');
      return;
    }

    if (contratos.length >= cantidadContratosMax) {
      setError(`Ya se ha alcanzado el número máximo de ${cantidadContratosMax} contratos para esta obra.`);
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('contrato', selectedFile);
    formData.append('obra_id', obraId);
    // Otros campos del contrato se pueden añadir aquí si son necesarios en la carga inicial

    try {
      await api.post(`/obras/${obraId}/contratos/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSelectedFile(null);
      fetchContratos(); // Recargar la lista de contratos
    } catch (err) {
      setError('Error al subir el contrato.');
      console.error('Error uploading contrato:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contrato-upload-container">
      <h3>Carga de Contratos</h3>
      {error && <p className="error-message">{error}</p>}
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading || !selectedFile}>
        {loading ? 'Subiendo...' : 'Subir Contrato'}
      </button>

      <div className="contratos-list">
        <h4>Contratos Cargados ({contratos.length}/{cantidadContratosMax})</h4>
        {loading && <p>Cargando contratos...</p>}
        {!loading && contratos.length === 0 && <p>No hay contratos cargados.</p>}
        <ul>
          {contratos.map((contrato) => (
            <li key={contrato.id}>
              <a href={`http://localhost:8080${contrato.Archivo.ruta_archivo}`} target="_blank" rel="noopener noreferrer">
                {contrato.Archivo.nombre_original || 'Archivo de Contrato'}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ContratoUpload;

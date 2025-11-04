import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Assuming you have an API service
import './ContratoUpload.css';

const ContratoUpload = ({ obraId, onContratoUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [contracts, setContracts] = useState([]);
  const [obraDetails, setObraDetails] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contracts
        console.log('Fetching contracts for obraId:', obraId);
        const contractsResponse = await api.get(`/obras/${obraId}/contratos`);
        console.log('Contracts Response:', contractsResponse.data);
        setContracts(contractsResponse.data);

        // Fetch obra details to get cantidad_contratos
        console.log('Fetching obra details for obraId:', obraId);
        const obraResponse = await api.get(`/obras/${obraId}`);
        console.log('Obra Details Response:', obraResponse.data);
        setObraDetails(obraResponse.data);
        console.log('Obra Details:', obraResponse.data); // Add this line for debugging
      } catch (error) {
        console.error('Error al obtener datos de la obra o contratos:', error);
        console.error('Detalles del error:', error.response ? error.response.data : error.message);
      }
    };

    if (obraId) {
      fetchData();
    }
  }, [obraId]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage('');
  };

  const handleDelete = async (contratoId) => {
    try {
      const response = await api.delete(`/obras/${obraId}/contratos/${contratoId}`);
      setMessage(response.data.message);
      console.log('ContratoUpload: Delete response newProgreso:', response.data.newProgreso);
      // Re-fetch contracts and update progress
      const contractsResponse = await api.get(`/obras/${obraId}/contratos`);
      setContracts(contractsResponse.data);
      if (response.data && response.data.newProgreso) {
        onContratoUploadSuccess(response.data.newProgreso);
      }
    } catch (error) {
      console.error('Error al eliminar el contrato:', error);
      setMessage(`Error al eliminar el contrato: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Por favor, selecciona un archivo para subir.');
      return;
    }

    setUploading(true);
    setMessage('Subiendo contrato...');

    const formData = new FormData();
    formData.append('contrato', selectedFile);
    formData.append('obraId', obraId);
    // Add contract details as needed by the new backend schema
    formData.append('nombre', selectedFile.name); // Using filename as contract name for now
    formData.append('orden', contracts.length + 1); // Simple sequential order

    console.log('Uploading contract for obraId:', obraId);
    console.log('FormData content:', formData);
    try {
      const response = await api.post(`/obras/${obraId}/upload-contrato`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Contrato subido exitosamente.');
      setSelectedFile(null);
      // Re-fetch contracts to update the list and progress
      const contractsResponse = await api.get(`/obras/${obraId}/contratos`);
      setContracts(contractsResponse.data);

      if (response.data && response.data.newProgreso) {
        // Also re-fetch obra details to ensure `cantidad_contratos` is up-to-date
        const obraResponse = await api.get(`/obras/${obraId}`);
        setObraDetails(obraResponse.data);
        onContratoUploadSuccess(response.data.newProgreso);
      }
    } catch (error) {
      console.error('Error al subir el contrato:', error);
      setMessage(`Error al subir el contrato: ${error.message || 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const totalContractsNeeded = obraDetails?.cantidad_contratos || 0;

  return (
    <div className="contrato-upload-container">
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="file-input"
        id="contrato-file-input"
      />
      <label htmlFor="contrato-file-input" className="file-input-label">
        {selectedFile ? selectedFile.name : 'Seleccionar Contrato (PDF)'}
      </label>
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading || (contracts.length >= totalContractsNeeded)}
        className="upload-button"
      >
        {uploading ? 'Subiendo...' : 'Subir Contrato'}
      </button>
      {message && <p className="upload-message">{message}</p>}

      <p>Contratos cargados: {contracts.length} / {totalContractsNeeded}</p>

      {contracts.length > 0 && (
        <div className="contracts-list">
          <h3>Contratos Subidos:</h3>
          <ul>
            {contracts.map((contrato) => (
              <li key={contrato.id}>
                <a href={contrato.Archivo?.ruta_archivo} target="_blank" rel="noopener noreferrer">
                  {contrato.Archivo?.nombre_original}
                </a>
                <button onClick={() => handleDelete(contrato.id)} className="delete-button">X</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {contracts.length === 0 && !uploading && (
        <p>No hay contratos subidos para esta obra.</p>
      )}
    </div>
  );
};

export default ContratoUpload;

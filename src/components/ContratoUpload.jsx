import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ContratoUpload.css';
import AnimatedProgressNumber from './AnimatedProgressNumber';

const ContratoUpload = ({ obraId, onContratoUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [contracts, setContracts] = useState([]);
  const [obraDetails, setObraDetails] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [showContracts, setShowContracts] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!obraId) return;
      
      try {
        console.log('Fetching data for obraId:', obraId);
        
        const [contractsResponse, obraResponse] = await Promise.all([
          api.get(`/obras/${obraId}/contratos`),
          api.get(`/obras/${obraId}`)
        ]);

        console.log('Contracts Response:', contractsResponse.data);
        console.log('Obra Details Response:', obraResponse.data);

        setContracts(contractsResponse.data);
        setObraDetails(obraResponse.data);

        const total = obraResponse.data?.cantidad_contratos || 0;
        const current = contractsResponse.data.length;
        setUploadProgress(total > 0 ? (current / total) * 100 : 0);

      } catch (error) {
        console.error('Error al obtener datos:', error);
        console.error('Detalles del error:', error.response?.data || error.message);
        setMessage('Error al cargar los datos de la obra');
      }
    };

    fetchData();
  }, [obraId]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type !== 'application/pdf') {
      setMessage('Por favor, selecciona un archivo PDF');
      return;
    }
    setSelectedFile(file);
    setMessage('');
  };

  const updateProgress = (currentContracts, totalContracts) => {
    const newProgress = totalContracts > 0 ? (currentContracts / totalContracts) * 100 : 0;
    setUploadProgress(newProgress);
    setIsProgressAnimating(true);
  };

  const handleAnimationComplete = () => {
    setIsProgressAnimating(false);
  };

  const handleDelete = async (contratoId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este contrato?')) {
      return;
    }

    setUploading(true);
    setMessage('Eliminando contrato...');
    
    try {
      const response = await api.delete(`/obras/${obraId}/contratos/${contratoId}`);
      setMessage('Contrato eliminado exitosamente');
      
      const [contractsResponse, obraResponse] = await Promise.all([
        api.get(`/obras/${obraId}/contratos`),
        api.get(`/obras/${obraId}`)
      ]);

      setContracts(contractsResponse.data);
      setObraDetails(obraResponse.data);

      if (response.data?.newProgreso) {
        onContratoUploadSuccess(response.data.newProgreso);
      }
      
      updateProgress(contractsResponse.data.length, obraResponse.data?.cantidad_contratos || 0);

    } catch (error) {
      console.error('Error al eliminar el contrato:', error);
      setMessage(`Error al eliminar el contrato: ${error.message || 'Error desconocido'}`);
    } finally {
      setUploading(false);
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
    formData.append('nombre', selectedFile.name);
    formData.append('orden', contracts.length + 1);

    try {
      const response = await api.post(`/obras/${obraId}/upload-contrato`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('Contrato subido exitosamente.');
      setSelectedFile(null);
      
      const fileInput = document.getElementById('contrato-file-input');
      if (fileInput) fileInput.value = '';

      const [contractsResponse, obraResponse] = await Promise.all([
        api.get(`/obras/${obraId}/contratos`),
        api.get(`/obras/${obraId}`)
      ]);

      setContracts(contractsResponse.data);
      setObraDetails(obraResponse.data);

      if (response.data?.newProgreso) {
        onContratoUploadSuccess(response.data.newProgreso);
      }
      
      updateProgress(contractsResponse.data.length, obraResponse.data?.cantidad_contratos || 0);

    } catch (error) {
      console.error('Error al subir el contrato:', error);
      setMessage(`Error al subir el contrato: ${error.message || 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const toggleContracts = () => {
    setShowContracts(!showContracts);
  };

  const totalContractsNeeded = obraDetails?.cantidad_contratos || 0;
  const hasReachedLimit = contracts.length >= totalContractsNeeded;

  return (
    <div className="contrato-upload-container">
      <div className="upload-header">
        <h3>Gestión de Contratos</h3>
        <div className="contracts-count">
          {contracts.length} / {totalContractsNeeded} contratos cargados
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="progress-section">
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className={`progress-fill ${isProgressAnimating ? 'animating' : ''}`}
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress >= 50 && (
                <span className="progress-percentage">
                  <AnimatedProgressNumber
                    targetValue={uploadProgress}
                    isAnimating={isProgressAnimating}
                    onAnimationComplete={handleAnimationComplete}
                  />
                </span>
              )}
            </div>
          </div>
          {uploadProgress < 50 && (
            <div className="progress-indicator">
              <AnimatedProgressNumber
                targetValue={uploadProgress}
                isAnimating={isProgressAnimating}
                onAnimationComplete={handleAnimationComplete}
              />
            </div>
          )}
        </div>
      </div>

      {!hasReachedLimit && (
        <div className="upload-section">
          <div className="file-upload-area">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="file-input"
              id="contrato-file-input"
              disabled={uploading}
            />
            <label htmlFor="contrato-file-input" className="file-input-label">
              <div className="file-label-content">
                <span className="file-icon"></span>
                {selectedFile ? (
                  <span className="file-name">{selectedFile.name}</span>
                ) : (
                  <span>Seleccionar Contrato PDF</span>
                )}
              </div>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="upload-button"
          >
            {uploading ? (
              <span className="button-loading">
                <span className="spinner"></span>
                Subiendo...
              </span>
            ) : (
              'Subir Contrato'
            )}
          </button>
        </div>
      )}

      {hasReachedLimit && (
        <div className="limit-reached-message">
          Todos los contratos requeridos han sido cargados
        </div>
      )}

      {contracts.length > 0 && (
        <div className="contracts-section">
          <button 
            className="contracts-toggle"
            onClick={toggleContracts}
          >
            <span>Contratos Subidos ({contracts.length})</span>
            <span className={`toggle-arrow ${showContracts ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          
          <div className={`contracts-list ${showContracts ? 'show' : ''}`}>
            {contracts.map((contrato) => (
              <div key={contrato.id} className="contract-item">
                <div className="contract-info">
                  <span className="contract-name">
                    {contrato.Archivo?.nombre_original}
                  </span>
                  <a 
                    href={contrato.Archivo?.ruta_archivo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-link"
                  >
                    Ver
                  </a>
                </div>
                <button 
                  onClick={() => handleDelete(contrato.id)} 
                  disabled={uploading}
                  className="delete-button"
                  title="Eliminar contrato"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {contracts.length === 0 && !uploading && (
        <div className="empty-state">
          <span className="empty-icon"></span>
          <p>No hay contratos subidos para esta obra</p>
        </div>
      )}
    </div>
  );
};

export default ContratoUpload;
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmationModal from './ConfirmationModal'; // Importar el nuevo modal
import './ContratoUpload.css';

const ContratoUpload = ({ obraId, onContratoUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [contracts, setContracts] = useState([]);
  const [obraDetails, setObraDetails] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [showContracts, setShowContracts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para el modal
  const [contractToDelete, setContractToDelete] = useState(null); // Estado para guardar el ID a eliminar

  // NUEVO LOG: Para rastrear el estado del modal en el padre
  useEffect(() => {
    console.log(`[ContratoUpload] El estado isModalOpen cambió a: ${isModalOpen}`);
  }, [isModalOpen]);

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

  const handleDeleteClick = (contratoId) => {
    if (uploading) return; // No abrir si ya se está procesando algo
    setContractToDelete(contratoId); // Guardar el ID del contrato
    console.log('[ContratoUpload] Abriendo modal para eliminar contrato ID:', contratoId);
    setIsModalOpen(true); // Abrir el modal
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;
    console.log('[ContratoUpload] confirmDelete iniciado.');

    setUploading(true);
    try {
      const deleteResponse = await api.delete(`/obras/${obraId}/contratos/${contractToDelete}`);

      // Volver a cargar los datos para actualizar la UI sin recargar la página
      const [contractsResponse, obraResponse] = await Promise.all([
        api.get(`/obras/${obraId}/contratos`),
        api.get(`/obras/${obraId}`)
      ]);

      setContracts(contractsResponse.data);
      setObraDetails(obraResponse.data);

      if (deleteResponse.data?.newProgreso) {
        onContratoUploadSuccess(deleteResponse.data.newProgreso);
      }
      updateProgress(contractsResponse.data.length, obraResponse.data?.cantidad_contratos || 0);

    } catch (error) {
      console.error('Error al eliminar el certificado:', error);
      setMessage(`Error al eliminar el certificado: ${error.message || 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleIncrementTotal = async () => {
    if (!obraDetails) return;

    const newTotal = (obraDetails.cantidad_contratos || 0) + 1;

    try {
      const response = await api.put(`/obras/${obraId}`, { cantidad_contratos: newTotal });
      setObraDetails(response.data);
      updateProgress(contracts.length, newTotal);
      setMessage('Cantidad de certificados requeridos actualizada.');
    } catch (error) {
      console.error('Error al incrementar la cantidad de certificados:', error);
      setMessage('Error al actualizar el total de certificados.');
    }
  };

  const handleCloseModal = () => {
    console.log('[ContratoUpload] handleCloseModal llamado. Seteando isModalOpen = false.');
    setIsModalOpen(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Por favor, selecciona un archivo para subir.');
      return;
    }

    setUploading(true);

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
      console.error('Error al subir el certificado:', error);
      setMessage(`Error al subir el certificado: ${error.message || 'Error desconocido'}`);
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
        <h3>Gestión de Certificados</h3>
        <div className="contracts-count">
          <span>{contracts.length} / {totalContractsNeeded} certificados cargados</span>
          <button
            onClick={handleIncrementTotal}
            className="increment-btn"
            title="Aumentar cantidad de certificados requeridos"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #4fc3f7',
              color: '#4fc3f7',
              padding: 0,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#81d4fa';
              e.target.style.color = '#132238';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#4fc3f7';
            }}
          >
            +
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'info'}`}>
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
              <span className="progress-percentage">
                {uploadProgress.toFixed(0)}%
              </span>
            </div>
          </div>
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
                  <span>Seleccionar Certificado PDF</span>
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
              'Subir Certificado'
            )}
          </button>
        </div>
      )}

      {hasReachedLimit && (
        <div className="limit-reached-message">
          Todos los Certificados requeridos han sido cargados
        </div>
      )}

      {contracts.length > 0 && (
        <div className="contracts-section">
  <button 
    className="contracts-toggle"
    onClick={toggleContracts}
    style={{
      background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.1) 0%, rgba(41, 182, 246, 0.1) 100%)',
      border: '1px solid rgba(79, 195, 247, 0.3)',
      width: '100%',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#4fc3f7',
      fontWeight: '600',
      fontSize: '0.875rem'
    }}
  >
    <span 
      className={`toggle-arrow ${showContracts ? 'open' : ''}`}
      style={{
        display: 'inline-block',
        transition: 'transform 0.3s ease',
        fontSize: '1rem',
        fontWeight: 'bold'
      }}
    >
      ▼
    </span>
  </button>
  
  <div 
    className={`contracts-list ${showContracts ? 'show' : ''}`}
    style={{
      maxHeight: showContracts ? '500px' : '0',
      overflow: 'hidden',
      transition: 'max-height 0.3s ease',
      marginTop: showContracts ? '8px' : '0'
    }}
  >
    {contracts.map((contrato) => (
      <div 
        key={contrato.id} 
        className="contract-item"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s ease',
          marginBottom: '8px'
        }}
      >
        <div 
          className="contract-info"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: '1'
          }}
        >
          <span 
            className="contract-name"
            style={{
              fontSize: '0.875rem',
              color: '#ffffff',
              fontWeight: '500',
              flex: '1'
            }}
          >
            {contrato.Archivo?.nombre_original}
          </span>
          <a 
            href={contrato.Archivo?.ruta_archivo} 
            target="_blank" 
            rel="noopener noreferrer"
            className="view-link"
            style={{
              color: '#4fc3f7',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: '500',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.1) 0%, rgba(41, 182, 246, 0.1) 100%)',
              border: '1px solid rgba(79, 195, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)';
              e.target.style.color = '#132238';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(79, 195, 247, 0.1) 0%, rgba(41, 182, 246, 0.1) 100%)';
              e.target.style.color = '#4fc3f7';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <span></span>
            Ver
          </a>
        </div>
        <button 
          onClick={() => handleDeleteClick(contrato.id)} 
          disabled={uploading}
          className="delete-button"
          title="Eliminar certificado"
          style={{
            background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.1) 0%, rgba(41, 182, 246, 0.1) 100%)',
            color: '#4fc3f7',
            maxWidth: '65px',
            maxHeight: '35px',  
            marginLeft: '10px', 
            border: '1px solid rgba(79, 195, 247, 0.3)',
            cursor: uploading ? 'not-allowed' : 'pointer',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            fontSize: '0.75rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: uploading ? '0.5' : '1'
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.target.style.background = 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)';
              e.target.style.color = '#132238';
              e.target.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.target.style.background = 'linear-gradient(135deg, rgba(79, 195, 247, 0.1) 0%, rgba(41, 182, 246, 0.1) 100%)';
              e.target.style.color = '#4fc3f7';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          <span></span>
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
          <p>No hay certificados subidos para esta obra</p>
        </div>
      )}

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={confirmDelete}
        title="Eliminar Certificado"
        message="¿Estás seguro de que quieres eliminar este certificado? Esta acción no se puede deshacer."
        type="danger"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default ContratoUpload;
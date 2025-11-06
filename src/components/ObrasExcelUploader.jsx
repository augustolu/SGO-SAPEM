import React, { useState } from 'react';
import api from '../services/api'; // Importamos tu instancia de 'api'

// Componente de ícono simple
const UploadIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

export function ObrasExcelUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Por favor, selecciona un archivo .xlsx o .xls');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('excel_file', file); // Coincide con el backend

    try {
      const response = await api.post('/obras/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(`¡Éxito! Se importaron ${response.data.importedCount} obras.`);
      setErrors([]);
      setFile(null); // Limpiar el input
      document.getElementById('excel-uploader-input').value = null; // Resetear el input
      onUploadSuccess(); // Llamar a la función para refrescar la lista de obras
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      const errorMsg = error.response?.data?.message || 'Error en el servidor.';
      const errorsList = error.response?.data?.errors || [];
      setMessage(errorMsg);
      setErrors(errorsList);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="excel-uploader-container">
      <form onSubmit={handleSubmit} className="excel-uploader-form">
        <label htmlFor="excel-uploader-input" className={`excel-uploader-label ${isLoading ? 'loading' : ''}`}>
          <UploadIcon />
          <span>{file ? file.name : 'Importar Obras (.xlsx)'}</span>
        </label>
        <input 
          id="excel-uploader-input"
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange} 
          disabled={isLoading}
        />
        {file && (
          <button type="submit" className="excel-uploader-button" disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Confirmar'}
          </button>
        )}
      </form>
      
      {/* Mensajes de estado */}
      {message && !errors.length && (
        <p className="excel-message success">{message}</p>
      )}
      {message && errors.length > 0 && (
        <div className="excel-message error">
          <p>{message}</p>
          <ul>
            {errors.map((err, index) => <li key={index}>{err}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
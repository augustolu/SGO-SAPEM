import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api'; // Importamos tu instancia de 'api'
import * as XLSX from 'xlsx';
import './Modal.css'; // Importamos los estilos del modal

// Componente de ícono simple
const UploadIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

// Campos de destino esperados en la base de datos
const TARGET_FIELDS = [
  'numero_gestion', 'nro', 'establecimiento', 'localidad', 'contratista', 'detalle', 'monto_sapem',
  'monto_sub', 'af', 'plazo', 'inspector_id',
  'rep_legal', 'progreso'
];

const CATEGORIAS = [
  'salud', 'educación', 'deporte', 'secretaría general', 
  'vialidad', 'obra pública', 'varios'
];

export function ObrasExcelUploader({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('varios');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setMessage('');
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // Extraer encabezados de la primera fila
      const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
      setExcelHeaders(headers);
      // Aquí podrías añadir la lógica de autocompletado si lo deseas
      setStep(2); // Pasar al siguiente paso
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleMappingChange = (targetField, excelHeader) => {
    setColumnMapping(prev => ({ ...prev, [targetField]: excelHeader }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Por favor, selecciona un archivo.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('excel_file', file); // Coincide con el backend
    // Adjuntar el objeto de mapeo serializado como una cadena JSON
    formData.append('mapa_json', JSON.stringify(columnMapping));
    formData.append('categoria', selectedCategory); // Enviar categoría seleccionada

    try {
      const response = await api.post('/obras/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(`¡Éxito! Se importaron ${response.data.importedCount} obras.`);
      setErrors([]);
      setFile(null); // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      // Resetear estados al estado inicial
      setStep(1);
      setExcelHeaders([]);
      setColumnMapping({});
      onUploadSuccess(); // Llamar a la función para refrescar la lista de obras
      onClose(); // Cerramos el modal en caso de éxito
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

  const handleCancel = () => {
    setFile(null);
    setStep(1);
    setExcelHeaders([]);
    setColumnMapping({});
    setMessage('');
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    // Si estamos en el paso 2, volver al 1. Si estamos en el 1, cerrar el modal.
    if (step === 2) {
      setStep(1);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" style={{ backgroundColor: '#e6f7ff' }} onClick={(e) => e.stopPropagation()}>
        <button onClick={handleCancel} className="modal-close-button">&times;</button>
        
        <div className="excel-uploader-container">
          {step === 1 && (
            <form className="excel-uploader-form">
              <label htmlFor="excel-uploader-input" className={`excel-uploader-label ${isLoading ? 'loading' : ''}`}>
                <UploadIcon />
                <span>Importar Obras (.xlsx)</span>
              </label>
              <input 
                id="excel-uploader-input"
                ref={fileInputRef}
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileChange} 
                disabled={isLoading}
              />
            </form>
          )}

          {step === 2 && file && (
            <div className="excel-mapping-container">
              <h4>Mapear Columnas de "{file.name}"</h4>
              <p>Asocia las columnas de tu archivo Excel con los campos requeridos por el sistema.</p>
              
              <div className="mapping-row" style={{marginBottom: '1rem', borderTop: '1px solid #ccc', paddingTop: '1rem'}}>
                <label htmlFor="category-select">Categoría para todas las obras:</label>
                <select 
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="excel-mapping-grid">
                {TARGET_FIELDS.map(targetField => (
                  <div key={targetField} className="mapping-row">
                    <label htmlFor={`map-${targetField}`}>{targetField.replace(/_/g, ' ')}:</label>
                    <select 
                      id={`map-${targetField}`}
                      value={columnMapping[targetField] || ''}
                      onChange={(e) => handleMappingChange(targetField, e.target.value)}
                    >
                      <option value="">-- No importar --</option>
                      {excelHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="excel-mapping-actions">
                <button onClick={handleCancel} className="excel-uploader-button secondary" disabled={isLoading}>
                  Volver
                </button>
                <button onClick={handleSubmit} className="excel-uploader-button" disabled={isLoading}>
                  {isLoading ? 'Importando...' : 'Confirmar Subida'}
                </button>
              </div>

              {/* Mensajes de estado */}
              {message && !errors.length && (
                <p className="excel-message success">{message}</p>
              )}
              {message && errors.length > 0 && (
                <div className="excel-message error">
                  <p>{message}</p>
                  <ul>{errors.map((err, index) => <li key={index}>{err}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
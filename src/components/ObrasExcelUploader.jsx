import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api'; // Importamos tu instancia de 'api'
import * as XLSX from 'xlsx';
import './ObrasExcelUploader.css'; // Importamos los estilos específicos del uploader

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
  const [step, setStep] = useState(1); // 1: Archivo, 2: Hoja, 3: Colores, 4: Columnas
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('varios');
  const [colorMapping, setColorMapping] = useState({}); // { '#FF0000': 'Anulada', ... }
  const fileInputRef = useRef(null);


  useEffect(() => {
    if (isOpen) {
      // Añadimos ambas clases: una para el pointer-events y otra para el overflow
      document.body.classList.add('excel-modal-open', 'modal-open');
    } else {
      document.body.classList.remove('excel-modal-open', 'modal-open');
    }
    return () => {
      // Limpieza al desmontar el componente
      document.body.classList.remove('excel-modal-open', 'modal-open');
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const detectColorsAndProceed = (worksheet) => {
    const detectedColors = new Set();
    // Iterar sobre todas las celdas para encontrar colores de fondo
    for (const cellAddress in worksheet) {
      // Ignorar las celdas especiales como !ref, !merges, etc.
      if (cellAddress[0] === '!') continue;

      const cell = worksheet[cellAddress];
      const cellColor = cell?.s?.fgColor?.rgb;

      if (cellColor) {
        // El color puede tener un prefijo de alfa (ej. 'FFFF0000'), lo quitamos.
        const cleanColor = `#${cellColor.slice(-6).toUpperCase()}`;
        detectedColors.add(cleanColor);
      }
    }
    // Inicializar el mapeo de colores con los colores detectados
    setColorMapping(Array.from(detectedColors).reduce((acc, color) => ({ ...acc, [color]: '' }), {}));
  };

  const processSheet = (sheetName) => {
    if (!workbook) return;

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      setMessage('La hoja seleccionada no se pudo encontrar en el archivo.');
      setErrors(['Por favor, selecciona otra hoja o sube un archivo diferente.']);
      return;
    }
    // Primero, detectamos los colores y preparamos el mapeo
    detectColorsAndProceed(worksheet);
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
    setExcelHeaders(headers);
    setStep(3); // Avanzar al paso de mapeo de colores
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setMessage('');
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      // ¡IMPORTANTE! Añadir { cellStyles: true } para leer los colores de las celdas.
      const workbook = XLSX.read(data, { type: 'array', cellStyles: true });
      setWorkbook(workbook);
      const sheets = workbook.SheetNames;
      setSheetNames(sheets);

      if (sheets.length === 1) {
        // Si solo hay una hoja, la procesamos directamente
        processSheet(sheets[0]);
      } else {
        setStep(2); // Si hay varias, vamos al paso de selección de hoja
      }
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
    formData.append('color_mapa_json', JSON.stringify(colorMapping)); // Mapa de colores actualizado
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
      setStep(1); // Volver al paso inicial
      setWorkbook(null);
      setSheetNames([]);
      setExcelHeaders([]);
      setColumnMapping({});
      setColorMapping({});
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
    setWorkbook(null);
    setSheetNames([]);
    setExcelHeaders([]);
    setColumnMapping({});
    setColorMapping({});
    setMessage('');
    setErrors([]);
    setStep(1); // Siempre volver al paso 1
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    } else {
      onClose();
    }
  };

  const handleColorMapChange = (color, status) => {
    setColorMapping(prev => ({ ...prev, [color]: status }));
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
                <span>Seleccionar archivo Excel (.xlsx)</span>
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

          {step === 2 && sheetNames.length > 1 && (
            <div className="excel-mapping-container">
              <h4>Seleccionar Hoja</h4>
              <p>Tu archivo contiene varias hojas. Por favor, elige cuál quieres importar.</p>
              <div className="excel-mapping-grid">
                <div className="mapping-row">
                  <label htmlFor="sheet-select">Hoja de cálculo:</label>
                  <select 
                    id="sheet-select"
                    onChange={(e) => processSheet(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Elige una hoja --</option>
                    {sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && file && (
            <div className="excel-mapping-container">
              <h4>Asignar Estado por Color</h4>
              <p>Hemos detectado estos colores en tu archivo. Asigna un estado a cada uno.</p>

              <div className="excel-mapping-grid">
                {Object.keys(colorMapping).length > 0 ? Object.keys(colorMapping).map(color => (
                  <div key={color} className="mapping-row color-map-row">
                    <div className="color-swatch" style={{ backgroundColor: color }}></div>
                    <label htmlFor={`color-map-${color}`}>{color}</label>
                    <select
                      id={`color-map-${color}`}
                      value={colorMapping[color]}
                      onChange={(e) => handleColorMapChange(color, e.target.value)}
                    >
                      <option value="">-- Ignorar este color --</option>
                      <option value="En ejecución">En ejecución</option>
                      <option value="Finalizada">Finalizada</option>
                      <option value="Anulada">Anulada</option>
                      <option value="Compulsa">Compulsa</option>
                      <option value="Solicitud">Solicitud</option>

                    </select>
                  </div>
                )) : (
                  <p className="no-colors-found">No se detectaron colores de fondo en las celdas de esta hoja.</p>
                )}
              </div>

              <div className="excel-mapping-actions">
                <button 
                  onClick={() => sheetNames.length > 1 ? setStep(2) : handleCancel()}
                  className="excel-uploader-button secondary" 
                  disabled={isLoading}
                >
                  Volver
                </button>
                <button onClick={() => setStep(4)} className="excel-uploader-button" disabled={isLoading}>
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {step === 4 && file && (
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
                <button onClick={() => setStep(3)} className="excel-uploader-button secondary" disabled={isLoading}>
                  Cancelar
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
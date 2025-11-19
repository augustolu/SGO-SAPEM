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
  'rep_legal', 'progreso', 'fecha_inicio', 'fecha_finalizacion_estimada'
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
      document.body.classList.add('excel-modal-open', 'modal-open');
    } else {
      document.body.classList.remove('excel-modal-open', 'modal-open');
    }
    return () => {
      document.body.classList.remove('excel-modal-open', 'modal-open');
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const detectColorsAndProceed = (worksheet) => {
    const detectedColors = new Set();
    for (const cellAddress in worksheet) {
      if (cellAddress[0] === '!') continue;
      const cell = worksheet[cellAddress];
      const cellColor = cell?.s?.fgColor?.rgb;
      if (cellColor) {
        const cleanColor = `#${cellColor.slice(-6).toUpperCase()}`;
        detectedColors.add(cleanColor);
      }
    }
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
    detectColorsAndProceed(worksheet);
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
    setExcelHeaders(headers);
    setStep(3);
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
      const workbook = XLSX.read(data, { type: 'array', cellStyles: true });
      setWorkbook(workbook);
      const sheets = workbook.SheetNames;
      setSheetNames(sheets);
      if (sheets.length === 1) {
        processSheet(sheets[0]);
      } else {
        setStep(2);
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
    formData.append('excel_file', file);
    formData.append('mapa_json', JSON.stringify(columnMapping));
    formData.append('color_mapa_json', JSON.stringify(colorMapping));
    formData.append('categoria', selectedCategory);

    try {
      const response = await api.post('/obras/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob', // Pedimos la respuesta como un blob para manejar el archivo
      });

      // Si la respuesta es un archivo de Excel, lo descargamos
      if (response.headers['content-type'] === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'Cuentas de inspectores.xlsx'; // Nombre por defecto
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch.length > 1) {
            filename = filenameMatch[1];
          }
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        // Asumimos éxito y cerramos el modal, notificando al padre
        onUploadSuccess({ message: `¡Éxito! Obras importadas y archivo de cuentas descargado.` });

      } else {
        // Si no es un archivo, es un JSON (éxito sin usuarios nuevos, o error)
        const responseText = await response.data.text();
        const jsonData = JSON.parse(responseText);
        onUploadSuccess(jsonData);
      }

    } catch (error) {
      console.error('Error al subir el archivo:', error);
      let errorMsg = 'Error en el servidor.';
      let errorsList = [];

      if (error.response && error.response.data) {
        try {
          // El error también puede ser un blob, hay que leerlo
          const errorText = await error.response.data.text();
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.message || 'Error al procesar el archivo.';
          errorsList = errorJson.errors || [];
        } catch (e) {
          // Si no se puede parsear como JSON, mostramos el texto plano
          errorMsg = await error.response.data.text();
        }
      }
      
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
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    onClose();
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

              <div className="excel-mapping-content-wrapper">
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

                <div className="color-reminder">
                  <h5>Recordatorio</h5>
                  <ul>
                    <li><span className="color-dot" style={{backgroundColor: 'white'}}></span>Solicitud</li>
                    <li><span className="color-dot" style={{backgroundColor: 'yellow'}}></span>Compulsa</li>
                    <li><span className="color-dot" style={{backgroundColor: 'green'}}></span>En ejecución</li>
                    <li><span className="color-dot" style={{backgroundColor: 'blue'}}></span>Finalizada</li>
                    <li><span className="color-dot" style={{backgroundColor: 'red'}}></span>Anulada</li>
                  </ul>
                </div>
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
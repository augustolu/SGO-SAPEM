import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ObraForm.css';
import api from '../services/api';
import CreatableAutocomplete from './CreatableAutocomplete.jsx';
import ImageUpload from './ImageUpload.jsx';

// --- Arreglo para el ícono de Leaflet en React ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const STEPS = [
  { number: 1, title: 'Datos Principales' },
  { number: 2, title: 'Ubicación y Responsables' },
  { number: 3, title: 'Detalles Económicos y Plazos' },
];

// --- Componente para Input de Moneda ---
const CurrencyInput = ({ name, value, onChange, placeholder }) => {
    const formatCurrency = (numStr) => {
      if (!numStr) return '';
      const [integerPart, decimalPart] = numStr.split(',');
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
    };
  
    const handleInputChange = (e) => {
      const rawValue = e.target.value;
      const withoutThousandSeparators = rawValue.replace(/\./g, '');
      const withDecimalPoint = withoutThousandSeparators.replace(',', '.');
      const sanitizedValue = withDecimalPoint.replace(/[^0-9.]/g, '');
      const parts = sanitizedValue.split('.');
      const numericValue =
        parts.length > 1
          ? `${parts[0]}.${parts.slice(1).join('').substring(0, 2)}`
          : parts[0];
  
      onChange({ target: { name, value: numericValue } });
    };
  
    return (
      <div className="input-with-prefix">
        <span className="input-prefix">ARS</span>
        <input type="text" name={name} value={formatCurrency(String(value || '').replace('.', ','))} onChange={handleInputChange} placeholder={placeholder} style={{ border: 'none', boxShadow: 'none', paddingLeft: '0.5rem' }} />
      </div>
    );
  };

// --- Componente Stepper (Indicador de Progreso) ---
const Stepper = ({ currentStep }) => (
  <div className="stepper-container">
    {STEPS.map(({ number, title }) => {
      const status = currentStep > number ? 'completed' : currentStep === number ? 'active' : 'pending';
      return (
        <React.Fragment key={number}>
          <div className={`step-item ${status}`}>
            <div className="step-circle">{status === 'completed' ? '✓' : number}</div>
            <div className="step-title">{title}</div>
          </div>
          {number < STEPS.length && <div className="step-connector"></div>}
        </React.Fragment>
      );
    })}
  </div>
);

// --- Componentes de cada Paso ---
const Step1 = ({ data, handleChange, errors, selectedFile, setSelectedFile, setIsCropping, isEditable }) => (
    <div className="form-step">
      <div className="form-grid-2-cols" style={{gap: '3rem', marginBottom: '1rem'}}>
        <div className="form-group">
          <label htmlFor="establecimiento">Título / Establecimiento <span className="mandatory-star">*</span></label>
          <input type="text" id="establecimiento" name="establecimiento" value={data.establecimiento} onChange={handleChange} placeholder="Nombre del lugar de la obra" disabled={!isEditable} />
          {errors.establecimiento && <span className="error-message">{errors.establecimiento}</span>}
        </div>
  
        <div className="form-group">
          <label htmlFor="numero_gestion">Número de Gestión <span className="mandatory-star">*</span></label>
          <input type="text" id="numero_gestion" name="numero_gestion" value={data.numero_gestion} onChange={handleChange} placeholder="Ej: 2024-001-A" maxLength={12} disabled={!isEditable} />
          {errors.numero_gestion && <span className="error-message">{errors.numero_gestion}</span>}
        </div>
  
        <div className="form-group">
          <label htmlFor="categoria">Categoría <span className="mandatory-star">*</span></label>
          <select id="categoria" name="categoria" value={data.categoria} onChange={handleChange} disabled={!isEditable}>
            <option value="salud">Salud</option>
            <option value="educación">Educación</option>
            <option value="deporte">Deporte</option>
            <option value="secretaría general">Secretaría General</option>
            <option value="vialidad">Vialidad</option>
            <option value="obra pública">Obra Pública</option>
            <option value="varios">Varios</option>
          </select>
        </div>
  
        <div className="form-group">
          <label htmlFor="nro">Numero de Obra</label>
          <input type="number" id="nro" name="nro" value={data.nro} onChange={handleChange} disabled={!isEditable} />
        </div>
  
        <div className="form-group grid-col-span-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div className="form-group">
            <label htmlFor="descripcion">Descripción de la Obra</label>
            <textarea id="descripcion" name="descripcion" value={data.descripcion} onChange={handleChange} rows="10" placeholder="Descripción de los trabajos a realizar..." disabled={!isEditable}></textarea>
          </div>
          <div className="form-group">
            <label>Imagen de Portada</label>
            <div className="image-preview-container">
              <img 
                src={data.imagen_url ? `http://localhost:8080${data.imagen_url}` : '/uploads/default-obra.png'} 
                alt="Portada actual" 
                className="image-preview" 
                onError={(e) => { e.target.onerror = null; e.target.src = '/uploads/default-obra.png'; }}
              />
            </div>
            <ImageUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} setIsCropping={setIsCropping} disabled={!isEditable} />
          </div>
        </div>
      </div>
    </div>
  );

const Step2 = ({ data, handleChange, setFormData, inspectores, errors }) => {
    const [markerPosition, setMarkerPosition] = useState({ lat: data.latitude, lng: data.longitude });

    useEffect(() => {
        setFormData(prev => ({ ...prev, latitude: markerPosition.lat, longitude: markerPosition.lng }));
    }, [markerPosition, setFormData]);

    function DraggableMarker() {
        const markerRef = useRef(null);
        const eventHandlers = useMemo(() => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) setMarkerPosition(marker.getLatLng());
            },
        }), []);
        return <Marker draggable={true} eventHandlers={eventHandlers} position={markerPosition} ref={markerRef} />;
    }

    function MapEvents() {
        useMapEvents({ click(e) { setMarkerPosition(e.latlng); } });
        return null;
    }

    return (
        <div className="form-step">
            <div className="form-grid-2-cols" style={{gap: '3rem', marginBottom: '1rem'}}>
                <div>
                    <div className="map-container-wizard">
                        <MapContainer center={markerPosition} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                            <LayersControl position="topright">
                                <LayersControl.BaseLayer checked name="Mapa">
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                </LayersControl.BaseLayer>
                                <LayersControl.BaseLayer name="Satélite">
                                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                </LayersControl.BaseLayer>
                            </LayersControl>
                            <DraggableMarker />
                            <MapEvents />
                        </MapContainer>
                    </div>
                    <p className="map-helper-text">Haga clic o arrastre el marcador para fijar la ubicación.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label htmlFor="localidad_id">Localidad <span className="mandatory-star">*</span></label>
                        <CreatableAutocomplete
                            name="localidad_id"
                            value={data.localidad_nombre} // Mostramos el nombre
                            onChange={(e) => {
                                // Cuando cambia, guardamos el nombre para la UI, pero el ID se manejará en el backend
                                handleChange({ target: { name: 'localidad_nombre', value: e.target.value } });
                                handleChange({ target: { name: 'localidad_id', value: e.target.value } });
                            }}
                            placeholder="Buscar o crear localidad..."
                            apiEndpoint="/localidades"
                        />
                        {errors.localidad_id && <span className="error-message">{errors.localidad_id}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="contratista">Contratista <span className="mandatory-star">*</span></label>
                        <CreatableAutocomplete
                            name="contratista"
                            value={data.contratista_nombre}
                            onChange={(e) => {
                                handleChange({ target: { name: 'contratista_nombre', value: e.target.value } });
                                handleChange({ target: { name: 'contratista', value: e.target.value } });
                            }}
                            placeholder="Buscar o crear contratista..."
                            apiEndpoint="/contribuyentes"
                        />
                        {errors.contratista && <span className="error-message">{errors.contratista}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="inspector_id">Inspector Asignado <span className="mandatory-star">*</span></label>
                        <select id="inspector_id" name="inspector_id" value={data.inspector_id} onChange={handleChange}>
                            <option value="">-- Sin Asignar --</option>
                            {inspectores.map(insp => <option key={insp.id} value={insp.id}>{insp.nombre}</option>)}
                        </select>
                        {errors.inspector_id && <span className="error-message">{errors.inspector_id}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="rep_legal">Representante Legal <span className="mandatory-star">*</span></label>
                        <CreatableAutocomplete
                            name="rep_legal"
                            value={data.rep_legal_nombre}
                            onChange={(e) => {
                                handleChange({ target: { name: 'rep_legal_nombre', value: e.target.value } });
                                handleChange({ target: { name: 'rep_legal', value: e.target.value } });
                            }}
                            placeholder="Buscar o crear representante..."
                            apiEndpoint="/representantes-legales"
                        />
                        {errors.rep_legal && <span className="error-message">{errors.rep_legal}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Step3 = ({ data, handleChange, errors }) => (
    <div className="form-step">
        <div className="form-grid-2-cols" style={{gap: '3rem', marginBottom: '1rem'}}>
            <div className="form-group">
                <label htmlFor="monto_sapem">Monto SAPEM ($) <span className="mandatory-star">*</span></label>
                <CurrencyInput name="monto_sapem" value={data.monto_sapem} onChange={handleChange} placeholder="150.000,00" />
                {errors.monto_sapem && <span className="error-message">{errors.monto_sapem}</span>}
            </div>
            <div className="form-group">
                <label htmlFor="monto_sub">Monto Subcontrato ($) <span className="mandatory-star">*</span></label>
                <CurrencyInput name="monto_sub" value={data.monto_sub} onChange={handleChange} placeholder="75.000,00" />
                {errors.monto_sub && <span className="error-message">{errors.monto_sub}</span>}
            </div>
            <div className="form-group">
                <label htmlFor="af">Aporte Financiero ($) <span className="mandatory-star">*</span></label>
                <CurrencyInput name="af" value={data.af} onChange={handleChange} placeholder="50.000,00" />
                {errors.af && <span className="error-message">{errors.af}</span>}
            </div>
            <div className="form-group">
                <label htmlFor="plazo_dias">Plazo de Ejecución (días) <span className="mandatory-star">*</span></label>
                <input type="number" id="plazo_dias" name="plazo_dias" value={data.plazo_dias} onChange={handleChange} placeholder="90" />
                {errors.plazo_dias && <span className="error-message">{errors.plazo_dias}</span>}
            </div>
            <div className="form-group">
                <label htmlFor="fecha_inicio">Fecha de Inicio <span className="mandatory-star">*</span></label>
                <input type="date" id="fecha_inicio" name="fecha_inicio" value={data.fecha_inicio} onChange={handleChange} />
                {errors.fecha_inicio && <span className="error-message">{errors.fecha_inicio}</span>}
            </div>
            <div className="form-group">
                <label htmlFor="estado">Estado de la Obra <span className="mandatory-star">*</span></label>
                <select id="estado" name="estado" value={data.estado} onChange={handleChange}>
                    <option value="Solicitud">Solicitud</option>
                    <option value="Proceso de compulsa">Proceso de compulsa</option>
                    <option value="En ejecución">En ejecución</option>
                    <option value="Finalizada">Finalizada</option>
                    <option value="Anulada">Anulada</option>
                </select>
            </div>
        </div>
    </div>
);


// --- Componente de Navegación ---
const Navigation = ({ currentStep, handlePrev, handleNext, isSubmitting, isCropping }) => (
  <>
    {currentStep > 1 ? (
        <button type="button" className="btn-secondary" onClick={handlePrev}>Anterior</button>
    ) : (
        <div></div>
    )}
    {currentStep < STEPS.length ? (
      <button type="button" className="btn-primary" onClick={handleNext} disabled={isCropping}>{isCropping ? 'Recortando...' : 'Siguiente'}</button>
    ) : (
      <button type="submit" className="btn-primary" disabled={isSubmitting || isCropping}>{isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}</button>
    )}
  </>
);

// --- Componente Principal del Wizard de Edición ---
function ObraEditForm({ obraData, onSubmit, onCancel }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(obraData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [inspectores, setInspectores] = useState([]);

  const isEditable = useMemo(() => {
    if (!user) return false;
    const roles = user.roles || [];
    if (roles.includes('admin') || roles.includes('supervisor')) {
      return true;
    }
    if (roles.includes('inspector')) {
      const createdAt = new Date(obraData.createdAt);
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    }
    return false;
  }, [user, obraData.createdAt]);

  useEffect(() => {
    // Formatear fechas para el input type="date"
    const formattedData = {
        ...obraData,
        fecha_inicio: obraData.fecha_inicio ? new Date(obraData.fecha_inicio).toISOString().split('T')[0] : '',
        fecha_finalizacion_estimada: obraData.fecha_finalizacion_estimada ? new Date(obraData.fecha_finalizacion_estimada).toISOString().split('T')[0] : '',
    };
    setFormData(formattedData);
  }, [obraData]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const inspectoresRes = await api.get('/usuarios/inspectores');
        setInspectores(inspectoresRes.data);
      } catch (error) {
        console.error("Error al cargar inspectores:", error);
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    const { fecha_inicio, plazo_dias } = formData;
    if (fecha_inicio && plazo_dias) {
      const startDate = new Date(fecha_inicio);
      const days = parseInt(plazo_dias, 10);
      if (!isNaN(startDate.getTime()) && !isNaN(days) && days >= 0) {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + days);
        const calculatedEndDate = endDate.toISOString().split('T')[0];
        if (formData.fecha_finalizacion_estimada !== calculatedEndDate) {
          setFormData(prev => ({ ...prev, fecha_finalizacion_estimada: calculatedEndDate }));
        }
      }
    }
  }, [formData.fecha_inicio, formData.plazo_dias, formData.fecha_finalizacion_estimada]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = async () => {
    const newErrors = {};
    switch (currentStep) {
      case 1:
        if (!formData.establecimiento) newErrors.establecimiento = 'El título es requerido.';
        if (!formData.numero_gestion) newErrors.numero_gestion = 'El número de gestión es requerido.';
        else {
          try {
            const response = await api.get(`/obras/check-gestion/${formData.numero_gestion}`);
            if (response.data.exists && response.data.id !== formData.id) {
              newErrors.numero_gestion = 'Este número de gestión ya está en uso en otra obra.';
            }
          } catch (error) {
            console.error("Error al verificar número de gestión:", error);
          }
        }
        break;
      case 2:
        if (!formData.localidad_id && !formData.localidad_nombre) newErrors.localidad_id = 'La localidad es requerida.';
        if (!formData.contratista && !formData.contratista_nombre) newErrors.contratista = 'El contratista es requerido.';
        if (!formData.inspector_id) newErrors.inspector_id = 'El inspector es requerido.';
        if (!formData.rep_legal && !formData.rep_legal_nombre) newErrors.rep_legal = 'El representante legal es requerido.';
        break;
      case 3:
        if (!formData.monto_sapem) newErrors.monto_sapem = 'El Monto SAPEM es requerido.';
        if (!formData.monto_sub) newErrors.monto_sub = 'El Monto Subcontrato es requerido.';
        if (!formData.af) newErrors.af = 'El Aporte Financiero es requerido.';
        if (!formData.plazo_dias) newErrors.plazo_dias = 'El plazo de ejecución es requerido.';
        if (!formData.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida.';
        break;
      default:
        break;
    }
    setErrors(newErrors);
    await new Promise(resolve => setTimeout(resolve, 0));
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (await validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (await validateStep()) {
      setIsSubmitting(true);
      try {
        let imageUrl = formData.imagen_url;
        if (selectedFile) {
          const uploadFormData = new FormData();
          uploadFormData.append('imagen', selectedFile);
          const response = await api.post('/upload', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          imageUrl = response.data.imageUrl;
        }

        const finalFormData = { ...formData, imagen_url: imageUrl };
        
        // Mapeo de campos antes de enviar
        const dataToSend = {
            ...finalFormData,
            detalle: finalFormData.descripcion, // Backend espera 'detalle'
            plazo: finalFormData.plazo_dias, // Backend espera 'plazo'
        };

        await onSubmit(dataToSend);

      } catch (error) {
        console.error("Error en el proceso de actualización:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="modal-overlay">
        <div className="modal-content-form" onClick={e => e.stopPropagation()}>
            <form className="wizard-form-container" onSubmit={handleFinalSubmit} style={{height: '90vh', width: '70vw'}}>
                <div className="wizard-header">
                    <Stepper currentStep={currentStep} />
                    <button onClick={onCancel} className="wizard-close-button" aria-label="Cerrar modal" type="button">
                        <span aria-hidden="true">( x )</span>
                    </button>
                </div>
                <div className="wizard-body">
                    {currentStep === 1 && <Step1 data={formData} handleChange={handleChange} errors={errors} selectedFile={selectedFile} setSelectedFile={setSelectedFile} setIsCropping={setIsCropping} />}
                    {currentStep === 2 && <Step2 data={formData} handleChange={handleChange} setFormData={setFormData} inspectores={inspectores} errors={errors} />}
                    {currentStep === 3 && <Step3 data={formData} handleChange={handleChange} errors={errors} />}
                </div>
                <div className="wizard-footer">
                    <div className="footer-notes">
                    <p><span className="mandatory-star">*</span> Campos obligatorios</p>
                    </div>
                    <div className="navigation-buttons">
                    <Navigation currentStep={currentStep} handlePrev={handlePrev} handleNext={handleNext} isSubmitting={isSubmitting} isCropping={isCropping} />
                    </div>
                </div>
            </form>
        </div>
    </div>
  );
}

export default ObraEditForm;
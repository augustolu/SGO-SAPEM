import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ObraWizardForm.css';
import api from '../services/api'; // Importamos el cliente de API

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

const obraSchema = {
  titulo: '', // Cambiado para coincidir con el backend
  numero_gestion: '',
  categoria: 'varios',
  descripcion: '', // Cambiado para coincidir con el backend
  nro: '',
  latitude: -33.2986, // San Luis, Argentina
  longitude: -66.3377, // San Luis, Argentina
  localidad: '',
  ubicacion: '', // Campo para la dirección textual
  contratista: '',
  inspector_id: '',
  rep_legal: '', // Cambiado para coincidir con el backend
  monto_sapem: '',
  monto_sub: '',
  af: '',
  plazo_dias: '', // Cambiado para coincidir con el backend
  fecha_inicio: '',
  fecha_finalizacion_estimada: '',
  estado: 'Solicitud',
};

// --- NUEVO: Componente para Input de Moneda ---
const CurrencyInput = ({ name, value, onChange, placeholder }) => {
  const formatCurrency = (numStr) => {
    if (!numStr) return '';
    const [integerPart, decimalPart] = numStr.split(',');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
  };

  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    // Permitir solo números, comas y puntos
    const sanitizedValue = rawValue.replace(/[^0-9,.]/g, '');
    const parts = sanitizedValue.split(',');
    // Reemplazar puntos por nada (para limpiar) y luego la primera coma por un punto decimal
    const numericValue = parts.join('.').replace(/\.(?=[^.]*\.)/g, '');

    onChange({ target: { name, value: numericValue } });
  };

  return (
    <div className="input-with-prefix">
      <span className="input-prefix">ARS</span>
      <input type="text" name={name} value={formatCurrency(String(value).replace('.', ','))} onChange={handleInputChange} placeholder={placeholder} style={{ border: 'none', boxShadow: 'none', paddingLeft: '0.5rem' }} />
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
const Step1 = ({ data, handleChange, errors }) => (
  <div className="form-step">
    <div className="form-grid-2-cols" style={{gap: '3rem', marginBottom: '1rem'}}>
      {/* Columna 1 */}
      <div className="form-group">
        <label htmlFor="titulo">Título / Establecimiento *</label>
        <input type="text" id="titulo" name="titulo" value={data.titulo} onChange={handleChange} placeholder="Nombre del lugar de la obra" />
        {errors.titulo && <span className="error-message">{errors.titulo}</span>}
      </div>

      {/* Columna 2 */}
      <div className="form-group">
        <label htmlFor="numero_gestion">Número de Gestión *</label>
        <input type="text" id="numero_gestion" name="numero_gestion" value={data.numero_gestion} onChange={handleChange} placeholder="Ej: 2024-001-A" />
        {errors.numero_gestion && <span className="error-message">{errors.numero_gestion}</span>}
      </div>

      {/* Columna 1 */}
      <div className="form-group">
        <label htmlFor="categoria">Categoría *</label>
        <select id="categoria" name="categoria" value={data.categoria} onChange={handleChange}>
          <option value="salud">Salud</option>
          <option value="educación">Educación</option>
          <option value="deporte">Deporte</option>
          <option value="secretaría general">Secretaría General</option>
          <option value="vialidad">Vialidad</option>
          <option value="obra pública">Obra Pública</option>
          <option value="varios">Varios</option>
        </select>
      </div>

      {/* Columna 2 */}
      <div className="form-group">
        <label htmlFor="nro">Nro de Obra (opcional)</label>
        <input type="number" id="nro" name="nro" value={data.nro} onChange={handleChange} />
      </div>

      {/* Ocupa ambas columnas */}
      <div className="form-group grid-col-span-2">
        <label htmlFor="descripcion">Descripción de la Obra</label>
        <textarea id="descripcion" name="descripcion" value={data.descripcion} onChange={handleChange} rows="4" placeholder="Descripción de los trabajos a realizar..."></textarea>
      </div>
    </div>
  </div>
);

const Step2 = ({ data, handleChange, setFormData, inspectores, errors }) => {
    const [markerPosition, setMarkerPosition] = useState({ lat: data.latitude, lng: data.longitude });
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeoutRef = useRef(null);
    const ignoreReverseGeocodeRef = useRef(false); // Flag para evitar que la geocodificación inversa sobrescriba la entrada del usuario
    const suggestionsRef = useRef(null); // Ref para el contenedor de sugerencias

    useEffect(() => {
        setFormData(prev => ({ ...prev, latitude: markerPosition.lat, longitude: markerPosition.lng }));

        // Evitar que la geocodificación inversa sobrescriba la entrada del usuario
        if (ignoreReverseGeocodeRef.current) {
            ignoreReverseGeocodeRef.current = false; // Resetear el flag
            return;
        }

        // Geocodificación inversa: Coordenadas -> Dirección
        const fetchAddress = async () => {
            try {
                const response = await api.get(`/geocode/reverse?lat=${markerPosition.lat}&lon=${markerPosition.lng}`);
                const result = response.data;
                if (result && result.display_name) {
                    setFormData(prev => ({ ...prev, ubicacion: result.display_name }));
                }
            } catch (error) {
                console.error("Error en geocodificación inversa:", error);
            }
        };
        fetchAddress();
    }, [markerPosition, setFormData]);

    // Manejador para ocultar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Componente para el marcador arrastrable
    function DraggableMarker() {
        const markerRef = useRef(null);
        const eventHandlers = useMemo(() => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) setMarkerPosition(marker.getLatLng());
            },
        }), [setMarkerPosition]);
        return <Marker draggable={true} eventHandlers={eventHandlers} position={markerPosition} ref={markerRef} />;
    }

    // Componente para manejar eventos del mapa (clic)
    function MapEvents() {
        useMapEvents({ click(e) { setMarkerPosition(e.latlng); } });
        return null;
    }

    // Función de búsqueda debounced para sugerencias
    const debouncedSearch = useMemo(() => {
        let timeoutId;
        return async (query) => {
            clearTimeout(timeoutId);
            if (query.length < 3) { // Solo buscar si la consulta tiene al menos 3 caracteres
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }
            timeoutId = setTimeout(async () => {
                try {
                    console.log('DEBUG: Searching for suggestions with query:', query);
                    const response = await api.get(`/geocode/search?q=${encodeURIComponent(query)}&country=Argentina&limit=5`);
                    const result = response.data;
                    console.log('DEBUG: Nominatim suggestions result:', result);
                    setSuggestions(result);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Error en geocodificación (sugerencias):", error);
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }, 500); // Debounce de 500ms
        };
    }, []);

    // Manejador para el cambio en el input de ubicación (con autocompletado)
    const handleUbicacionChange = (e) => {
        const { value } = e.target;
        handleChange(e); // Actualiza el formData.ubicacion
        debouncedSearch(value); // Inicia la búsqueda debounced
    };

    // Manejador para cuando se selecciona una sugerencia
    const handleSuggestionClick = (suggestion) => {
        ignoreReverseGeocodeRef.current = true; // Establece el flag para evitar sobrescritura
        setFormData(prev => ({ ...prev, ubicacion: suggestion.display_name }));
        setMarkerPosition({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // Manejador para el botón "Buscar" (búsqueda explícita)
    const handleAddressSearch = async () => {
        if (!data.ubicacion) return;
        try {
            console.log('DEBUG: Explicit search for address:', data.ubicacion);
            const response = await api.get(`/geocode/search?q=${encodeURIComponent(data.ubicacion)}&country=Argentina&limit=1`);
            const result = response.data;
            console.log('DEBUG: Nominatim explicit search result:', result);
            if (result && result.length > 0) {
                const { lat, lon } = result[0];
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                ignoreReverseGeocodeRef.current = true; // Establece el flag
                setMarkerPosition(newPos);
                setSuggestions([]); // Limpiar sugerencias
                setShowSuggestions(false);
            } else {
                alert("Dirección no encontrada.");
            }
        } catch (error) {
            console.error("Error en geocodificación:", error);
        }
    };

    return (
        <div className="form-step">
            <div className="form-grid-2-cols" style={{gap: '3rem', marginBottom: '1rem'}}>
                {/* Columna 1: Mapa */}
                <div>
                    <div className="map-container-wizard">
                        <MapContainer center={markerPosition} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <DraggableMarker />
                            <MapEvents />
                        </MapContainer>
                    </div>
                    <p className="map-helper-text">Haga clic o arrastre el marcador para fijar la ubicación.</p>
                </div>

                {/* Columna 2: Campos apilados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label htmlFor="localidad">Localidad *</label>
                        <input type="text" id="localidad" name="localidad" value={data.localidad} onChange={handleChange} placeholder="Ej: Goya, Corrientes" />
                        {errors.localidad && <span className="error-message">{errors.localidad}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="ubicacion">Dirección (para el mapa)</label>
                        <div className="suggestions-container" ref={suggestionsRef}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    id="ubicacion"
                                    name="ubicacion"
                                    value={data.ubicacion}
                                    onChange={handleUbicacionChange} // Usar el nuevo manejador
                                    placeholder="Calle Falsa 123, Barrio..." style={{ flexGrow: 1 }}
                                />
                            <button type="button" className="btn-secondary" onClick={handleAddressSearch} style={{ flexShrink: 0, padding: '0 1rem' }}>Buscar</button>
                            </div>
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="suggestions-list">
                                    {suggestions.map((sug, index) => (
                                        <li key={index} onClick={() => handleSuggestionClick(sug)}>
                                            {sug.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="contratista">Contratista</label>
                        <input type="text" id="contratista" name="contratista" value={data.contratista} onChange={handleChange} placeholder="Nombre de la empresa o persona" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="inspector_id">Inspector Asignado</label>
                        <select id="inspector_id" name="inspector_id" value={data.inspector_id} onChange={handleChange}>
                            <option value="">-- Sin Asignar --</option>
                            {inspectores.map(insp => <option key={insp.id} value={insp.id}>{insp.nombre}</option>)}
                        </select>
                        {errors.inspector_id && <span className="error-message">{errors.inspector_id}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="rep_legal">Representante Legal</label>
                        <input type="text" id="rep_legal" name="rep_legal" value={data.rep_legal} onChange={handleChange} placeholder="Nombre del representante" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Step3 = ({ data, handleChange }) => (
    <div className="form-step">
        <div className="form-grid-2-cols" style={{gap: '3rem', marginBottom: '1rem'}}>
            {/* Col 1 */}
            <div className="form-group">
                <label htmlFor="monto_sapem">Monto SAPEM ($)</label>
                <CurrencyInput name="monto_sapem" value={data.monto_sapem} onChange={handleChange} placeholder="150.000,00" />
            </div>
            {/* Col 2 */}
            <div className="form-group">
                <label htmlFor="monto_sub">Monto Subcontrato ($)</label>
                <CurrencyInput name="monto_sub" value={data.monto_sub} onChange={handleChange} placeholder="75.000,00" />
            </div>
            {/* Col 1 */}
            <div className="form-group">
                <label htmlFor="af">Aporte Financiero ($)</label>
                <CurrencyInput name="af" value={data.af} onChange={handleChange} placeholder="50.000,00" />
            </div>
            {/* Col 2 */}
            <div className="form-group">
                <label htmlFor="plazo_dias">Plazo de Ejecución (días)</label>
                <input type="number" id="plazo_dias" name="plazo_dias" value={data.plazo_dias} onChange={handleChange} placeholder="90" />
            </div>
            {/* Col 1 */}
            <div className="form-group">
                <label htmlFor="fecha_inicio">Fecha de Inicio</label>
                <input type="date" id="fecha_inicio" name="fecha_inicio" value={data.fecha_inicio} onChange={handleChange} />
            </div>
            {/* Col 2 */}
            <div className="form-group">
                <label htmlFor="fecha_finalizacion_estimada">Finalización Estimada</label>
                <input type="date" id="fecha_finalizacion_estimada" name="fecha_finalizacion_estimada" value={data.fecha_finalizacion_estimada} onChange={handleChange} />
            </div>
            
            <div className="form-group grid-col-span-2">
                <label htmlFor="estado">Estado Inicial *</label>
                <select id="estado" name="estado" value={data.estado} onChange={handleChange}>
                    <option value="Solicitud">Solicitud</option>
                    <option value="Proceso de compulsa">Proceso de compulsa</option>
                </select>
            </div>
        </div>
    </div>
);


// --- Componente de Navegación ---
const Navigation = ({ currentStep, handlePrev, handleNext, isSubmitting }) => (
  <>
    {currentStep > 1 ? (
        <button type="button" className="btn-secondary" onClick={handlePrev}>Anterior</button>
    ) : (
        <div></div> /* Placeholder para mantener el layout */
    )}
    {currentStep < STEPS.length ? (
      <button type="button" className="btn-primary" onClick={handleNext}>Siguiente</button>
    ) : (
      <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Finalizar Creación'}</button>
    )}
  </>
);

// --- Componente Principal del Wizard ---
function ObraWizardForm({ onSubmit }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(obraSchema);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Simulación de carga de datos para desplegables ---
  const [inspectores, setInspectores] = useState([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Usamos el endpoint que ya existe para traer solo inspectores
        const inspectoresResponse = await api.get('/usuarios/inspectores');
        console.log('DEBUG: Inspectores recibidos del backend:', inspectoresResponse.data); // Añadido para depuración
        setInspectores(inspectoresResponse.data);
      } catch (error) {
        console.error("Error al cargar datos para los desplegables:", error);
      }
    };
    fetchDropdownData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    const newErrors = {};
    switch (currentStep) {
      case 1:
        if (!formData.titulo) newErrors.titulo = 'El título es requerido.';
        if (!formData.numero_gestion) newErrors.numero_gestion = 'El número de gestión es requerido.';
        break;
      case 2:
        if (!formData.localidad) newErrors.localidad = 'La localidad es requerida.';
        if (!formData.inspector_id) newErrors.inspector_id = 'Debe asignar un inspector.';
        break;
      case 3:
        if (!formData.plazo_dias) newErrors.plazo_dias = 'El plazo es requerido.';
        if (!formData.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida.';
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (validateStep()) {
        setIsSubmitting(true);
        await onSubmit(formData);
        setIsSubmitting(false);
    }
  };

  return (
    <form className="wizard-form-container" onSubmit={handleFinalSubmit}>
      <div className="wizard-header">
        <Stepper currentStep={currentStep} />
      </div>
      <div className="wizard-body">
        {currentStep === 1 && <Step1 data={formData} handleChange={handleChange} errors={errors} />}
        {currentStep === 2 && <Step2 data={formData} handleChange={handleChange} setFormData={setFormData} inspectores={inspectores} errors={errors} />}
        {currentStep === 3 && <Step3 data={formData} handleChange={handleChange} />}
      </div>
      <div className="wizard-footer">
        <Navigation currentStep={currentStep} handlePrev={handlePrev} handleNext={handleNext} isSubmitting={isSubmitting} />
      </div>
    </form>
  );
}

export default ObraWizardForm;
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ObraWizardForm.css';
import api from '../services/api'; // Importamos el cliente de API
import CreatableAutocomplete from './CreatableAutocomplete.jsx'; // ¡Importamos el nuevo componente!
import ImageUpload from './ImageUpload.jsx';
import './ImageUpload.css';

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
  establecimiento: '', // Cambiado para coincidir con el backend
  numero_gestion: '',
  categoria: 'varios',
  descripcion: '', // Cambiado para coincidir con el backend
  nro: '',
  latitude: -33.2986, // San Luis, Argentina
  longitude: -66.3377, // San Luis, Argentina
  localidad_id: '', // Cambiado para coincidir con el backend
  ubicacion: '', // Campo para la dirección textual
  contratista: '',
  inspector_id: '', // Cambiado para coincidir con el backend
  rep_legal: '', // Cambiado para coincidir con el backend
  monto_sapem: '',
  monto_sub: '',
  af: '',
  plazo_dias: '', // Cambiado para coincidir con el backend
  fecha_inicio: '',
  fecha_finalizacion_estimada: '',
  estado: 'En ejecución', // Estado inicial por defecto
  progreso: 0,
  cantidad_contratos: '', // Nuevo campo para la cantidad de contratos
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
    // 1. Quitar los puntos de miles que son solo para formato visual.
    const withoutThousandSeparators = rawValue.replace(/\./g, '');
    // 2. Reemplazar la coma decimal (si existe) por un punto para el procesamiento numérico.
    const withDecimalPoint = withoutThousandSeparators.replace(',', '.');
    // 3. Permitir solo números y un único punto decimal.
    const sanitizedValue = withDecimalPoint.replace(/[^0-9.]/g, '');
    // 4. Asegurarse de que solo haya un punto decimal.
    const parts = sanitizedValue.split('.');
    // 5. Limitar a dos decimales.
    const numericValue =
      parts.length > 1
        ? `${parts[0]}.${parts.slice(1).join('').substring(0, 2)}`
        : parts[0];

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
const Step1 = ({ data, handleChange, errors, selectedFile, setSelectedFile, setIsCropping }) => (
  <div className="form-step">
    <div className="form-grid-2-cols" style={{gap: '3rem', marginBottom: '1rem'}}>
      {/* Columna 1 */}
      <div className="form-group">
        <label htmlFor="titulo">Título / Establecimiento <span className="mandatory-star">*</span></label>
        <input type="text" id="establecimiento" name="establecimiento" value={data.establecimiento} onChange={handleChange} placeholder="Nombre del lugar de la obra" />
        {errors.establecimiento && <span className="error-message">{errors.establecimiento}</span>}
      </div>

      {/* Columna 2 */}
      <div className="form-group">
        <label htmlFor="numero_gestion">Número de Gestión <span className="mandatory-star">*</span></label>
        <input type="text" id="numero_gestion" name="numero_gestion" value={data.numero_gestion} onChange={handleChange} placeholder="Ej: 2024-001-A" maxLength={12} />
        {errors.numero_gestion && <span className="error-message">{errors.numero_gestion}</span>}
      </div>

      {/* Columna 1 */}
      <div className="form-group">
        <label htmlFor="categoria">Categoría <span className="mandatory-star">*</span></label>
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
        <label htmlFor="nro">Numero de Obra</label>
        <input type="number" id="nro" name="nro" value={data.nro} onChange={handleChange} />
      </div>

      {/* Nueva sección de 2 columnas para Descripción e Imagen */}
      <div className="form-group grid-col-span-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <div className="form-group">
          <label htmlFor="descripcion">Descripción de la Obra</label>
          <textarea id="descripcion" name="descripcion" value={data.descripcion} onChange={handleChange} rows="10" placeholder="Descripción de los trabajos a realizar..."></textarea>
        </div>
        <div className="form-group">
          <label>Imagen de Portada</label>
          <ImageUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} setIsCropping={setIsCropping} />
        </div>
      </div>
    </div>
  </div>
);

const Step2 = ({ data, handleChange, setFormData, inspectores, representantes, errors }) => {
    const [markerPosition, setMarkerPosition] = useState({ lat: data.latitude, lng: data.longitude });
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeoutRef = useRef(null);
    const ignoreReverseGeocodeRef = useRef(false); // Flag para evitar que la geocodificación inversa sobrescriba la entrada del usuario
    const suggestionsRef = useRef(null); // Ref para el contenedor de sugerencias

    useEffect(() => {
        console.log('Frontend: markerPosition changed:', markerPosition);
        setFormData(prev => ({ ...prev, latitude: markerPosition.lat, longitude: markerPosition.lng }));

        // Evitar que la geocodificación inversa sobrescriba la entrada del usuario
        if (ignoreReverseGeocodeRef.current) {
            ignoreReverseGeocodeRef.current = false; // Resetear el flag
            return;
        }

        // Geocodificación inversa: Coordenadas -> Dirección
        const fetchAddress = async () => {
            const reverseGeocodeUrl = `/geocode/reverse?lat=${markerPosition.lat}&lon=${markerPosition.lng}`;
            console.log('Frontend: Initiating reverse geocode for lat:', markerPosition.lat, 'lon:', markerPosition.lng);
            console.log('Frontend: Sending reverse geocode request to backend:', reverseGeocodeUrl);
            try {
                const response = await api.get(reverseGeocodeUrl);
                const result = response.data;
                console.log('Frontend: Reverse geocode successful, result:', result);
                if (result && result.display_name) {
                    setFormData(prev => ({ ...prev, ubicacion: result.display_name }));
                }
            } catch (error) {
                console.error("Error en geocodificación inversa:", error);
                console.error('Frontend: Reverse geocode error response status:', error.response?.status);
                console.error('Frontend: Reverse geocode error response data:', error.response?.data);
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
                console.log('Frontend: Debounced search initiated for query:', query);
                try {
                    const searchUrl = `/geocode/search?q=${encodeURIComponent(query)}&country=Argentina&limit=5`;
                    console.log('Frontend: Sending debounced search request to backend:', searchUrl);
                    const response = await api.get(searchUrl);
                    const result = response.data;
                    console.log('Frontend: Nominatim raw suggestions result:', result);
                    
                    // Filtramos las sugerencias para mostrar solo las de San Luis
                    const filteredSuggestions = result.filter(s => 
                        s.display_name.toLowerCase().includes('san luis')
                    );
                    setSuggestions(filteredSuggestions);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Error en geocodificación (sugerencias):", error);
                    console.error('Frontend: Suggestions error response status:', error.response?.status);
                    console.error('Frontend: Suggestions error response data:', error.response?.data);
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }, 500); // Debounce de 500ms
        };
    }, []);

    // Manejador para el cambio en el input de ubicación (con autocompletado)
    const handleUbicacionChange = (e) => {
        const { value } = e.target;
        console.log('Frontend: ubicacion input changed to:', value);
        handleChange(e); // Actualiza el formData.ubicacion
        debouncedSearch(value); // Inicia la búsqueda debounced
    };

    // Manejador para cuando se selecciona una sugerencia
    const handleSuggestionClick = (suggestion) => {
        ignoreReverseGeocodeRef.current = true; // Establece el flag para evitar sobrescritura
        console.log('Frontend: Suggestion selected:', suggestion);
        setFormData(prev => ({ ...prev, ubicacion: suggestion.display_name }));
        setMarkerPosition({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // Manejador para el botón "Buscar" (búsqueda explícita)
    const handleAddressSearch = async () => {
        if (!data.ubicacion) return;
        try {
            console.log('Frontend: Explicit search for address:', data.ubicacion);
            const searchUrl = `/geocode/search?q=${encodeURIComponent(data.ubicacion)}&country=Argentina&limit=1`;
            console.log('Frontend: Sending explicit search request to backend:', searchUrl);
            const response = await api.get(searchUrl);
            const result = response.data;
            console.log('Frontend: Nominatim explicit search result:', result);
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
            console.error('Frontend: Explicit search error response status:', error.response?.status);
            console.error('Frontend: Explicit search error response data:', error.response?.data);
        }
    };

    return (
        <div className="form-step">
            <div className="form-grid-2-cols" style={{gap: '3rem', marginBottom: '1rem'}}>
                {/* Columna 1: Mapa */}
                <div>
                    <div className="map-container-wizard">
                        <MapContainer center={markerPosition} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                            <LayersControl position="topright">
                                <LayersControl.BaseLayer checked name="Mapa">
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                </LayersControl.BaseLayer>
                                <LayersControl.BaseLayer name="Satélite">
                                    <TileLayer
                                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    />
                                </LayersControl.BaseLayer>
                            </LayersControl>
                            <DraggableMarker />
                            <MapEvents />
                        </MapContainer>
                    </div>
                    <p className="map-helper-text">Haga clic o arrastre el marcador para fijar la ubicación.</p>
                </div>

                {/* Columna 2: Campos apilados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label htmlFor="localidad_id">Localidad <span className="mandatory-star">*</span></label>
                        <CreatableAutocomplete
                            name="localidad_id"
                            value={data.localidad_id}
                            onChange={handleChange}
                            placeholder="Buscar o crear localidad..."
                            apiEndpoint="/localidades"
                        />
                        {errors.localidad_id && <span className="error-message">{errors.localidad_id}</span>}
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
                        <label htmlFor="contratista">Contratista <span className="mandatory-star">*</span></label>
                        <CreatableAutocomplete
                            name="contratista"
                            value={data.contratista}
                            onChange={handleChange}
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
                            value={data.rep_legal}
                            onChange={handleChange}
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
            {/* Col 1 */}
            <div className="form-group">
                <label htmlFor="monto_sapem">Monto SAPEM ($) <span className="mandatory-star">*</span></label>
                <CurrencyInput name="monto_sapem" value={data.monto_sapem} onChange={handleChange} placeholder="150.000,00" />
                {errors.monto_sapem && <span className="error-message">{errors.monto_sapem}</span>}
            </div>
            {/* Col 2 */}
            <div className="form-group">
                <label htmlFor="monto_sub">Monto Subcontrato ($) <span className="mandatory-star">*</span></label>
                <CurrencyInput name="monto_sub" value={data.monto_sub} onChange={handleChange} placeholder="75.000,00" />
                {errors.monto_sub && <span className="error-message">{errors.monto_sub}</span>}
            </div>
            {/* Col 1 */}
            <div className="form-group">
                <label htmlFor="af">Aporte Financiero ($) <span className="mandatory-star">*</span></label>
                <CurrencyInput name="af" value={data.af} onChange={handleChange} placeholder="50.000,00" />
                {errors.af && <span className="error-message">{errors.af}</span>}
            </div>
            {/* Col 2 */}
            <div className="form-group">
                <label htmlFor="plazo_dias">Plazo de Ejecución (días) <span className="mandatory-star">*</span></label>
                <input type="number" id="plazo_dias" name="plazo_dias" value={data.plazo_dias} onChange={handleChange} placeholder="90" />
                {errors.plazo_dias && <span className="error-message">{errors.plazo_dias}</span>}
            </div>
            {/* Col 1 */}
            <div className="form-group">
                <label htmlFor="fecha_inicio">Fecha de Inicio <span className="mandatory-star">*</span></label>
                <input type="date" id="fecha_inicio" name="fecha_inicio" value={data.fecha_inicio} onChange={handleChange} />
                {errors.fecha_inicio && <span className="error-message">{errors.fecha_inicio}</span>}
            </div>
            {/* Col 2 - NUEVO */}
            <div className="form-group">
              <label htmlFor="cantidad_contratos">Cantidad de Contratos (meses)</label>
              <input type="text" id="cantidad_contratos" name="cantidad_contratos" value={data.cantidad_contratos} onChange={handleChange} />
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
        <div></div> /* Placeholder para mantener el layout */
    )}
    {currentStep < STEPS.length ? (
      <button type="button" className="btn-primary" onClick={handleNext} disabled={isCropping}>{isCropping ? 'Recortando...' : 'Siguiente'}</button>
    ) : (
      <button type="submit" className="btn-primary" disabled={isSubmitting || isCropping}>{isSubmitting ? 'Creando...' : 'Finalizar Creación'}</button>
    )}
  </>
);

// --- Componente Principal del Wizard ---
function ObraWizardForm({ onSubmit }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(obraSchema);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // Nuevo estado para la imagen
  const [isCropping, setIsCropping] = useState(false); // ¡NUEVO ESTADO!
  const [isContractCountManuallyEdited, setIsContractCountManuallyEdited] = useState(false);

  // --- Simulación de carga de datos para desplegables ---
  const [inspectores, setInspectores] = useState([]);
  const [representantes, setRepresentantes] = useState([]); // NUEVO ESTADO

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Solo necesitamos cargar los inspectores para el dropdown
        const inspectoresRes = await api.get('/usuarios/inspectores');
        setInspectores(inspectoresRes.data);

        // Ya no necesitamos cargar representantes ni contribuyentes aquí,
        // el componente CreatableAutocomplete lo hará por su cuenta.

      } catch (error) {
        console.error("Error al cargar inspectores:", error);
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    const { fecha_inicio, plazo_dias } = formData;

    // --- Cálculo de Fecha de Finalización ---
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
      } else if (formData.fecha_finalizacion_estimada !== '') {
        setFormData(prev => ({ ...prev, fecha_finalizacion_estimada: '' }));
      }
    } else if (formData.fecha_finalizacion_estimada !== '') {
      setFormData(prev => ({ ...prev, fecha_finalizacion_estimada: '' }));
    }

    // --- Cálculo de Cantidad de Contratos (si no se ha editado manualmente) ---
    if (formData.plazo_dias && !isContractCountManuallyEdited) {
        const days = parseInt(formData.plazo_dias, 10);
        if (!isNaN(days) && days > 0) {
            const contractCount = Math.ceil(days / 30);
            if (formData.cantidad_contratos !== contractCount) {
                setFormData(prev => ({ ...prev, cantidad_contratos: contractCount }));
            }
        } else if (formData.cantidad_contratos !== '') {
            setFormData(prev => ({ ...prev, cantidad_contratos: '' }));
        }
    } else if (!formData.plazo_dias) {
        // Si se borra el plazo, y no se ha tocado el campo de contratos, se limpia
        if (!isContractCountManuallyEdited) {
            setFormData(prev => ({ ...prev, cantidad_contratos: '' }));
        }
    }
  }, [formData.fecha_inicio, formData.plazo_dias, isContractCountManuallyEdited, setFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'numero_gestion') {
      const rawValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      let formattedValue = rawValue;

      if (rawValue.length > 3) {
        formattedValue = `${rawValue.slice(0, 2)}-${rawValue.slice(2, 3)} - ${rawValue.slice(3, 7)}`;
      } else if (rawValue.length > 2) {
        formattedValue = `${rawValue.slice(0, 2)}-${rawValue.slice(2, 3)}`;
      }

      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'cantidad_contratos') {
        setIsContractCountManuallyEdited(true);
    }
  };

  const validateStep = async () => {
    const newErrors = {};
    let isValid = true;

    switch (currentStep) {
      case 1:
        if (!formData.establecimiento) {
          newErrors.establecimiento = 'El título es requerido.';
          isValid = false;
        }
        if (!formData.numero_gestion) {
          newErrors.numero_gestion = 'El número de gestión es requerido.';
          isValid = false;
        } else {
          // --- NUEVA VALIDACIÓN ASÍNCRONA ---
          try {
            const response = await api.get(`/obras/check-gestion/${formData.numero_gestion}`);
            if (response.data.exists) {
              newErrors.numero_gestion = 'Este número de gestión ya está en uso.';
              isValid = false;
            }
          } catch (error) {
            console.error("Error al verificar número de gestión:", error);
            // Opcional: manejar el error de la API, por ahora solo lo logueamos
          }
          // ---------------------------------
        }
        break;
      case 2:
        if (!formData.localidad_id) newErrors.localidad_id = 'La localidad es requerida.';
        if (!formData.contratista) newErrors.contratista = 'El contratista es requerido.';
        if (!formData.inspector_id) newErrors.inspector_id = 'El inspector es requerido.';
        if (!formData.rep_legal) newErrors.rep_legal = 'El representante legal es requerido.';
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
        let imageUrl = null;
        // Si hay un archivo seleccionado, subirlo primero
        if (selectedFile) {
          const uploadFormData = new FormData();
          uploadFormData.append('imagen', selectedFile);

          const response = await api.post('/upload', uploadFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          imageUrl = response.data.imageUrl;
        }

        // Combinar los datos del formulario con la URL de la imagen (si existe)
        const finalFormData = { ...formData, imagen_url: imageUrl };

        console.log('FRONTEND: Datos finales a enviar al backend:', finalFormData);
        await onSubmit(finalFormData); // Enviar los datos finales

      } catch (error) {
        console.error("Error en el proceso de subida o creación:", error);
        // Aquí podrías mostrar un mensaje de error al usuario
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form className="wizard-form-container" onSubmit={handleFinalSubmit}>
      <div className="wizard-header">
        <Stepper currentStep={currentStep} />
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
  );
}

export default ObraWizardForm;
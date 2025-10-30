
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ObraForm.css';

// FIX: Icono por defecto de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const obraSchema = {
  titulo: '', // Cambiado de 'establecimiento' a 'titulo'
  descripcion: '', // Cambiado de 'detalle' a 'descripcion'
  localidad: '',
  contratista: '',
  monto_sapem: '',
  monto_sub: '',
  af: '',
  plazo_dias: '', // Cambiado de 'plazo' a 'plazo_dias'
  rep_legal: '', // Cambiado de 'representante_legal_id' a 'rep_legal'
  numero_gestion: '',
  categoria: 'varios',
  estado: 'Solicitud',
  fecha_inicio: '',
  fecha_finalizacion_estimada: '',
  progreso: 0,
  motivo_anulacion: '',
  inspector_id: '',
  latitude: -27.7833, // Coordenadas por defecto (ej. Goya, Corrientes)
  longitude: -59.2667,
};

function DraggableMarker({ position, setPosition }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setPosition({ lat, lng });
        }
      },
    }),
    [setPosition],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

function MapEvents({ setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return null;
}


function ObraForm({ obra, onSubmit }) {
  const [formData, setFormData] = useState(obra || obraSchema);
  const [inspectores, setInspectores] = useState([]);
  const [representantes, setRepresentantes] = useState([]);
  const [markerPosition, setMarkerPosition] = useState({
    lat: formData.latitude,
    lng: formData.longitude,
  });

  useEffect(() => {
    // Simulación de carga de datos para los desplegables
    // En una app real, aquí se harían las llamadas a la API
    const fetchDropdownData = async () => {
      // Ejemplo de datos para inspectores
      setInspectores([
        { id: 1, nombre: 'Juan Pérez' },
        { id: 2, nombre: 'Ana Gómez' },
        { id: 3, nombre: 'Luis García' },
      ]);

      // Ejemplo de datos para representantes legales
      setRepresentantes([
        { id: 1, nombre: 'Representante Legal A' },
        { id: 2, nombre: 'Representante Legal B' },
      ]);
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    setFormData(prev => ({
        ...prev,
        latitude: markerPosition.lat,
        longitude: markerPosition.lng
    }));
  }, [markerPosition]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    console.log('Datos del formulario a enviar:', formData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="obra-form">
      <fieldset>
        <legend>Información General</legend>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="numero_gestion">Número de Gestión</label>
            <input type="text" id="numero_gestion" name="numero_gestion" value={formData.numero_gestion} onChange={handleChange} placeholder="Ej: 2024-001-A" />
          </div>
          <div className="form-group">
            <label htmlFor="titulo">Título / Establecimiento *</label>
            <input type="text" id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required placeholder="Nombre del lugar o título de la obra" />
          </div>
          <div className="form-group">
            <label htmlFor="nro">Numero de obra</label>
            <input type="number" id="nro" name="nro" value={formData.nro} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="categoria">Categoría *</label>
            <select id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} required>
              <option value="salud">Salud</option>
              <option value="educación">Educación</option>
              <option value="deporte">Deporte</option>
              <option value="secretaría general">Secretaría General</option>
              <option value="vialidad">Vialidad</option>
              <option value="obra pública">Obra Pública</option>
              <option value="varios">Varios</option>
            </select>
          </div>
          <div className="form-group form-group-full">
            <label htmlFor="descripcion">Descripción de la Obra</label>
            <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} rows="4" placeholder="Descripción de los trabajos a realizar..."></textarea>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Detalles Económicos y Plazos</legend>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="monto_sapem">Monto SAPEM ($)</label>
            <input type="number" step="0.01" id="monto_sapem" name="monto_sapem" value={formData.monto_sapem} onChange={handleChange} placeholder="Ej: 150000.00" />
          </div>
          <div className="form-group">
            <label htmlFor="monto_sub">Monto Subcontrato ($)</label>
            <input type="number" step="0.01" id="monto_sub" name="monto_sub" value={formData.monto_sub} onChange={handleChange} placeholder="Ej: 75000.00" />
          </div>
          <div className="form-group">
            <label htmlFor="af">Aporte Financiero ($)</label>
            <input type="number" step="0.01" id="af" name="af" value={formData.af} onChange={handleChange} placeholder="Ej: 50000.00" />
          </div>
           <div className="form-group">
            <label htmlFor="plazo_dias">Plazo de Ejecución (días)</label>
            <input type="number" id="plazo_dias" name="plazo_dias" value={formData.plazo_dias} onChange={handleChange} placeholder="Ej: 90" />
          </div>
          <div className="form-group">
            <label htmlFor="fecha_inicio">Fecha de Inicio</label>
            <input type="date" id="fecha_inicio" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="fecha_finalizacion_estimada">Fecha de Finalización Estimada</label>
            <input type="date" id="fecha_finalizacion_estimada" name="fecha_finalizacion_estimada" value={formData.fecha_finalizacion_estimada} onChange={handleChange} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Estado y Asignaciones</legend>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="estado">Estado *</label>
            <select id="estado" name="estado" value={formData.estado} onChange={handleChange} required>
              <option value="Solicitud">Solicitud</option>
              <option value="Proceso de compulsa">Proceso de compulsa</option>
              <option value="En ejecución">En ejecución</option>
              <option value="Finalizada">Finalizada</option>
              <option value="Anulada">Anulada</option>
            </select>
          </div>
           <div className="form-group">
            <label htmlFor="progreso">Progreso (%)</label>
            <input type="number" id="progreso" name="progreso" value={formData.progreso} onChange={handleChange} min="0" max="100" />
          </div>
          <div className="form-group">
            <label htmlFor="contratista">Contratista</label>
            <input type="text" id="contratista" name="contratista" value={formData.contratista} onChange={handleChange} placeholder="Nombre de la empresa o persona" />
          </div>
          <div className="form-group">
            <label htmlFor="inspector_id">Inspector Asignado</label>
            <select id="inspector_id" name="inspector_id" value={formData.inspector_id} onChange={handleChange}>
              <option value="">-- Sin Asignar --</option>
              {inspectores.map(insp => <option key={insp.id} value={insp.id}>{insp.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="rep_legal">Representante Legal</label>
            <select id="rep_legal" name="rep_legal" value={formData.rep_legal} onChange={handleChange}>
                <option value="">-- Sin Asignar --</option>
                {representantes.map(rep => <option key={rep.id} value={rep.id}>{rep.nombre}</option>)}
            </select>
          </div>
          {formData.estado === 'Anulada' && (
            <div className="form-group form-group-full">
              <label htmlFor="motivo_anulacion">Motivo de Anulación</label>
              <textarea id="motivo_anulacion" name="motivo_anulacion" value={formData.motivo_anulacion} onChange={handleChange} rows="3" placeholder="Explique por qué se anula la obra..."></textarea>
            </div>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend>Ubicación Geográfica</legend>
        <div className="form-grid">
            <div className="form-group">
                <label htmlFor="localidad">Localidad / Dirección</label>
                <input type="text" id="localidad" name="localidad" value={formData.localidad} onChange={handleChange} placeholder="Ej: Barrio San Martín, Calle Falsa 123" />
            </div>
        </div>
        <div className="map-container">
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
                <DraggableMarker position={markerPosition} setPosition={setMarkerPosition} />
                <MapEvents setPosition={setMarkerPosition} />
            </MapContainer>
        </div>
        <p className="map-helper-text">Haga clic en el mapa o arrastre el marcador para fijar la ubicación de la obra.</p>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn-submit">Guardar Obra</button>
        <button type="button" className="btn-cancel">Cancelar</button>
      </div>
    </form>
  );
}

export default ObraForm;

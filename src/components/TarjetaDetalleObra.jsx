import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './TarjetaDetalleObra.css';
import { useAuth } from '../context/AuthContext';
import CreatableAutocomplete from './CreatableAutocomplete';
import CurrencyInput from './CurrencyInput';
import ContratoUpload from './ContratoUpload'; // Importar el nuevo componente
import AnimatedProgressNumber from './AnimatedProgressNumber'; // Importar el nuevo componente
import api from '../services/api';

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const TarjetaDetalleObra = ({ obra: initialObra }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [obra, setObra] = useState(initialObra);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialObra);
  const [currentObraProgreso, setCurrentObraProgreso] = useState(initialObra.progreso);
  const [inspectores, setInspectores] = useState([]);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [inlineEditingField, setInlineEditingField] = useState(null);
  const markerRef = React.useRef(null);

  const isSimplifiedView = useMemo(() => {
    return ['Solicitud', 'Compulsa'].includes(obra.estado);
  }, [obra.estado]);

  const handleStatusChange = async (newStatus) => {
    try {
      // Si pasamos a "En ejecución", activamos el modo edición.
      if (newStatus === 'En ejecución') {
        setFormData(prev => ({ ...prev, estado: newStatus }));
        setIsEditing(true);
      }
      const response = await api.put(`/obras/${obra.id}`, { estado: newStatus });
      setIsStatusDropdownOpen(false);
      setObra(response.data); // Actualizar el estado local de la obra con los datos del backend
    } catch (error) {
      console.error("Error al actualizar el estado de la obra:", error);
    }
  };

  useEffect(() => {
    const fetchInspectores = async () => {
      try {
        const res = await api.get('/usuarios/inspectores');
        setInspectores(res.data);
      } catch (error) {
        console.error('Error fetching inspectores:', error);
      }
    };
    fetchInspectores();
  }, []);

  useEffect(() => {
    setObra(initialObra);
    setFormData(initialObra);
    setCurrentObraProgreso(initialObra.progreso);
  }, [initialObra]);



  const handleContratoUploadSuccess = async (newProgreso) => {
    console.log('TarjetaDetalleObra: handleContratoUploadSuccess received newProgreso:', newProgreso);
    setCurrentObraProgreso(newProgreso);
    // Re-fetch the entire obra to ensure all details are up-to-date
    try {
      const response = await api.get(`/obras/${obra.id}`);
      console.log('TarjetaDetalleObra: Re-fetched obra data:', response.data);
      setObra(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error re-fetching obra after contract update:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(obra);
  };

  const isInspectorEditDisabled = () => {
    if (user && user.role && user.role === 'Inspector') {
      if (!obra.fecha_inicio) {
        return false; // Permitir editar si no hay fecha de inicio
      }
      const now = new Date();
      // Fix for timezone issue: parse date parts manually
      const parts = obra.fecha_inicio.split('T')[0].split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      const fechaInicio = new Date(year, month, day);

      const oneWeekAfterStartDate = new Date(fechaInicio.getTime() + (7 * 24 * 60 * 60 * 1000));
      return now > oneWeekAfterStartDate;
    }
    return false;
  };

  const handleUpdateObra = async () => {
    try {
      const response = await api.put(`/obras/${obra.id}`, formData);
      setObra(response.data);
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error("Error al actualizar la obra:", error);
    }
  };

  const handleInlineUpdate = async (fieldName) => {
    try {
      const valueToUpdate = formData[fieldName];
      const payload = { [fieldName]: valueToUpdate };
      
      const response = await api.put(`/obras/${obra.id}`, payload);
      setObra(response.data);
      setFormData(response.data);
      setInlineEditingField(null);
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMapChange = (latlng) => {
    setFormData(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
  }

  function DraggableMarker() {
    const eventHandlers = useMemo(() => ({
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                handleMapChange(marker.getLatLng());
            }
        },
    }), []);

    return <Marker draggable={true} eventHandlers={eventHandlers} position={{lat: formData.latitude, lng: formData.longitude}} ref={markerRef} />;
  }

  function MapEvents() {
      useMapEvents({ click(e) { handleMapChange(e.latlng); } });
      return null;
  }

  const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '$ 0,00';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(number);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-AR', { timeZone: 'UTC' });
  };

  const getStatusClass = (status) => {
    return status ? status.toLowerCase().replace(/\s+/g, '-') : '';
  };

  // Determina si estamos en el modo de edición especial para Solicitud/Compulsa
  const isSimplifiedEditMode = useMemo(() => {
    return isEditing && isSimplifiedView;
  }, [isEditing, isSimplifiedView]);

  const InlineEditField = ({ fieldName, displayValue, value, children, type = 'text' }) => {
    const canEdit = !isInspectorEditDisabled();

    if (inlineEditingField === fieldName) {
      return (
        <div className="inline-edit-form">
          {children ? children : (
            <input
              type={type}
              name={fieldName}
              value={formData[fieldName] ?? ''}
              onChange={handleChange}
              className="form-input-inline"
            />
          )}
          <button onClick={() => handleInlineUpdate(fieldName)} className="inline-confirm-button">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
          </button>
          <button onClick={() => setInlineEditingField(null)} className="inline-cancel-button">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
          </button>
        </div>
      );
    }

    return (
      <span className="inline-display">
        {displayValue}
        {((value === null || value === undefined || value === '') && !isEditing && canEdit) && (
          <button onClick={() => { setFormData(obra); setInlineEditingField(fieldName); }} className="inline-edit-button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
        )}
      </span>
    );
  };

  return (
    <div className="detalle-obra-container">
      <style>{`
        .inline-edit-button {
            background: none;
            border: none;
            cursor: pointer;
            margin-left: 8px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            color: #007bff;
        }
        .inline-edit-button svg {
            transition: transform 0.2s;
        }
        .inline-edit-button:hover svg {
            transform: scale(1.2);
        }
        .inline-display {
            display: inline-flex;
            align-items: center;
            min-height: 38px; /* Alineación con campos de formulario */
        }
        .inline-edit-form {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .inline-confirm-button, .inline-cancel-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            display: inline-flex;
            align-items: center;
        }
        .inline-confirm-button { color: #28a745; }
        .inline-cancel-button { color: #dc3545; }
        .inline-confirm-button:hover, .inline-cancel-button:hover {
            opacity: 0.7;
        }
        .responsables-list li, .info-list p {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .descripcion-obra {
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }
      `}</style>
      <button onClick={() => navigate(-1)} className="back-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver al Listado
      </button>
      <div className="detalle-obra-content-wrapper">
        <>
          <div className="detalle-obra-card">

          <div className="actions-container">
            {!isEditing ? (
              <>
                {!isInspectorEditDisabled() && (
                  <button onClick={handleEdit} className="edit-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    Editar
                  </button>
                )}
              </>
            ) : (
              <div className="edit-controls">
                <button onClick={handleUpdateObra} className="save-button">Confirmar</button>
                <button onClick={handleCancel} className="cancel-button">Cancelar</button>
              </div>
            )}
          </div>
          <div className="detalle-header-image-container">
            <img
              src={obra.imagen_url ? `http://localhost:8080${obra.imagen_url}` : '/uploads/default-obra.png'}
              alt={obra.establecimiento}
              className="detalle-header-image"
              onError={(e) => { e.target.onerror = null; e.target.src = '/uploads/default-obra.png'; }}
            />
            <div className="header-image-overlay"></div>
          </div>

          <div className="detalle-obra-content">
            <div className="detalle-main-info">
              <div className="detalle-title-section">
                {isEditing ? ( // Si está en modo edición general o simplificado
                  <input
                    type="text"
                    name="establecimiento"
                    value={formData.establecimiento}
                    onChange={handleChange}
                    className="form-input-inline form-input-h1"
                  />
                ) : (
                  <h1>{obra.establecimiento}</h1>
                )}
                {isSimplifiedEditMode ? (
                  <div className="form-field-inline">
                    <label>Número de Gestión:</label>
                    <input
                      type="text"
                      name="numero_gestion"
                      value={formData.numero_gestion}
                      onChange={handleChange}
                      className="form-input-inline"
                    />
                  </div>
                ) : (
                  <p className="numero-gestion">
                    Número de Gestión: {obra.numero_gestion}
                  </p>
                )}
              </div>
              <div className="tags">
                <select
                  className={`status-badge status-select-detalle ${getStatusClass(obra.estado)}`}
                  value={obra.estado}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="Solicitud">Solicitud</option>
                  <option value="Compulsa">Compulsa</option>
                  <option value="En ejecución">En ejecución</option>
                  <option value="Finalizada">Finalizada</option>
                  <option value="Anulada">Anulada</option>
                </select>
                {isEditing ? ( // Mostrar select de categoría en cualquier modo de edición
                  <select name="categoria" value={formData.categoria} onChange={handleChange} className="form-select-inline">
                    <option value="salud">Salud</option>
                    <option value="educación">Educación</option>
                    <option value="deporte">Deporte</option>
                    <option value="secretaría general">Secretaría General</option>
                    <option value="vialidad">Vialidad</option>
                    <option value="obra pública">Obra Pública</option>
                    <option value="varios">Varios</option>
                  </select>
                ) : (
                  obra.categoria && <span className="status-badge categoria-badge">{obra.categoria}</span>
                )}
              </div>
            </div>

            {!isSimplifiedView && (
              <div className={`detalle-grid ${isEditing ? 'edit-form-grid' : ''}`}>
                {/* --- Columna Izquierda --- */}
                <div className="detalle-col-izquierda">
                  {isEditing ? (
                    <>
                      <div className="info-section">
                        <h3>Descripción</h3>
                        <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleChange} className="form-textarea-inline" rows="5" />
                      </div>
                      <div className="info-section">
                        <h3>Detalles Económicos</h3>
                        <div className="form-field">
                          <label>Monto SAPEM</label>
                          <CurrencyInput name="monto_sapem" value={formData.monto_sapem || ''} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                          <label>Monto Subcontrato</label>
                          <CurrencyInput name="monto_sub" value={formData.monto_sub || ''} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                          <label>Aporte Financiero</label>
                          <CurrencyInput name="af" value={formData.af || ''} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                          <label>Cantidad de Contratos</label>
                          <input type="number" name="cantidad_contratos" value={formData.cantidad_contratos || ''} onChange={handleChange} className="form-input-inline" />
                        </div>
                      </div>
                      <div className="info-section">
                        <h3>Plazos</h3>
                        <div className="form-field">
                          <label>Fecha de Inicio</label>
                          <input type="date" name="fecha_inicio" value={formData.fecha_inicio ? new Date(formData.fecha_inicio).toISOString().split('T')[0] : ''} onChange={handleChange} className="form-input-inline" />
                        </div>
                        <div className="form-field">
                          <label>Finalización Estimada</label>
                          <input type="date" name="fecha_finalizacion_estimada" value={formData.fecha_finalizacion_estimada ? new Date(formData.fecha_finalizacion_estimada).toISOString().split('T')[0] : ''} onChange={handleChange} className="form-input-inline" />
                        </div>
                        <div className="form-field">
                          <label>Plazo de Obra (días)</label>
                          <input type="number" name="plazo_dias" value={formData.plazo_dias || ''} onChange={handleChange} className="form-input-inline" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="info-section">
                        <h3>Descripción</h3>
                        <p className="descripcion-obra">
                          <InlineEditField
                            fieldName="descripcion"
                            value={obra.descripcion}
                            displayValue={obra.descripcion || 'No hay una descripción disponible para esta obra.'}
                          >
                            <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleChange} className="form-textarea-inline" rows="3" style={{minWidth: '300px'}}/>
                          </InlineEditField>
                        </p>
                      </div>
                      <div className="info-section">
                        <h3>Detalles Económicos</h3>
                        <div className="info-list">
                          <p><strong>Monto SAPEM:</strong> <span>{formatCurrency(obra.monto_sapem)}</span></p>
                          <p><strong>Monto Subcontrato:</strong> <span>{formatCurrency(obra.monto_sub)}</span></p>
                          <p><strong>Aporte Financiero:</strong> <span>{formatCurrency(obra.af)}</span></p>
                          <p><strong>Cantidad de Contratos:</strong>
                            <InlineEditField
                              fieldName="cantidad_contratos"
                              value={obra.cantidad_contratos}
                              displayValue={obra.cantidad_contratos || 'No disponible'}
                              type="number"
                            />
                          </p>
                        </div>
                      </div>
                      <div className="info-section">
                        <h3>Plazos</h3>
                        <div className="info-list">
                          <p><strong>Fecha de Inicio:</strong>
                            <InlineEditField
                              fieldName="fecha_inicio"
                              value={obra.fecha_inicio}
                              displayValue={formatDate(obra.fecha_inicio)}
                            >
                              <input type="date" name="fecha_inicio" value={formData.fecha_inicio ? new Date(formData.fecha_inicio).toISOString().split('T')[0] : ''} onChange={handleChange} className="form-input-inline" />
                            </InlineEditField>
                          </p>
                          <p><strong>Finalización Estimada:</strong>
                            <InlineEditField
                              fieldName="fecha_finalizacion_estimada"
                              value={obra.fecha_finalizacion_estimada}
                              displayValue={formatDate(obra.fecha_finalizacion_estimada)}
                            >
                              <input type="date" name="fecha_finalizacion_estimada" value={formData.fecha_finalizacion_estimada ? new Date(formData.fecha_finalizacion_estimada).toISOString().split('T')[0] : ''} onChange={handleChange} className="form-input-inline" />
                            </InlineEditField>
                          </p>
                          <p><strong>Plazo de Obra:</strong>
                            <InlineEditField
                              fieldName="plazo_dias"
                              value={obra.plazo_dias}
                              displayValue={obra.plazo_dias ? `${obra.plazo_dias} días` : 'No disponible'}
                            >
                                <input type="number" name="plazo_dias" value={formData.plazo_dias || ''} onChange={handleChange} className="form-input-inline" style={{width: '80px', display: 'inline-block'}} />
                                <span style={{marginLeft: '4px'}}>días</span>
                            </InlineEditField>
                          </p>
                        </div>
                      </div>
                  </>
                )}
                </div>

                {/* --- Columna Derecha --- */}
                <div className="detalle-col-derecha">
                  {isEditing ? (
                    <>
                      <div className="info-section">
                        <h3>Responsables y Ubicación</h3>
                        <div className="form-field">
                          <label>Localidad</label>
                          <CreatableAutocomplete name="localidad_nombre" value={formData.localidad_nombre || ''} onChange={(e) => handleChange({ target: { name: 'localidad_nombre', value: e.target.value } })} apiEndpoint="/localidades" />
                        </div>
                        <div className="form-field">
                          <label>Contratista</label>
                          <CreatableAutocomplete name="contratista_nombre" value={formData.contratista_nombre || ''} onChange={(e) => handleChange({ target: { name: 'contratista_nombre', value: e.target.value } })} apiEndpoint="/contribuyentes" />
                        </div>
                        <div className="form-field">
                          <label>Rep. Legal</label>
                          <CreatableAutocomplete name="rep_legal_nombre" value={formData.rep_legal_nombre || ''} onChange={(e) => handleChange({ target: { name: 'rep_legal_nombre', value: e.target.value } })} apiEndpoint="/representantes-legales" />
                        </div>
                        <div className="form-field">
                          <label>Inspector</label>
                          <select name="inspector_id" value={formData.inspector_id || ''} onChange={handleChange} className="form-select-inline">
                            <option value="">-- Sin Asignar --</option>
                            {inspectores.map(insp => (
                              <option key={insp.id} value={insp.id}>{insp.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {/* Mapa para editar */}
                      {formData.latitude && formData.longitude && (
                        <div className="map-container-detalle">
                          <MapContainer center={[formData.latitude, formData.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                            <DraggableMarker />
                            <MapEvents />
                          </MapContainer>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="info-section">
                        <h3>Responsables y Ubicación</h3>
                        <ul className="responsables-list">
                          <li><strong>Localidad:</strong>
                            <InlineEditField
                              fieldName="localidad_nombre"
                              value={obra.localidad_nombre}
                              displayValue={obra.localidad_nombre || 'No especificada'}
                            >
                              <CreatableAutocomplete
                                name="localidad_nombre"
                                value={formData.localidad_nombre || ''}
                                onChange={(e) => handleChange({ target: { name: 'localidad_nombre', value: e.target.value } })}
                                apiEndpoint="/localidades"
                              />
                            </InlineEditField>
                          </li>
                          <li><strong>Contratista:</strong>
                            <InlineEditField
                              fieldName="contratista_nombre"
                              value={obra.contratista_nombre}
                              displayValue={obra.contratista_nombre || 'No especificado'}
                            >
                              <CreatableAutocomplete
                                name="contratista_nombre"
                                value={formData.contratista_nombre || ''}
                                onChange={(e) => handleChange({ target: { name: 'contratista_nombre', value: e.target.value } })}
                                apiEndpoint="/contribuyentes"
                              />
                            </InlineEditField>
                          </li>
                          <li><strong>Rep. Legal:</strong>
                            <InlineEditField
                              fieldName="rep_legal_nombre"
                              value={obra.rep_legal_nombre}
                              displayValue={obra.rep_legal_nombre || 'No especificado'}
                            >
                              <CreatableAutocomplete
                                name="rep_legal_nombre"
                                value={formData.rep_legal_nombre || ''}
                                onChange={(e) => handleChange({ target: { name: 'rep_legal_nombre', value: e.target.value } })}
                                apiEndpoint="/representantes-legales"
                              />
                            </InlineEditField>
                          </li>
                          <li><strong>Inspector:</strong>
                            <InlineEditField
                              fieldName="inspector_id"
                              value={obra.inspector_id}
                              displayValue={obra.inspector_nombre || 'No asignado'}
                            >
                              <select name="inspector_id" value={formData.inspector_id || ''} onChange={handleChange} className="form-select-inline">
                                <option value="">-- Sin Asignar --</option>
                                {inspectores.map(insp => (
                                  <option key={insp.id} value={insp.id}>{insp.nombre}</option>
                                ))}
                              </select>
                            </InlineEditField>
                          </li>
                        </ul>
                      </div>
                      {/* Mapa para ver */}
                      {obra.latitude && obra.longitude && (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${obra.latitude},${obra.longitude}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <div className="map-container-detalle">
                            <MapContainer center={[obra.latitude, obra.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} dragging={false} zoomControl={false}>
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                              <Marker position={[obra.latitude, obra.longitude]} />
                            </MapContainer>
                          </div>
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div> {/* Closing detalle-obra-card */}
        
        {!isSimplifiedView && (
          <div className="info-section contratos-section-wrapper">
            <ContratoUpload obraId={obra.id} onContratoUploadSuccess={handleContratoUploadSuccess} />
          </div>
        )}
        </>
      </div>
    </div>
  );
};

export default TarjetaDetalleObra;

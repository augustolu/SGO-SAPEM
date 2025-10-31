import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './TarjetaDetalleObra.css';
import { useAuth } from '../context/AuthContext';
import ObraEditForm from './ObraEditForm'; 
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
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    setObra(initialObra);
  }, [initialObra]);

  const canEdit = useMemo(() => {
    if (!user) return false;
    const roles = user.roles || [];
    if (roles.includes('admin') || roles.includes('supervisor')) {
      return true;
    }
    if (roles.includes('inspector')) {
      const createdAt = new Date(obra.createdAt);
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    }
    return false;
  }, [user, obra.createdAt]);

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
  };

  const handleUpdateObra = async (updatedData) => {
    try {
      const response = await api.put(`/obras/${obra.id}`, updatedData);
      setObra(response.data); // Actualiza el estado local con la obra actualizada
      setEditModalOpen(false); // Cierra el modal
    } catch (error) {
      console.error("Error al actualizar la obra:", error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

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

  return (
    <div className="detalle-obra-container">
      <div className="detalle-obra-content-wrapper">
        <button onClick={() => navigate(-1)} className="back-button">
          &larr; Volver al Listado
        </button>
        {canEdit && (
            <button onClick={handleEdit} className="edit-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              Editar Obra
            </button>
        )}

        <div className="detalle-obra-card">
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
                <h1>{obra.establecimiento}</h1>
                <p className="numero-gestion">Gestión: {obra.numero_gestion}</p>
              </div>
              <div className="tags">
                {obra.estado && <span className={`status-badge ${getStatusClass(obra.estado)}`}>{obra.estado}</span>}
                {obra.categoria && <span className="status-badge categoria-badge">{obra.categoria}</span>}
              </div>
            </div>

            <div className="detalle-grid">
              {/* --- Columna Izquierda --- */}
              <div className="detalle-col-izquierda">
                {typeof obra.progreso !== 'undefined' && (
                  <div className="info-section progreso-seccion">
                    <h3>Progreso de la Obra</h3>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${obra.progreso}%` }}></div>
                      <span>{obra.progreso}%</span>
                    </div>
                  </div>
                )}

                <div className="info-section">
                  <h3>Descripción</h3>
                  <p className="descripcion-obra">{obra.descripcion || 'No hay una descripción disponible para esta obra.'}</p>
                </div>

                <div className="info-section">
                  <h3>Detalles Económicos</h3>
                  <div className="info-list">
                    <p><strong>Monto SAPEM:</strong> <span>{formatCurrency(obra.monto_sapem)}</span></p>
                    <p><strong>Monto Subcontrato:</strong> <span>{formatCurrency(obra.monto_sub)}</span></p>
                    <p><strong>Aporte Financiero:</strong> <span>{formatCurrency(obra.af)}</span></p>
                  </div>
                </div>

                <div className="info-section">
                  <h3>Plazos</h3>
                  <div className="info-list">
                    <p><strong>Fecha de Inicio:</strong> <span>{formatDate(obra.fecha_inicio)}</span></p>
                    <p><strong>Finalización Estimada:</strong> <span>{formatDate(obra.fecha_finalizacion_estimada)}</span></p>
                    <p><strong>Plazo de Obra:</strong> <span>{obra.plazo_dias ? `${obra.plazo_dias} días` : 'No disponible'}</span></p>
                  </div>
                </div>
              </div>

              {/* --- Columna Derecha --- */}
              <div className="detalle-col-derecha">
                <div className="info-section">
                  <h3>Responsables y Ubicación</h3>
                  <ul className="responsables-list">
                    <li><strong>Localidad:</strong> {obra.localidad_nombre || 'No especificada'}</li>
                    <li><strong>Contratista:</strong> {obra.contratista_nombre || 'No especificado'}</li>
                    <li><strong>Rep. Legal:</strong> {obra.rep_legal_nombre || 'No especificado'}</li>
                    <li><strong>Inspector:</strong> {obra.inspector_nombre || 'No asignado'}</li>
                  </ul>
                </div>
                {obra.latitude && obra.longitude && (
                  <div className="map-container-detalle">
                    <MapContainer center={[obra.latitude, obra.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                      <Marker position={[obra.latitude, obra.longitude]} />
                    </MapContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isEditModalOpen && (
        <ObraEditForm
          obraData={obra}
          onSubmit={handleUpdateObra}
          onCancel={handleCloseModal}
        />
      )}
    </div>
  );
};

export default TarjetaDetalleObra;

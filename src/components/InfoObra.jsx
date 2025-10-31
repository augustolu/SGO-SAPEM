import React from 'react';
import { MapContainer, TileLayer, Marker, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './InfoObra.css';

// Fix Leaflet's default icon path issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const InfoObra = ({ obra }) => {
  const position = (obra.latitude && obra.longitude) ? [obra.latitude, obra.longitude] : null;

  const formatCurrency = (value) => {
    const number = parseFloat(value);
    return !isNaN(number) ? number.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : 'No disponible';
  };

  return (
    <div className="info-obra-container">
      <div className="info-obra-card">
        <div className="info-obra-header">
          <h1>{obra.establecimiento || 'Nombre de Obra no disponible'}</h1>
          <span className={`status-badge status-${obra.estado?.toLowerCase().replace(/\s+/g, '-')}`}>{obra.estado || 'Estado no disponible'}</span>
        </div>

        <div className="info-obra-body">
          <div className="info-obra-left">
            <div className="obra-image-container">
              <img 
                src={obra.imagen_url || '/uploads/default-obra.png'} 
                alt={`Imagen de la obra ${obra.establecimiento}`}
                className="obra-image"
              />
            </div>
            <div className="progress-section">
              <h3>Progreso de la Obra</h3>
              <div className="progress-bar-wrapper">
                <div className="progress-bar-track">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${obra.progreso || 0}%` }}
                  >
                    <span>{obra.progreso || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="info-obra-right">
            <div className="details-section">
              <h3>Detalles</h3>
              <div className="details-grid">
                <p><strong>Descripción:</strong> {obra.detalle || 'No disponible'}</p>
                <p><strong>Ubicación:</strong> {obra.Localidad?.nombre || 'No disponible'}</p>
                <p><strong>Contratista:</strong> {obra.Contribuyente?.nombre || 'No disponible'}</p>
                <p><strong>Representante Legal:</strong> {obra.RepresentanteLegal?.nombre || 'No disponible'}</p>
                <p><strong>Plazo de Obra:</strong> {obra.plazo ? `${obra.plazo} días` : 'No disponible'}</p>
              </div>
            </div>
            <div className="finance-section">
              <h3>Información Financiera</h3>
              <div className="finance-grid">
                <p><strong>Monto SAPEM:</strong> {formatCurrency(obra.monto_sapem)}</p>
                <p><strong>Monto SUB:</strong> {formatCurrency(obra.monto_sub)}</p>
                <p><strong>Adelanto Financiero:</strong> {formatCurrency(obra.af)}</p>
              </div>
            </div>
            {position && (
              <div className="map-section">
                <h3>Ubicación en Mapa</h3>
                <div className="map-container">
                  <MapContainer center={position} zoom={15} scrollWheelZoom={true} style={{ height: '300px', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={position} />
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoObra;
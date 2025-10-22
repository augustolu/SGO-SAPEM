import React from 'react';
import { MapContainer, TileLayer, Marker, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './InfoObra.css';

// FIX: Icono por defecto de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const InfoObra = ({ obra }) => {
  const position = [obra.latitude, obra.longitude];

  return (
    <div className="info-obra">
      <h2>{obra.titulo}</h2>
      <div className="info-obra-grid">
        <div className="info-obra-details">
          <p><strong>Descripción:</strong> {obra.descripcion || 'No especificada'}</p>
          <p><strong>Ubicación:</strong> {obra.ubicacion || 'No especificada'}</p>
          <p><strong>Contratista:</strong> {obra.contratista || 'No especificado'}</p>
          <p><strong>Representante Legal:</strong> {obra.rep_legal || 'No especificado'}</p>
          <p><strong>Monto SAPEM:</strong> ${obra.monto_sapem ? parseFloat(obra.monto_sapem).toLocaleString('es-AR') : 'N/A'}</p>
          <p><strong>Monto SUB:</strong> ${obra.monto_sub ? parseFloat(obra.monto_sub).toLocaleString('es-AR') : 'N/A'}</p>
          <p><strong>Adelanto Financiero (AF):</strong> ${obra.af ? parseFloat(obra.af).toLocaleString('es-AR') : 'N/A'}</p>
          <p><strong>Plazo:</strong> {obra.plazo_dias ? `${obra.plazo_dias} días` : 'No especificado'}</p>
          
          <p><strong>Progreso:</strong></p>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${obra.progreso || 0}%` }}
            >
              {obra.progreso || 0}%
            </div>
          </div>
        </div>
        <div className="info-obra-map">
          <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '400px', width: '100%' }}>
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
            <Marker position={position} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default InfoObra;

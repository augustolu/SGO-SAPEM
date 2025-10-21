import React from 'react';
import './InfoObra.css';

const InfoObra = ({ obra }) => {
  return (
    <div className="info-obra">
      <h2>{obra.titulo}</h2>
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
  );
};

export default InfoObra;

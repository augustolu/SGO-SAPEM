import React from 'react';
import './InfoObra.css';

const InfoObra = ({ obra }) => {
  return (
    <div className="info-obra">
      <h2>{obra.titulo}</h2>
      <p><strong>Descripción:</strong> {obra.descripcion}</p>
      <p><strong>Ubicación:</strong> {obra.ubicacion}</p>
      <p><strong>Contratista:</strong> {obra.contratista}</p>
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${obra.progreso}%` }}
        >
          {obra.progreso}%
        </div>
      </div>
    </div>
  );
};

export default InfoObra;

import React from 'react';
import { useParams } from 'react-router-dom';

function ObraDetail() {
  const { id } = useParams();
  return <div>Detalle de la Obra: {id}</div>;
}

export default ObraDetail;

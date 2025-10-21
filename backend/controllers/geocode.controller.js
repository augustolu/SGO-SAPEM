const axios = require('axios');

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Es importante enviar un User-Agent para cumplir con la política de uso de Nominatim.
const axiosOptions = {
  headers: {
    'User-Agent': 'SGO-SAPEM-App/1.0 (augustoluceropollio@gmail..com)'
  }
};

exports.search = async (req, res) => {
  try {
    const { q, state, country, limit } = req.query;
    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q,
        state,
        country,
        format: 'json',
        limit: limit || 5
      },
      ...axiosOptions
    });
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error en proxy de búsqueda de geolocalización:', error.message);
    res.status(error.response?.status || 500).send({ message: 'Error al contactar el servicio de geolocalización.' });
  }
};

exports.reverse = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params: {
        lat,
        lon,
        format: 'json'
      },
      ...axiosOptions
    });
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error en proxy de geolocalización inversa:', error.message);
    res.status(error.response?.status || 500).send({ message: 'Error al contactar el servicio de geolocalización.' });
  }
};
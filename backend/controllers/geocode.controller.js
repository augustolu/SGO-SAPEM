const axios = require('axios');

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Es importante enviar un User-Agent para cumplir con la política de uso de Nominatim.
const axiosOptions = {
  headers: {
    'User-Agent': 'SGO-SAPEM-App/1.0 (augustoluceropollio@gmail.com)'
  }
};

exports.search = async (req, res) => {
  try {
    console.log('Backend: Received geocode search request from frontend.');
    console.log('Backend: Frontend query parameters:', req.query);
    const { q, state, country, limit } = req.query;

    // Construir los parámetros dinámicamente para evitar enviar 'undefined'
    const nominatimParams = {
      q,
      format: 'json',
      limit: limit || 5
    };
    if (state) nominatimParams.state = state;
    if (country) nominatimParams.country = country;

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: nominatimParams,
      headers: axiosOptions.headers // Explicitly pass headers
    });
    console.log('Backend: Sending search request to Nominatim with params:', nominatimParams);
    console.log('Backend: Nominatim request headers:', axiosOptions.headers);
    console.log('Backend: Received successful search response from Nominatim.');
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error en proxy de búsqueda de geolocalización:', error.message);
    if (error.response) {
      console.error('Backend: Nominatim response status:', error.response.status);
      console.error('Backend: Nominatim response data:', error.response.data);
      console.error('Backend: Nominatim response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Backend: No response received from Nominatim (request made but no response).');
    }
    res.status(error.response?.status || 500).send({ message: 'Error al contactar el servicio de geolocalización.', details: error.response?.data });
  }
};

exports.reverse = async (req, res) => {
  try {
    console.log('Backend: Received geocode reverse request from frontend.');
    console.log('Backend: Frontend query parameters:', req.query);
    const { lat, lon } = req.query;

    // Construir los parámetros dinámicamente
    const nominatimParams = {
      lat,
      lon,
      format: 'json'
    };

    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params: nominatimParams,
      headers: axiosOptions.headers // Explicitly pass headers
    });
    console.log('Backend: Sending reverse request to Nominatim with params:', nominatimParams);
    console.log('Backend: Nominatim request headers:', axiosOptions.headers);
    console.log('Backend: Received successful reverse response from Nominatim.');
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error en proxy de geolocalización inversa:', error.message);
    if (error.response) {
      console.error('Backend: Nominatim response status:', error.response.status);
      console.error('Backend: Nominatim response data:', error.response.data);
      console.error('Backend: Nominatim response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Backend: No response received from Nominatim (request made but no response).');
    }
    res.status(error.response?.status || 500).send({ message: 'Error al contactar el servicio de geolocalización.', details: error.response?.data });
  }
};
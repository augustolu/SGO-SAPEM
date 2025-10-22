import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import './CreatableAutocomplete.css';

const CreatableAutocomplete = ({ name, value, onChange, placeholder, apiEndpoint }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const suggestionsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Sincronizar el estado interno si el valor externo cambia
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const fetchSuggestions = useCallback(async (query) => {
    console.log('Fetching suggestions for query:', query);
    if (query.length < 1) { // Cambiado a 1 para mostrar sugerencias desde la primera letra
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsLoading(true);
    try {
      // Pasamos la consulta al backend para que filtre
      const url = `${apiEndpoint}?nombre=${query}`;
      console.log('Requesting URL:', url);
      const response = await api.get(url);
      console.log('Received response:', response.data);
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error(`Error fetching suggestions from ${apiEndpoint}:`, error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint]);

  const debouncedFetch = useCallback((query) => {
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
  }, [fetchSuggestions]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue); // CORRECCIÓN: Actualizar el estado interno del input
    onChange({ target: { name, value: newValue } }); // Y también el estado del formulario principal
    debouncedFetch(newValue);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.nombre);
    onChange({ target: { name, value: suggestion.nombre } });
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    // Pequeño delay para permitir que el clic en la sugerencia se registre antes de ocultar
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  return (
    <div className="creatable-autocomplete-container" ref={suggestionsRef}>
      <input
        type="text"
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => inputValue && fetchSuggestions(inputValue)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showSuggestions && (
        <ul className="suggestions-list">
          {isLoading ? (
            <li className="suggestion-item-info">Cargando...</li>
          ) : suggestions.length > 0 ? (
            suggestions.map((sug) => (
              <li
                key={sug.id}
                className="suggestion-item"
                onMouseDown={() => handleSuggestionClick(sug)} // Usar onMouseDown para que se dispare antes del onBlur del input
              >
                {sug.nombre}
              </li>
            ))
          ) : (
            <li className="suggestion-item-info">No hay sugerencias. Puedes crear uno nuevo.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default CreatableAutocomplete;
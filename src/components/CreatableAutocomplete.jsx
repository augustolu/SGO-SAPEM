import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import './CreatableAutocomplete.css';

const CreatableAutocomplete = ({ name, value, onChange, placeholder, apiEndpoint, disallowNumbers }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null); // Nuevo estado
  const suggestionsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Sincronizar el estado interno si el valor externo cambia
  useEffect(() => {
    // Si el valor es un número (ID), buscar el nombre para mostrar
    if (value && !isNaN(value)) {
      api.get(`${apiEndpoint}/${value}`)
        .then(res => {
          setInputValue(res.data.nombre);
        })
        .catch(err => {
          console.error("Error fetching initial name:", err);
          setInputValue(value); // Fallback al ID si no se encuentra
        });
    } else {
      setInputValue(value || '');
    }
  }, [value, apiEndpoint]);

  const fetchSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsLoading(true);
    try {
      // Pasamos la consulta directamente como un parámetro de consulta 'nombre'
      const response = await api.get(apiEndpoint, { params: { nombre: query } });
      // La API ya devuelve los datos filtrados, así que los usamos directamente
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
    let newValue = e.target.value;
    if (disallowNumbers) {
      newValue = newValue.replace(/[0-9]/g, '');
    }
    setInputValue(newValue);
    setSelectedValue(null); // Resetea el ID seleccionado si el usuario escribe
    onChange(name, newValue); // Cambiado para pasar nombre y valor directamente
    debouncedFetch(newValue);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.nombre);
    setSelectedValue(suggestion.id);
    onChange(name, suggestion.id); // Cambiado para pasar nombre y valor directamente
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    // Pequeño delay para permitir que el clic en la sugerencia se registre antes de ocultar
    setTimeout(() => {
      if (showSuggestions) {
        setShowSuggestions(false);
      }
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
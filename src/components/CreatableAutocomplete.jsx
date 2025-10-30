import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import './CreatableAutocomplete.css';

const CreatableAutocomplete = ({ name, value, onChange, placeholder, apiEndpoint }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const suggestionsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Sincronizar el estado interno si el valor externo cambia
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const fetchSuggestions = useCallback(async (query) => {
    console.log('Fetching suggestions for query:', query);
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const url = `${apiEndpoint}?nombre=${query}`;
      console.log('Requesting URL:', url);
      const response = await api.get(url);
      console.log('Received response:', response.data);
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (err) {
      console.error(`Error fetching suggestions from ${apiEndpoint}:`, err);
      setError('Error al cargar datos. Verifique la consola.');
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
    setInputValue(newValue);
    onChange({ target: { name, value: newValue } });
    debouncedFetch(newValue);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.nombre);
    onChange({ target: { name, value: suggestion.nombre } });
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const handleFocus = () => {
    if (inputValue) {
        debouncedFetch(inputValue);
    } else {
        setShowSuggestions(true); // Mostrar el menu para que el usuario sepa que puede escribir
    }
  }

  return (
    <div className="creatable-autocomplete-container" ref={suggestionsRef}>
      <input
        type="text"
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showSuggestions && (
        <ul className="suggestions-list">
          {isLoading ? (
            <li className="suggestion-item-info">Cargando...</li>
          ) : error ? (
            <li className="suggestion-item-error">{error}</li>
          ) : suggestions.length > 0 ? (
            suggestions.map((sug) => (
              <li
                key={sug.id}
                className="suggestion-item"
                onMouseDown={() => handleSuggestionClick(sug)}
              >
                {sug.nombre}
              </li>
            ))
          ) : inputValue ? (
            <li className="suggestion-item-info">No se encontraron coincidencias para "{inputValue}".</li>
          ) : (
            <li className="suggestion-item-info">Escriba para buscar...</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default CreatableAutocomplete;

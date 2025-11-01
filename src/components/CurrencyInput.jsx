import React from 'react';

const CurrencyInput = ({ name, value, onChange, placeholder }) => {
    const formatCurrency = (numStr) => {
      if (!numStr) return '';
      const [integerPart, decimalPart] = numStr.split(',');
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
    };
  
    const handleInputChange = (e) => {
      const rawValue = e.target.value;
      const withoutThousandSeparators = rawValue.replace(/\./g, '');
      const withDecimalPoint = withoutThousandSeparators.replace(',', '.');
      const sanitizedValue = withDecimalPoint.replace(/[^0-9.]/g, '');
      const parts = sanitizedValue.split('.');
      const numericValue =
        parts.length > 1
          ? `${parts[0]}.${parts.slice(1).join('').substring(0, 2)}`
          : parts[0];
  
      onChange({ target: { name, value: numericValue } });
    };
  
    return (
      <div className="input-with-prefix">
        <span className="input-prefix">ARS</span>
        <input type="text" name={name} value={formatCurrency(String(value || '').replace('.', ','))} onChange={handleInputChange} placeholder={placeholder} style={{ border: 'none', boxShadow: 'none', paddingLeft: '0.5rem' }} />
      </div>
    );
  };

  export default CurrencyInput;
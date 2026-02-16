import { useState, useRef, useEffect, useCallback } from 'react';

// Principales ciudades del Paraguay
const PARAGUAY_CITIES = [
  'Asunción',
  'Ciudad del Este',
  'San Lorenzo',
  'Luque',
  'Capiatá',
  'Lambaré',
  'Fernando de la Mora',
  'Limpio',
  'Ñemby',
  'Mariano Roque Alonso',
  'Itauguá',
  'Encarnación',
  'Pedro Juan Caballero',
  'Caaguazú',
  'Coronel Oviedo',
  'Presidente Franco',
  'Hernandarias',
  'Villarrica',
  'Concepción',
  'Pilar',
  'San Antonio',
  'Villa Elisa',
  'Areguá',
  'Itá',
  'San Bernardino',
  'Caacupé',
  'Paraguarí',
  'Ypacaraí',
  'Tobatí',
  'Salto del Guairá',
  'Filadelfia',
  'Santa Rita',
  'Minga Guazú',
  'Obligado',
  'Bella Vista',
  'Cambyretá',
  'Fram',
  'Hohenau',
  'Loma Plata',
  'San Estanislao',
  'Yaguarón',
  'Villeta',
  'Juan Eulogio Estigarribia',
  'Quiindy',
  'Villa Hayes',
  'Ypané',
  'Guarambaré',
  'J. Augusto Saldívar',
  'Fuerte Olimpo',
  'Ayolas',
  'San Ignacio',
  'Santa Rosa',
  'Itacurubí de la Cordillera',
  'Eusebio Ayala',
  'San Juan Bautista',
  'Piribebuy',
  'Benjamín Aceval',
];

interface CityAutocompleteProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Ej: Ciudad del Este',
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter cities based on input
  const filterCities = useCallback((input: string) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const normalized = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const matches = PARAGUAY_CITIES.filter((city) => {
      const cityNorm = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return cityNorm.includes(normalized);
    }).slice(0, 8);
    setSuggestions(matches);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    filterCities(val);
    setShowSuggestions(true);
    setActiveIndex(-1);
  };

  const selectCity = (city: string) => {
    onChange(city);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        selectCity(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-light-text mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => { if (value.trim()) { filterCities(value); setShowSuggestions(true); } }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder-light-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {suggestions.map((city, idx) => (
            <li
              key={city}
              onClick={() => selectCity(city)}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                idx === activeIndex
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-light-text hover:bg-dark-hover'
              }`}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CityAutocomplete;

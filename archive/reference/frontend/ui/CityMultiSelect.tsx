import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, Check } from 'lucide-react';

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

interface CityMultiSelectProps {
  label?: string;
  selectedCities: string[];
  onChange: (cities: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const CityMultiSelect: React.FC<CityMultiSelectProps> = ({
  label,
  selectedCities,
  onChange,
  placeholder = 'Buscar ciudad...',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter cities based on input
  const filterCities = useCallback((input: string) => {
    const normalized = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const matches = PARAGUAY_CITIES.filter((city) => {
      const cityNorm = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return cityNorm.includes(normalized) && !selectedCities.includes(city);
    }).slice(0, 8);
    setSuggestions(matches);
  }, [selectedCities]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    filterCities(val);
    setShowSuggestions(true);
    setActiveIndex(-1);
  };

  const addCity = (city: string) => {
    if (!selectedCities.includes(city)) {
      onChange([...selectedCities, city]);
    }
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const removeCity = (city: string) => {
    onChange(selectedCities.filter(c => c !== city));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && activeIndex >= 0 && activeIndex < suggestions.length) {
        addCity(suggestions[activeIndex]);
      } else if (inputValue.trim()) {
        // Allow custom city if typed
        addCity(inputValue.trim());
      }
      return;
    }

    if (e.key === 'Backspace' && !inputValue && selectedCities.length > 0) {
      removeCity(selectedCities[selectedCities.length - 1]);
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (inputValue.trim()) {
        // Don't auto-add on blur, let user press Enter or click
      }
    }, 150);
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

  // Show all available cities when input is focused and empty
  const handleFocus = () => {
    const available = PARAGUAY_CITIES.filter(city => !selectedCities.includes(city)).slice(0, 8);
    setSuggestions(available);
    setShowSuggestions(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-light-text mb-1.5">
          {label}
        </label>
      )}
      
      {/* Selected cities chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedCities.map((city) => (
          <span
            key={city}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-500/20 text-primary-400 rounded-full text-sm border border-primary-500/30"
          >
            {city}
            <button
              onClick={() => removeCity(city)}
              className="hover:bg-primary-500/30 rounded-full p-0.5 transition-colors"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-muted" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={selectedCities.length === 0 ? placeholder : 'Agregar otra ciudad...'}
          autoComplete="off"
          className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder-light-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors"
        />
      </div>
      
      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {suggestions.map((city, idx) => (
            <li
              key={city}
              onMouseDown={() => addCity(city)}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                idx === activeIndex
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-light-text hover:bg-dark-hover'
              }`}
            >
              <span>{city}</span>
              {idx === activeIndex && <Check className="w-4 h-4" />}
            </li>
          ))}
        </ul>
      )}
      
      {/* Show message when all cities are selected */}
      {showSuggestions && suggestions.length === 0 && selectedCities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl p-4 text-center text-sm text-light-muted">
          Todas las ciudades han sido seleccionadas
        </div>
      )}
    </div>
  );
};

export default CityMultiSelect;

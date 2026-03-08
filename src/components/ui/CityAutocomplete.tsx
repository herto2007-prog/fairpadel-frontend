import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, X } from 'lucide-react';

// Ciudades de Paraguay ordenadas por importancia/población
const ciudadesParaguay = [
  'Asunción',
  'Ciudad del Este',
  'San Lorenzo',
  'Luque',
  'Capiatá',
  'Lambaré',
  'Fernando de la Mora',
  'Limpio',
  'Ñemby',
  'Itauguá',
  'Mariano Roque Alonso',
  'Pedro Juan Caballero',
  'Encarnación',
  'Villa Elisa',
  'San Antonio',
  'Itá',
  'Coronel Oviedo',
  'Concepción',
  'Guarambaré',
  'Ypané',
  'Caaguazú',
  'Caacupé',
  'Villarrica',
  'Presidente Franco',
  'Minga Guazú',
  'San Ignacio',
  'Pilar',
  'San Juan Bautista',
  'Paraguarí',
  'Villeta',
  'Areguá',
  'Pirayú',
  'Yaguarón',
  'Ybycuí',
  'Quiindy',
  'Sapucai',
  'Guayaibí',
  'Tobatí',
  'Carayaó',
  'Doctor Arroyo',
  'Bella Vista',
  'Paso de Patria',
  'Mayor Otaño',
  'General Delgado',
  'San Pedro de Ycuamandiyú',
  'Capitán Bado',
  'Fuerte Olimpo',
  'Bahía Negra',
  'Puerto Casado',
  'Filadelfia',
  'Loma Plata',
  'Neuland',
];

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const CityAutocomplete = ({
  value,
  onChange,
  placeholder = 'Buscar ciudad...',
  label = 'Ciudad',
}: CityAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar ciudades según el input
  const filteredCities = useMemo(() => {
    if (!inputValue.trim()) return ciudadesParaguay.slice(0, 10);
    
    const searchTerm = inputValue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return ciudadesParaguay
      .filter(city => {
        const normalizedCity = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normalizedCity.includes(searchTerm);
      })
      .sort((a, b) => {
        // Priorizar coincidencias exactas al inicio
        const aStartsWith = a.toLowerCase().startsWith(inputValue.toLowerCase());
        const bStartsWith = b.toLowerCase().startsWith(inputValue.toLowerCase());
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return 0;
      })
      .slice(0, 8); // Máximo 8 resultados
  }, [inputValue]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincronizar con valor externo
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(0);
    
    // Si la ciudad existe exactamente, actualizar valor
    if (ciudadesParaguay.includes(newValue)) {
      onChange(newValue);
    }
  };

  const handleSelectCity = (city: string) => {
    setInputValue(city);
    onChange(city);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCities.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCities[highlightedIndex]) {
          handleSelectCity(filteredCities[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const clearInput = () => {
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative group">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder={placeholder}
          autoComplete="off"
        />

        {/* Clear button */}
        <AnimatePresence>
          {inputValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearInput}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-dark-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Search icon when empty */}
        <AnimatePresence>
          {!inputValue && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && filteredCities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-gray-700 overflow-hidden z-50"
          >
            <ul className="max-h-64 overflow-y-auto py-2">
              {filteredCities.map((city, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = city === value;
                
                return (
                  <motion.li
                    key={city}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all ${
                        isHighlighted 
                          ? 'bg-primary/10 border-l-2 border-primary' 
                          : 'border-l-2 border-transparent'
                      } ${isSelected ? 'text-primary' : 'text-gray-300'}`}
                    >
                      <MapPin className={`w-4 h-4 ${isHighlighted ? 'text-primary' : 'text-gray-500'}`} />
                      <span className="flex-1">{city}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-primary rounded-full"
                        />
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      <AnimatePresence>
        {isOpen && inputValue && filteredCities.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-gray-700 p-4 text-center z-50"
          >
            <p className="text-gray-400 text-sm">No se encontró "{inputValue}"</p>
            <p className="text-gray-500 text-xs mt-1">Selecciona una ciudad de la lista</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

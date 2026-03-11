import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Building2 } from 'lucide-react';

interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
}

interface SedeAutocompleteProps {
  sedes: Sede[];
  value: string; // id de la sede
  onChange: (sedeId: string, sedeNombre: string) => void;
  placeholder?: string;
  label?: string;
}

export const SedeAutocomplete = ({
  sedes,
  value,
  onChange,
  placeholder = 'Buscar sede...',
  label = 'Sede',
}: SedeAutocompleteProps) => {
  // Encontrar la sede seleccionada para mostrar su nombre
  const selectedSede = sedes.find(s => s.id === value);
  const [inputValue, setInputValue] = useState(selectedSede ? `${selectedSede.nombre} - ${selectedSede.ciudad}` : '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar sedes según el input
  const filteredSedes = useMemo(() => {
    if (!inputValue.trim()) return sedes.slice(0, 10);
    
    const searchTerm = inputValue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return sedes
      .filter(sede => {
        const nombreNormalized = sede.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const ciudadNormalized = sede.ciudad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return nombreNormalized.includes(searchTerm) || ciudadNormalized.includes(searchTerm);
      })
      .sort((a, b) => {
        // Priorizar coincidencias exactas al inicio del nombre
        const aStartsWith = a.nombre.toLowerCase().startsWith(inputValue.toLowerCase());
        const bStartsWith = b.nombre.toLowerCase().startsWith(inputValue.toLowerCase());
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return 0;
      })
      .slice(0, 8); // Máximo 8 resultados
  }, [inputValue, sedes]);

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
    const sede = sedes.find(s => s.id === value);
    if (sede) {
      setInputValue(`${sede.nombre} - ${sede.ciudad}`);
    } else {
      setInputValue('');
    }
  }, [value, sedes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(0);
    
    // Si el input se vacía, limpiar selección
    if (!newValue.trim()) {
      onChange('', '');
    }
  };

  const handleSelectSede = (sede: Sede) => {
    setInputValue(`${sede.nombre} - ${sede.ciudad}`);
    onChange(sede.id, sede.nombre);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSedes.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredSedes[highlightedIndex]) {
          handleSelectSede(filteredSedes[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const clearInput = () => {
    setInputValue('');
    onChange('', '');
    inputRef.current?.focus();
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative group">
        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#df2531] transition-colors" />
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-12 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] focus:ring-2 focus:ring-[#df2531]/20 transition-all"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#151921] rounded-lg transition-colors"
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
        {isOpen && filteredSedes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#151921] rounded-xl border border-[#232838] overflow-hidden z-50 shadow-xl"
          >
            <ul className="max-h-64 overflow-y-auto py-2">
              {filteredSedes.map((sede, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = sede.id === value;
                
                return (
                  <motion.li
                    key={sede.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectSede(sede)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all ${
                        isHighlighted 
                          ? 'bg-[#df2531]/10 border-l-2 border-[#df2531]' 
                          : 'border-l-2 border-transparent'
                      } ${isSelected ? 'text-[#df2531]' : 'text-gray-300'}`}
                    >
                      <Building2 className={`w-4 h-4 ${isHighlighted ? 'text-[#df2531]' : 'text-gray-500'}`} />
                      <div className="flex-1">
                        <span className="block">{sede.nombre}</span>
                        <span className="text-xs text-gray-500">{sede.ciudad}</span>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-[#df2531] rounded-full"
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
        {isOpen && inputValue && filteredSedes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#151921] rounded-xl border border-[#232838] p-4 text-center z-50"
          >
            <p className="text-gray-400 text-sm">No se encontró "{inputValue}"</p>
            <p className="text-gray-500 text-xs mt-1">
              {sedes.length === 0 ? 'No hay sedes registradas' : 'Selecciona una sede de la lista'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

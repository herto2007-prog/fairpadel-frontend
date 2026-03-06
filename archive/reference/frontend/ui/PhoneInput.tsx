import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
];

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  /** País por defecto (código ISO) */
  defaultCountry?: string;
  /** Ejemplo a mostrar debajo del input */
  hint?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Ej: 981123456',
  required = false,
  className = '',
  defaultCountry = 'PY',
  hint,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value to extract country code and number
  useEffect(() => {
    if (value) {
      // Try to find if value starts with any dial code
      const country = COUNTRIES.find((c) => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.slice(country.dialCode.length));
      } else {
        // If no country code found, use default and set full value as number
        setPhoneNumber(value);
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Only digits
    setPhoneNumber(rawValue);
    onChange(selectedCountry.dialCode + rawValue);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    if (phoneNumber) {
      onChange(country.dialCode + phoneNumber);
    }
  };

  // Format phone number for display based on country
  const formatPhoneNumber = (number: string, countryCode: string): string => {
    if (!number) return '';
    
    // Paraguay: +595 9XX XXX XXX or +595 98X XXX XXX
    if (countryCode === 'PY') {
      if (number.length <= 3) return number;
      if (number.length <= 6) return `${number.slice(0, 3)} ${number.slice(3)}`;
      return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 9)}`;
    }
    
    // Argentina: +54 9 11 XXXX XXXX
    if (countryCode === 'AR') {
      if (number.length <= 2) return number;
      if (number.length <= 4) return `${number.slice(0, 2)} ${number.slice(2)}`;
      return `${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4, 8)} ${number.slice(8, 12)}`;
    }
    
    // Brasil: +55 11 9XXXX XXXX
    if (countryCode === 'BR') {
      if (number.length <= 2) return number;
      if (number.length <= 3) return `${number.slice(0, 2)} ${number.slice(2)}`;
      return `${number.slice(0, 2)} ${number.slice(2, 3)}${number.slice(3, 7)} ${number.slice(7, 11)}`;
    }
    
    // Default: group in 3s
    return number.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-light-text mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex">
        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2.5 bg-dark-bg border border-r-0 border-dark-border rounded-l-lg text-light-text hover:bg-dark-hover transition-colors min-w-[100px]"
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            <ChevronDown className="w-4 h-4 text-light-secondary" />
          </button>
          
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-dark-card border border-dark-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-dark-hover transition-colors ${
                    selectedCountry.code === country.code ? 'bg-primary-500/10' : ''
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-light-text truncate">{country.name}</p>
                    <p className="text-xs text-light-secondary">{country.dialCode}</p>
                  </div>
                  {selectedCountry.code === country.code && (
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Phone Number Input */}
        <input
          type="tel"
          value={formatPhoneNumber(phoneNumber, selectedCountry.code)}
          onChange={handleNumberChange}
          placeholder={placeholder}
          required={required}
          className="flex-1 px-4 py-2.5 bg-dark-bg border border-dark-border rounded-r-lg text-light-text placeholder-light-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors"
        />
      </div>
      
      {hint && (
        <p className="mt-1.5 text-xs text-light-secondary">{hint}</p>
      )}
    </div>
  );
};

export default PhoneInput;

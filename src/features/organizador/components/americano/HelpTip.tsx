import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Ayuda "¿qué es esto?" al toque: un ? que muestra una explicación corta
 * en lenguaje simple, sin sacar al usuario de la pantalla.
 */
export function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="Qué es esto"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="text-white/30 hover:text-white/70 transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span className="absolute left-0 top-6 z-20 w-56 bg-[#0B0E14] border border-[#232838] rounded-lg p-2.5 text-white/70 text-[11px] leading-relaxed shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

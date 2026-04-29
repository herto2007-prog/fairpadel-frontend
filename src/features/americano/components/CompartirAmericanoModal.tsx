import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Check, Copy } from 'lucide-react';

interface CompartirAmericanoModalProps {
  torneoId: string;
  torneoNombre: string;
  onClose: () => void;
}

export function CompartirAmericanoModal({ torneoId, torneoNombre, onClose }: CompartirAmericanoModalProps) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/americano/${torneoId}`;
  const mensajeWhatsApp = `¡Hola! Te invito a jugar el torneo americano "${torneoNombre}" en FairPadel. Inscribite acá: ${url}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#232838]">
          <div>
            <h2 className="text-white font-bold">¡Torneo creado!</h2>
            <p className="text-white/40 text-xs">Compartí el link para que se inscriban</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* URL */}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Link del torneo</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/[0.03] border border-[#232838] rounded-xl px-4 py-2.5 text-white text-sm truncate">
                {url}
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 bg-white/[0.05] border border-[#232838] rounded-xl hover:bg-white/[0.08] transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/40" />}
              </button>
            </div>
          </div>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-3 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Compartir por WhatsApp</span>
          </button>

          {/* Ir al torneo */}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Ir a mi torneo
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

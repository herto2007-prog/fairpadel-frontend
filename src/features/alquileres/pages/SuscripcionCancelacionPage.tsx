import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, Home, CreditCard } from 'lucide-react';

export default function SuscripcionCancelacionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#151921] rounded-2xl border border-[#232838] p-8 text-center"
      >
        <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-amber-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-amber-400">Pago cancelado</h2>
        <p className="text-gray-400 mb-6">
          Has cancelado el proceso de pago. Tu suscripción no ha sido activada.
          Puedes intentarlo nuevamente cuando quieras.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#df2531] hover:bg-[#c41f2a] rounded-xl font-medium transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            Intentar de nuevo
          </button>
          <button
            onClick={() => navigate('/mis-sedes')}
            className="flex items-center justify-center gap-2 w-full py-3 border border-[#232838] hover:bg-[#232838] rounded-xl transition-colors"
          >
            <Home className="w-5 h-5" />
            Ir a Mis Sedes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

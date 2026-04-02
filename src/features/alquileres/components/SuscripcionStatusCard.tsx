import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { suscripcionService, EstadoSuscripcion } from '../../../services/suscripcionService';
import { useToast } from '../../../components/ui/ToastProvider';
import { CreditCard, CheckCircle, AlertCircle, ArrowRight, Clock } from 'lucide-react';

interface SuscripcionStatusCardProps {
  sedeId: string;
}

export default function SuscripcionStatusCard({ sedeId }: SuscripcionStatusCardProps) {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [estado, setEstado] = useState<EstadoSuscripcion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstado();
  }, [sedeId]);

  const loadEstado = async () => {
    try {
      setLoading(true);
      const data = await suscripcionService.getEstado(sedeId);
      setEstado(data);
    } catch (err: any) {
      showError('Error', 'No se pudo cargar el estado de la suscripción');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="bg-[#151921] rounded-lg border border-[#232838] p-4 animate-pulse">
        <div className="h-4 bg-[#232838] rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-[#232838] rounded w-1/2"></div>
      </div>
    );
  }

  if (!estado) return null;

  return (
    <div className={`rounded-lg border p-4 ${
      estado.activa 
        ? 'bg-green-500/10 border-green-500/30' 
        : 'bg-[#151921] border-[#232838]'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            estado.activa ? 'bg-green-500/20' : 'bg-[#df2531]/20'
          }`}>
            {estado.activa ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <AlertCircle size={20} className="text-[#df2531]" />
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-sm">
              {estado.activa ? 'Suscripción Activa' : 'Suscripción Inactiva'}
            </h3>
            {estado.activa ? (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <Clock size={12} />
                Vence: {formatDate(estado.venceEn)}
              </p>
            ) : (
              <p className="text-xs text-gray-400">
                Activa tu suscripción para recibir reservas
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate(`/sede/${sedeId}/suscripcion`)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            estado.activa
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-[#df2531] text-white hover:bg-[#c41f2a]'
          }`}
        >
          {estado.activa ? (
            <>
              Gestionar
              <ArrowRight size={14} />
            </>
          ) : (
            <>
              <CreditCard size={14} />
              Suscribirse
            </>
          )}
        </button>
      </div>
    </div>
  );
}

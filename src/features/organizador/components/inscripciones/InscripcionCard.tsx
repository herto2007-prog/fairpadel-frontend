import { motion } from 'framer-motion';
import { 
  Phone, CheckCircle2, Clock, AlertCircle, XCircle,
  UserPlus, CreditCard, Edit2, ArrowRightLeft
} from 'lucide-react';
import { formatDatePY } from '../../../../utils/date';

interface Jugador {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
}

interface Inscripcion {
  id: string;
  jugador1: Jugador;
  jugador2?: Jugador;
  jugador2Documento?: string;
  jugador2Email?: string;
  estado: 'PENDIENTE_PAGO' | 'PENDIENTE_CONFIRMACION' | 'CONFIRMADA' | 'CANCELADA' | 'RECHAZADA';
  modoPago?: 'COMPLETO' | 'INDIVIDUAL';
  createdAt: string;
  pagos: { monto: number; estado: string }[];
  categoriaNombre?: string;
}

interface InscripcionCardProps {
  inscripcion: Inscripcion;
  index: number;
  onConfirmar: () => void;
  onCancelar: () => void;
  onEditar?: () => void;
  onCambiarCategoria?: () => void;
}

export function InscripcionCard({ inscripcion, index, onConfirmar, onCancelar, onEditar, onCambiarCategoria }: InscripcionCardProps) {
  const getEstadoConfig = () => {
    switch (inscripcion.estado) {
      case 'CONFIRMADA':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          label: 'Confirmado',
        };
      case 'PENDIENTE_PAGO':
      case 'PENDIENTE_CONFIRMACION':
        return {
          icon: Clock,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          label: 'Pendiente',
        };
      case 'CANCELADA':
      case 'RECHAZADA':
        return {
          icon: XCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          label: 'Cancelado',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          label: inscripcion.estado,
        };
    }
  };

  const estadoConfig = getEstadoConfig();
  const EstadoIcon = estadoConfig.icon;
  const tieneParejaCompleta = !!inscripcion.jugador2;
  const montoPagado = inscripcion.pagos.reduce((sum, p) => sum + (p.estado === 'COMPLETADO' ? p.monto : 0), 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
      className={`glass rounded-2xl p-5 border ${estadoConfig.borderColor} hover:border-[#df2531]/30 transition-all group`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Info principal */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {/* Estado */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${estadoConfig.bgColor}`}>
              <EstadoIcon className={`w-4 h-4 ${estadoConfig.color}`} />
              <span className={`text-sm font-medium ${estadoConfig.color}`}>
                {estadoConfig.label}
              </span>
            </div>

            {/* Categoria */}
            {inscripcion.categoriaNombre && (
              <span className="text-xs text-[#df2531] bg-[#df2531]/10 px-2 py-1 rounded-full font-medium">
                {inscripcion.categoriaNombre}
              </span>
            )}

            {/* Modo de pago */}
            {inscripcion.modoPago && (
              <span className="text-xs text-gray-500 bg-[#0B0E14] px-2 py-1 rounded-full">
                {inscripcion.modoPago === 'COMPLETO' ? 'Uno paga todo' : 'Cada uno paga'}
              </span>
            )}

            {/* Pago parcial */}
            {montoPagado > 0 && inscripcion.estado !== 'CONFIRMADA' && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Pagó Gs. {montoPagado.toLocaleString('es-PY')}
              </span>
            )}
          </div>

          {/* Jugadores */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Jugador 1 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#df2531] to-[#ff6b6b] flex items-center justify-center text-white font-bold">
                {inscripcion.jugador1.nombre[0]}{inscripcion.jugador1.apellido[0]}
              </div>
              <div>
                <p className="text-white font-medium">
                  {inscripcion.jugador1.nombre} {inscripcion.jugador1.apellido}
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {inscripcion.jugador1.telefono && (
                    <a 
                      href={`https://wa.me/595${inscripcion.jugador1.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      {inscripcion.jugador1.telefono}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Separador */}
            <span className="text-gray-600">+</span>

            {/* Jugador 2 */}
            {tieneParejaCompleta ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {inscripcion.jugador2!.nombre[0]}{inscripcion.jugador2!.apellido[0]}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {inscripcion.jugador2!.nombre} {inscripcion.jugador2!.apellido}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {inscripcion.jugador2!.telefono && (
                      <a 
                        href={`https://wa.me/595${inscripcion.jugador2!.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        {inscripcion.jugador2!.telefono}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-500/50 flex items-center justify-center text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-amber-400 font-medium">Esperando pareja</p>
                  <p className="text-sm text-gray-500">
                    {inscripcion.jugador2Email ? `Invitación enviada a ${inscripcion.jugador2Email}` : 'Sin invitación'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {inscripcion.estado !== 'CONFIRMADA' && inscripcion.estado !== 'CANCELADA' && (
            <>
              <button
                onClick={onConfirmar}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar
              </button>
              <button
                onClick={onCancelar}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors text-sm font-medium"
              >
                <XCircle className="w-4 h-4" />
                Cancelar
              </button>
            </>
          )}
          
          {/* Acciones adicionales */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEditar && (
              <button
                onClick={onEditar}
                className="p-2 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 rounded-xl transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onCambiarCategoria && (
              <button
                onClick={onCambiarCategoria}
                className="p-2 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 rounded-xl transition-colors"
                title="Cambiar categoría"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fecha de inscripción */}
      <div className="mt-3 pt-3 border-t border-[#232838] text-xs text-gray-500">
        Inscrito el {formatDatePY(inscripcion.createdAt)}
      </div>
    </motion.div>
  );
}

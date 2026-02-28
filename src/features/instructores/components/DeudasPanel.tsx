import { useState, useEffect } from 'react';
import { instructoresService } from '@/services/instructoresService';
import { Card, CardContent, Badge } from '@/components/ui';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Loader2,
  User,
} from 'lucide-react';
import type { DeudaAlumno, AlumnoResumen } from '@/types';
import RegistrarPagoModal from './RegistrarPagoModal';

interface Props {
  refreshKey?: number;
}

const DeudasPanel = ({ refreshKey }: Props) => {
  const [deudas, setDeudas] = useState<DeudaAlumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<AlumnoResumen | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<{ id: string; precio: number } | null>(null);

  useEffect(() => {
    loadDeudas();
  }, [refreshKey]);

  const loadDeudas = async () => {
    setLoading(true);
    try {
      const data = await instructoresService.obtenerDeudas();
      setDeudas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading deudas:', err);
      setDeudas([]);
    } finally {
      setLoading(false);
    }
  };

  const totalDeuda = deudas.reduce((sum, d) => sum + d.deudaPendiente, 0);

  const handlePagar = (deuda: DeudaAlumno, reserva?: { id: string; precio: number }) => {
    setSelectedAlumno({
      tipo: deuda.tipo,
      id: deuda.id,
      nombre: deuda.nombre,
      apellido: deuda.apellido,
      telefono: deuda.telefono,
      fotoUrl: deuda.fotoUrl,
      totalClases: 0,
      ultimaClase: '',
      deudaPendiente: deuda.deudaPendiente,
    });
    setSelectedReserva(reserva || null);
    setShowPagoModal(true);
  };

  const handlePagoCreated = () => {
    setShowPagoModal(false);
    setSelectedAlumno(null);
    setSelectedReserva(null);
    loadDeudas();
  };

  const toggleKey = (d: DeudaAlumno) => d.id || d.nombre;

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
      </div>
    );
  }

  if (deudas.length === 0) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
        <p className="text-sm text-light-secondary">Todos tus alumnos están al día</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Total header */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-light-muted flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
            {deudas.length} alumno{deudas.length !== 1 ? 's' : ''} con deuda
          </span>
          <span className="text-sm font-semibold text-red-400">
            Total: Gs. {totalDeuda.toLocaleString()}
          </span>
        </div>

        {/* Deuda cards */}
        {deudas.map((d) => {
          const key = toggleKey(d);
          const isExpanded = expanded === key;

          return (
            <Card key={key}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  {d.fotoUrl ? (
                    <img src={d.fotoUrl} alt={d.nombre} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-light-text truncate">
                        {d.nombre} {d.apellido || ''}
                      </span>
                      {d.tipo === 'externo' && (
                        <Badge variant="default" className="text-[10px]">Externo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-light-muted">
                      {d.reservasPendientes.length} clase{d.reservasPendientes.length !== 1 ? 's' : ''} impaga{d.reservasPendientes.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Debt + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-red-400">
                      Gs. {d.deudaPendiente.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handlePagar(d)}
                      className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                      <DollarSign className="h-3 w-3 inline mr-0.5" />
                      Cobrar
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : key)}
                      className="p-1 text-light-muted hover:text-light-text transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded: unpaid reservas */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-dark-border space-y-1.5">
                    {d.reservasPendientes.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs">
                        <span className="text-light-secondary">
                          {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-light-text font-medium">Gs. {r.precio.toLocaleString()}</span>
                          <button
                            onClick={() => handlePagar(d, { id: r.id, precio: r.precio })}
                            className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors"
                          >
                            Cobrar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showPagoModal && (
        <RegistrarPagoModal
          isOpen
          onClose={() => { setShowPagoModal(false); setSelectedAlumno(null); setSelectedReserva(null); }}
          onCreated={handlePagoCreated}
          preselectedAlumno={selectedAlumno}
          preselectedReserva={selectedReserva}
        />
      )}
    </>
  );
};

export default DeudasPanel;

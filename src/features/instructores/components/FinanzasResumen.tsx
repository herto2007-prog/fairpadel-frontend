import { useState, useEffect } from 'react';
import { instructoresService } from '@/services/instructoresService';
import { Loading, Card, CardContent, Button } from '@/components/ui';
import {
  DollarSign,
  TrendingUp,
  Clock,
  XCircle,
  Calendar,
  Plus,
  Receipt,
  Loader2,
} from 'lucide-react';
import type { FinanzasResumen as FinanzasResumenType, FinanzasMensual, PagoInstructor, ReciboData } from '@/types';
import RegistrarPagoModal from './RegistrarPagoModal';
import DeudasPanel from './DeudasPanel';
import ComprobanteRecibo from './ComprobanteRecibo';

type Periodo = 'este-mes' | 'mes-pasado' | '3-meses' | 'custom';

const FinanzasResumenComponent = () => {
  const [finanzas, setFinanzas] = useState<FinanzasResumenType | null>(null);
  const [mensual, setMensual] = useState<FinanzasMensual[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('este-mes');

  // Pagos state
  const [pagos, setPagos] = useState<PagoInstructor[]>([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [showRegistrarPago, setShowRegistrarPago] = useState(false);
  const [selectedRecibo, setSelectedRecibo] = useState<ReciboData | null>(null);
  const [loadingRecibo, setLoadingRecibo] = useState<string | null>(null);
  const [deudasRefreshKey, setDeudasRefreshKey] = useState(0);

  // Custom range
  const [customDesde, setCustomDesde] = useState('');
  const [customHasta, setCustomHasta] = useState('');

  useEffect(() => {
    loadFinanzas();
  }, [periodo, customDesde, customHasta]);

  const loadFinanzas = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let desde: string | undefined;
      let hasta: string | undefined;

      if (periodo === 'este-mes') {
        desde = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      } else if (periodo === 'mes-pasado') {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        desde = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        hasta = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      } else if (periodo === '3-meses') {
        const prev = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        desde = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`;
      } else if (periodo === 'custom' && customDesde) {
        desde = customDesde;
        hasta = customHasta || undefined;
      }

      const [finanzasData, mensualData] = await Promise.all([
        instructoresService.obtenerFinanzas(desde, hasta),
        instructoresService.obtenerFinanzasMensual(
          desde ? parseInt(desde.split('-')[0]) : now.getFullYear(),
          desde ? parseInt(desde.split('-')[1]) : now.getMonth() + 1
        ),
      ]);

      setFinanzas(finanzasData);
      setMensual(Array.isArray(mensualData) ? mensualData : []);

      // Also load recent pagos
      loadPagos(desde, hasta);
    } catch (err) {
      console.error('Error loading finanzas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPagos = async (desde?: string, hasta?: string) => {
    setLoadingPagos(true);
    try {
      const data = await instructoresService.listarPagos({ desde, hasta });
      setPagos(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch {
      setPagos([]);
    } finally {
      setLoadingPagos(false);
    }
  };

  const handleVerRecibo = async (pagoId: string) => {
    setLoadingRecibo(pagoId);
    try {
      const data = await instructoresService.obtenerRecibo(pagoId);
      setSelectedRecibo(data);
    } catch {
      // silently fail
    } finally {
      setLoadingRecibo(null);
    }
  };

  const handlePagoCreated = () => {
    setShowRegistrarPago(false);
    loadFinanzas();
    setDeudasRefreshKey((k) => k + 1);
  };

  const getPagoAlumnoName = (p: PagoInstructor) => {
    if (p.alumno) return `${p.alumno.nombre} ${p.alumno.apellido || ''}`.trim();
    return p.alumnoExternoNombre || 'Sin nombre';
  };

  if (loading && !finanzas) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando finanzas..." />
      </div>
    );
  }

  const periodos: { key: Periodo; label: string }[] = [
    { key: 'este-mes', label: 'Este mes' },
    { key: 'mes-pasado', label: 'Mes pasado' },
    { key: '3-meses', label: 'Últimos 3 meses' },
    { key: 'custom', label: 'Personalizado' },
  ];

  // Totals from mensual data
  const totalMensualCobrado = mensual.reduce((sum, d) => sum + d.cobrado, 0);
  const totalMensualPendiente = mensual.reduce((sum, d) => sum + d.pendiente, 0);
  const totalMensualClases = mensual.reduce((sum, d) => sum + d.clases, 0);

  return (
    <div className="space-y-5">
      {/* Period Filter + Register Button */}
      <div className="flex flex-wrap items-center gap-2">
        {periodos.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodo(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              periodo === p.key
                ? 'bg-primary-500 text-white'
                : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto">
          <Button variant="primary" size="sm" onClick={() => setShowRegistrarPago(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Registrar Ingreso
          </Button>
        </div>
      </div>

      {/* Custom date range */}
      {periodo === 'custom' && (
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs text-light-muted mb-1">Desde</label>
            <input
              type="date"
              value={customDesde}
              onChange={(e) => setCustomDesde(e.target.value)}
              className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-light-muted mb-1">Hasta</label>
            <input
              type="date"
              value={customHasta}
              onChange={(e) => setCustomHasta(e.target.value)}
              className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {finanzas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-400" />
              <p className="text-xl font-bold text-green-400">
                {finanzas.totalCobrado > 0
                  ? `${(finanzas.totalCobrado / 1000).toFixed(0)}k`
                  : '0'}
              </p>
              <p className="text-xs text-light-muted">Cobrado (Gs.)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
              <p className="text-xl font-bold text-yellow-400">
                {finanzas.totalPendiente > 0
                  ? `${(finanzas.totalPendiente / 1000).toFixed(0)}k`
                  : '0'}
              </p>
              <p className="text-xs text-light-muted">Pendiente (Gs.)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-1 text-blue-400" />
              <p className="text-xl font-bold text-light-text">{finanzas.clasesCompletadas}</p>
              <p className="text-xs text-light-muted">Completadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 mx-auto mb-1 text-red-400" />
              <p className="text-xl font-bold text-light-text">{finanzas.clasesCanceladas}</p>
              <p className="text-xs text-light-muted">Canceladas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly breakdown table */}
      {mensual.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left px-4 py-3 text-xs text-light-muted font-medium">Fecha</th>
                    <th className="text-center px-4 py-3 text-xs text-light-muted font-medium">Clases</th>
                    <th className="text-right px-4 py-3 text-xs text-light-muted font-medium">Cobrado</th>
                    <th className="text-right px-4 py-3 text-xs text-light-muted font-medium">Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {mensual.map((d) => (
                    <tr key={d.fecha} className="border-b border-dark-border/50 hover:bg-dark-hover/30">
                      <td className="px-4 py-2.5 text-light-text flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-light-muted" />
                        {new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-PY', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </td>
                      <td className="text-center px-4 py-2.5 text-light-text">{d.clases}</td>
                      <td className="text-right px-4 py-2.5 text-green-400">
                        {d.cobrado > 0 ? `Gs. ${d.cobrado.toLocaleString()}` : '—'}
                      </td>
                      <td className="text-right px-4 py-2.5 text-yellow-400">
                        {d.pendiente > 0 ? `Gs. ${d.pendiente.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-dark-surface/50">
                    <td className="px-4 py-3 font-semibold text-light-text">Total</td>
                    <td className="text-center px-4 py-3 font-semibold text-light-text">{totalMensualClases}</td>
                    <td className="text-right px-4 py-3 font-semibold text-green-400">
                      Gs. {totalMensualCobrado.toLocaleString()}
                    </td>
                    <td className="text-right px-4 py-3 font-semibold text-yellow-400">
                      Gs. {totalMensualPendiente.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <div className="text-center py-8">
            <DollarSign className="h-10 w-10 mx-auto mb-2 text-light-muted opacity-50" />
            <p className="text-sm text-light-secondary">Sin movimientos en este período</p>
          </div>
        )
      )}
      {/* Recent Pagos Table */}
      {pagos.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-dark-border flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary-400" />
              <span className="text-sm font-semibold text-light-text">Últimos pagos registrados</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left px-4 py-2 text-xs text-light-muted font-medium">Fecha</th>
                    <th className="text-left px-4 py-2 text-xs text-light-muted font-medium">Alumno</th>
                    <th className="text-right px-4 py-2 text-xs text-light-muted font-medium">Monto</th>
                    <th className="text-center px-4 py-2 text-xs text-light-muted font-medium">Método</th>
                    <th className="text-center px-4 py-2 text-xs text-light-muted font-medium">Concepto</th>
                    <th className="text-center px-4 py-2 text-xs text-light-muted font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => (
                    <tr key={p.id} className="border-b border-dark-border/50 hover:bg-dark-hover/30">
                      <td className="px-4 py-2 text-light-text text-xs">
                        {new Date(p.fecha + (p.fecha.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-2 text-light-text text-xs truncate max-w-[120px]">
                        {getPagoAlumnoName(p)}
                      </td>
                      <td className="text-right px-4 py-2 text-green-400 text-xs font-medium">
                        Gs. {p.monto.toLocaleString()}
                      </td>
                      <td className="text-center px-4 py-2 text-light-secondary text-xs">
                        {p.metodoPago === 'EFECTIVO' ? '💵' : p.metodoPago === 'TRANSFERENCIA' ? '🏦' : p.metodoPago === 'QR' ? '📱' : '—'}
                      </td>
                      <td className="text-center px-4 py-2 text-light-muted text-xs capitalize">
                        {p.concepto.toLowerCase()}
                      </td>
                      <td className="text-center px-4 py-2">
                        <button
                          onClick={() => handleVerRecibo(p.id)}
                          disabled={loadingRecibo === p.id}
                          className="text-primary-400 hover:text-primary-300 transition-colors"
                          title="Ver recibo"
                        >
                          {loadingRecibo === p.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Receipt className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingPagos && pagos.length === 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
        </div>
      )}

      {/* Deudas Panel */}
      <div>
        <h3 className="text-sm font-semibold text-light-text mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-yellow-400" />
          Deudas pendientes
        </h3>
        <DeudasPanel refreshKey={deudasRefreshKey} />
      </div>

      {/* Modals */}
      {showRegistrarPago && (
        <RegistrarPagoModal
          isOpen
          onClose={() => setShowRegistrarPago(false)}
          onCreated={handlePagoCreated}
        />
      )}

      {selectedRecibo && (
        <ComprobanteRecibo
          recibo={selectedRecibo}
          onClose={() => setSelectedRecibo(null)}
        />
      )}
    </div>
  );
};

export default FinanzasResumenComponent;

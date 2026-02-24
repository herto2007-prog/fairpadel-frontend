import { Card } from '@/components/ui';
import { TrendingUp, TrendingDown, Wallet, Package, Download, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { FinanzasDonut, BalanceBarChart, COLORS_INGRESO, COLORS_EGRESO } from './FinanzasCharts';
import tournamentsService from '@/services/tournamentsService';
import toast from 'react-hot-toast';
import { useState } from 'react';
import type { DashboardFinanciero, Tournament } from '@/types';

const CATEGORIA_LABELS: Record<string, string> = {
  PREMIO: 'Premios',
  ARBITRAJE: 'Arbitraje',
  ALQUILER_CANCHA: 'Alquiler Cancha',
  PELOTAS: 'Pelotas',
  PUBLICIDAD: 'Publicidad',
  LOGISTICA: 'Logística',
  ALIMENTACION: 'Alimentación',
  AUSPICIO_EFECTIVO: 'Auspicio Efectivo',
  OTRO: 'Otro',
  INSCRIPCIONES: 'Inscripciones',
};

interface Props {
  tournament: Tournament;
  dashboard: DashboardFinanciero;
}

export function FinanzasResumenSection({ tournament, dashboard }: Props) {
  const [exporting, setExporting] = useState(false);
  const { resumenGeneral, movimientos, porCategoria } = dashboard;

  // Build chart data for ingresos
  const ingresosChartData = [
    ...(dashboard.totalRecaudado > 0 ? [{ name: 'Inscripciones', value: dashboard.totalRecaudado }] : []),
    ...movimientos.porCategoria
      .filter((c) => c.tipo === 'INGRESO')
      .map((c) => ({ name: CATEGORIA_LABELS[c.categoria] || c.categoria, value: c.total })),
  ];

  // Build chart data for egresos
  const egresosChartData = movimientos.porCategoria
    .filter((c) => c.tipo === 'EGRESO')
    .map((c) => ({ name: CATEGORIA_LABELS[c.categoria] || c.categoria, value: c.total }));

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await tournamentsService.exportInscripcionesExcel(tournament.id);
      toast.success('Excel descargado');
    } catch {
      toast.error('Error al exportar Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">Resumen General</h3>
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex items-center gap-2 px-3 py-1.5 bg-dark-surface text-light-secondary rounded-lg text-xs font-medium hover:bg-dark-hover transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center bg-green-500/5 border-green-500/20">
          <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-green-400">{formatCurrency(resumenGeneral.ingresosEfectivo)}</p>
          <p className="text-xs text-light-secondary mt-1">Ingresos Efectivo</p>
          <p className="text-[10px] text-light-secondary/60 mt-0.5">
            Inscripciones: {formatCurrency(dashboard.totalRecaudado)}
            {movimientos.totalIngresos > 0 && <> + Manual: {formatCurrency(movimientos.totalIngresos)}</>}
          </p>
        </Card>
        <Card className="p-4 text-center bg-red-500/5 border-red-500/20">
          <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-red-400">{formatCurrency(resumenGeneral.egresosEfectivo)}</p>
          <p className="text-xs text-light-secondary mt-1">Egresos Efectivo</p>
        </Card>
        <Card className="p-4 text-center" style={{ borderColor: resumenGeneral.balanceEfectivo >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }}>
          <Wallet className="w-6 h-6 text-primary-400 mx-auto mb-2" />
          <p className={`text-xl font-bold ${resumenGeneral.balanceEfectivo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {resumenGeneral.balanceEfectivo >= 0 ? '+' : ''}{formatCurrency(resumenGeneral.balanceEfectivo)}
          </p>
          <p className="text-xs text-light-secondary mt-1">Balance Efectivo</p>
        </Card>
        <Card className="p-4 text-center bg-purple-500/5 border-purple-500/20">
          <Package className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-purple-400">{formatCurrency(resumenGeneral.valorEspecie)}</p>
          <p className="text-xs text-light-secondary mt-1">En Especie</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <FinanzasDonut
            data={ingresosChartData}
            colors={COLORS_INGRESO}
            title="Desglose de Ingresos"
            total={resumenGeneral.ingresosEfectivo}
            emptyText="Sin ingresos registrados"
          />
        </Card>
        <Card className="p-4">
          <FinanzasDonut
            data={egresosChartData}
            colors={COLORS_EGRESO}
            title="Desglose de Egresos"
            total={resumenGeneral.egresosEfectivo}
            emptyText="Sin egresos registrados"
          />
        </Card>
      </div>

      {/* Balance Bar */}
      <Card className="p-4">
        <BalanceBarChart
          ingresos={resumenGeneral.ingresosEfectivo}
          egresos={resumenGeneral.egresosEfectivo}
        />
      </Card>

      {/* Payment status summary */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-primary-400" />
          <h4 className="text-sm font-medium">Estado de Pagos de Inscripción</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-dark-surface/50 rounded-lg">
            <p className="text-lg font-bold text-green-400">{dashboard.pagosConfirmados}</p>
            <p className="text-[10px] text-light-secondary">Confirmados</p>
          </div>
          <div className="text-center p-3 bg-dark-surface/50 rounded-lg">
            <p className="text-lg font-bold text-yellow-400">{dashboard.pagosPendientes}</p>
            <p className="text-[10px] text-light-secondary">Pendientes</p>
          </div>
          <div className="text-center p-3 bg-dark-surface/50 rounded-lg">
            <p className="text-lg font-bold text-red-400">{dashboard.pagosRechazados}</p>
            <p className="text-[10px] text-light-secondary">Rechazados</p>
          </div>
          {dashboard.inscripcionesGratis > 0 && (
            <div className="text-center p-3 bg-dark-surface/50 rounded-lg">
              <p className="text-lg font-bold text-blue-400">{dashboard.inscripcionesGratis}</p>
              <p className="text-[10px] text-light-secondary">Gratis</p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-light-secondary text-center mt-2">
          Costo por inscripción: {formatCurrency(dashboard.costoInscripcion)}
        </p>
      </Card>

      {/* Per-category table */}
      {porCategoria.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-border flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary-400" />
            <h4 className="text-sm font-medium">Desglose por Categoría</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left">
                  <th className="px-4 py-2.5 text-light-secondary font-medium text-xs">Categoría</th>
                  <th className="px-4 py-2.5 text-light-secondary font-medium text-xs text-center">Inscritas</th>
                  <th className="px-4 py-2.5 text-light-secondary font-medium text-xs text-center">Confirmadas</th>
                  <th className="px-4 py-2.5 text-light-secondary font-medium text-xs text-center">Pendientes</th>
                  <th className="px-4 py-2.5 text-light-secondary font-medium text-xs text-right">Recaudado</th>
                </tr>
              </thead>
              <tbody>
                {porCategoria.map((cat) => (
                  <tr key={cat.categoryId} className="border-b border-dark-border/50 hover:bg-dark-hover/30">
                    <td className="px-4 py-2.5 font-medium text-light-text text-xs">{cat.categoryNombre}</td>
                    <td className="px-4 py-2.5 text-center text-light-secondary text-xs">{cat.totalInscritas}</td>
                    <td className="px-4 py-2.5 text-center text-green-400 text-xs">{cat.confirmadas}</td>
                    <td className="px-4 py-2.5 text-center text-yellow-400 text-xs">{cat.pendientes}</td>
                    <td className="px-4 py-2.5 text-right text-green-400 text-xs">{formatCurrency(cat.montoRecaudado)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-dark-surface/50 font-medium">
                  <td className="px-4 py-2.5 text-xs">Total</td>
                  <td className="px-4 py-2.5 text-center text-xs">{porCategoria.reduce((s, c) => s + c.totalInscritas, 0)}</td>
                  <td className="px-4 py-2.5 text-center text-green-400 text-xs">{porCategoria.reduce((s, c) => s + c.confirmadas, 0)}</td>
                  <td className="px-4 py-2.5 text-center text-yellow-400 text-xs">{porCategoria.reduce((s, c) => s + c.pendientes, 0)}</td>
                  <td className="px-4 py-2.5 text-right text-green-400 text-xs">{formatCurrency(porCategoria.reduce((s, c) => s + c.montoRecaudado, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

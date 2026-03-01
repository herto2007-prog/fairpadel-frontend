import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { TipoCancha } from '@/types';
import type { AlquilerPrecio } from '@/types';

interface Props {
  sedeId: string;
}

const TIPOS_CANCHA: TipoCancha[] = [TipoCancha.INDOOR, TipoCancha.OUTDOOR, TipoCancha.SEMI_TECHADA];
const tipoCanchaLabel: Record<TipoCancha, string> = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  SEMI_TECHADA: 'Semi-techada',
};

const FRANJAS = ['MANANA', 'TARDE', 'NOCHE'] as const;
const franjaLabel: Record<string, string> = {
  MANANA: 'Ma\u00f1ana (06-12)',
  TARDE: 'Tarde (12-18)',
  NOCHE: 'Noche (18-23)',
};

const TIPOS_DIA = ['SEMANA', 'FIN_DE_SEMANA'] as const;
const tipoDiaLabel: Record<string, string> = {
  SEMANA: 'Lun-Vie',
  FIN_DE_SEMANA: 'S\u00e1b-Dom',
};

type PrecioKey = string; // "TIPO_FRANJA_DIA"
const precioKey = (tipo: string, franja: string, dia: string) => `${tipo}_${franja}_${dia}`;

export default function PreciosAlquilerConfig({ sedeId }: Props) {
  const [precios, setPrecios] = useState<Record<PrecioKey, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Track which tipos actually have canchas
  const [tiposEnSede, setTiposEnSede] = useState<TipoCancha[]>([]);

  useEffect(() => {
    loadData();
  }, [sedeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [preciosData, sedeData] = await Promise.all([
        alquileresService.getPrecios(sedeId),
        alquileresService.getSedeDetalle(sedeId),
      ]);

      // Get tipos from sede canchas
      const canchas = Array.isArray(sedeData.canchas) ? sedeData.canchas : [];
      const tipos = [...new Set(canchas.map((c: any) => c.tipo))] as TipoCancha[];
      setTiposEnSede(tipos.length > 0 ? tipos : TIPOS_CANCHA);

      // Build precios map
      const map: Record<PrecioKey, string> = {};
      const preciosList = Array.isArray(preciosData) ? preciosData : [];
      preciosList.forEach((p: AlquilerPrecio) => {
        map[precioKey(p.tipoCancha, p.franja, p.tipoDia)] = String(p.precio);
      });
      setPrecios(map);
    } catch {
      toast.error('Error cargando precios');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: PrecioKey, value: string) => {
    setPrecios((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const preciosList: { tipoCancha: string; tipoDia: string; franja: string; precio: number }[] = [];
      Object.entries(precios).forEach(([key, val]) => {
        const num = parseInt(val);
        if (!isNaN(num) && num > 0) {
          const [tipo, franja, dia] = key.split('_');
          preciosList.push({ tipoCancha: tipo, tipoDia: dia, franja, precio: num });
        }
      });
      await alquileresService.configurarPrecios(sedeId, preciosList);
      toast.success('Precios guardados');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error guardando precios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dark-text">Precios por Turno (Guaran\u00edes)</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </button>
      </div>

      <div className="space-y-6">
        {tiposEnSede.map((tipo) => (
          <div key={tipo} className="bg-dark-card rounded-xl border border-dark-border p-4">
            <h4 className="text-xs font-medium text-dark-muted mb-3">{tipoCanchaLabel[tipo]}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-dark-muted text-xs">
                    <th className="text-left py-2 pr-3"></th>
                    {TIPOS_DIA.map((td) => (
                      <th key={td} className="text-center py-2 px-2">{tipoDiaLabel[td]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FRANJAS.map((franja) => (
                    <tr key={franja} className="border-t border-dark-border/50">
                      <td className="py-2 pr-3 text-xs text-dark-muted whitespace-nowrap">{franjaLabel[franja]}</td>
                      {TIPOS_DIA.map((td) => {
                        const key = precioKey(tipo, franja, td);
                        return (
                          <td key={td} className="py-2 px-2">
                            <div className="relative">
                              <input
                                type="number"
                                value={precios[key] || ''}
                                onChange={(e) => handleChange(key, e.target.value)}
                                placeholder="0"
                                min="0"
                                step="5000"
                                className="w-full px-3 py-1.5 bg-dark-hover border border-dark-border rounded-lg text-sm text-dark-text text-center font-mono placeholder-dark-muted"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

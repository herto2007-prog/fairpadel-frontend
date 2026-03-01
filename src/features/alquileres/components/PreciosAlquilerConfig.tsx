import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { Button, Loading } from '@/components/ui';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { TipoCancha } from '@/types';
import type { AlquilerPrecio } from '@/types';

interface Props {
  sedeId: string;
}

const TIPOS_CANCHA = [TipoCancha.INDOOR, TipoCancha.OUTDOOR, TipoCancha.SEMI_TECHADA];
const tipoCanchaLabel: Record<string, string> = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  SEMI_TECHADA: 'Semi-techada',
};

const FRANJAS = ['MANANA', 'TARDE', 'NOCHE'] as const;
const franjaLabel: Record<string, string> = {
  MANANA: 'Mañana (06-12)',
  TARDE: 'Tarde (12-18)',
  NOCHE: 'Noche (18-23)',
};

const TIPOS_DIA = ['SEMANA', 'SABADO', 'DOMINGO'] as const;
const tipoDiaLabel: Record<string, string> = {
  SEMANA: 'Lun-Vie',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

type PrecioKey = string;
const precioKey = (tipo: string, franja: string, dia: string) => `${tipo}|${franja}|${dia}`;

export default function PreciosAlquilerConfig({ sedeId }: Props) {
  const [precios, setPrecios] = useState<Record<PrecioKey, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      const canchas = Array.isArray(sedeData.canchas) ? sedeData.canchas : [];
      const tipos = [...new Set(canchas.map((c: any) => c.tipo))] as TipoCancha[];
      setTiposEnSede(tipos.length > 0 ? tipos : TIPOS_CANCHA);

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
          const [tipo, franja, dia] = key.split('|');
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
    return <Loading size="lg" text="Cargando precios..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-light-text">Precios por Turno (Guaraníes)</h3>
        <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
          <Save className="w-4 h-4 mr-1.5" />
          Guardar
        </Button>
      </div>

      <div className="space-y-6">
        {tiposEnSede.map((tipo) => (
          <div key={tipo} className="bg-dark-card rounded-lg border border-dark-border p-4">
            <h4 className="text-xs font-medium text-light-muted mb-3 uppercase tracking-wide">
              {tipoCanchaLabel[tipo] || tipo}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="text-light-muted text-xs">
                    <th className="text-left py-2 pr-3"></th>
                    {TIPOS_DIA.map((td) => (
                      <th key={td} className="text-center py-2 px-2">{tipoDiaLabel[td]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FRANJAS.map((franja) => (
                    <tr key={franja} className="border-t border-dark-border/50">
                      <td className="py-2.5 pr-3 text-xs text-light-secondary whitespace-nowrap">{franjaLabel[franja]}</td>
                      {TIPOS_DIA.map((td) => {
                        const key = precioKey(tipo, franja, td);
                        return (
                          <td key={td} className="py-2.5 px-2">
                            <input
                              type="number"
                              value={precios[key] || ''}
                              onChange={(e) => handleChange(key, e.target.value)}
                              placeholder="0"
                              min="0"
                              step="5000"
                              className="w-full px-3 py-1.5 bg-dark-input border border-dark-border rounded-md text-sm text-light-text text-center font-mono placeholder:text-light-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
                            />
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

import { useMemo } from 'react';
import { Card } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { TournamentCategory } from '@/types';

interface ResumenCategoriasChartProps {
  categorias: (TournamentCategory & { inscripcionesCount: number })[];
}

function estadoToColor(estado: string, abierta: boolean): string {
  if (estado === 'FINALIZADA') return '#6b7280'; // gray-500
  if (estado === 'EN_CURSO') return '#a78bfa'; // purple-400
  if (estado === 'SORTEO_REALIZADO' || estado === 'FIXTURE_BORRADOR') return '#60a5fa'; // blue-400
  if (!abierta) return '#facc15'; // yellow-400 (cerrada)
  return '#4ade80'; // green-400 (abierta)
}

function estadoToLabel(estado: string, abierta: boolean): string {
  if (estado === 'FINALIZADA') return 'Finalizada';
  if (estado === 'EN_CURSO') return 'En Curso';
  if (estado === 'SORTEO_REALIZADO') return 'Sorteo Realizado';
  if (estado === 'FIXTURE_BORRADOR') return 'Fixture Borrador';
  if (!abierta) return 'Inscr. Cerradas';
  return 'Inscr. Abiertas';
}

interface ChartItem {
  name: string;
  fullName: string;
  parejas: number;
  estado: string;
  abierta: boolean;
  color: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as ChartItem;
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-light-text">{data.fullName}</p>
      <p className="text-sm text-light-secondary">{data.parejas} parejas</p>
      <p className="text-xs mt-1" style={{ color: data.color }}>
        {estadoToLabel(data.estado, data.abierta)}
      </p>
    </div>
  );
}

function CategoryBarChart({ data, title, titleColor }: { data: ChartItem[]; title: string; titleColor: string }) {
  const totalParejas = data.reduce((sum, d) => sum + d.parejas, 0);
  const maxParejas = Math.max(...data.map(d => d.parejas), 1);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-light-secondary text-sm">
        Sin categorias de {title.toLowerCase()}
      </div>
    );
  }

  return (
    <div>
      <h4 className={`font-semibold text-sm mb-3`} style={{ color: titleColor }}>{title}</h4>
      <div className="w-full" style={{ height: data.length * 36 + 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 45, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <XAxis type="number" hide domain={[0, maxParejas * 1.1]} />
            <YAxis
              type="category"
              dataKey="name"
              width={40}
              tick={{ fill: '#a0a0b0', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="parejas" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#f1f1f1', fontSize: 12, fontWeight: 600 }}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-light-secondary mt-2">
        Total: <span className="font-semibold text-light-text">{totalParejas}</span> parejas en {data.length} categorias
      </p>
    </div>
  );
}

const LEGEND_ITEMS = [
  { color: '#4ade80', label: 'Inscr. Abiertas' },
  { color: '#facc15', label: 'Inscr. Cerradas' },
  { color: '#60a5fa', label: 'Sorteo/Fixture' },
  { color: '#a78bfa', label: 'En Curso' },
  { color: '#6b7280', label: 'Finalizada' },
];

export function ResumenCategoriasChart({ categorias }: ResumenCategoriasChartProps) {
  const { caballeros, damas } = useMemo(() => {
    const cab: ChartItem[] = [];
    const dam: ChartItem[] = [];

    for (const tc of categorias) {
      const nombre = tc.category?.nombre || '';
      const shortName = nombre.replace(/ (Caballeros|Damas)/, '');
      const item: ChartItem = {
        name: shortName,
        fullName: nombre,
        parejas: tc.inscripcionesCount || 0,
        estado: tc.estado,
        abierta: tc.inscripcionAbierta,
        color: estadoToColor(tc.estado, tc.inscripcionAbierta),
      };

      if (nombre.toLowerCase().includes('caballeros')) {
        cab.push(item);
      } else if (nombre.toLowerCase().includes('damas')) {
        dam.push(item);
      }
    }

    // Sort by category order descending (8va first = highest orden)
    cab.sort((a, b) => {
      const catA = categorias.find(c => c.category?.nombre === a.fullName);
      const catB = categorias.find(c => c.category?.nombre === b.fullName);
      return (catB?.category?.orden ?? 0) - (catA?.category?.orden ?? 0);
    });
    dam.sort((a, b) => {
      const catA = categorias.find(c => c.category?.nombre === a.fullName);
      const catB = categorias.find(c => c.category?.nombre === b.fullName);
      return (catB?.category?.orden ?? 0) - (catA?.category?.orden ?? 0);
    });

    return { caballeros: cab, damas: dam };
  }, [categorias]);

  if (categorias.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-light-secondary text-sm">Sin categorias configuradas</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-sm text-light-secondary mb-4 uppercase tracking-wider">Categorias</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryBarChart data={caballeros} title="Caballeros" titleColor="#60a5fa" />
        <CategoryBarChart data={damas} title="Damas" titleColor="#f472b6" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t border-dark-border">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-light-secondary">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

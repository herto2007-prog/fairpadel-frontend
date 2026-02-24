import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS_INGRESO = ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#86efac', '#4ade80', '#bbf7d0', '#dcfce7'];
const COLORS_EGRESO = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#dc2626', '#b91c1c', '#fb923c', '#f97316', '#ea580c'];

interface ChartItem {
  name: string;
  value: number;
}

// Custom tooltip for dark theme
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-light-text font-medium">{payload[0].name || payload[0].payload?.name}</p>
      <p className="text-xs text-light-secondary">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

// Custom label for pie slices
function renderLabel({ percent }: any) {
  if (percent < 0.05) return null;
  return `${(percent * 100).toFixed(0)}%`;
}

interface DonutProps {
  data: ChartItem[];
  colors: string[];
  title: string;
  total: number;
  emptyText?: string;
}

export function FinanzasDonut({ data, colors, title, total, emptyText = 'Sin datos' }: DonutProps) {
  if (data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[240px]">
        <p className="text-sm text-light-secondary">{emptyText}</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-light-secondary mb-2 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={renderLabel}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="text-[10px] text-light-secondary">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BalanceBarProps {
  ingresos: number;
  egresos: number;
}

export function BalanceBarChart({ ingresos, egresos }: BalanceBarProps) {
  const data = [
    { name: 'Ingresos', value: ingresos, fill: '#22c55e' },
    { name: 'Egresos', value: egresos, fill: '#ef4444' },
  ];

  if (ingresos === 0 && egresos === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[160px]">
        <p className="text-sm text-light-secondary">Sin movimientos registrados</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-light-secondary mb-2 text-center">Ingresos vs Egresos</h4>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={70} tick={{ fill: '#a0a0b0', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { COLORS_INGRESO, COLORS_EGRESO };

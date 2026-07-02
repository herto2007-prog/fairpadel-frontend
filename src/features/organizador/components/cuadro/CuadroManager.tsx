import { useState } from 'react';
import { Settings2, GitBranch, CalendarDays } from 'lucide-react';
import { CanchasSorteoManager } from '../canchas-sorteo/CanchasSorteoManager';
import { BracketManager } from '../bracket';
import { AgendaCalendario } from './AgendaCalendario';

interface Props {
  tournamentId: string;
}

type Vista = 'configurar' | 'cuadros' | 'agenda';

// ============================================
// CUADRO — un solo momento del torneo (¿cuándo y dónde?)
// Fusiona "Canchas y Sorteo" + "Fixture" en un flujo único:
//   1) Configurar y sortear (sedes, días, capacidad → sorteo)
//   2) Cuadros (ver/publicar, re-sortear, reprogramar, finalizar)
// No reescribe la lógica de los managers: los orquesta bajo una
// sub-navegación que cuenta el flujo de principio a fin.
// ============================================
export function CuadroManager({ tournamentId }: Props) {
  const [vista, setVista] = useState<Vista>('configurar');

  return (
    <div className="space-y-6">
      {/* Sub-navegación del momento "Cuadro" */}
      <div>
        <div className="inline-flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
          <SubTab
            active={vista === 'configurar'}
            icon={Settings2}
            label="Configurar y sortear"
            onClick={() => setVista('configurar')}
          />
          <SubTab
            active={vista === 'cuadros'}
            icon={GitBranch}
            label="Cuadros"
            onClick={() => setVista('cuadros')}
          />
          <SubTab
            active={vista === 'agenda'}
            icon={CalendarDays}
            label="Agenda"
            onClick={() => setVista('agenda')}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Configurá sedes y días, sorteá las categorías, y después revisá y publicá los cuadros.
        </p>
      </div>

      {/* Vista activa */}
      {vista === 'configurar' && <CanchasSorteoManager tournamentId={tournamentId} />}
      {vista === 'cuadros' && <BracketManager tournamentId={tournamentId} />}
      {vista === 'agenda' && <AgendaCalendario tournamentId={tournamentId} />}
    </div>
  );
}

interface SubTabProps {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

function SubTab({ active, icon: Icon, label, onClick }: SubTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-[#df2531] text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

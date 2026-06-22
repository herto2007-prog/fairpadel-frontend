import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Building2, Settings, Trophy, Route, Award, Users,
  Crown, CreditCard, MessageCircle, ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { UserRoleManager } from '../components/UserRoleManager';
import { SedesManager } from '../components/SedesManager';
import { ModalidadesManager } from '../components/ModalidadesManager';
import { FairpadelPanel } from '../components/FairpadelPanel';
import { CircuitosManager } from '../components/CircuitosManager';
import { SedesDuenosManager } from '../components/SedesDuenosManager';
import { SuscripcionesManager } from '../components/SuscripcionesManager';
import { useNoIndex } from '../../../hooks/useNoIndex';

type SectionId =
  | 'torneos' | 'circuitos'
  | 'usuarios' | 'duenos'
  | 'sedes' | 'modalidades'
  | 'suscripciones';

interface NavItem {
  id: SectionId | string;
  label: string;
  icon: typeof Trophy;
  subtitle: string;
  href?: string; // si tiene href, abre su propia pantalla
  accent?: string; // color del icono para los destacados
}

const GRUPOS: { titulo: string; items: NavItem[] }[] = [
  {
    titulo: 'Competencia',
    items: [
      { id: 'torneos', label: 'Torneos', icon: Trophy, subtitle: 'Centro de torneos: aprobar, cobrar y configurar' },
      { id: 'circuitos', label: 'Circuitos', icon: Route, subtitle: 'Ligas y rankings por circuito' },
      { id: 'federacion', label: 'Federación', icon: Award, subtitle: 'Categorías, ascensos y descensos', href: '/admin/federacion', accent: '#df2531' },
    ],
  },
  {
    titulo: 'Gente',
    items: [
      { id: 'usuarios', label: 'Usuarios', icon: Users, subtitle: 'Cuentas, roles y datos de jugadores' },
      { id: 'duenos', label: 'Dueños de sede', icon: Crown, subtitle: 'Asignación de dueños a sedes' },
    ],
  },
  {
    titulo: 'Lugares',
    items: [
      { id: 'sedes', label: 'Sedes y canchas', icon: Building2, subtitle: 'Sedes, canchas y disponibilidad' },
      { id: 'modalidades', label: 'Modalidades', icon: Settings, subtitle: 'Reglas y formatos de juego' },
    ],
  },
  {
    titulo: 'Negocio',
    items: [
      { id: 'suscripciones', label: 'Suscripciones', icon: CreditCard, subtitle: 'Planes y pagos de sedes' },
      { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, subtitle: 'Conversaciones y leads', href: '/admin/whatsapp', accent: '#22c55e' },
    ],
  },
];

const TODOS = GRUPOS.flatMap((g) => g.items);

export function AdminPage() {
  useNoIndex();
  const [active, setActive] = useState<SectionId>('torneos');
  const navigate = useNavigate();

  const activeItem = TODOS.find((i) => i.id === active);
  const ActiveIcon = activeItem?.icon ?? Trophy;

  return (
    <div className="min-h-screen bg-dark">
      <BackgroundEffects variant="subtle" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 md:flex-shrink-0">
          <div className="flex items-center gap-2 px-2 pb-4 mb-2 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-[#df2531] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Panel FairPadel</span>
          </div>

          <nav className="space-y-4">
            {GRUPOS.map((grupo) => (
              <div key={grupo.titulo}>
                <p className="px-3 mb-1 text-[11px] uppercase tracking-wide text-gray-600">{grupo.titulo}</p>
                <div className="space-y-0.5">
                  {grupo.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = !item.href && item.id === active;
                    return (
                      <button
                        key={item.id}
                        onClick={() => (item.href ? navigate(item.href) : setActive(item.id as SectionId))}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-[#df2531]/15 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <Icon
                            className="w-[18px] h-[18px] flex-shrink-0"
                            style={item.accent ? { color: item.accent } : undefined}
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.href && <ExternalLink className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Contenido */}
        <main className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <ActiveIcon className="w-5 h-5 text-[#df2531]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{activeItem?.label}</h1>
                {activeItem?.subtitle && <p className="text-sm text-gray-400">{activeItem.subtitle}</p>}
              </div>
            </div>
          </motion.div>

          <motion.div
            key={active}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            {active === 'torneos' && <FairpadelPanel />}
            {active === 'circuitos' && <CircuitosManager />}
            {active === 'usuarios' && <UserRoleManager />}
            {active === 'duenos' && <SedesDuenosManager />}
            {active === 'sedes' && <SedesManager />}
            {active === 'modalidades' && <ModalidadesManager />}
            {active === 'suscripciones' && <SuscripcionesManager />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

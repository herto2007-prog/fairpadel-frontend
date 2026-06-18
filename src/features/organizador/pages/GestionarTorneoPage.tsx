import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Trophy, LayoutDashboard, Users,
  GitBranch, Database, Sparkles, Swords, Pencil
} from 'lucide-react';
import { OverviewTab } from '../components/overview/OverviewTab';

import { InscripcionesManager } from '../components/inscripciones/InscripcionesManager';
import { CuadroManager } from '../components/cuadro/CuadroManager';
import { CentroPartidos } from '../components/centro-partidos/CentroPartidos';
import { CompletarDatosTorneoModal } from '../components/overview/CompletarDatosTorneoModal';

import { AuditoriaManager } from '../components/auditoria/AuditoriaManager';
import { AmericanoManager } from '../components/americano/AmericanoManager';
import { api } from '../../../services/api';
import { useNoIndex } from '../../../hooks/useNoIndex';

interface Torneo {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  fechaInicio?: string;
  fechaFin?: string;
  formato?: string;
}

type TabType = 'overview' | 'inscripciones' | 'cuadro' | 'centroPartidos' | 'auditoria' | 'americano';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: number;
  // Auditoría es la herramienta admin/dueño — no es uno de los 4 momentos
  // del organizador, así que la separamos visualmente del resto.
  aparte?: boolean;
}

export function GestionarTorneoPage() {
  useNoIndex();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [editVersion, setEditVersion] = useState(0);
  const [stats, setStats] = useState({
    inscripcionesPendientes: 0,
  });

  useEffect(() => {
    if (id) {
      loadTorneo();
      loadStats();
    }
  }, [id]);

  const loadStats = async () => {
    if (!id) return;
    try {
      const inscResponse = await api.get(`/admin/torneos/${id}/inscripciones`);

      if (inscResponse.data?.stats) {
        setStats({
          inscripcionesPendientes: inscResponse.data.stats.pendientes || 0,
        });
      }
    } catch (error) {
      console.error('Error cargando stats:', error);
    }
  };

  const loadTorneo = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${id}`);
      if (data) {
        if (data.formato === 'americano') {
          navigate(`/americano/${id}`, { replace: true });
          return;
        }
        setTorneo(data);
      }
    } catch (error) {
      console.error('Error cargando torneo:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
    {
      id: 'inscripciones',
      label: 'Inscriptos',
      icon: Users,
      badge: stats.inscripcionesPendientes > 0 ? stats.inscripcionesPendientes : undefined,
    },
    ...(torneo?.formato === 'americano'
      ? [{ id: 'americano' as TabType, label: 'Americano', icon: Sparkles }]
      : [
          { id: 'cuadro' as TabType, label: 'Cuadro', icon: GitBranch },
          { id: 'centroPartidos' as TabType, label: 'Partidos', icon: Swords },
          { id: 'auditoria' as TabType, label: 'Auditoría', icon: Database, aparte: true },
        ]
    ),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  if (!torneo) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Torneo no encontrado</h2>
          <button
            onClick={() => navigate('/mis-torneos')}
            className="mt-4 px-6 py-2 bg-[#df2531] text-white rounded-xl"
          >
            Volver a Mis Torneos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      {/* Header */}
      <div className="bg-[#151921] border-b border-[#232838]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/mis-torneos')}
              className="p-2 hover:bg-[#232838] rounded-xl transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-400" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">{torneo.nombre}</h1>
              <p className="text-gray-400 text-sm">{torneo.ciudad}</p>
            </div>
            {/* Editar transversal: disponible siempre, desde cualquier momento */}
            <button
              onClick={() => setMostrarEditar(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors flex-shrink-0"
              title="Editar datos del torneo"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {tabs.map((tab, index) => (
            <Fragment key={tab.id}>
              {/* Separador: Auditoría (herramienta admin) queda aparte de los 4 momentos */}
              {tab.aparte && index > 0 && !tabs[index - 1].aparte && (
                <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
              )}
              <TabButton
                label={tab.label}
                icon={tab.icon}
                active={activeTab === tab.id}
                badge={tab.badge}
                onClick={() => setActiveTab(tab.id)}
              />
            </Fragment>
          ))}
        </div>

        {/* Contenido */}
        {activeTab === 'overview' && id && (
          <OverviewTab
            tournamentId={id}
            onTabChange={(tab) => setActiveTab(tab as TabType)}
            onEditar={() => setMostrarEditar(true)}
            reloadSignal={editVersion}
          />
        )}

        {activeTab === 'inscripciones' && id && (
          <InscripcionesManager tournamentId={id} />
        )}

        {activeTab === 'cuadro' && id && (
          <CuadroManager tournamentId={id} />
        )}

        {activeTab === 'centroPartidos' && id && (
          <CentroPartidos tournamentId={id} />
        )}



        {activeTab === 'auditoria' && id && (
          <AuditoriaManager tournamentId={id} />
        )}

        {activeTab === 'americano' && id && (
          <AmericanoManager tournamentId={id} />
        )}
      </div>

      {/* Editar datos del torneo (transversal) */}
      {mostrarEditar && id && (
        <CompletarDatosTorneoModal
          tournamentId={id}
          onClose={() => setMostrarEditar(false)}
          onSaved={() => {
            loadTorneo();
            loadStats();
            setEditVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}

interface TabButtonProps {
  label: string;
  icon: React.ElementType;
  active: boolean;
  badge?: number;
  onClick: () => void;
}

function TabButton({ label, icon: Icon, active, badge, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
        active
          ? 'bg-[#df2531] text-white'
          : 'bg-[#151921] text-gray-400 hover:text-white hover:bg-[#232838]'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
          active ? 'bg-white text-[#df2531]' : 'bg-[#df2531] text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

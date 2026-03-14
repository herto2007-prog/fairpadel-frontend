import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Trophy, LayoutDashboard, Users, Calendar, 
  GitBranch, Settings, DollarSign, Info, Eye 
} from 'lucide-react';
import { OverviewTab } from '../components/overview/OverviewTab';
import { ChecklistCuaderno } from '../components/checklist/ChecklistCuaderno';
import { InscripcionesManager } from '../components/inscripciones/InscripcionesManager';
import { BracketManager } from '../components/bracket';
import { ProgramacionManager } from '../components/programacion/ProgramacionManager';
import { ConfiguradorSede, CalendarioDisponibilidad } from '../components/disponibilidad';
import { VistaDemo } from '../components/vista-demo';
import { api } from '../../../services/api';

interface Torneo {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  fechaInicio?: string;
  fechaFin?: string;
}

type TabType = 'overview' | 'inscripciones' | 'disponibilidad' | 'bracket' | 'programacion' | 'comision' | 'checklist' | 'info' | 'vistaDemo';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export function GestionarTorneoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dispVista, setDispVista] = useState<'configurar' | 'ver'>('configurar');
  const [dispRefreshKey, setDispRefreshKey] = useState(0);
  const [categoriasSorteadas, setCategoriasSorteadas] = useState<any[]>([]);
  const [stats, setStats] = useState({
    inscripcionesPendientes: 0,
    tareasChecklist: 0,
  });

  useEffect(() => {
    if (id) {
      loadTorneo();
      loadStats();
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'programacion' && id) {
      loadCategoriasSorteadas();
    }
  }, [activeTab, id]);

  const loadStats = async () => {
    if (!id) return;
    try {
      // Cargar stats para badges
      const [inscResponse, checklistResponse] = await Promise.all([
        api.get(`/admin/torneos/${id}/inscripciones`),
        api.get(`/admin/torneos/${id}/checklist`),
      ]);

      if (inscResponse.data?.stats) {
        setStats(prev => ({
          ...prev,
          inscripcionesPendientes: inscResponse.data.stats.pendientes || 0,
        }));
      }

      if (checklistResponse.data?.items) {
        const pendientes = checklistResponse.data.items.filter((i: any) => !i.completado).length;
        setStats(prev => ({
          ...prev,
          tareasChecklist: pendientes,
        }));
      }
    } catch (error) {
      console.error('Error cargando stats:', error);
    }
  };

  const loadCategoriasSorteadas = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${id}/categorias`);
      if (data.success) {
        const sorteadas = data.categorias.filter((c: any) => c.fixtureVersionId);
        setCategoriasSorteadas(sorteadas);
      }
    } catch (error) {
      console.error('Error cargando categorias:', error);
    }
  };

  const loadTorneo = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${id}`);
      if (data) {
        setTorneo(data);
      }
    } catch (error) {
      console.error('Error cargando torneo:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { 
      id: 'inscripciones', 
      label: 'Inscripciones', 
      icon: Users,
      badge: stats.inscripcionesPendientes > 0 ? stats.inscripcionesPendientes : undefined,
    },
    { id: 'disponibilidad', label: 'Canchas', icon: Calendar },
    { id: 'bracket', label: 'Fixture', icon: GitBranch },
    { id: 'programacion', label: 'Programacion', icon: Calendar },
    { id: 'comision', label: 'Comision', icon: DollarSign },
    { 
      id: 'checklist', 
      label: 'Checklist', 
      icon: Settings,
      badge: stats.tareasChecklist > 0 ? stats.tareasChecklist : undefined,
    },
    { id: 'info', label: 'Info', icon: Info },
    { id: 'vistaDemo', label: 'Vista Publica', icon: Eye },
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
            <div>
              <h1 className="text-xl font-bold text-white">{torneo.nombre}</h1>
              <p className="text-gray-400 text-sm">{torneo.ciudad}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              badge={tab.badge}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* Contenido */}
        {activeTab === 'overview' && id && (
          <OverviewTab 
            tournamentId={id} 
            onTabChange={(tab) => setActiveTab(tab as TabType)}
          />
        )}

        {activeTab === 'checklist' && id && (
          <ChecklistCuaderno tournamentId={id} />
        )}

        {activeTab === 'inscripciones' && id && (
          <InscripcionesManager tournamentId={id} />
        )}

        {activeTab === 'disponibilidad' && id && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setDispVista('configurar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dispVista === 'configurar'
                    ? 'bg-[#df2531] text-white'
                    : 'bg-[#151921] text-gray-400 hover:text-white'
                }`}
              >
                Configurar
              </button>
              <button
                onClick={() => setDispVista('ver')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dispVista === 'ver'
                    ? 'bg-[#df2531] text-white'
                    : 'bg-[#151921] text-gray-400 hover:text-white'
                }`}
              >
                Ver Calendario
              </button>
            </div>
            
            {dispVista === 'configurar' ? (
              <ConfiguradorSede 
                tournamentId={id} 
                fechaInicio={torneo?.fechaInicio}
                fechaFin={torneo?.fechaFin}
                onSave={() => {
                  setDispRefreshKey(prev => prev + 1);
                  setDispVista('ver');
                }}
              />
            ) : (
              <CalendarioDisponibilidad 
                key={dispRefreshKey}
                tournamentId={id} 
                fechaInicio={torneo?.fechaInicio}
                fechaFin={torneo?.fechaFin}
              />
            )}
          </div>
        )}

        {activeTab === 'bracket' && id && (
          <BracketManager tournamentId={id} />
        )}

        {activeTab === 'programacion' && id && (
          <ProgramacionManager 
            tournamentId={id} 
            categoriasSorteadas={categoriasSorteadas}
          />
        )}

        {activeTab === 'comision' && (
          <div className="glass rounded-2xl p-8 text-center">
            <h3 className="text-lg font-medium text-gray-400">
              Comision - Próximamente
            </h3>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="glass rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-4">Informacion del Torneo</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Nombre:</span>
                <p className="text-white">{torneo.nombre}</p>
              </div>
              <div>
                <span className="text-gray-500">Ciudad:</span>
                <p className="text-white">{torneo.ciudad}</p>
              </div>
              <div>
                <span className="text-gray-500">Estado:</span>
                <p className="text-white">{torneo.estado}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vistaDemo' && <VistaDemo />}
      </div>
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

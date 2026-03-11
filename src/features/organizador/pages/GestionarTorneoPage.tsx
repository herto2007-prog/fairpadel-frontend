import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy } from 'lucide-react';
import { ChecklistCuaderno } from '../components/checklist/ChecklistCuaderno';
import { InscripcionesManager } from '../components/inscripciones/InscripcionesManager';
import { BracketManager } from '../components/bracket';
import { DisponibilidadWizard, CalendarioDisponibilidad } from '../components/disponibilidad';
import { api } from '../../../services/api';

interface Torneo {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export function GestionarTorneoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'inscripciones' | 'disponibilidad' | 'bracket' | 'comision' | 'info'>('checklist');
  const [dispVista, setDispVista] = useState<'configurar' | 'ver'>('configurar');

  useEffect(() => {
    if (id) {
      loadTorneo();
    }
  }, [id]);

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
        <div className="flex gap-2 mb-6">
          <TabButton
            label="Checklist"
            active={activeTab === 'checklist'}
            onClick={() => setActiveTab('checklist')}
          />
          <TabButton
            label="Inscripciones"
            active={activeTab === 'inscripciones'}
            onClick={() => setActiveTab('inscripciones')}
          />
          <TabButton
            label="Disponibilidad"
            active={activeTab === 'disponibilidad'}
            onClick={() => setActiveTab('disponibilidad')}
          />
          <TabButton
            label="Fixture"
            active={activeTab === 'bracket'}
            onClick={() => setActiveTab('bracket')}
          />
          <TabButton
            label="Comisión"
            active={activeTab === 'comision'}
            onClick={() => setActiveTab('comision')}
          />
          <TabButton
            label="Información"
            active={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
          />
        </div>

        {/* Contenido */}
        {activeTab === 'checklist' && id && (
          <ChecklistCuaderno tournamentId={id} />
        )}

        {activeTab === 'inscripciones' && id && (
          <InscripcionesManager tournamentId={id} />
        )}

        {activeTab === 'disponibilidad' && id && (
          <div className="space-y-4">
            {/* Sub-tabs para disponibilidad */}
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
              <DisponibilidadWizard 
                tournamentId={id} 
                fechaInicio={torneo?.fechaInicio}
                fechaFin={torneo?.fechaFin}
              />
            ) : (
              <CalendarioDisponibilidad tournamentId={id} />
            )}
          </div>
        )}

        {activeTab === 'bracket' && id && (
          <BracketManager tournamentId={id} />
        )}

        {activeTab === 'comision' && (
          <div className="glass rounded-2xl p-8 text-center">
            <h3 className="text-lg font-medium text-gray-400">
              Comisión - Próximamente
            </h3>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="glass rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-4">Información del Torneo</h3>
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
      </div>
    </div>
  );
}

function TabButton({ 
  label, 
  active, 
  onClick 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium transition-all ${
        active
          ? 'bg-[#df2531] text-white'
          : 'bg-[#151921] text-gray-400 hover:text-white hover:bg-[#232838]'
      }`}
    >
      {label}
    </button>
  );
}

import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { Calendar, Clock, Ban, DollarSign, Settings, MapPin } from 'lucide-react';
import { Loading } from '@/components/ui';
import ReservasAlquilerList from '../components/ReservasAlquilerList';
import DisponibilidadHorariosConfig from '../components/DisponibilidadHorariosConfig';
import BloqueosAlquilerManager from '../components/BloqueosAlquilerManager';
import PreciosAlquilerConfig from '../components/PreciosAlquilerConfig';
import ConfigAlquilerPanel from '../components/ConfigAlquilerPanel';

type Tab = 'reservas' | 'disponibilidad' | 'bloqueos' | 'precios' | 'config';

const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'reservas', label: 'Reservas', icon: Calendar },
  { key: 'disponibilidad', label: 'Disponibilidad', icon: Clock },
  { key: 'bloqueos', label: 'Bloqueos', icon: Ban },
  { key: 'precios', label: 'Precios', icon: DollarSign },
  { key: 'config', label: 'Configuración', icon: Settings },
];

export default function GestionAlquileresPage() {
  const [sedeId, setSedeId] = useState<string | null>(null);
  const [sedeName, setSedeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('reservas');

  useEffect(() => {
    const loadSede = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await alquileresService.getMiSede();
        if (data?.sedeId) {
          setSedeId(data.sedeId);
          setSedeName(data.sede?.nombre || 'Mi Sede');
        } else {
          setError('No tenés una sede asignada para gestionar alquileres.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error cargando sede asignada');
      } finally {
        setLoading(false);
      }
    };
    loadSede();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !sedeId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-light-muted mx-auto mb-3" />
          <p className="text-light-muted">{error || 'No tenés una sede asignada.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Gestión de Alquileres</h1>
        <p className="text-sm sm:text-base text-light-secondary mt-1 flex items-center gap-1">
          <MapPin className="w-4 h-4" /> {sedeName}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                  : 'bg-dark-card border border-dark-border text-light-muted hover:text-light-text hover:bg-dark-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'reservas' && <ReservasAlquilerList sedeId={sedeId} />}
      {activeTab === 'disponibilidad' && <DisponibilidadHorariosConfig sedeId={sedeId} />}
      {activeTab === 'bloqueos' && <BloqueosAlquilerManager sedeId={sedeId} />}
      {activeTab === 'precios' && <PreciosAlquilerConfig sedeId={sedeId} />}
      {activeTab === 'config' && <ConfigAlquilerPanel sedeId={sedeId} />}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, CheckCircle, XCircle, Settings, Loader2, ExternalLink, MapPin, Calendar } from 'lucide-react';
import { circuitosService } from '../../circuitos/circuitosService';
import { formatDatePY } from '../../../utils/date';

interface Circuito {
  id: string;
  nombre: string;
  slug: string;
  ciudad: string;
  temporada: string;
  estado: string;
  fechaInicio: string;
  _count?: {
    torneos: number;
  };
}

interface Solicitud {
  id: string;
  orden: number;
  estado: string;
  puntosValidos: boolean;
  torneo: {
    id: string;
    nombre: string;
    fechaInicio: string;
    ciudad: string;
    organizador: {
      nombre: string;
      apellido: string;
    };
  };
  circuito: {
    id: string;
    nombre: string;
  };
}

export function CircuitosManager() {
  const [activeSubTab, setActiveSubTab] = useState<'circuitos' | 'solicitudes' | 'nuevo'>('circuitos');
  const [circuitos, setCircuitos] = useState<Circuito[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'circuitos') {
        const res = await circuitosService.getCircuitos();
        if (res.success) setCircuitos(res.data);
      } else if (activeSubTab === 'solicitudes') {
        const res = await circuitosService.getSolicitudesPendientes();
        if (res.success) setSolicitudes(res.data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcesarSolicitud = async (id: string, estado: 'APROBADO' | 'RECHAZADO') => {
    if (!confirm(`¿${estado === 'APROBADO' ? 'Aprobar' : 'Rechazar'} esta solicitud?`)) return;
    
    setProcessing(id);
    try {
      await circuitosService.procesarSolicitud(id, {
        estado,
        puntosValidos: estado === 'APROBADO',
      });
      await loadData();
    } catch (error) {
      alert('Error procesando solicitud');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('circuitos')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeSubTab === 'circuitos'
              ? 'bg-[#df2531] text-white'
              : 'bg-[#151921] text-gray-400 hover:text-white'
          }`}
        >
          Circuitos
        </button>
        <button
          onClick={() => setActiveSubTab('solicitudes')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'solicitudes'
              ? 'bg-[#df2531] text-white'
              : 'bg-[#151921] text-gray-400 hover:text-white'
          }`}
        >
          Solicitudes
          {solicitudes.length > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{solicitudes.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('nuevo')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'nuevo'
              ? 'bg-green-600 text-white'
              : 'bg-[#151921] text-gray-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          Nuevo Circuito
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
        </div>
      ) : activeSubTab === 'circuitos' ? (
        <div className="grid gap-4">
          {circuitos.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hay circuitos creados</p>
          ) : (
            circuitos.map((circuito) => (
              <motion.div
                key={circuito.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#151921] border border-white/5 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-lg">{circuito.nombre}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {circuito.ciudad}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDatePY(circuito.fechaInicio)}
                      </span>
                      <span className="px-2 py-0.5 bg-white/5 rounded">
                        Temp. {circuito.temporada}
                      </span>
                      <span className="px-2 py-0.5 bg-[#df2531]/20 text-[#df2531] rounded">
                        {circuito._count?.torneos || 0} torneos
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/circuitos/${circuito.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : activeSubTab === 'solicitudes' ? (
        <div className="grid gap-4">
          {solicitudes.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hay solicitudes pendientes</p>
          ) : (
            solicitudes.map((sol) => (
              <motion.div
                key={sol.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#151921] border border-white/5 rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-5 h-5 text-[#df2531]" />
                      <h3 className="font-bold text-white">{sol.torneo.nombre}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Quiere unirse a: <span className="text-white">{sol.circuito.nombre}</span>
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Organizador: {sol.torneo.organizador.apellido}, {sol.torneo.organizador.nombre}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {sol.torneo.ciudad} • {formatDatePY(sol.torneo.fechaInicio)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleProcesarSolicitud(sol.id, 'APROBADO')}
                      disabled={processing === sol.id}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50"
                    >
                      {processing === sol.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleProcesarSolicitud(sol.id, 'RECHAZADO')}
                      disabled={processing === sol.id}
                      className="flex items-center gap-1 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <NuevoCircuitoForm onSuccess={() => { setActiveSubTab('circuitos'); loadData(); }} />
      )}
    </div>
  );
}

function NuevoCircuitoForm({ onSuccess }: { onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    ciudad: 'Asunción',
    fechaInicio: '',
    torneosParaClasificar: 8,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await circuitosService.createCircuito(formData);
      onSuccess();
    } catch (error) {
      alert('Error creando circuito');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#151921] border border-white/5 rounded-xl p-6 space-y-4">
      <h3 className="font-bold text-white text-lg">Crear Nuevo Circuito</h3>
      
      <div>
        <label className="text-sm text-gray-400 block mb-1">Nombre del Circuito</label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          placeholder="Ej: Copa Primavera 2025"
          required
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Descripción</label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          rows={3}
          placeholder="Descripción del circuito..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Ciudad</label>
          <input
            type="text"
            value={formData.ciudad}
            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Fecha de Inicio</label>
          <input
            type="date"
            value={formData.fechaInicio}
            onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Torneos que clasifican</label>
        <input
          type="number"
          value={formData.torneosParaClasificar}
          onChange={(e) => setFormData({ ...formData, torneosParaClasificar: parseInt(e.target.value) })}
          className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          min={1}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {saving ? 'Creando...' : 'Crear Circuito'}
      </button>
    </form>
  );
}

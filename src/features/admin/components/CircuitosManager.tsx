import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, CheckCircle, XCircle, Settings, Loader2, ExternalLink, MapPin, Upload, Image as ImageIcon } from 'lucide-react';
import { circuitosService } from '../../circuitos/circuitosService';

interface Circuito {
  id: string;
  nombre: string;
  slug: string;
  ciudad: string;
  temporada: string;
  estado: string;
  logoUrl?: string;
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
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  {circuito.logoUrl ? (
                    <img 
                      src={circuito.logoUrl} 
                      alt={circuito.nombre}
                      className="w-16 h-16 rounded-lg object-cover bg-white/5"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{circuito.nombre}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {circuito.ciudad}
                      </span>
                      <span className="px-2 py-0.5 bg-white/5 rounded">
                        Temp. {circuito.temporada || '2026'}
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
                      {sol.torneo.ciudad} • {new Date(sol.torneo.fechaInicio).toLocaleDateString('es-PY')}
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    ciudad: 'Asunción',
    temporada: new Date().getFullYear().toString(),
    colorPrimario: '#df2531',
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const res = await circuitosService.uploadLogo(file);
      if (res.success && res.url) {
        setLogoUrl(res.url);
      }
    } catch (error) {
      alert('Error subiendo logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await circuitosService.createCircuito({
        ...formData,
        logoUrl: logoUrl || undefined,
      });
      onSuccess();
    } catch (error) {
      alert('Error creando circuito');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#151921] border border-white/5 rounded-xl p-6 space-y-4 max-w-2xl">
      <h3 className="font-bold text-white text-lg">Crear Nuevo Circuito</h3>
      
      {/* Logo Upload */}
      <div>
        <label className="text-sm text-gray-400 block mb-2">Logo del Circuito</label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo preview" 
              className="w-20 h-20 rounded-lg object-cover bg-white/5"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
              <ImageIcon className="w-8 h-8 text-gray-600" />
            </div>
          )}
          <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            {uploadingLogo ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">Nombre del Circuito *</label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
          placeholder="Ej: Circuito Metropolitano"
          required
        />
      </div>

      {/* Descripción */}
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

      {/* Ciudad y Temporada */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Ciudad *</label>
          <input
            type="text"
            value={formData.ciudad}
            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Temporada *</label>
          <input
            type="number"
            value={formData.temporada}
            onChange={(e) => setFormData({ ...formData, temporada: e.target.value })}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white"
            min={2024}
            max={2030}
            required
          />
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">Color Principal</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={formData.colorPrimario}
            onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
            className="w-12 h-10 rounded cursor-pointer bg-transparent"
          />
          <span className="text-gray-400 text-sm">{formData.colorPrimario}</span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-400">
        <p>• Los circuitos son por temporada anual (2026, 2027...)</p>
        <p>• Al finalizar la temporada se resetean los puntos</p>
        <p>• El Master Final se configura como un torneo más del circuito</p>
      </div>

      <button
        type="submit"
        disabled={saving || uploadingLogo}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {saving ? 'Creando...' : 'Crear Circuito'}
      </button>
    </form>
  );
}

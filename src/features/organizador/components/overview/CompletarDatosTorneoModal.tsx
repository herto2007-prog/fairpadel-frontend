import { useState } from 'react';
import { X, Upload, Loader2, MapPin, DollarSign, Image as ImageIcon } from 'lucide-react';
import { api } from '../../../../services/api';
import { CityAutocomplete } from '../../../../components/ui/CityAutocomplete';
import { useToast } from '../../../../components/ui/ToastProvider';

interface Props {
  tournamentId: string;
  ciudadInicial?: string;
  costoInicial?: number;
  flyerInicial?: string;
  onClose: () => void;
  onSaved: () => void;
}

// Form para completar los datos públicos del torneo que el borrador difiere:
// ciudad, costo y flyer. (La sede se asigna en la pestaña Canchas.)
export function CompletarDatosTorneoModal({
  tournamentId,
  ciudadInicial,
  costoInicial,
  flyerInicial,
  onClose,
  onSaved,
}: Props) {
  const { showSuccess, showError } = useToast();
  const [ciudad, setCiudad] = useState(ciudadInicial || '');
  const [costo, setCosto] = useState<number>(costoInicial || 0);
  const [flyerUrl, setFlyerUrl] = useState(flyerInicial || '');
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const subirFlyer = async (file: File) => {
    if (!file) return;
    setSubiendo(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('folder', 'tournaments');
    try {
      const { data } = await api.post('/uploads/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) setFlyerUrl(data.data.url);
    } catch {
      showError('Error', 'No se pudo subir la imagen');
    } finally {
      setSubiendo(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.put(`/admin/torneos/${tournamentId}`, {
        ciudad,
        costoInscripcion: costo,
        flyerUrl,
      });
      showSuccess('Datos guardados', 'Los datos del torneo se actualizaron.');
      onSaved();
      onClose();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudieron guardar los datos');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#232838]">
          <h3 className="font-bold text-white">Datos del torneo</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-xs text-gray-500">
            Completá estos datos para que el torneo pueda salir público. La sede se asigna en la pestaña Canchas.
          </p>

          {/* Ciudad */}
          <div>
            <label className="text-sm text-white mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#df2531]" /> Ciudad
            </label>
            <CityAutocomplete value={ciudad} onChange={setCiudad} placeholder="Buscar ciudad..." />
          </div>

          {/* Costo */}
          <div>
            <label className="text-sm text-white mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#df2531]" /> Costo de inscripción
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-medium">Gs.</span>
              <input
                type="text"
                inputMode="numeric"
                value={costo ? costo.toLocaleString('es-PY') : ''}
                onChange={(e) => setCosto(parseInt(e.target.value.replace(/[^\d]/g, '')) || 0)}
                placeholder="0"
                className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 pl-12 pr-3 text-white focus:outline-none focus:border-[#df2531]/50"
              />
            </div>
          </div>

          {/* Flyer */}
          <div>
            <label className="text-sm text-white mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#df2531]" /> Flyer
            </label>
            <label className="block border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-[#df2531]/40 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && subirFlyer(e.target.files[0])}
              />
              {subiendo ? (
                <div className="flex flex-col items-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-1" />
                  <span className="text-xs">Subiendo...</span>
                </div>
              ) : flyerUrl ? (
                <img src={flyerUrl} alt="Flyer" className="max-h-32 mx-auto rounded-lg" />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs">Subí el flyer (JPG, PNG, WEBP)</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-[#232838]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || subiendo}
            className="px-5 py-2 text-sm bg-[#df2531] hover:bg-[#df2531]/80 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

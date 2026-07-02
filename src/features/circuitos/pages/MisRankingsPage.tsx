import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Plus, X, Loader2, Check, AlertCircle, Camera, ExternalLink,
  Copy, FlagTriangleRight, CalendarDays, Users, ChevronDown,
} from 'lucide-react';
import { circuitosService } from '../circuitosService';
import { useToast } from '../../../components/ui/ToastProvider';
import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { formatDatePY } from '../../../utils/date';
import { useNoIndex } from '../../../hooks/useNoIndex';

interface TorneoMini { id: string; nombre: string; estado: string; fechaInicio: string; ciudad?: string }
interface MiRanking {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  logoUrl?: string;
  estado: string;
  temporada: string;
  torneos: TorneoMini[];
  jugadoresConPuntos: number;
}

function iniciales(nombre: string): string {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export function MisRankingsPage() {
  useNoIndex();
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmState } = useConfirm();
  const [cargando, setCargando] = useState(true);
  const [rankings, setRankings] = useState<MiRanking[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pickerDe, setPickerDe] = useState<string | null>(null); // rankingId con picker abierto
  const [disponibles, setDisponibles] = useState<TorneoMini[]>([]);
  const [procesando, setProcesando] = useState(false);

  const cargar = async () => {
    try {
      const r = await circuitosService.getMisRankings();
      setRankings(r.data || []);
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudieron cargar tus rankings');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const copiarLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/circuitos/${slug}`);
    showSuccess('Copiado', 'Link de la tabla pública copiado.');
  };

  const abrirPicker = async (rankingId: string) => {
    if (pickerDe === rankingId) { setPickerDe(null); return; }
    try {
      const r = await circuitosService.getTorneosDisponiblesParaMiRanking(rankingId);
      setDisponibles(r.data || []);
      setPickerDe(rankingId);
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudieron cargar tus torneos');
    }
  };

  const sumarTorneo = async (rankingId: string, torneoId: string) => {
    setProcesando(true);
    try {
      const r = await circuitosService.sumarTorneoAMiRanking(rankingId, torneoId);
      showSuccess('Sumado', r.message || 'El torneo ahora suma en este ranking.');
      setPickerDe(null);
      await cargar();
    } catch (err: any) {
      showError('No se pudo sumar', err.response?.data?.message || 'Error sumando el torneo');
    } finally {
      setProcesando(false);
    }
  };

  const quitarTorneo = async (rankingId: string, torneo: TorneoMini) => {
    const ok = await confirm({
      title: `¿Quitar "${torneo.nombre}"?`,
      message: 'El torneo deja de sumar en este ranking y la tabla se recalcula. El torneo en sí no se toca.',
      variant: 'warning',
    });
    if (!ok) return;
    setProcesando(true);
    try {
      await circuitosService.quitarTorneoDeMiRanking(rankingId, torneo.id);
      showSuccess('Quitado', 'Tabla recalculada.');
      await cargar();
    } catch (err: any) {
      showError('No se pudo quitar', err.response?.data?.message || 'Error');
    } finally {
      setProcesando(false);
    }
  };

  const cerrarTemporada = async (r: MiRanking) => {
    const cerrar = r.estado === 'ACTIVO';
    const ok = await confirm({
      title: cerrar ? `¿Cerrar la temporada de "${r.nombre}"?` : `¿Reactivar "${r.nombre}"?`,
      message: cerrar
        ? 'El ranking queda FINALIZADO: la tabla sigue visible pero no se le pueden sumar más torneos. Podés reactivarlo cuando quieras.'
        : 'El ranking vuelve a ACTIVO y podés sumarle torneos de nuevo.',
      variant: cerrar ? 'warning' : 'info',
    });
    if (!ok) return;
    try {
      await circuitosService.editarMiRanking(r.id, { estado: cerrar ? 'FINALIZADO' : 'ACTIVO' });
      showSuccess('Listo', cerrar ? 'Temporada cerrada.' : 'Ranking reactivado.');
      await cargar();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo cambiar el estado');
    }
  };

  const borrar = async (r: MiRanking) => {
    const ok = await confirm({
      title: `¿Borrar "${r.nombre}"?`,
      message: 'Solo se puede borrar un ranking sin torneos. Esta acción no tiene vuelta.',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await circuitosService.borrarMiRanking(r.id);
      showSuccess('Borrado', 'El ranking se eliminó.');
      await cargar();
    } catch (err: any) {
      showError('No se pudo borrar', err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      <div className="bg-[#151921] border-b border-[#232838] relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-7 h-7 text-[#df2531]" /> Mis rankings
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Gratis y tuyos: creá uno por evento o circuito, sumale tus torneos y compartí la tabla.
            </p>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-[#df2531]/20"
          >
            <Plus className="w-5 h-5" /> Crear ranking
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {cargando ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#df2531]" /></div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="w-20 h-20 bg-[#df2531]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trophy className="w-10 h-10 text-[#df2531]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Creá tu primer ranking</h2>
            <p className="text-gray-400 text-sm mb-6">
              Una tabla de puntos con tu nombre y tu logo: tus torneos suman, los jugadores se enganchan a seguirla.
            </p>
            <button
              onClick={() => setModalAbierto(true)}
              className="px-6 py-3 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium mx-auto flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Crear ranking
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rankings.map((r) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#151921] border border-[#232838] rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  {r.logoUrl ? (
                    <img src={r.logoUrl} alt={r.nombre} className="w-11 h-11 rounded-lg object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-[#df2531] flex items-center justify-center text-white font-semibold text-sm">
                      {iniciales(r.nombre)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold truncate">{r.nombre}</h3>
                    <p className="text-gray-500 text-xs flex items-center gap-2">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{r.torneos.length} torneo(s)</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.jugadoresConPuntos} con puntos</span>
                      <span>temporada {r.temporada}</span>
                    </p>
                  </div>
                  <span className={`text-[10.5px] px-2 py-1 rounded-md ${r.estado === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                    {r.estado}
                  </span>
                </div>

                {/* Torneos que suman */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {r.torneos.map((t) => (
                    <span key={t.id} className="flex items-center gap-1.5 bg-[#0B0E14] border border-white/10 text-gray-300 text-xs px-2.5 py-1.5 rounded-lg">
                      {t.nombre}
                      <button onClick={() => quitarTorneo(r.id, t)} disabled={procesando} title="Quitar del ranking"
                        className="text-gray-600 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {r.estado === 'ACTIVO' && (
                    <button onClick={() => abrirPicker(r.id)}
                      className="flex items-center gap-1 border border-dashed border-[#df2531]/60 text-[#f0999b] text-xs px-2.5 py-1.5 rounded-lg hover:bg-[#df2531]/10 transition-colors">
                      <Plus className="w-3 h-3" /> Sumar torneo mío <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Picker de torneos disponibles */}
                {pickerDe === r.id && (
                  <div className="mt-3 bg-[#0B0E14] border border-white/10 rounded-xl p-3">
                    {disponibles.length === 0 ? (
                      <p className="text-gray-500 text-xs">No te quedan torneos para sumar (o todavía no creaste ninguno).</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {disponibles.map((t) => (
                          <button key={t.id} onClick={() => sumarTorneo(r.id, t.id)} disabled={procesando}
                            className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50">
                            <span className="text-gray-200 text-xs truncate">{t.nombre}</span>
                            <span className="text-gray-600 text-[10.5px] shrink-0 ml-2">{formatDatePY(t.fechaInicio)} · {t.estado}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#232838] text-xs flex-wrap">
                  <a href={`/circuitos/${r.slug}`} target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Ver tabla pública
                  </a>
                  <button onClick={() => copiarLink(r.slug)} className="text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Copiar link
                  </button>
                  <button onClick={() => cerrarTemporada(r)} className="text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors">
                    <FlagTriangleRight className="w-3.5 h-3.5" /> {r.estado === 'ACTIVO' ? 'Cerrar temporada' : 'Reactivar'}
                  </button>
                  {r.torneos.length === 0 && (
                    <button onClick={() => borrar(r)} className="text-gray-500 hover:text-red-400 flex items-center gap-1.5 transition-colors">
                      <X className="w-3.5 h-3.5" /> Borrar
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {modalAbierto && (
        <CrearRankingModal
          onClose={() => setModalAbierto(false)}
          onCreado={() => { setModalAbierto(false); cargar(); }}
        />
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={confirmState.close}
        onConfirm={confirmState.handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
}

// ── Modal de creación (mockup aprobado: logo + nombre validado en vivo + descripción) ──
function CrearRankingModal({ onClose, onCreado }: { onClose: () => void; onCreado: () => void }) {
  const { showError, showSuccess } = useToast();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [validacion, setValidacion] = useState<{ disponible: boolean; motivo?: string; slug?: string } | null>(null);
  const [validando, setValidando] = useState(false);
  const [creando, setCreando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Validación en vivo con debounce
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const limpio = nombre.trim();
    if (limpio.length < 3) { setValidacion(null); return; }
    setValidando(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const r = await circuitosService.validarNombre(limpio);
        setValidacion(r);
      } catch {
        setValidacion(null);
      } finally {
        setValidando(false);
      }
    }, 400);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [nombre]);

  const subirLogo = async (file: File) => {
    if (!file.type.startsWith('image/')) { showError('Archivo inválido', 'Subí una imagen JPG o PNG.'); return; }
    if (file.size > 5 * 1024 * 1024) { showError('Muy pesada', 'Máximo 5 MB.'); return; }
    setSubiendoLogo(true);
    try {
      const r = await circuitosService.uploadLogo(file);
      setLogoUrl(r.url || r.secure_url || r.data?.url || null);
    } catch (err: any) {
      showError('No se pudo subir', err.response?.data?.message || 'Error subiendo el logo');
    } finally {
      setSubiendoLogo(false);
    }
  };

  const crear = async () => {
    if (!validacion?.disponible) return;
    setCreando(true);
    try {
      await circuitosService.crearMiRanking({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        logoUrl: logoUrl || undefined,
      });
      showSuccess('¡Ranking creado!', 'Sumale torneos para que empiece a contar.');
      onCreado();
    } catch (err: any) {
      showError('No se pudo crear', err.response?.data?.message || 'Error creando el ranking');
      setCreando(false);
    }
  };

  const urlPropuesta = useMemo(
    () => (validacion?.disponible && validacion.slug ? `fairpadel.com/circuitos/${validacion.slug}` : null),
    [validacion],
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#232838]">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#df2531]" /> Crear ranking
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button onClick={() => fileRef.current?.click()} disabled={subiendoLogo}
              className="w-14 h-14 rounded-xl border-[1.5px] border-dashed border-white/20 hover:border-[#df2531]/60 flex items-center justify-center text-gray-500 hover:text-[#df2531] transition-colors overflow-hidden shrink-0">
              {subiendoLogo ? <Loader2 className="w-5 h-5 animate-spin" /> :
                logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> :
                <Camera className="w-5 h-5" />}
            </button>
            <div>
              <p className="text-gray-200 text-sm">Logo (opcional)</p>
              <p className="text-gray-600 text-xs">JPG o PNG. Si no subís, usamos las iniciales.</p>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => e.target.files?.[0] && subirLogo(e.target.files[0])} />
          </div>

          {/* Nombre con validación en vivo */}
          <div>
            <label className="text-xs text-gray-400">Nombre del ranking</label>
            <div className={`flex items-center gap-2 bg-[#0B0E14] border rounded-lg px-3 py-2.5 mt-1 transition-colors ${
              validacion == null ? 'border-white/10' : validacion.disponible ? 'border-emerald-500/60' : 'border-red-500/60'
            }`}>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60}
                placeholder="Circuito Verano CDE 2027"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600" />
              {validando ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> :
                validacion?.disponible ? <Check className="w-4 h-4 text-emerald-400" /> :
                validacion ? <AlertCircle className="w-4 h-4 text-red-400" /> : null}
            </div>
            {urlPropuesta && <p className="text-emerald-400 text-[11px] mt-1">Disponible — tu página: {urlPropuesta}</p>}
            {validacion && !validacion.disponible && (
              <p className="text-red-400 text-[11px] mt-1">{validacion.motivo || 'No disponible'}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs text-gray-400">Descripción (opcional)</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={500} rows={2}
              placeholder="Contale a los jugadores de qué va este circuito…"
              className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2.5 mt-1 text-white text-sm outline-none placeholder-gray-600 focus:border-[#df2531]/60 resize-none" />
          </div>

          {/* Nota de puntos */}
          <div className="bg-[#0B0E14] border border-white/10 rounded-lg p-3 flex gap-2 text-[11px] text-gray-500">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Los puntos son iguales para todos los rankings: campeón 100, finalista 70, semis 45, cuartos 25… La categoría del jugador la gobierna FairPadel aparte.</span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
            <button onClick={crear} disabled={!validacion?.disponible || creando || subiendoLogo}
              className="px-5 py-2 text-sm bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
              {creando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              {creando ? 'Creando…' : 'Crear ranking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

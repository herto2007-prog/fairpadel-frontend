import { useState, useEffect } from 'react';
import {
  X, Upload, Loader2, MapPin, DollarSign, Image as ImageIcon,
  Type as TypeIcon, FileText, Calendar, Tags, ChevronDown, ChevronUp, Lock,
} from 'lucide-react';
import { api } from '../../../../services/api';
import { CityAutocomplete } from '../../../../components/ui/CityAutocomplete';
import { useToast } from '../../../../components/ui/ToastProvider';

interface Props {
  tournamentId: string;
  onClose: () => void;
  onSaved: () => void;
}

interface CategoriaDisponible {
  id: string;
  nombre: string;
  tipo: string; // MASCULINO | FEMENINO
  tipoCategoria?: 'STANDARD' | 'MIXTO' | 'SUMAS';
  orden: number;
}

interface CategoriaActual {
  categoryId: string;
  nombre: string;
  inscripcionesCount: number;
  fixtureVersionId: string | null;
}

// Editar los datos del torneo desde cualquier momento del panel: nombre,
// descripción, fechas, ciudad, costo, flyer y categorías. Se autocarga sus
// datos (no depende del tab que lo abrió). Las categorías se editan de forma
// segura: agregar es libre, quitar solo si no tienen inscriptos ni cuadro.
export function CompletarDatosTorneoModal({ tournamentId, onClose, onSaved }: Props) {
  const { showSuccess, showError } = useToast();

  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState<string>('BORRADOR');

  // Campos editables
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [costo, setCosto] = useState<number>(0);
  const [flyerUrl, setFlyerUrl] = useState('');

  // Categorías
  const [disponibles, setDisponibles] = useState<CategoriaDisponible[]>([]);
  const [actuales, setActuales] = useState<CategoriaActual[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [mostrarCategorias, setMostrarCategorias] = useState(false);

  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
  }, [tournamentId]);

  const cargar = async () => {
    setCargando(true);
    try {
      const [tRes, catActRes, catDispRes] = await Promise.all([
        api.get(`/admin/torneos/${tournamentId}`),
        api.get(`/admin/torneos/${tournamentId}/categorias`).catch(() => ({ data: { categorias: [] } })),
        api.get('/admin/torneos/datos/wizard').catch(() => ({ data: { categorias: [] } })),
      ]);

      const t = tRes.data;
      setNombre(t.nombre || '');
      setDescripcion(t.descripcion || '');
      setFechaInicio(t.fechaInicio || '');
      setFechaFin(t.fechaFin || '');
      setFechaLimite(t.fechaLimiteInscr || '');
      setCiudad(t.ciudad || '');
      setCosto(t.costoInscripcion || 0);
      setFlyerUrl(t.flyerUrl || '');
      setEstado(t.estado || 'BORRADOR');

      const act: CategoriaActual[] = (catActRes.data.categorias || []).map((c: any) => ({
        categoryId: c.categoryId,
        nombre: c.nombre || c.category?.nombre || '',
        inscripcionesCount: c.inscripcionesCount || 0,
        fixtureVersionId: c.fixtureVersionId || null,
      }));
      setActuales(act);
      setSeleccionadas(new Set(act.map((c) => c.categoryId)));
      setDisponibles(catDispRes.data.categorias || []);
    } catch (err: any) {
      showError('Error', 'No se pudieron cargar los datos del torneo');
    } finally {
      setCargando(false);
    }
  };

  // Una categoría actual está "bloqueada" (no se puede quitar) si tiene inscriptos o cuadro.
  const bloqueada = (categoryId: string) => {
    const a = actuales.find((c) => c.categoryId === categoryId);
    return !!a && (a.inscripcionesCount > 0 || !!a.fixtureVersionId);
  };

  const motivoBloqueo = (categoryId: string) => {
    const a = actuales.find((c) => c.categoryId === categoryId);
    if (!a) return '';
    if (a.fixtureVersionId) return 'Ya tiene cuadro sorteado';
    if (a.inscripcionesCount > 0) return `Tiene ${a.inscripcionesCount} inscripto(s)`;
    return '';
  };

  const toggleCategoria = (categoryId: string) => {
    // Si está bloqueada y seleccionada, no permitir quitarla.
    if (seleccionadas.has(categoryId) && bloqueada(categoryId)) return;
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

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

  const categoriasCambiaron = () => {
    const actualSet = new Set(actuales.map((c) => c.categoryId));
    if (actualSet.size !== seleccionadas.size) return true;
    for (const id of seleccionadas) if (!actualSet.has(id)) return true;
    return false;
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      showError('Falta el nombre', 'El torneo necesita un nombre.');
      return;
    }
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      showError('Fechas inválidas', 'La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    if (fechaLimite && fechaInicio && fechaLimite > fechaInicio) {
      showError('Cierre de inscripciones inválido', 'El cierre de inscripciones no puede ser posterior al inicio del torneo.');
      return;
    }
    setGuardando(true);
    try {
      await api.put(`/admin/torneos/${tournamentId}`, {
        nombre,
        descripcion,
        ...(fechaInicio && { fechaInicio }),
        ...(fechaFin && { fechaFin }),
        ...(fechaLimite && { fechaLimiteInscripcion: fechaLimite }),
        ciudad,
        costoInscripcion: costo,
        flyerUrl,
      });

      // Sincronizar categorías solo si cambiaron (endpoint seguro)
      if (categoriasCambiaron()) {
        const { data } = await api.put(`/admin/torneos/${tournamentId}/categorias`, {
          categoriaIds: Array.from(seleccionadas),
        });
        if (data?.bloqueadas?.length) {
          const detalle = data.bloqueadas
            .map((b: any) => `${b.nombre}: ${b.motivo}`)
            .join(' · ');
          showError('Algunas categorías no se quitaron', detalle);
        }
      }

      showSuccess('Datos guardados', 'Los datos del torneo se actualizaron.');
      onSaved();
      onClose();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudieron guardar los datos');
    } finally {
      setGuardando(false);
    }
  };

  const esBorrador = estado === 'BORRADOR';

  // Agrupar disponibles por tipo para el selector
  const grupos: { titulo: string; items: CategoriaDisponible[] }[] = [
    { titulo: 'Caballeros', items: disponibles.filter((c) => c.tipo === 'MASCULINO' && c.tipoCategoria === 'STANDARD') },
    { titulo: 'Damas', items: disponibles.filter((c) => c.tipo === 'FEMENINO' && c.tipoCategoria === 'STANDARD') },
    { titulo: 'Mixto', items: disponibles.filter((c) => c.tipoCategoria === 'MIXTO') },
    { titulo: 'Suma (Caballeros)', items: disponibles.filter((c) => c.tipoCategoria === 'SUMAS' && c.tipo === 'MASCULINO') },
    { titulo: 'Suma (Damas)', items: disponibles.filter((c) => c.tipoCategoria === 'SUMAS' && c.tipo === 'FEMENINO') },
  ]
    .map((g) => ({ ...g, items: g.items.sort((a, b) => a.orden - b.orden) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#232838] sticky top-0 bg-[#151921] z-10">
          <h3 className="font-bold text-white">Editar torneo</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#df2531] animate-spin" />
          </div>
        ) : (
          <>
            <div className="p-5 space-y-5">
              {/* Aviso según estado: si ya es público/sorteado, los cambios afectan algo vivo */}
              {!esBorrador && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
                  Este torneo ya no es borrador. Cambiar fechas o categorías afecta lo que ven los
                  jugadores y la agenda. Las categorías con inscriptos o cuadro no se pueden quitar.
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="text-sm text-white mb-1.5 flex items-center gap-1.5">
                  <TypeIcon className="w-4 h-4 text-[#df2531]" /> Nombre
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del torneo"
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-[#df2531]/50"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-sm text-white mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#df2531]" /> Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                  placeholder="Detalles del torneo (opcional)"
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-[#df2531]/50 resize-none"
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-white mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#df2531]" /> Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-[#df2531]/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                  />
                </div>
                <div>
                  <label className="text-sm text-white mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#df2531]" /> Fin (finales)
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    min={fechaInicio || undefined}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-[#df2531]/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 -mt-2">El último día es el de las finales (se deriva del fin).</p>

              {/* Cierre de inscripciones */}
              <div>
                <label className="text-sm text-white mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#df2531]" /> Cierre de inscripciones
                </label>
                <input
                  type="date"
                  value={fechaLimite}
                  max={fechaInicio || undefined}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-[#df2531]/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Hasta esta fecha la gente puede inscribirse. Si lo dejás vacío, queda hasta el día de inicio. Igual podés cerrar antes a mano cuando sorteés.
                </p>
              </div>

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

              {/* Categorías (colapsable) */}
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setMostrarCategorias((v) => !v)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm text-white flex items-center gap-1.5">
                    <Tags className="w-4 h-4 text-[#df2531]" /> Categorías
                    <span className="text-gray-500">({seleccionadas.size})</span>
                  </span>
                  {mostrarCategorias ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {mostrarCategorias && (
                  <div className="p-3 border-t border-white/10 space-y-3 max-h-64 overflow-y-auto">
                    <p className="text-[11px] text-gray-500">
                      Agregá las que quieras. Las que ya tienen inscriptos o cuadro no se pueden quitar 🔒.
                    </p>
                    {grupos.map((g) => (
                      <div key={g.titulo}>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">{g.titulo}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {g.items.map((cat) => {
                            const sel = seleccionadas.has(cat.id);
                            const lock = sel && bloqueada(cat.id);
                            return (
                              <button
                                key={cat.id}
                                onClick={() => toggleCategoria(cat.id)}
                                disabled={lock}
                                title={lock ? motivoBloqueo(cat.id) : undefined}
                                className={`flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors text-left ${
                                  sel
                                    ? 'bg-[#df2531]/10 border-[#df2531]/40 text-white'
                                    : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'
                                } ${lock ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <span className="truncate">{cat.nombre}</span>
                                {lock && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {grupos.length === 0 && (
                      <p className="text-xs text-gray-500">No hay categorías disponibles.</p>
                    )}
                  </div>
                )}
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

            <div className="flex items-center justify-end gap-2 p-5 border-t border-[#232838] sticky bottom-0 bg-[#151921]">
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
          </>
        )}
      </div>
    </div>
  );
}

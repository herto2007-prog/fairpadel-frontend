import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Trophy, CalendarDays, ClipboardList, AlertTriangle,
  ArrowUp, ArrowDown, Minus, Save, Loader2,
  MapPin, Phone, Cake, Shield, Mail, FileText, Key,
  BarChart3, Award, TrendingUp, Power, RotateCcw, Trash2
} from 'lucide-react';
import { ModalContent } from '../../../components/ui/Modal';
import { adminService, User as AdminUser, InscripcionActiva, HistorialCategoriaItem, RankingItem, PuntosItem } from '../../../services/adminService';
import { torneoService } from '../../../services/torneoService';
import { useToast } from '../../../components/ui/ToastProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser;
  onUpdate: (updatedUser: AdminUser) => void;
  onDelete?: (userId: string) => void;
}

type TabId = 'perfil' | 'categoria' | 'inscripciones' | 'ranking' | 'historial';

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'categoria', label: 'Categoría', icon: Trophy },
  { id: 'inscripciones', label: 'Torneos', icon: CalendarDays },
  { id: 'ranking', label: 'Ranking', icon: BarChart3 },
  { id: 'historial', label: 'Historial', icon: ClipboardList },
];

const ESTADOS = ['ACTIVO', 'NO_VERIFICADO', 'INACTIVO', 'SUSPENDIDO'] as const;

export function EditarJugadorModal({ isOpen, onClose, user, onUpdate, onDelete }: Props) {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('perfil');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<Array<{ id: string; nombre: string; tipo: string; orden: number }>>([]);
  const [inscripciones, setInscripciones] = useState<InscripcionActiva[]>([]);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [puntos, setPuntos] = useState<PuntosItem[]>([]);
  const [historial, setHistorial] = useState<HistorialCategoriaItem[]>([]);

  // Form state
  const [form, setForm] = useState({
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    email: user.email || '',
    documento: user.documento || '',
    telefono: user.telefono || '',
    ciudad: user.ciudad || '',
    fechaNacimiento: user.fechaNacimiento || '',
    genero: user.genero || 'MASCULINO',
    estado: user.estado || 'ACTIVO',
    categoriaActualId: user.categoriaActual?.id || '',
    motivoCambioCategoria: '',
  });
  const [pwd, setPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [estadoBusy, setEstadoBusy] = useState(false);

  const [advertencias, setAdvertencias] = useState<{ inscripciones: InscripcionActiva[]; ascensosPendientes: any[] } | null>(null);
  const [confirmarFuerza, setConfirmarFuerza] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setActiveTab('perfil');
    setAdvertencias(null);
    setConfirmarFuerza(false);
    setPwd('');
    setForm({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      documento: user.documento || '',
      telefono: user.telefono || '',
      ciudad: user.ciudad || '',
      fechaNacimiento: user.fechaNacimiento || '',
      genero: user.genero || 'MASCULINO',
      estado: user.estado || 'ACTIVO',
      categoriaActualId: user.categoriaActual?.id || '',
      motivoCambioCategoria: '',
    });

    const load = async () => {
      setLoading(true);
      try {
        const [cats, ficha, hist] = await Promise.all([
          // Sin filtro de género: el endpoint filtra por tipoCategoria (no género).
          // Traemos todas y filtramos por género del lado del cliente (categoriasFiltradas).
          torneoService.getCategories(),
          adminService.getUserFicha(user.id),
          adminService.getUserHistorialCategorias(user.id),
        ]);
        setCategorias(cats);
        setInscripciones(ficha.data.inscripciones || []);
        setRankings(ficha.data.rankings || []);
        setPuntos(ficha.data.historialPuntos || []);
        setHistorial(hist.data || []);
      } catch (err) {
        showError('Error', 'No se pudieron cargar los datos del jugador');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, user.id]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setAdvertencias(null);
    setConfirmarFuerza(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      if (form.nombre.trim() && form.nombre.trim() !== user.nombre) payload.nombre = form.nombre.trim();
      if (form.apellido.trim() && form.apellido.trim() !== user.apellido) payload.apellido = form.apellido.trim();
      if (form.email.trim() !== (user.email || '')) payload.email = form.email.trim();
      if (form.documento.trim() !== (user.documento || '')) payload.documento = form.documento.trim();
      if (form.telefono !== (user.telefono || '')) payload.telefono = form.telefono || undefined;
      if (form.ciudad !== (user.ciudad || '')) payload.ciudad = form.ciudad || undefined;
      if (form.fechaNacimiento !== (user.fechaNacimiento || '')) payload.fechaNacimiento = form.fechaNacimiento || undefined;
      if (form.genero !== user.genero) payload.genero = form.genero;
      if (form.estado !== user.estado) payload.estado = form.estado;
      if (form.categoriaActualId !== (user.categoriaActual?.id || '')) {
        payload.categoriaActualId = form.categoriaActualId || undefined;
        if (form.motivoCambioCategoria) payload.motivoCambioCategoria = form.motivoCambioCategoria;
      }

      // Si no hay cambios, no llamar
      if (Object.keys(payload).length === 0) {
        showSuccess('Sin cambios', 'No se detectaron modificaciones');
        onClose();
        setSaving(false);
        return;
      }

      const res = await adminService.updateUser(user.id, payload);

      if (res.advertencias && !confirmarFuerza) {
        setAdvertencias(res.advertencias);
        showError('Advertencia', 'El jugador tiene inscripciones o ascensos pendientes. Revisa la pestaña Categoría y confirma para forzar el cambio.');
        setSaving(false);
        return;
      }

      showSuccess('Actualizado', 'Los datos del jugador fueron actualizados correctamente');
      onUpdate(res.user);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al actualizar el jugador';
      showError('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSetPassword = async () => {
    if (pwd.length < 6) {
      showError('Contraseña corta', 'Debe tener al menos 6 caracteres');
      return;
    }
    setSavingPwd(true);
    try {
      await adminService.setUserPassword(user.id, pwd);
      showSuccess('Contraseña actualizada', `Ya podés pasarle la nueva clave a ${user.nombre}`);
      setPwd('');
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo actualizar la contraseña');
    } finally {
      setSavingPwd(false);
    }
  };

  const esInactivo = user.estado === 'INACTIVO';
  const esVacia = inscripciones.length === 0 && rankings.length === 0 && puntos.length === 0;

  const toggleActivo = async () => {
    const nuevo = esInactivo ? 'ACTIVO' : 'INACTIVO';
    const accion = esInactivo ? 'reactivar' : 'desactivar';
    if (!window.confirm(`¿Seguro que querés ${accion} la cuenta de ${user.nombre} ${user.apellido}?`)) return;
    setEstadoBusy(true);
    try {
      const res = await adminService.updateUser(user.id, { estado: nuevo });
      showSuccess(
        esInactivo ? 'Cuenta reactivada' : 'Cuenta desactivada',
        esInactivo ? 'El jugador puede volver a iniciar sesión' : 'No puede iniciar sesión; su historial se conserva',
      );
      onUpdate(res.user);
      onClose();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo cambiar el estado');
    } finally {
      setEstadoBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Vas a ELIMINAR definitivamente la cuenta de ${user.nombre} ${user.apellido}. Solo es posible porque no tiene historial. ¿Continuar?`)) return;
    setEstadoBusy(true);
    try {
      await adminService.deleteUser(user.id);
      showSuccess('Cuenta eliminada', 'La cuenta vacía fue eliminada');
      onDelete?.(user.id);
      onClose();
    } catch (err: any) {
      showError('No se pudo eliminar', err.response?.data?.message || 'La cuenta tiene historial: desactivala en su lugar');
    } finally {
      setEstadoBusy(false);
    }
  };

  const categoriasFiltradas = categorias.filter(c => c.tipo === form.genero);

  const getTipoCambioIcon = (tipo: string) => {
    if (tipo.includes('ASCENSO')) return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (tipo.includes('DESCENSO')) return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTipoCambioLabel = (tipo: string) => {
    const map: Record<string, string> = {
      ASCENSO: 'Ascenso',
      ASCENSO_AUTOMATICO: 'Ascenso automático',
      ASCENSO_POR_DEMOSTRACION: 'Ascenso por demostración',
      ASCENSO_MANUAL: 'Ascenso manual',
      DESCENSO: 'Descenso',
      DESCENSO_MANUAL: 'Descenso manual',
      MANTENIMIENTO: 'Mantenimiento',
    };
    return map[tipo] || tipo;
  };

  return (
    <ModalContent isOpen={isOpen} onClose={onClose} title={`Editar jugador`} size="lg">
      {/* Header con info del jugador */}
      <div className="px-6 pt-2 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.fotoUrl ? (
              <img src={user.fotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-semibold text-sm">
                {user.nombre.charAt(0)}{user.apellido.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-white">{user.nombre} {user.apellido}</p>
            <p className="text-xs text-gray-400">{user.email} · {user.documento}</p>
          </div>
          <span className="ml-auto px-2 py-1 bg-[#232838] rounded-full text-xs text-gray-300">
            {user.categoriaActual?.nombre || 'Sin categoría'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[50vh]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* TAB: PERFIL */}
            {activeTab === 'perfil' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> Nombre
                    </label>
                    <input
                      value={form.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      placeholder="Nombre"
                      className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> Apellido
                    </label>
                    <input
                      value={form.apellido}
                      onChange={(e) => handleChange('apellido', e.target.value)}
                      placeholder="Apellido"
                      className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Documento
                    </label>
                    <input
                      value={form.documento}
                      onChange={(e) => handleChange('documento', e.target.value)}
                      placeholder="Cédula"
                      className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Teléfono
                    </label>
                    <input
                      value={form.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      placeholder="+595 981 123456"
                      className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Ciudad
                    </label>
                    <input
                      value={form.ciudad}
                      onChange={(e) => handleChange('ciudad', e.target.value)}
                      placeholder="Asunción"
                      className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 flex items-center gap-1">
                      <Cake className="w-3 h-3" /> Fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      value={form.fechaNacimiento}
                      onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                      className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> Género
                    </label>
                    <select
                      value={form.genero}
                      onChange={(e) => handleChange('genero', e.target.value)}
                      className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors appearance-none"
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMENINO">Femenino</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Estado
                    </label>
                    <select
                      value={form.estado}
                      onChange={(e) => handleChange('estado', e.target.value)}
                      className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors appearance-none"
                    >
                      {ESTADOS.map(e => (
                        <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contraseña manual (soporte) */}
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <label className="text-xs text-gray-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Contraseña (soporte)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="Nueva contraseña (mín. 6)"
                      className="flex-1 bg-[#151921] border border-[#232838] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-primary outline-none transition-colors"
                    />
                    <button
                      onClick={handleSetPassword}
                      disabled={savingPwd || pwd.length < 6}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium rounded-xl transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                    >
                      {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                      Setear
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Cambia la contraseña al instante (no envía email). Pasásela vos al jugador.
                  </p>
                </div>

                {/* Cuenta: desactivar (soft) / reactivar / eliminar (solo vacía) */}
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <label className="text-xs text-gray-400 flex items-center gap-1">
                    <Power className="w-3 h-3" /> Cuenta
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={toggleActivo}
                      disabled={estadoBusy}
                      className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-colors disabled:opacity-50 text-sm ${
                        esInactivo
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                          : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                      }`}
                    >
                      {estadoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : esInactivo ? <RotateCcw className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      {esInactivo ? 'Reactivar cuenta' : 'Desactivar cuenta'}
                    </button>
                    {esVacia && (
                      <button
                        onClick={handleDelete}
                        disabled={estadoBusy}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-xl transition-colors disabled:opacity-50 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar definitivamente
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    <strong className="text-gray-400">Desactivar</strong> conserva todo el historial (el jugador no puede iniciar sesión; reversible).{' '}
                    {esVacia
                      ? 'Como esta cuenta no tiene historial, también podés eliminarla del todo.'
                      : 'Eliminar del todo no está disponible: la cuenta tiene historial.'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB: CATEGORÍA */}
            {activeTab === 'categoria' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Categoría actual</label>
                  <div className="relative">
                    <select
                      value={form.categoriaActualId}
                      onChange={(e) => handleChange('categoriaActualId', e.target.value)}
                      className="w-full appearance-none bg-[#1a1f2e] border border-[#232838] rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:border-primary outline-none transition-colors [color-scheme:dark]"
                    >
                      <option value="">Sin categoría</option>
                      {categoriasFiltradas.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                    <Trophy className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Mostrando categorías {form.genero.toLowerCase()}s
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Motivo del cambio (opcional)</label>
                  <textarea
                    value={form.motivoCambioCategoria}
                    onChange={(e) => handleChange('motivoCambioCategoria', e.target.value)}
                    placeholder="Ej: Corrección por error de registro, ascenso manual aprobado..."
                    rows={3}
                    className="w-full bg-[#1a1f2e] border border-[#232838] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:border-primary outline-none transition-colors resize-none"
                  />
                </div>

                {/* Advertencias */}
                {advertencias && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium text-sm">Advertencias detectadas</span>
                    </div>

                    {advertencias.inscripciones.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-300 mb-1">Inscripciones activas en torneos:</p>
                        <ul className="space-y-1">
                          {advertencias.inscripciones.map((ins: any) => (
                            <li key={ins.id} className="text-xs text-gray-300 flex items-center gap-2">
                              <CalendarDays className="w-3 h-3 text-amber-400" />
                              {ins.tournament?.nombre} ({ins.tournament?.estado}) — {ins.category?.nombre}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {advertencias.ascensosPendientes.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-300 mb-1">Ascensos pendientes obsoletos:</p>
                        <ul className="space-y-1">
                          {advertencias.ascensosPendientes.map((asc: any) => (
                            <li key={asc.id} className="text-xs text-gray-300 flex items-center gap-2">
                              <ArrowUp className="w-3 h-3 text-amber-400" />
                              Ascenso a {asc.categoriaNueva?.nombre}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmarFuerza}
                        onChange={(e) => setConfirmarFuerza(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary bg-[#151921]"
                      />
                      <span className="text-sm text-gray-300">Forzar cambio de categoría de todos modos</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* TAB: INSCRIPCIONES */}
            {activeTab === 'inscripciones' && (
              <div className="space-y-3">
                {inscripciones.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                    No tiene inscripciones en ningún torneo
                  </div>
                ) : (
                  inscripciones.map((ins) => (
                    <div key={ins.id} className="bg-[#151921] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{ins.tournament.nombre}</p>
                        <p className="text-xs text-gray-400">{ins.category.nombre} · {ins.estado.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ins.tournament.estado === 'EN_CURSO'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {ins.tournament.estado.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: RANKING */}
            {activeTab === 'ranking' && (
              <div className="space-y-4">
                {rankings.length === 0 && puntos.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                    Sin actividad de ranking todavía
                  </div>
                ) : (
                  <>
                    {rankings.map((r) => (
                      <div key={r.id} className="bg-[#151921] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-white">
                            {r.alcance} · {r.genero.toLowerCase()}
                          </span>
                          <span className="ml-auto text-xs text-gray-500">Temporada {r.temporada}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Posición</p>
                            <p className="text-lg font-bold text-white">#{r.posicion}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Puntos</p>
                            <p className="text-lg font-bold text-primary">{r.puntosTotales}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Torneos</p>
                            <p className="text-lg font-bold text-white">{r.torneosJugados}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">V / D</p>
                            <p className="text-lg font-bold text-white">{r.victorias} / {r.derrotas}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-gray-400">
                          {r.porcentajeVictorias != null && (
                            <span>Efectividad: <span className="text-white font-medium">{Math.round(Number(r.porcentajeVictorias))}%</span></span>
                          )}
                          {r.campeonatos > 0 && (
                            <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-400" /> {r.campeonatos} título{r.campeonatos > 1 ? 's' : ''}</span>
                          )}
                          {r.rachaActual !== 0 && (
                            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-400" /> Racha {r.rachaActual}</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {puntos.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 mt-2">Puntos por torneo</p>
                        <div className="space-y-2">
                          {puntos.map((p) => (
                            <div key={p.id} className="bg-[#151921] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{p.tournament.nombre}</p>
                                <p className="text-xs text-gray-400">{p.category.nombre} · {p.posicionFinal} · {p.fechaTorneo}</p>
                              </div>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary whitespace-nowrap">
                                +{p.puntosGanados} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB: HISTORIAL */}
            {activeTab === 'historial' && (
              <div className="space-y-3">
                {historial.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                    No hay cambios de categoría registrados
                  </div>
                ) : (
                  historial.map((h) => (
                    <div key={h.id} className="bg-[#151921] border border-white/5 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {getTipoCambioIcon(h.tipo)}
                        <span className="text-sm font-medium text-white">{getTipoCambioLabel(h.tipo)}</span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(h.createdAt).toLocaleDateString('es-PY')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-white/5 rounded text-gray-300 text-xs">
                          {h.categoriaAnterior?.nombre || 'Sin categoría'}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-medium">
                          {h.categoriaNueva?.nombre || 'Desconocida'}
                        </span>
                      </div>
                      {h.motivo && (
                        <p className="text-xs text-gray-500 mt-2 italic">{h.motivo}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-colors disabled:opacity-50 text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || (advertencias !== null && !confirmarFuerza)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </ModalContent>
  );
}

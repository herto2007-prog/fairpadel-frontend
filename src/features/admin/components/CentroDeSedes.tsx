import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Search, Phone, Map, Save, X, Edit2, Trash2,
  Power, ChevronDown, Check, ArrowLeft, Info, LayoutGrid, Users, CalendarClock,
  Crown, UserCog, Sun, Home, CheckCircle, MinusCircle, Gift, XCircle, CreditCard,
} from 'lucide-react';
import { adminService, CreateSedeData, CreateCanchaData } from '../../../services/adminService';
import { sedesAdminService } from '../../../services/sedesAdminService';
import {
  centroSedesService, CentroSede, CentroSedeCancha, PagoServicio,
} from '../../../services/centroSedesService';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';
import { useToast } from '../../../components/ui/ToastProvider';
import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';

const countries = [
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
];

interface UserLite {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  documento: string;
}

type Tab = 'datos' | 'canchas' | 'resp' | 'serv';

const normalizeCI = (ci: string) => (ci || '').replace(/\./g, '').replace(/-/g, '');

const formatDate = (s: string | null | undefined) => {
  if (!s) return '-';
  const [y, m, d] = s.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const formatMonto = (monto: number, moneda?: string | null) => {
  const n = monto.toLocaleString('es-PY');
  return moneda && moneda !== 'PYG' ? `${moneda} ${n}` : `Gs. ${n}`;
};

export function CentroDeSedes() {
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmState } = useConfirm();

  const [sedes, setSedes] = useState<CentroSede[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('datos');

  const selected = sedes.find((s) => s.id === selectedId) || null;

  const loadSedes = async () => {
    try {
      const data = await centroSedesService.getSedes();
      setSedes(Array.isArray(data) ? data : []);
    } catch {
      showError('Error', 'No se pudieron cargar las sedes');
      setSedes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSedes(); }, []);

  const openFicha = (id: string) => {
    setSelectedId(id);
    setTab('datos');
  };

  const filtered = sedes.filter((s) =>
    s.nombre.toLowerCase().includes(search.toLowerCase()) ||
    s.ciudad.toLowerCase().includes(search.toLowerCase()),
  );

  const servicioVigentes = sedes.filter((s) => s.servicio?.suscripcionActiva).length;
  const porVencer = sedes.filter(
    (s) => s.servicio?.suscripcionActiva && s.servicio.diasRestantes <= 7,
  ).length;
  const totalCanchas = sedes.reduce((acc, s) => acc + s.canchas.filter((c) => c.activa).length, 0);

  if (loading) {
    return (
      <div className="glass rounded-3xl p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
        />
        <p className="text-gray-400 mt-4">Cargando sedes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selected ? (
        <FichaSede
          sede={selected}
          tab={tab}
          setTab={setTab}
          onBack={() => setSelectedId(null)}
          reload={loadSedes}
          confirm={confirm}
          showSuccess={showSuccess}
          showError={showError}
        />
      ) : (
        <ListaSedes
          sedes={filtered}
          total={sedes.length}
          servicioVigentes={servicioVigentes}
          porVencer={porVencer}
          totalCanchas={totalCanchas}
          search={search}
          setSearch={setSearch}
          onOpen={openFicha}
          reload={loadSedes}
          showSuccess={showSuccess}
          showError={showError}
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

// ════════════════════════════════════════════════════════════
// LISTA
// ════════════════════════════════════════════════════════════

function ServicioBadge({ sede }: { sede: CentroSede }) {
  const s = sede.servicio;
  if (s?.suscripcionActiva) {
    const porVencer = s.diasRestantes <= 7;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
        porVencer ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
      }`}>
        <CheckCircle className="w-3.5 h-3.5" />
        {porVencer ? `Vence en ${s.diasRestantes}d` : 'Reservas activas'}
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-gray-700/60 text-gray-400">
      <MinusCircle className="w-3.5 h-3.5" />
      Sin servicio
    </span>
  );
}

function ListaSedes({
  sedes, total, servicioVigentes, porVencer, totalCanchas,
  search, setSearch, onOpen, reload, showSuccess, showError,
}: {
  sedes: CentroSede[];
  total: number;
  servicioVigentes: number;
  porVencer: number;
  totalCanchas: number;
  search: string;
  setSearch: (s: string) => void;
  onOpen: (id: string) => void;
  reload: () => Promise<void>;
  showSuccess: (t: string, m: string) => void;
  showError: (t: string, m: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Sedes</h2>
          <p className="text-gray-400 text-sm">
            Sedes, canchas, responsables y servicio de reservas — todo en un lugar
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Nueva sede
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Sedes" value={total} color="text-white" />
        <Stat label="Con servicio activo" value={servicioVigentes} color="text-green-400" />
        <Stat label="Por vencer (7 días)" value={porVencer} color="text-amber-400" />
        <Stat label="Canchas activas" value={totalCanchas} color="text-primary" />
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar sedes..."
          className="w-full bg-[#151921] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <SedeForm
            onCancel={() => setShowForm(false)}
            onSaved={async () => { setShowForm(false); await reload(); }}
            showSuccess={showSuccess}
            showError={showError}
          />
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {sedes.map((sede) => (
          <motion.button
            key={sede.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onOpen(sede.id)}
            className={`w-full text-left glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition-colors ${
              !sede.activa ? 'opacity-60' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{sede.nombre}</p>
              <p className="text-sm text-gray-400 truncate">
                {sede.ciudad} · {sede.canchas.filter((c) => c.activa).length} canchas
                {sede.dueno ? ` · Dueño: ${sede.dueno.nombre} ${sede.dueno.apellido}` : ' · Sin dueño'}
              </p>
            </div>
            {!sede.activa && (
              <span className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-400">Inactiva</span>
            )}
            <ServicioBadge sede={sede} />
            <ChevronDown className="w-5 h-5 text-gray-600 -rotate-90 flex-shrink-0" />
          </motion.button>
        ))}

        {sedes.length === 0 && (
          <div className="glass rounded-3xl p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No se encontraron sedes</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// FORM DE SEDE (crear / editar datos)
// ════════════════════════════════════════════════════════════

function splitPhone(telefono?: string | null) {
  let code = 'PY';
  let numero = telefono || '';
  if (telefono) {
    for (const c of countries) {
      if (telefono.startsWith(c.dialCode)) {
        code = c.code;
        numero = telefono.substring(c.dialCode.length);
        break;
      }
    }
  }
  return { code, numero };
}

function SedeForm({
  sede, onCancel, onSaved, showSuccess, showError,
}: {
  sede?: CentroSede;
  onCancel: () => void;
  onSaved: () => Promise<void>;
  showSuccess: (t: string, m: string) => void;
  showError: (t: string, m: string) => void;
}) {
  const editing = !!sede;
  const initPhone = splitPhone(sede?.telefono);
  const [form, setForm] = useState<CreateSedeData>({
    nombre: sede?.nombre || '',
    ciudad: sede?.ciudad || '',
    direccion: sede?.direccion || '',
    mapsUrl: sede?.mapsUrl || '',
    telefono: sede?.telefono || '',
  });
  const [paisTelefono, setPaisTelefono] = useState(initPhone.code);
  const [telefonoNumero, setTelefonoNumero] = useState(initPhone.numero);
  const [showCountry, setShowCountry] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setShowCountry(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const dial = countries.find((c) => c.code === paisTelefono)?.dialCode;
    const fullTelefono = telefonoNumero ? `${dial}${telefonoNumero}` : undefined;
    const payload = {
      ...form,
      telefono: fullTelefono,
      direccion: form.direccion?.trim() || undefined,
      mapsUrl: form.mapsUrl?.trim() || undefined,
    };
    try {
      if (editing && sede) {
        await adminService.updateSede(sede.id, payload);
        showSuccess('Listo', 'Sede actualizada');
      } else {
        await adminService.createSede(payload);
        showSuccess('Listo', 'Sede creada');
      }
      await onSaved();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Error guardando la sede');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass rounded-3xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">{editing ? 'Editar datos' : 'Nueva sede'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Nombre *</label>
          <input
            type="text" required value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            placeholder="Ej: Club Padel Paraguay"
          />
        </div>
        <div>
          <CityAutocomplete
            value={form.ciudad}
            onChange={(v) => setForm({ ...form, ciudad: v })}
            label="Ciudad *"
            placeholder="Busca tu ciudad..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">Dirección</label>
          <input
            type="text" value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            placeholder="Ej: Avda. Santa Teresa 1234"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">Teléfono</label>
          <div className="relative flex" ref={countryRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCountry(!showCountry)}
                className="h-full px-4 bg-[#0B0E14] border border-r-0 border-[#232838] rounded-l-xl flex items-center gap-2 hover:border-primary transition-colors min-w-[110px]"
              >
                <span className="text-xl">{countries.find((c) => c.code === paisTelefono)?.flag}</span>
                <span className="text-gray-300 text-sm">{countries.find((c) => c.code === paisTelefono)?.dialCode}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              <AnimatePresence>
                {showCountry && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto glass rounded-xl border border-[#232838] z-50"
                  >
                    {countries.map((c) => (
                      <button
                        key={c.code} type="button"
                        onClick={() => { setPaisTelefono(c.code); setShowCountry(false); }}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[#151921] transition-colors text-left ${
                          paisTelefono === c.code ? 'bg-[#151921]' : ''
                        }`}
                      >
                        <span className="text-2xl">{c.flag}</span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{c.name}</p>
                          <p className="text-gray-500 text-xs">{c.dialCode}</p>
                        </div>
                        {paisTelefono === c.code && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative flex-1">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="tel" value={telefonoNumero}
                onChange={(e) => setTelefonoNumero(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#0B0E14] border border-[#232838] rounded-r-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary rounded-l-none"
                placeholder="981 123456"
              />
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">URL Google Maps</label>
          <input
            type="url" value={form.mapsUrl}
            onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
            className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            placeholder="https://maps.google.com/..."
          />
        </div>
        <div className="md:col-span-2 flex justify-end gap-3">
          <button type="button" onClick={onCancel}
            className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
            <Save className="w-5 h-5" />
            {editing ? 'Guardar cambios' : 'Crear sede'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// FICHA
// ════════════════════════════════════════════════════════════

function FichaSede({
  sede, tab, setTab, onBack, reload, confirm, showSuccess, showError,
}: {
  sede: CentroSede;
  tab: Tab;
  setTab: (t: Tab) => void;
  onBack: () => void;
  reload: () => Promise<void>;
  confirm: (o: any) => Promise<boolean>;
  showSuccess: (t: string, m: string) => void;
  showError: (t: string, m: string) => void;
}) {
  const tabs: { id: Tab; label: string; icon: typeof Info }[] = [
    { id: 'datos', label: 'Datos', icon: Info },
    { id: 'canchas', label: 'Canchas', icon: LayoutGrid },
    { id: 'resp', label: 'Responsables', icon: Users },
    { id: 'serv', label: 'Servicio de reservas', icon: CalendarClock },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-lg bg-[#1b212c] hover:bg-[#232838] flex items-center justify-center text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">{sede.nombre}</h2>
          <p className="text-sm text-gray-400 truncate">{sede.ciudad}</p>
        </div>
        <div className="ml-auto"><ServicioBadge sede={sede} /></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-[#232838]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                on ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'datos' && (
        <DatosTab sede={sede} reload={reload} confirm={confirm} showSuccess={showSuccess} showError={showError} />
      )}
      {tab === 'canchas' && (
        <CanchasTab sede={sede} reload={reload} confirm={confirm} showSuccess={showSuccess} showError={showError} />
      )}
      {tab === 'resp' && (
        <ResponsablesTab sede={sede} reload={reload} showSuccess={showSuccess} showError={showError} />
      )}
      {tab === 'serv' && (
        <ServicioTab sede={sede} reload={reload} confirm={confirm} showSuccess={showSuccess} showError={showError} />
      )}
    </div>
  );
}

function DatosTab({
  sede, reload, confirm, showSuccess, showError,
}: {
  sede: CentroSede;
  reload: () => Promise<void>;
  confirm: (o: any) => Promise<boolean>;
  showSuccess: (t: string, m: string) => void;
  showError: (t: string, m: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  const toggleActiva = async () => {
    if (sede.activa) {
      const ok = await confirm({
        title: 'Desactivar sede',
        message: '¿Desactivar esta sede? Sus canchas dejarán de usarse.',
        confirmText: 'Desactivar', cancelText: 'Cancelar', variant: 'warning',
      });
      if (!ok) return;
      try { await adminService.deleteSede(sede.id); showSuccess('Listo', 'Sede desactivada'); await reload(); }
      catch { showError('Error', 'No se pudo desactivar'); }
    } else {
      try { await adminService.activateSede(sede.id); showSuccess('Listo', 'Sede reactivada'); await reload(); }
      catch { showError('Error', 'No se pudo reactivar'); }
    }
  };

  if (editing) {
    return (
      <SedeForm
        sede={sede}
        onCancel={() => setEditing(false)}
        onSaved={async () => { setEditing(false); await reload(); }}
        showSuccess={showSuccess}
        showError={showError}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Nombre" value={sede.nombre} />
        <Field label="Ciudad" value={sede.ciudad} />
        <Field label="Dirección" value={sede.direccion || '-'} full />
        <Field label="Teléfono" value={sede.telefono || '-'} />
        <Field label="Google Maps" value={sede.mapsUrl || '-'} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#232838] hover:bg-[#2a3042] text-white rounded-lg text-sm">
          <Edit2 className="w-4 h-4" /> Editar datos
        </button>
        <button onClick={toggleActiva}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
            sede.activa ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
          }`}>
          {sede.activa ? <Trash2 className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          {sede.activa ? 'Desactivar sede' : 'Reactivar sede'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="bg-[#0B0E14] border border-[#232838] rounded-lg py-2.5 px-3 text-sm text-gray-200 break-words">
        {value}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CANCHAS
// ════════════════════════════════════════════════════════════

function CanchasTab({
  sede, reload, confirm, showSuccess, showError,
}: {
  sede: CentroSede;
  reload: () => Promise<void>;
  confirm: (o: any) => Promise<boolean>;
  showSuccess: (t: string, m: string) => void;
  showError: (t: string, m: string) => void;
}) {
  const empty: CreateCanchaData = { nombre: '', tipo: 'SINTETICO', tieneLuz: false, cubierta: false, notas: '' };
  const [form, setForm] = useState<CreateCanchaData>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const startNew = () => { setForm(empty); setEditingId(null); setShowForm(true); };
  const startEdit = (c: CentroSedeCancha) => {
    setForm({ nombre: c.nombre, tipo: c.tipo, tieneLuz: c.tieneLuz, cubierta: c.cubierta, notas: c.notas || '' });
    setEditingId(c.id);
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      if (editingId) { await adminService.updateCancha(editingId, form); showSuccess('Listo', 'Cancha actualizada'); }
      else { await adminService.createCancha(sede.id, form); showSuccess('Listo', 'Cancha creada'); }
      setShowForm(false); setEditingId(null); setForm(empty);
      await reload();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Error guardando la cancha');
    } finally { setSaving(false); }
  };

  const toggleCancha = async (c: CentroSedeCancha) => {
    if (c.activa) {
      const ok = await confirm({
        title: 'Desactivar cancha', message: '¿Desactivar esta cancha?',
        confirmText: 'Desactivar', cancelText: 'Cancelar', variant: 'warning',
      });
      if (!ok) return;
      try { await adminService.deleteCancha(c.id); showSuccess('Listo', 'Cancha desactivada'); await reload(); }
      catch { showError('Error', 'No se pudo desactivar'); }
    } else {
      try { await adminService.activateCancha(c.id); showSuccess('Listo', 'Cancha reactivada'); await reload(); }
      catch { showError('Error', 'No se pudo reactivar'); }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <Map className="w-4 h-4" /> Canchas
        </h3>
        <button onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm">
          <Plus className="w-4 h-4" /> Agregar cancha
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">{editingId ? 'Editar cancha' : 'Nueva cancha'}</h4>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Nombre *</label>
                <input
                  type="text" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary"
                  placeholder="Ej: Cancha 1"
                />
              </div>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={!!form.tieneLuz}
                    onChange={(e) => setForm({ ...form, tieneLuz: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary" />
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Tiene iluminación</span>
                </label>
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={!!form.cubierta}
                    onChange={(e) => setForm({ ...form, cubierta: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary" />
                  <Home className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Techada</span>
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Notas / Características</label>
                <input
                  type="text" value={form.notas || ''}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary"
                  placeholder="Ej: con gradas, acceso directo..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
              <button onClick={submit} disabled={saving || !form.nombre.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg text-sm">
                <Save className="w-4 h-4" /> {editingId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sede.canchas.map((c) => (
          <div key={c.id}
            className={`p-4 rounded-xl border ${c.activa ? 'bg-[#151921] border-[#232838]' : 'bg-[#0B0E14] border-[#1a1d24] opacity-60'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.activa ? 'bg-primary/20' : 'bg-gray-800'}`}>
                  <Map className={`w-5 h-5 ${c.activa ? 'text-primary' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">{c.nombre}</p>
                  <p className="text-xs text-gray-500">{c.notas || 'Césped sintético'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {c.cubierta && <Home className="w-4 h-4 text-blue-400" aria-label="Techada" />}
                {c.tieneLuz && <Sun className="w-4 h-4 text-yellow-500" aria-label="Con luz" />}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => startEdit(c)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#232838] hover:bg-[#2a3042] text-white rounded text-xs">
                <Edit2 className="w-3 h-3" /> Editar
              </button>
              <button onClick={() => toggleCancha(c)}
                className={`flex items-center justify-center p-1.5 rounded text-xs ${
                  c.activa ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                           : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                }`}>
                {c.activa ? <Trash2 className="w-3 h-3" /> : <Power className="w-3 h-3" />}
              </button>
            </div>
          </div>
        ))}
        {sede.canchas.length === 0 && (
          <div className="col-span-full py-8 text-center">
            <Map className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay canchas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// RESPONSABLES
// ════════════════════════════════════════════════════════════

function ResponsablesTab({
  sede, reload, showSuccess, showError,
}: {
  sede: CentroSede;
  reload: () => Promise<void>;
  showSuccess: (t: string, m: string) => void;
  showError: (t: string, m: string) => void;
}) {
  const [users, setUsers] = useState<UserLite[]>([]);
  const [picking, setPicking] = useState<null | 'dueno' | 'encargado'>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await adminService.getUsers();
        setUsers(Array.isArray(data) ? data : (data.users || []));
      } catch { setUsers([]); }
    })();
  }, []);

  const asignar = async (role: 'dueno' | 'encargado', userId: string) => {
    try {
      if (role === 'dueno') await sedesAdminService.asignarDueno(sede.id, userId);
      else await sedesAdminService.asignarEncargado(sede.id, userId);
      showSuccess('Listo', role === 'dueno' ? 'Dueño asignado' : 'Encargado asignado');
      setPicking(null); setQuery('');
      await reload();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo asignar');
    }
  };

  const filteredUsers = users.filter((u) =>
    normalizeCI(u.documento).includes(normalizeCI(query)) ||
    `${u.nombre} ${u.apellido}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <PersonaCard
        icon={<Crown className="w-5 h-5 text-primary" />}
        title="Dueño (paga el servicio)"
        persona={sede.dueno}
        onPick={() => { setPicking(picking === 'dueno' ? null : 'dueno'); setQuery(''); }}
        picking={picking === 'dueno'}
      />
      {picking === 'dueno' && (
        <UserPicker query={query} setQuery={setQuery} users={filteredUsers} onSelect={(id) => asignar('dueno', id)} />
      )}

      <PersonaCard
        icon={<UserCog className="w-5 h-5 text-blue-400" />}
        title="Encargado (gestiona el día a día)"
        persona={sede.encargado}
        onPick={() => { setPicking(picking === 'encargado' ? null : 'encargado'); setQuery(''); }}
        picking={picking === 'encargado'}
      />
      {picking === 'encargado' && (
        <UserPicker query={query} setQuery={setQuery} users={filteredUsers} onSelect={(id) => asignar('encargado', id)} />
      )}

      <p className="text-xs text-gray-500">
        El dueño y el encargado pueden gestionar las reservas de esta sede desde su cuenta.
      </p>
    </div>
  );
}

function PersonaCard({
  icon, title, persona, onPick, picking,
}: {
  icon: React.ReactNode;
  title: string;
  persona: CentroSede['dueno'];
  onPick: () => void;
  picking: boolean;
}) {
  return (
    <div className="bg-[#0B0E14] border border-[#232838] rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{title}</p>
        {persona ? (
          <p className="text-sm text-white truncate">{persona.nombre} {persona.apellido} · {persona.email}</p>
        ) : (
          <p className="text-sm text-yellow-400">Sin asignar</p>
        )}
      </div>
      <button onClick={onPick}
        className="px-3 py-1.5 bg-[#1b212c] hover:bg-[#232838] text-gray-300 rounded-lg text-xs">
        {picking ? 'Cancelar' : (persona ? 'Cambiar' : 'Asignar')}
      </button>
    </div>
  );
}

function UserPicker({
  query, setQuery, users, onSelect,
}: {
  query: string;
  setQuery: (s: string) => void;
  users: UserLite[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="p-4 bg-[#0B0E14] border border-[#232838] rounded-xl">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o CI..."
          className="w-full bg-[#151921] border border-[#232838] rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
        />
      </div>
      <div className="max-h-60 overflow-y-auto space-y-2">
        {users.slice(0, 10).map((u) => (
          <button key={u.id} onClick={() => onSelect(u.id)}
            className="w-full flex items-center gap-3 p-3 bg-[#151921] hover:bg-[#232838] rounded-lg text-left">
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{u.nombre} {u.apellido}</p>
              <p className="text-gray-500 text-xs">CI: {u.documento || '-'} · {u.email}</p>
            </div>
            <Check className="w-4 h-4 text-primary" />
          </button>
        ))}
        {users.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No se encontraron usuarios</p>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SERVICIO DE RESERVAS
// ════════════════════════════════════════════════════════════

function ServicioTab({
  sede, reload, confirm, showSuccess, showError,
}: {
  sede: CentroSede;
  reload: () => Promise<void>;
  confirm: (o: any) => Promise<boolean>;
  showSuccess: (t: string, m: string) => void;
  showError: (t: string, m: string) => void;
}) {
  const [pagos, setPagos] = useState<PagoServicio[] | null>(null);
  const [working, setWorking] = useState(false);
  const activo = !!sede.servicio?.suscripcionActiva;

  const loadPagos = async () => {
    try { setPagos(await centroSedesService.getPagos(sede.id)); }
    catch { setPagos([]); }
  };
  useEffect(() => { loadPagos(); }, [sede.id]);

  const activar = async (tipo: 'MENSUAL' | 'ANUAL') => {
    setWorking(true);
    try {
      await centroSedesService.activarServicio(sede.id, tipo);
      showSuccess('Listo', `Servicio activado (${tipo.toLowerCase()})`);
      await reload(); await loadPagos();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo activar');
    } finally { setWorking(false); }
  };

  const desactivar = async () => {
    const ok = await confirm({
      title: 'Desactivar servicio',
      message: 'La sede dejará de aparecer para reservas. ¿Continuar?',
      confirmText: 'Desactivar', cancelText: 'Cancelar', variant: 'warning',
    });
    if (!ok) return;
    setWorking(true);
    try {
      await centroSedesService.desactivarServicio(sede.id);
      showSuccess('Listo', 'Servicio desactivado');
      await reload();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo desactivar');
    } finally { setWorking(false); }
  };

  const estadoPagoColor = (e: string) =>
    e === 'COMPLETADO' ? 'text-green-400' : e === 'PENDIENTE' ? 'text-amber-400' : 'text-gray-500';

  return (
    <div className="space-y-5">
      <div className={`rounded-xl p-4 border flex items-center gap-3 ${
        activo ? 'bg-green-500/5 border-green-500/25' : 'bg-[#0B0E14] border-[#232838]'
      }`}>
        <CalendarClock className={`w-6 h-6 ${activo ? 'text-green-400' : 'text-gray-500'}`} />
        <div className="flex-1">
          <p className="text-white font-medium">Servicio de reservas</p>
          <p className="text-sm text-gray-400">El jugador reserva canchas de esta sede desde la app</p>
        </div>
        <span className={`text-sm font-medium ${activo ? 'text-green-400' : 'text-gray-500'}`}>
          {activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ServStat label="Estado" value={activo ? 'Activo' : 'Inactivo'} color={activo ? 'text-green-400' : 'text-gray-400'} />
        <ServStat label="Vence" value={formatDate(sede.servicio?.suscripcionVenceEn)} color="text-gray-200" />
        <ServStat
          label="Plan"
          value={sede.servicio?.tipoSuscripcion ? sede.servicio.tipoSuscripcion.charAt(0) + sede.servicio.tipoSuscripcion.slice(1).toLowerCase() : '-'}
          color="text-gray-200"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => activar('MENSUAL')} disabled={working}
          className="flex items-center gap-2 px-4 py-2 bg-green-500/15 hover:bg-green-500/25 disabled:opacity-50 text-green-400 rounded-lg text-sm">
          <Gift className="w-4 h-4" /> Activar mensual
        </button>
        <button onClick={() => activar('ANUAL')} disabled={working}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/15 hover:bg-blue-500/25 disabled:opacity-50 text-blue-400 rounded-lg text-sm">
          <Gift className="w-4 h-4" /> Activar anual
        </button>
        {activo && (
          <button onClick={desactivar} disabled={working}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 disabled:opacity-50 text-red-400 rounded-lg text-sm">
            <XCircle className="w-4 h-4" /> Desactivar
          </button>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Historial de pagos
        </p>
        <div className="bg-[#0B0E14] border border-[#232838] rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2.5 text-xs text-gray-500 border-b border-[#232838]">
            <span>Fecha</span><span>Período</span><span>Método</span><span className="text-right">Monto</span>
          </div>
          {pagos === null ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">Cargando...</div>
          ) : pagos.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">Sin pagos registrados</div>
          ) : (
            pagos.map((p) => (
              <div key={p.id} className="grid grid-cols-4 gap-2 px-4 py-2.5 text-sm border-b border-[#1a1f29] last:border-0">
                <span className="text-gray-300">{formatDate(p.fechaPago || p.createdAt)}</span>
                <span className="text-gray-400 text-xs self-center">{formatDate(p.periodoDesde)} → {formatDate(p.periodoHasta)}</span>
                <span className="text-gray-400 self-center">{p.metodo || '-'}</span>
                <span className={`text-right self-center ${estadoPagoColor(p.estado)}`}>
                  {formatMonto(p.monto, p.moneda)}
                </span>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          "Activar mensual / anual" registra el pago y deja el servicio vigente (sirve para cobros por transferencia o regalo).
        </p>
      </div>
    </div>
  );
}

function ServStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0B0E14] border border-[#232838] rounded-xl p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-medium ${color}`}>{value}</p>
    </div>
  );
}

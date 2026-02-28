import { useState, useEffect, useMemo, useRef } from 'react';
import { instructoresService } from '@/services/instructoresService';
import { Modal, Button } from '@/components/ui';
import {
  DollarSign,
  Loader2,
  User,
  UserPlus,
  Search,
  X,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { AlumnoResumen } from '@/types';

const METODOS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'QR', label: 'QR' },
  { value: 'OTRO', label: 'Otro' },
];

const CONCEPTOS = [
  { value: 'CLASE', label: 'Clase' },
  { value: 'PAQUETE', label: 'Paquete' },
  { value: 'DEUDA', label: 'Deuda' },
  { value: 'ADELANTO', label: 'Adelanto' },
  { value: 'OTRO', label: 'Otro' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  preselectedAlumno?: AlumnoResumen | null;
  preselectedReserva?: { id: string; precio: number } | null;
}

const RegistrarPagoModal = ({ isOpen, onClose, onCreated, preselectedAlumno, preselectedReserva }: Props) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [monto, setMonto] = useState<string>(preselectedReserva ? String(preselectedReserva.precio) : '');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [concepto, setConcepto] = useState('CLASE');
  const [fecha, setFecha] = useState(todayStr);
  const [descripcion, setDescripcion] = useState('');
  const [sending, setSending] = useState(false);

  // Alumno selection
  const [alumnoMode, setAlumnoMode] = useState<'registrado' | 'externo'>(
    preselectedAlumno ? preselectedAlumno.tipo : 'registrado'
  );
  const [alumnoId, setAlumnoId] = useState(preselectedAlumno?.id || '');
  const [selectedAlumnoName] = useState(
    preselectedAlumno ? `${preselectedAlumno.nombre} ${preselectedAlumno.apellido || ''}`.trim() : ''
  );
  const [externoNombre, setExternoNombre] = useState(
    preselectedAlumno?.tipo === 'externo' ? preselectedAlumno.nombre : ''
  );
  const [externoTelefono, setExternoTelefono] = useState(
    preselectedAlumno?.tipo === 'externo' ? (preselectedAlumno.telefono || '') : ''
  );

  // Alumno search state
  const [alumnos, setAlumnos] = useState<AlumnoResumen[]>([]);
  const [alumnoSearch, setAlumnoSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [pickedAlumno, setPickedAlumno] = useState<AlumnoResumen | null>(null);

  // Load alumnos list when modal opens
  useEffect(() => {
    if (isOpen && !preselectedAlumno) {
      instructoresService.obtenerAlumnos().then((data) => {
        setAlumnos(Array.isArray(data) ? data : []);
      }).catch(() => {});
    }
  }, [isOpen, preselectedAlumno]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  // Filter registered alumnos by search
  const filteredRegistrados = useMemo(() => {
    const registrados = alumnos.filter((a) => a.tipo === 'registrado');
    if (!alumnoSearch.trim()) return registrados;
    const q = alumnoSearch.toLowerCase();
    return registrados.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        (a.apellido && a.apellido.toLowerCase().includes(q)) ||
        (`${a.nombre} ${a.apellido || ''}`).toLowerCase().includes(q) ||
        (a.telefono && a.telefono.includes(q))
    );
  }, [alumnos, alumnoSearch]);

  // Filter external alumnos by search
  const filteredExternos = useMemo(() => {
    const externos = alumnos.filter((a) => a.tipo === 'externo');
    if (!externoNombre.trim()) return externos.slice(0, 5);
    const q = externoNombre.toLowerCase();
    return externos.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        (a.telefono && a.telefono.includes(q))
    );
  }, [alumnos, externoNombre]);

  const handleSelectAlumno = (alumno: AlumnoResumen) => {
    setAlumnoId(alumno.id || '');
    setPickedAlumno(alumno);
    setAlumnoSearch('');
    setShowDropdown(false);
  };

  const handleClearAlumno = () => {
    setAlumnoId('');
    setPickedAlumno(null);
    setAlumnoSearch('');
  };

  const handleSelectExterno = (alumno: AlumnoResumen) => {
    setExternoNombre(alumno.nombre);
    setExternoTelefono(alumno.telefono || '');
  };

  const handleSubmit = async () => {
    const montoNum = parseInt(monto);
    if (!montoNum || montoNum <= 0) {
      toast.error('Ingresá un monto válido');
      return;
    }
    if (alumnoMode === 'registrado' && !alumnoId) {
      toast.error('Seleccioná un alumno');
      return;
    }
    if (alumnoMode === 'externo' && !externoNombre.trim()) {
      toast.error('Ingresá el nombre del alumno');
      return;
    }

    setSending(true);
    try {
      await instructoresService.registrarPago({
        monto: montoNum,
        metodoPago,
        concepto,
        fecha,
        alumnoId: alumnoMode === 'registrado' ? alumnoId : undefined,
        alumnoExternoNombre: alumnoMode === 'externo' ? externoNombre.trim() : undefined,
        alumnoExternoTelefono: alumnoMode === 'externo' && externoTelefono.trim() ? externoTelefono.trim() : undefined,
        reservaId: preselectedReserva?.id || undefined,
        descripcion: descripcion.trim() || undefined,
      });
      toast.success('Pago registrado');
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al registrar pago');
    } finally {
      setSending(false);
    }
  };

  const selectClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
      active
        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
        : 'border-dark-border text-light-secondary hover:bg-dark-hover'
    }`;

  const getInitials = (nombre: string, apellido?: string) => {
    const first = nombre.charAt(0).toUpperCase();
    const last = apellido ? apellido.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago" size="md">
      <div className="space-y-4">
        {/* Monto */}
        <div>
          <label className="block text-xs text-light-muted mb-1.5">Monto (Gs.)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              className="w-full pl-9 pr-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Método + Concepto */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-light-muted mb-1.5">Método</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
            >
              {METODOS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-light-muted mb-1.5">Concepto</label>
            <select
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
            >
              {CONCEPTOS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-xs text-light-muted mb-1.5">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Alumno */}
        {!preselectedAlumno && (
          <div>
            <label className="block text-xs text-light-muted mb-1.5">Alumno</label>
            <div className="flex gap-2 mb-2">
              <button onClick={() => { setAlumnoMode('registrado'); handleClearAlumno(); }} className={selectClass(alumnoMode === 'registrado')}>
                <User className="h-3.5 w-3.5" /> Registrado
              </button>
              <button onClick={() => { setAlumnoMode('externo'); handleClearAlumno(); }} className={selectClass(alumnoMode === 'externo')}>
                <UserPlus className="h-3.5 w-3.5" /> Externo
              </button>
            </div>

            {alumnoMode === 'registrado' ? (
              <div ref={dropdownRef} className="relative">
                {pickedAlumno ? (
                  /* Selected alumno chip */
                  <div className="flex items-center gap-2 px-3 py-2 bg-dark-surface border border-primary-500/30 rounded-lg">
                    <div className="h-6 w-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary-400">
                        {getInitials(pickedAlumno.nombre, pickedAlumno.apellido)}
                      </span>
                    </div>
                    <span className="text-sm text-light-text flex-1">
                      {pickedAlumno.nombre} {pickedAlumno.apellido || ''}
                    </span>
                    {pickedAlumno.telefono && (
                      <span className="text-[10px] text-light-muted">{pickedAlumno.telefono}</span>
                    )}
                    <button
                      onClick={handleClearAlumno}
                      className="p-0.5 rounded hover:bg-dark-hover text-light-muted hover:text-light-text transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  /* Search input */
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-light-muted" />
                      <input
                        type="text"
                        value={alumnoSearch}
                        onChange={(e) => { setAlumnoSearch(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Buscar alumno por nombre..."
                        className="w-full pl-9 pr-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    {/* Dropdown */}
                    {showDropdown && (
                      <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-dark-surface border border-dark-border rounded-lg shadow-lg">
                        {filteredRegistrados.length === 0 ? (
                          <div className="px-3 py-3 text-xs text-light-muted text-center">
                            {alumnos.length === 0 ? 'Cargando alumnos...' : 'No se encontraron alumnos'}
                          </div>
                        ) : (
                          filteredRegistrados.map((a) => (
                            <button
                              key={a.id || a.nombre}
                              onClick={() => handleSelectAlumno(a)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-dark-hover text-left transition-colors"
                            >
                              <div className="h-7 w-7 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-blue-400">
                                  {getInitials(a.nombre, a.apellido)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-light-text truncate">
                                  {a.nombre} {a.apellido || ''}
                                </p>
                                {a.telefono && (
                                  <p className="text-[10px] text-light-muted flex items-center gap-1">
                                    <Phone className="h-2.5 w-2.5" /> {a.telefono}
                                  </p>
                                )}
                              </div>
                              {a.totalClases > 0 && (
                                <span className="text-[10px] text-light-muted whitespace-nowrap">
                                  {a.totalClases} clases
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Externo mode */
              <div className="space-y-2">
                <input
                  type="text"
                  value={externoNombre}
                  onChange={(e) => setExternoNombre(e.target.value)}
                  placeholder="Nombre del alumno"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
                />
                {/* Suggestions from previous external students */}
                {filteredExternos.length > 0 && externoNombre.trim() && (
                  <div className="flex flex-wrap gap-1">
                    {filteredExternos.slice(0, 4).map((a) => (
                      <button
                        key={a.nombre}
                        onClick={() => handleSelectExterno(a)}
                        className="px-2 py-0.5 text-[10px] bg-dark-hover rounded-full text-light-secondary hover:text-light-text transition-colors"
                      >
                        {a.nombre} {a.telefono ? `(${a.telefono})` : ''}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={externoTelefono}
                  onChange={(e) => setExternoTelefono(e.target.value)}
                  placeholder="Teléfono (opcional)"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Preselected alumno display */}
        {preselectedAlumno && (
          <div className="flex items-center gap-2 p-3 bg-dark-surface rounded-lg">
            <User className="h-4 w-4 text-light-muted" />
            <span className="text-sm text-light-text">{selectedAlumnoName}</span>
          </div>
        )}

        {/* Descripcion */}
        <div>
          <label className="block text-xs text-light-muted mb-1.5">Descripción (opcional)</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value.slice(0, 300))}
            rows={2}
            placeholder="Detalle del pago..."
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-dark-border">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <DollarSign className="h-4 w-4 mr-1" />}
            Registrar Pago
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RegistrarPagoModal;

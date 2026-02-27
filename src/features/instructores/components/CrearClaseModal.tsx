import { useState, useEffect, useCallback } from 'react';
import { instructoresService } from '@/services/instructoresService';
import usersService from '@/services/usersService';
import { Modal, Button } from '@/components/ui';
import {
  User as UserIcon,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Search,
  Loader2,
  UserPlus,
  FileText,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Instructor, User } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  instructor: Instructor;
  onCreated: () => void;
}

const CrearClaseModal = ({ isOpen, onClose, instructor, onCreated }: Props) => {
  // Alumno type
  const [alumnoTipo, setAlumnoTipo] = useState<'registrado' | 'externo'>('externo');

  // Alumno registrado
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Alumno externo
  const [externoNombre, setExternoNombre] = useState('');
  const [externoTelefono, setExternoTelefono] = useState('');

  // Clase
  const [tipo, setTipo] = useState<'INDIVIDUAL' | 'GRUPAL'>('INDIVIDUAL');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [duracion, setDuracion] = useState(60);
  const [precio, setPrecio] = useState('');
  const [notas, setNotas] = useState('');
  const [sending, setSending] = useState(false);

  // Auto-set price from instructor profile
  useEffect(() => {
    const p = tipo === 'INDIVIDUAL' ? instructor.precioIndividual : instructor.precioGrupal;
    if (p) setPrecio(String(p));
  }, [tipo, instructor]);

  // Search debounce
  useEffect(() => {
    if (alumnoTipo !== 'registrado' || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await usersService.search(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, alumnoTipo]);

  const resetForm = useCallback(() => {
    setAlumnoTipo('externo');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setExternoNombre('');
    setExternoTelefono('');
    setTipo('INDIVIDUAL');
    setFecha('');
    setHoraInicio('');
    setDuracion(60);
    setPrecio('');
    setNotas('');
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!fecha || !horaInicio) {
      toast.error('Completá fecha y hora');
      return;
    }
    if (alumnoTipo === 'registrado' && !selectedUser) {
      toast.error('Seleccioná un alumno');
      return;
    }
    if (alumnoTipo === 'externo' && !externoNombre.trim()) {
      toast.error('Ingresá el nombre del alumno');
      return;
    }

    setSending(true);
    try {
      await instructoresService.crearClaseManual({
        tipo,
        fecha,
        horaInicio,
        duracionMinutos: duracion,
        precio: precio ? parseInt(precio) : undefined,
        solicitanteId: alumnoTipo === 'registrado' ? selectedUser?.id : undefined,
        alumnoExternoNombre: alumnoTipo === 'externo' ? externoNombre.trim() : undefined,
        alumnoExternoTelefono: alumnoTipo === 'externo' && externoTelefono.trim() ? externoTelefono.trim() : undefined,
        notas: notas.trim() || undefined,
      });
      toast.success('Clase creada');
      resetForm();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al crear clase');
    } finally {
      setSending(false);
    }
  };

  // Today as min date
  const today = new Date().toISOString().split('T')[0];

  // Generate time slots
  const timeSlots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 22) timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva Clase" size="lg">
      <div className="space-y-5">
        {/* Alumno Toggle */}
        <div>
          <label className="block text-xs text-light-muted mb-2">Alumno</label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => { setAlumnoTipo('externo'); setSelectedUser(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                alumnoTipo === 'externo'
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-dark-border text-light-secondary hover:bg-dark-hover'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Externo
            </button>
            <button
              onClick={() => { setAlumnoTipo('registrado'); setExternoNombre(''); setExternoTelefono(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                alumnoTipo === 'registrado'
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-dark-border text-light-secondary hover:bg-dark-hover'
              }`}
            >
              <Search className="h-4 w-4" />
              FairPadel
            </button>
          </div>

          {alumnoTipo === 'externo' ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nombre del alumno"
                value={externoNombre}
                onChange={(e) => setExternoNombre(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
              />
              <input
                type="text"
                placeholder="Teléfono (opcional)"
                value={externoTelefono}
                onChange={(e) => setExternoTelefono(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {selectedUser ? (
                <div className="flex items-center gap-2 p-2 bg-dark-surface rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    {selectedUser.fotoUrl ? (
                      <img src={selectedUser.fotoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-primary-400" />
                    )}
                  </div>
                  <span className="text-sm text-light-text flex-1">
                    {selectedUser.nombre} {selectedUser.apellido}
                  </span>
                  <button
                    onClick={() => { setSelectedUser(null); setSearchQuery(''); }}
                    className="text-xs text-light-muted hover:text-light-text"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-muted" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o documento..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary-400" />
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto bg-dark-surface rounded-lg border border-dark-border">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { setSelectedUser(u); setSearchResults([]); }}
                          className="w-full flex items-center gap-2 p-2 hover:bg-dark-hover text-left transition-colors"
                        >
                          <div className="h-7 w-7 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                            {u.fotoUrl ? (
                              <img src={u.fotoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <UserIcon className="h-3.5 w-3.5 text-primary-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-light-text">{u.nombre} {u.apellido}</p>
                            {u.ciudad && <p className="text-xs text-light-muted">{u.ciudad}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Tipo de clase */}
        <div>
          <label className="block text-xs text-light-muted mb-2">Tipo de clase</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTipo('INDIVIDUAL')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                tipo === 'INDIVIDUAL'
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-dark-border text-light-secondary hover:bg-dark-hover'
              }`}
            >
              <UserIcon className="h-4 w-4" />
              Individual
            </button>
            <button
              onClick={() => setTipo('GRUPAL')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                tipo === 'GRUPAL'
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-dark-border text-light-secondary hover:bg-dark-hover'
              }`}
            >
              <Users className="h-4 w-4" />
              Grupal
            </button>
          </div>
        </div>

        {/* Fecha + Hora + Duración */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-light-muted mb-1.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Fecha
            </label>
            <input
              type="date"
              value={fecha}
              min={today}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-2 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-light-muted mb-1.5 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Hora
            </label>
            <select
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full px-2 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
            >
              <option value="">--:--</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-light-muted mb-1.5">Duración</label>
            <select
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
              className="w-full px-2 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
            >
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="block text-xs text-light-muted mb-1.5 flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Precio (Gs.)
          </label>
          <input
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs text-light-muted mb-1.5 flex items-center gap-1">
            <FileText className="h-3 w-3" /> Notas (opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value.slice(0, 500))}
            rows={2}
            placeholder="Notas sobre la clase..."
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2 border-t border-dark-border">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Crear Clase
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CrearClaseModal;

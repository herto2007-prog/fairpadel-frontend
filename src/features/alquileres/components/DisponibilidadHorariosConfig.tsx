import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { Button, Loading } from '@/components/ui';
import { Save, Clock, Copy, Trash2, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  sedeId: string;
}

interface HorarioDia {
  dia: number;
  diaNombre: string;
  activo: boolean;
  horaInicio: string;
  horaFin: string;
}

const DIAS_SEMANA = [
  { dia: 1, nombre: 'Lunes', corto: 'Lun' },
  { dia: 2, nombre: 'Martes', corto: 'Mar' },
  { dia: 3, nombre: 'Miércoles', corto: 'Mié' },
  { dia: 4, nombre: 'Jueves', corto: 'Jue' },
  { dia: 5, nombre: 'Viernes', corto: 'Vie' },
  { dia: 6, nombre: 'Sábado', corto: 'Sáb' },
  { dia: 0, nombre: 'Domingo', corto: 'Dom' },
];

const HORAS_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '00:00'
];

export default function DisponibilidadHorariosConfig({ sedeId }: Props) {
  const [canchas, setCanchas] = useState<{ id: string; nombre: string }[]>([]);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState('');
  const [horarios, setHorarios] = useState<HorarioDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cambiaron, setCambiaron] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [sedeId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [sedeData, dispData] = await Promise.all([
        alquileresService.getSedeDetalle(sedeId),
        alquileresService.getDisponibilidad(sedeId),
      ]);

      const canchasList = Array.isArray(sedeData.canchas) 
        ? sedeData.canchas.map((c: any) => ({ id: c.id, nombre: c.nombre }))
        : [];
      setCanchas(canchasList);
      
      if (canchasList.length > 0) {
        setCanchaSeleccionada(canchasList[0].id);
      }

      // Convertir disponibilidad a formato de horarios
      const horariosIniciales: HorarioDia[] = DIAS_SEMANA.map(d => ({
        dia: d.dia,
        diaNombre: d.nombre,
        activo: false,
        horaInicio: '08:00',
        horaFin: '22:00',
      }));

      const disps = Array.isArray(dispData) ? dispData : [];
      disps.forEach((d: any) => {
        const idx = horariosIniciales.findIndex(h => h.dia === d.diaSemana);
        if (idx >= 0) {
          horariosIniciales[idx] = {
            dia: d.diaSemana,
            diaNombre: DIAS_SEMANA.find(ds => ds.dia === d.diaSemana)?.nombre || '',
            activo: d.activo !== false,
            horaInicio: d.horaInicio,
            horaFin: d.horaFin,
          };
        }
      });

      setHorarios(horariosIniciales);
      setCambiaron(false);
    } catch {
      toast.error('Error cargando disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  const toggleDia = (dia: number) => {
    setHorarios(prev => prev.map(h => 
      h.dia === dia ? { ...h, activo: !h.activo } : h
    ));
    setCambiaron(true);
  };

  const updateHora = (dia: number, campo: 'horaInicio' | 'horaFin', valor: string) => {
    setHorarios(prev => prev.map(h => 
      h.dia === dia ? { ...h, [campo]: valor } : h
    ));
    setCambiaron(true);
  };

  const aplicarATodos = (desdeDia: number) => {
    const horarioBase = horarios.find(h => h.dia === desdeDia);
    if (!horarioBase) return;

    setHorarios(prev => prev.map(h => ({
      ...h,
      activo: horarioBase.activo,
      horaInicio: horarioBase.horaInicio,
      horaFin: horarioBase.horaFin,
    })));
    setCambiaron(true);
    toast.success('Horario aplicado a todos los días');
  };

  const copiarSemanaLaboral = () => {
    const lunes = horarios.find(h => h.dia === 1);
    if (!lunes) return;

    setHorarios(prev => prev.map(h => {
      if (h.dia >= 1 && h.dia <= 5) {
        return { ...h, activo: lunes.activo, horaInicio: lunes.horaInicio, horaFin: lunes.horaFin };
      }
      return h;
    }));
    setCambiaron(true);
    toast.success('Copiado a Lun-Vie');
  };

  const copiarFinDeSemana = () => {
    const sabado = horarios.find(h => h.dia === 6);
    if (!sabado) return;

    setHorarios(prev => prev.map(h => {
      if (h.dia === 0) {
        return { ...h, activo: sabado.activo, horaInicio: sabado.horaInicio, horaFin: sabado.horaFin };
      }
      return h;
    }));
    setCambiaron(true);
    toast.success('Copiado Sábado → Domingo');
  };

  const limpiarTodo = () => {
    if (!confirm('¿Eliminar todos los horarios?')) return;
    setHorarios(prev => prev.map(h => ({ ...h, activo: false })));
    setCambiaron(true);
  };

  const guardar = async () => {
    if (!canchaSeleccionada) {
      toast.error('Seleccioná una cancha');
      return;
    }

    setSaving(true);
    try {
      const slots = horarios
        .filter(h => h.activo)
        .map(h => ({
          sedeCanchaId: canchaSeleccionada,
          diaSemana: h.dia,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
        }));

      await alquileresService.configurarDisponibilidad(sedeId, slots);
      toast.success('Disponibilidad guardada');
      setCambiaron(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading size="lg" text="Cargando..." />;
  }

  if (canchas.length === 0) {
    return (
      <div className="text-center py-12 text-light-muted">
        No hay canchas configuradas en esta sede.
      </div>
    );
  }

  const horariosActivos = horarios.filter(h => h.activo).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-light-text flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Configurar Horarios
          </h3>
          <p className="text-xs text-light-muted mt-1">
            {horariosActivos} días activos • Seleccioná los días y horarios de atención
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={canchaSeleccionada}
            onChange={(e) => setCanchaSeleccionada(e.target.value)}
            className="bg-dark-input border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text"
          >
            {canchas.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          
          <Button 
            variant="primary" 
            size="sm" 
            loading={saving}
            onClick={guardar}
            disabled={!cambiaron}
          >
            <Save className="w-4 h-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={copiarSemanaLaboral}>
          <Copy className="w-3.5 h-3.5 mr-1" />
          Lunes → Lun-Vie
        </Button>
        <Button variant="outline" size="sm" onClick={copiarFinDeSemana}>
          <Copy className="w-3.5 h-3.5 mr-1" />
          Sáb → Dom
        </Button>
        <Button variant="ghost" size="sm" onClick={limpiarTodo} className="text-red-400 hover:text-red-300">
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Limpiar todo
        </Button>
      </div>

      {/* Tabla de horarios */}
      <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-3 bg-dark-surface text-xs text-light-muted font-medium">
          <div className="col-span-2">Día</div>
          <div className="col-span-2">Activo</div>
          <div className="col-span-3">Apertura</div>
          <div className="col-span-3">Cierre</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        <div className="divide-y divide-dark-border">
          {horarios.map((h) => (
            <div 
              key={h.dia} 
              className={`grid grid-cols-12 gap-2 p-3 items-center transition-colors ${
                h.activo ? 'bg-primary-500/5' : ''
              }`}
            >
              <div className="col-span-2">
                <span className={`font-medium ${h.activo ? 'text-light-text' : 'text-light-muted'}`}>
                  {h.diaNombre}
                </span>
              </div>
              
              <div className="col-span-2">
                <button
                  onClick={() => toggleDia(h.dia)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    h.activo ? 'bg-primary-500' : 'bg-dark-border'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    h.activo ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="col-span-3">
                <select
                  value={h.horaInicio}
                  onChange={(e) => updateHora(h.dia, 'horaInicio', e.target.value)}
                  disabled={!h.activo}
                  className="w-full bg-dark-input border border-dark-border rounded-lg px-2 py-1.5 text-sm text-light-text disabled:opacity-50"
                >
                  {HORAS_OPTIONS.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <select
                  value={h.horaFin}
                  onChange={(e) => updateHora(h.dia, 'horaFin', e.target.value)}
                  disabled={!h.activo}
                  className="w-full bg-dark-input border border-dark-border rounded-lg px-2 py-1.5 text-sm text-light-text disabled:opacity-50"
                >
                  {HORAS_OPTIONS.filter(hora => hora > h.horaInicio).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => aplicarATodos(h.dia)}
                  disabled={!h.activo}
                  title="Copiar a todos los días"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-dark-surface rounded-lg p-4 text-sm">
        <h4 className="font-medium text-light-text mb-2">Vista previa</h4>
        <div className="space-y-1">
          {horarios.filter(h => h.activo).map(h => (
            <div key={h.dia} className="flex items-center gap-2 text-light-muted">
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="w-24">{h.diaNombre}:</span>
              <span>{h.horaInicio} - {h.horaFin}</span>
            </div>
          ))}
          {horariosActivos === 0 && (
            <p className="text-light-muted italic">No hay días configurados</p>
          )}
        </div>
      </div>
    </div>
  );
}

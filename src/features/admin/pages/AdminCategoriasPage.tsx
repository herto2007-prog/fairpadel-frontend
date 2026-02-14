import { useEffect, useState, useMemo } from 'react';
import { Card, Button, Loading } from '@/components/ui';
import { categoriasService } from '@/services/categoriasService';
import tournamentsService from '@/services/tournamentsService';
import type { ReglaAscenso, HistorialCategoria, Category, User } from '@/types';
import {
  Layers,
  Users,
  History,
  Save,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'reglas' | 'jugadores' | 'historial';

const AdminCategoriasPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('reglas');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'reglas', label: 'Reglas de Ascenso', icon: <Layers className="w-4 h-4" /> },
    { key: 'jugadores', label: 'Gestión de Jugadores', icon: <Users className="w-4 h-4" /> },
    { key: 'historial', label: 'Historial de Movimientos', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-light-text">Gestión de Categorías</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-card text-light-secondary hover:bg-dark-hover border border-dark-border'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reglas' && <ReglasTab />}
      {activeTab === 'jugadores' && <JugadoresTab />}
      {activeTab === 'historial' && <HistorialTab />}
    </div>
  );
};

// ═══════════════════════════════════════════
// TAB 1: REGLAS DE ASCENSO
// ═══════════════════════════════════════════

function ReglasTab() {
  const [reglas, setReglas] = useState<ReglaAscenso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedReglas, setEditedReglas] = useState<Record<string, Partial<ReglaAscenso>>>({});

  useEffect(() => {
    loadReglas();
  }, []);

  const loadReglas = async () => {
    try {
      const data = await categoriasService.getReglas();
      setReglas(data);
    } catch {
      toast.error('Error al cargar reglas');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, field: string, value: any) => {
    setEditedReglas((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (id: string) => {
    const edited = editedReglas[id];
    if (!edited) return;
    setSaving(id);
    try {
      await categoriasService.actualizarRegla(id, edited as any);
      toast.success('Regla actualizada');
      setEditedReglas((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await loadReglas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta regla?')) return;
    try {
      await categoriasService.eliminarRegla(id);
      toast.success('Regla eliminada');
      await loadReglas();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const reglasCaballeros = reglas.filter(
    (r) => r.categoriaOrigen?.tipo === 'MASCULINO',
  );
  const reglasDamas = reglas.filter(
    (r) => r.categoriaOrigen?.tipo === 'FEMENINO',
  );

  if (loading) return <Loading size="lg" text="Cargando reglas..." />;

  const renderReglasTable = (reglasGrupo: ReglaAscenso[], titulo: string, color: string) => (
    <Card className="p-4">
      <h3 className={`font-bold text-lg mb-4 text-${color}-400`}>{titulo}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border text-left">
              <th className="px-3 py-2 text-light-secondary">Desde</th>
              <th className="px-3 py-2 text-light-secondary">→ Hacia</th>
              <th className="px-3 py-2 text-light-secondary text-center">Consecutivos</th>
              <th className="px-3 py-2 text-light-secondary text-center">Alternados</th>
              <th className="px-3 py-2 text-light-secondary text-center">Finalista Califica</th>
              <th className="px-3 py-2 text-light-secondary text-center">Activa</th>
              <th className="px-3 py-2 text-light-secondary">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reglasGrupo.map((regla) => {
              const edited = editedReglas[regla.id];
              const consecutivos = edited?.campeonatosConsecutivos ?? regla.campeonatosConsecutivos ?? '';
              const alternados = edited?.campeonatosAlternados ?? regla.campeonatosAlternados ?? '';
              const finalistaCalifica = edited?.finalistaCalifica ?? regla.finalistaCalifica;
              const activa = edited?.activa ?? regla.activa;
              const hasChanges = !!edited;

              return (
                <tr key={regla.id} className="border-b border-dark-border/50 hover:bg-dark-hover/30">
                  <td className="px-3 py-2 font-medium text-light-text">
                    {regla.categoriaOrigen?.nombre}
                  </td>
                  <td className="px-3 py-2 text-green-400 font-medium">
                    {regla.categoriaDestino?.nombre}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={consecutivos}
                      onChange={(e) =>
                        handleEdit(regla.id, 'campeonatosConsecutivos', e.target.value ? parseInt(e.target.value) : null)
                      }
                      className="w-16 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm text-light-text text-center focus:outline-none focus:border-primary-500"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={alternados}
                      onChange={(e) =>
                        handleEdit(regla.id, 'campeonatosAlternados', e.target.value ? parseInt(e.target.value) : null)
                      }
                      className="w-16 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm text-light-text text-center focus:outline-none focus:border-primary-500"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={finalistaCalifica}
                      onChange={(e) => handleEdit(regla.id, 'finalistaCalifica', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={activa}
                      onChange={(e) => handleEdit(regla.id, 'activa', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {hasChanges && (
                        <button
                          onClick={() => handleSave(regla.id)}
                          disabled={saving === regla.id}
                          className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          {saving === regla.id ? '...' : <Save className="w-3 h-3" />}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(regla.id)}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-light-secondary">
        Configurá las reglas para ascenso automático de categoría. Se cumple si se alcanza
        <strong className="text-light-text"> consecutivos O alternados</strong> (lo que pase primero).
      </p>
      {renderReglasTable(reglasCaballeros, 'Caballeros', 'blue')}
      {renderReglasTable(reglasDamas, 'Damas', 'pink')}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB 2: GESTIÓN DE JUGADORES
// ═══════════════════════════════════════════

function JugadoresTab() {
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [playerHistory, setPlayerHistory] = useState<HistorialCategoria[]>([]);
  const [changingPlayer, setChangingPlayer] = useState<User | null>(null);
  const [changeData, setChangeData] = useState({ nuevaCategoriaId: '', tipo: 'ASCENSO_MANUAL', motivo: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    tournamentsService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (search.length < 2) return;
    setLoading(true);
    try {
      const data = await categoriasService.buscarJugadores(search);
      setPlayers(data);
    } catch {
      toast.error('Error en búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (playerId: string) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
      return;
    }
    setExpandedPlayer(playerId);
    try {
      const data = await categoriasService.obtenerJugador(playerId);
      setPlayerHistory(data.historial);
    } catch {
      setPlayerHistory([]);
    }
  };

  const handleChangeCategory = async () => {
    if (!changingPlayer || !changeData.nuevaCategoriaId || !changeData.motivo) {
      toast.error('Completá todos los campos');
      return;
    }
    setProcessing(true);
    try {
      await categoriasService.cambiarCategoria(changingPlayer.id, changeData);
      toast.success('Categoría cambiada exitosamente');
      setChangingPlayer(null);
      setChangeData({ nuevaCategoriaId: '', tipo: 'ASCENSO_MANUAL', motivo: '' });
      // Refresh search
      if (search.length >= 2) handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar categoría');
    } finally {
      setProcessing(false);
    }
  };

  const playerCategories = useMemo(() => {
    if (!changingPlayer) return [];
    const generoTipo = changingPlayer.genero;
    return categories.filter((c) => c.tipo === generoTipo).sort((a, b) => b.orden - a.orden);
  }, [changingPlayer, categories]);

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      ASCENSO_AUTOMATICO: 'bg-green-900/30 text-green-400',
      ASCENSO_POR_DEMOSTRACION: 'bg-blue-900/30 text-blue-400',
      ASCENSO_MANUAL: 'bg-yellow-900/30 text-yellow-400',
      DESCENSO_MANUAL: 'bg-red-900/30 text-red-400',
      ASIGNACION_INICIAL: 'bg-dark-surface text-light-secondary',
    };
    const labels: Record<string, string> = {
      ASCENSO_AUTOMATICO: 'Auto',
      ASCENSO_POR_DEMOSTRACION: 'Demostración',
      ASCENSO_MANUAL: 'Manual ↑',
      DESCENSO_MANUAL: 'Manual ↓',
      ASIGNACION_INICIAL: 'Inicial',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[tipo] || 'bg-dark-surface text-light-secondary'}`}>
        {labels[tipo] || tipo}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por cédula o nombre..."
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <Button variant="primary" size="sm" onClick={handleSearch} loading={loading}>
          Buscar
        </Button>
      </div>

      {/* Results */}
      {players.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left">
                  <th className="px-4 py-3 text-light-secondary font-medium">Documento</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Nombre</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Género</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Categoría Actual</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <>
                    <tr key={player.id} className="border-b border-dark-border/50 hover:bg-dark-hover/30">
                      <td className="px-4 py-3 font-mono text-light-text">{player.documento}</td>
                      <td className="px-4 py-3 font-medium text-light-text">
                        {player.nombre} {player.apellido}
                      </td>
                      <td className="px-4 py-3 text-light-secondary">
                        {player.genero === 'MASCULINO' ? '♂ Caballero' : '♀ Dama'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full text-xs font-medium">
                          {player.categoriaActual?.nombre || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setChangingPlayer(player)}
                            className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium hover:bg-yellow-500/30 transition-colors"
                          >
                            Cambiar Categoría
                          </button>
                          <button
                            onClick={() => handleExpand(player.id)}
                            className="px-2 py-1 bg-dark-surface text-light-secondary rounded text-xs hover:bg-dark-hover transition-colors"
                          >
                            {expandedPlayer === player.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedPlayer === player.id && (
                      <tr key={`${player.id}-history`}>
                        <td colSpan={5} className="px-4 py-3 bg-dark-bg/50">
                          <p className="text-xs text-light-secondary mb-2 font-medium">Historial de movimientos:</p>
                          {playerHistory.length === 0 ? (
                            <p className="text-xs text-light-secondary">Sin movimientos registrados</p>
                          ) : (
                            <div className="space-y-1">
                              {playerHistory.slice(0, 10).map((h) => (
                                <div key={h.id} className="flex items-center gap-2 text-xs">
                                  <span className="text-light-secondary w-28">
                                    {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—'}
                                  </span>
                                  {getTipoBadge(h.tipo)}
                                  <span className="text-light-text">{h.motivo}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Change Category Modal */}
      {changingPlayer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4 text-light-text">
              Cambiar Categoría de {changingPlayer.nombre} {changingPlayer.apellido}
            </h3>
            <p className="text-sm text-light-secondary mb-4">
              Categoría actual: <strong className="text-primary-400">{changingPlayer.categoriaActual?.nombre || 'Sin categoría'}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-light-secondary mb-1">Nueva Categoría</label>
                <select
                  value={changeData.nuevaCategoriaId}
                  onChange={(e) => setChangeData({ ...changeData, nuevaCategoriaId: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Seleccionar...</option>
                  {playerCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-light-secondary mb-1">Tipo</label>
                <select
                  value={changeData.tipo}
                  onChange={(e) => setChangeData({ ...changeData, tipo: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="ASCENSO_MANUAL">Ascenso Manual</option>
                  <option value="DESCENSO_MANUAL">Descenso Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-light-secondary mb-1">Motivo (requerido)</label>
                <input
                  type="text"
                  value={changeData.motivo}
                  onChange={(e) => setChangeData({ ...changeData, motivo: e.target.value })}
                  placeholder="Ej: Ajuste por nivel demostrado en práctica"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" size="sm" onClick={() => setChangingPlayer(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleChangeCategory}
                loading={processing}
                disabled={!changeData.nuevaCategoriaId || !changeData.motivo}
              >
                Confirmar Cambio
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB 3: HISTORIAL DE MOVIMIENTOS
// ═══════════════════════════════════════════

function HistorialTab() {
  const [historial, setHistorial] = useState<HistorialCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadHistorial();
    tournamentsService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const loadHistorial = async () => {
    try {
      const params: any = {};
      if (filterTipo) params.tipo = filterTipo;
      const data = await categoriasService.getHistorial(params);
      setHistorial(data);
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistorial();
  }, [filterTipo]);

  const getCategoryName = (catId?: string | null) => {
    if (!catId) return '—';
    const cat = categories.find((c) => c.id === catId);
    return cat?.nombre || catId.slice(0, 8);
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      ASCENSO_AUTOMATICO: 'bg-green-900/30 text-green-400',
      ASCENSO_POR_DEMOSTRACION: 'bg-blue-900/30 text-blue-400',
      ASCENSO_MANUAL: 'bg-yellow-900/30 text-yellow-400',
      DESCENSO_MANUAL: 'bg-red-900/30 text-red-400',
      ASIGNACION_INICIAL: 'bg-dark-surface text-light-secondary',
    };
    const labels: Record<string, string> = {
      ASCENSO_AUTOMATICO: 'Automático',
      ASCENSO_POR_DEMOSTRACION: 'Demostración',
      ASCENSO_MANUAL: 'Manual ↑',
      DESCENSO_MANUAL: 'Manual ↓',
      ASIGNACION_INICIAL: 'Inicial',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[tipo] || ''}`}>
        {labels[tipo] || tipo}
      </span>
    );
  };

  const filteredHistorial = useMemo(() => {
    if (!filterSearch.trim()) return historial;
    const s = filterSearch.toLowerCase();
    return historial.filter((h) => {
      const nombre = `${h.user?.nombre || ''} ${h.user?.apellido || ''}`.toLowerCase();
      const doc = h.user?.documento?.toLowerCase() || '';
      return nombre.includes(s) || doc.includes(s);
    });
  }, [historial, filterSearch]);

  if (loading) return <Loading size="lg" text="Cargando historial..." />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-secondary" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Buscar por nombre o cédula..."
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Todos los tipos</option>
          <option value="ASCENSO_AUTOMATICO">Automático</option>
          <option value="ASCENSO_POR_DEMOSTRACION">Demostración</option>
          <option value="ASCENSO_MANUAL">Manual ↑</option>
          <option value="DESCENSO_MANUAL">Manual ↓</option>
          <option value="ASIGNACION_INICIAL">Inicial</option>
        </select>
      </div>

      {/* Table */}
      {filteredHistorial.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-light-secondary">No hay movimientos registrados</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left">
                  <th className="px-4 py-3 text-light-secondary font-medium">Fecha</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Jugador</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Anterior → Nueva</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Tipo</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistorial.map((h) => (
                  <tr key={h.id} className="border-b border-dark-border/50 hover:bg-dark-hover/30">
                    <td className="px-4 py-3 text-light-secondary text-xs">
                      {h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-light-text">
                        {h.user?.nombre} {h.user?.apellido}
                      </div>
                      <div className="text-xs text-light-secondary">{h.user?.documento}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-light-secondary">{getCategoryName(h.categoriaAnteriorId)}</span>
                      <span className="mx-1 text-light-secondary">→</span>
                      <span className="text-green-400 font-medium">{getCategoryName(h.categoriaNuevaId)}</span>
                    </td>
                    <td className="px-4 py-3">{getTipoBadge(h.tipo)}</td>
                    <td className="px-4 py-3 text-light-secondary text-xs max-w-[200px] truncate">
                      {h.motivo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default AdminCategoriasPage;

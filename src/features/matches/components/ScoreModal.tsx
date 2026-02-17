import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Match, CargarResultadoDto } from '@/types';
import { MatchStatus } from '@/types';
import { usePadelScoring } from '../hooks/usePadelScoring';
import matchesService from '@/services/matchesService';
import { useAuthStore } from '@/store/authStore';
import { Crown, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

const getParejaLabel = (match: Match, num: 1 | 2): string => {
  const pareja = num === 1 ? match.pareja1 : match.pareja2;
  if (!pareja) return 'TBD';
  const j1 = pareja.jugador1;
  const j2 = pareja.jugador2;
  if (!j1) return 'TBD';
  const n1 = `${j1.nombre?.charAt(0)}. ${j1.apellido}`;
  const n2 = j2 ? `${j2.nombre?.charAt(0)}. ${j2.apellido}` : 'TBD';
  return `${n1} / ${n2}`;
};

/** Valida un set normal de pádel. Retorna null si OK, string con error si inválido. */
const validarSetNormal = (p1: number, p2: number): string | null => {
  if (p1 === 6 && p2 <= 4) return null;
  if (p2 === 6 && p1 <= 4) return null;
  if (p1 === 7 && (p2 === 5 || p2 === 6)) return null;
  if (p2 === 7 && (p1 === 5 || p1 === 6)) return null;
  // Specific error messages
  if (p1 === 7 && p2 === 7) return 'No puede ser 7-7. Si van 6-6, se juega tie-break y el ganador queda 7-6.';
  if ((p1 > 7 || p2 > 7)) return 'Máximo 7 games en un set.';
  if (p1 === p2) return 'Un set no puede terminar empatado.';
  if (p1 < 6 && p2 < 6) return 'Al menos una pareja debe llegar a 6 games.';
  return 'Marcador inválido. Resultados válidos: 6-0 a 6-4, 7-5, 7-6.';
};

/** Valida super tie-break (a 10, diferencia 2) */
const validarSuperTieBreak = (p1: number, p2: number): string | null => {
  const max = Math.max(p1, p2);
  const diff = Math.abs(p1 - p2);
  if (max < 10) return 'Al menos uno debe llegar a 10 puntos.';
  if (diff < 2) return 'Debe haber diferencia de al menos 2 puntos.';
  return null;
};

const ROUND_LABELS: Record<string, string> = {
  ACOMODACION_1: 'Acomodación 1',
  ACOMODACION_2: 'Acomodación 2',
  DIECISEISAVOS: 'Dieciseisavos',
  OCTAVOS: 'Octavos',
  CUARTOS: 'Cuartos',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
};

// ═══════════════════════════════════════════════════════
// SCORE MODAL
// ═══════════════════════════════════════════════════════

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onResultSaved: (result?: { categoriaCompleta?: boolean }) => void;
}

type TabMode = 'directo' | 'arbitraje';

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  match,
  onResultSaved,
}) => {
  const { user, hasRole } = useAuthStore();
  const isPremium = user?.esPremium || hasRole('admin');
  const [activeTab, setActiveTab] = useState<TabMode>('directo');
  const [loading, setLoading] = useState(false);

  const isEditing = match.estado === MatchStatus.FINALIZADO;
  const roundLabel = ROUND_LABELS[match.ronda] || match.ronda.replace('RONDA_', 'Ronda ');
  const pareja1Label = getParejaLabel(match, 1);
  const pareja2Label = getParejaLabel(match, 2);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEditing ? 'Editar' : 'Cargar'} Resultado — ${roundLabel}`}
      size="xl"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-dark-surface rounded-lg p-1">
        <button
          onClick={() => setActiveTab('directo')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'directo'
              ? 'bg-primary-500 text-white'
              : 'text-light-secondary hover:text-light-text'
          }`}
        >
          Resultado Directo
        </button>
        <button
          onClick={() => isPremium && setActiveTab('arbitraje')}
          disabled={!isPremium}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'arbitraje'
              ? 'bg-primary-500 text-white'
              : !isPremium
              ? 'text-light-secondary/50 cursor-not-allowed'
              : 'text-light-secondary hover:text-light-text'
          }`}
        >
          Arbitraje en Vivo
          {!isPremium && <Crown className="inline h-3 w-3 ml-1 text-yellow-400" />}
        </button>
      </div>

      {/* Parejas header */}
      <div className="flex justify-between items-center mb-4 px-1 sm:px-2 gap-2">
        <div className="text-xs sm:text-sm font-medium text-light-text truncate min-w-0">{pareja1Label}</div>
        <span className="text-xs text-light-secondary flex-shrink-0">vs</span>
        <div className="text-xs sm:text-sm font-medium text-light-text truncate min-w-0 text-right">{pareja2Label}</div>
      </div>

      {/* Editing warning */}
      {isEditing && (
        <div className="flex items-center gap-2 p-2.5 mb-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
          <span className="text-xs text-yellow-300">Editando resultado existente. El avance del ganador se recalculará.</span>
        </div>
      )}

      {activeTab === 'directo' ? (
        <DirectTab
          match={match}
          pareja1Label={pareja1Label}
          pareja2Label={pareja2Label}
          loading={loading}
          setLoading={setLoading}
          onResultSaved={onResultSaved}
          onClose={onClose}
          isEditing={isEditing}
        />
      ) : (
        <ArbitrajeTab
          match={match}
          pareja1Label={pareja1Label}
          pareja2Label={pareja2Label}
          loading={loading}
          setLoading={setLoading}
          onResultSaved={onResultSaved}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════
// TAB: RESULTADO DIRECTO
// ═══════════════════════════════════════════════════════

interface DirectTabProps {
  match: Match;
  pareja1Label: string;
  pareja2Label: string;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onResultSaved: (result?: { categoriaCompleta?: boolean }) => void;
  onClose: () => void;
  isEditing?: boolean;
}

const DirectTab: React.FC<DirectTabProps> = ({
  match,
  pareja1Label,
  pareja2Label,
  loading,
  setLoading,
  onResultSaved,
  onClose,
  isEditing = false,
}) => {
  const isSemiFinal = ['SEMIFINAL', 'FINAL'].includes(match.ronda);

  // Pre-populate with existing values when editing
  const [set1P1, setSet1P1] = useState<string>(isEditing && match.set1Pareja1 != null ? String(match.set1Pareja1) : '');
  const [set1P2, setSet1P2] = useState<string>(isEditing && match.set1Pareja2 != null ? String(match.set1Pareja2) : '');
  const [set2P1, setSet2P1] = useState<string>(isEditing && match.set2Pareja1 != null ? String(match.set2Pareja1) : '');
  const [set2P2, setSet2P2] = useState<string>(isEditing && match.set2Pareja2 != null ? String(match.set2Pareja2) : '');
  const [set3P1, setSet3P1] = useState<string>(isEditing && match.set3Pareja1 != null ? String(match.set3Pareja1) : '');
  const [set3P2, setSet3P2] = useState<string>(isEditing && match.set3Pareja2 != null ? String(match.set3Pareja2) : '');
  const [esWalkOver, setEsWalkOver] = useState(isEditing && match.estado === 'WO');
  const [esRetiro, setEsRetiro] = useState(isEditing && match.observaciones?.includes('Retiro'));
  const [parejaGanadoraId, setParejaGanadoraId] = useState<string>(isEditing && match.parejaGanadoraId ? match.parejaGanadoraId : '');
  const [observaciones, setObservaciones] = useState(isEditing && match.observaciones ? match.observaciones : '');

  // Determinar si necesita set 3
  const set1Winner = set1P1 && set1P2 ? (Number(set1P1) > Number(set1P2) ? 1 : 2) : null;
  const set2Winner = set2P1 && set2P2 ? (Number(set2P1) > Number(set2P2) ? 1 : 2) : null;
  const needsSet3 = set1Winner !== null && set2Winner !== null && set1Winner !== set2Winner;

  // ── Inline score validation ──
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (esWalkOver || esRetiro) return errors;

    const s1p1 = Number(set1P1);
    const s1p2 = Number(set1P2);
    const s2p1 = Number(set2P1);
    const s2p2 = Number(set2P2);
    const s3p1 = Number(set3P1);
    const s3p2 = Number(set3P2);

    // Validate set 1
    if (set1P1 !== '' && set1P2 !== '') {
      const err = validarSetNormal(s1p1, s1p2);
      if (err) errors.push(`Set 1: ${err}`);
    }

    // Validate set 2
    if (set2P1 !== '' && set2P2 !== '') {
      const err = validarSetNormal(s2p1, s2p2);
      if (err) errors.push(`Set 2: ${err}`);
    }

    // Validate set 3 / STB
    if (needsSet3 && set3P1 !== '' && set3P2 !== '') {
      if (isSemiFinal) {
        const err = validarSetNormal(s3p1, s3p2);
        if (err) errors.push(`Set 3: ${err}`);
      } else {
        const err = validarSuperTieBreak(s3p1, s3p2);
        if (err) errors.push(`STB: ${err}`);
      }
    }

    return errors;
  }, [set1P1, set1P2, set2P1, set2P2, set3P1, set3P2, needsSet3, isSemiFinal, esWalkOver, esRetiro]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const dto: CargarResultadoDto = {
        esWalkOver,
        esRetiro,
        observaciones: observaciones || undefined,
      };

      if (esWalkOver || esRetiro) {
        if (!parejaGanadoraId) {
          toast.error('Selecciona la pareja ganadora');
          return;
        }
        dto.parejaGanadoraId = parejaGanadoraId;

        // Si es retiro, incluir sets parciales si los hay
        if (esRetiro) {
          if (set1P1) dto.set1Pareja1 = Number(set1P1);
          if (set1P2) dto.set1Pareja2 = Number(set1P2);
          if (set2P1) dto.set2Pareja1 = Number(set2P1);
          if (set2P2) dto.set2Pareja2 = Number(set2P2);
          if (set3P1) dto.set3Pareja1 = Number(set3P1);
          if (set3P2) dto.set3Pareja2 = Number(set3P2);
        }
      } else {
        // Resultado normal — validate before sending
        if (!set1P1 || !set1P2 || !set2P1 || !set2P2) {
          toast.error('Completa los sets 1 y 2');
          return;
        }
        if (validationErrors.length > 0) {
          toast.error(validationErrors[0]);
          return;
        }
        dto.set1Pareja1 = Number(set1P1);
        dto.set1Pareja2 = Number(set1P2);
        dto.set2Pareja1 = Number(set2P1);
        dto.set2Pareja2 = Number(set2P2);

        if (needsSet3) {
          if (!set3P1 || !set3P2) {
            toast.error('Completa el set 3 / super tie-break');
            return;
          }
          dto.set3Pareja1 = Number(set3P1);
          dto.set3Pareja2 = Number(set3P2);
        }
      }

      let result;
      if (isEditing) {
        result = await matchesService.editarResultado(match.id, dto);
        toast.success('Resultado editado exitosamente');
      } else {
        result = await matchesService.cargarResultado(match.id, dto);
        toast.success('Resultado cargado exitosamente');
      }
      onResultSaved(result);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al cargar resultado');
    } finally {
      setLoading(false);
    }
  };

  // Input style matching the scoreboard aesthetic
  const cellInput = "w-full py-1.5 sm:py-2 rounded-md bg-dark-bg border border-dark-border text-center font-mono text-base sm:text-lg font-bold text-light-text focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]";

  return (
    <div className="space-y-4">
      {/* Scoreboard-style grid */}
      {!esWalkOver && (
        <div className="bg-dark-surface rounded-lg p-3 sm:p-4">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_repeat(2,44px)_44px] sm:grid-cols-[1fr_repeat(2,56px)_56px] gap-1.5 sm:gap-2 items-center mb-2">
            <div></div>
            <div className="text-[10px] sm:text-xs text-center text-light-secondary font-medium">S1</div>
            <div className="text-[10px] sm:text-xs text-center text-light-secondary font-medium">S2</div>
            <div className="text-[10px] sm:text-xs text-center text-light-secondary font-medium">
              {needsSet3 ? (isSemiFinal ? 'S3' : 'STB') : 'S3'}
            </div>
          </div>

          {/* Pareja 1 row */}
          <div className="grid grid-cols-[1fr_repeat(2,44px)_44px] sm:grid-cols-[1fr_repeat(2,56px)_56px] gap-1.5 sm:gap-2 items-center py-1.5 sm:py-2 border-b border-dark-border">
            <div className="text-xs sm:text-sm font-medium text-light-text truncate pr-1">
              {pareja1Label}
            </div>
            <input type="number" min="0" max="7" value={set1P1} onChange={(e) => setSet1P1(e.target.value)} className={cellInput} />
            <input type="number" min="0" max="7" value={set2P1} onChange={(e) => setSet2P1(e.target.value)} className={cellInput} />
            {needsSet3 ? (
              <input type="number" min="0" max={isSemiFinal ? 7 : 99} value={set3P1} onChange={(e) => setSet3P1(e.target.value)} className={cellInput} />
            ) : (
              <div className="text-center font-mono text-base sm:text-lg font-bold text-dark-border">-</div>
            )}
          </div>

          {/* Pareja 2 row */}
          <div className="grid grid-cols-[1fr_repeat(2,44px)_44px] sm:grid-cols-[1fr_repeat(2,56px)_56px] gap-1.5 sm:gap-2 items-center py-1.5 sm:py-2">
            <div className="text-xs sm:text-sm font-medium text-light-text truncate pr-1">
              {pareja2Label}
            </div>
            <input type="number" min="0" max="7" value={set1P2} onChange={(e) => setSet1P2(e.target.value)} className={cellInput} />
            <input type="number" min="0" max="7" value={set2P2} onChange={(e) => setSet2P2(e.target.value)} className={cellInput} />
            {needsSet3 ? (
              <input type="number" min="0" max={isSemiFinal ? 7 : 99} value={set3P2} onChange={(e) => setSet3P2(e.target.value)} className={cellInput} />
            ) : (
              <div className="text-center font-mono text-base sm:text-lg font-bold text-dark-border">-</div>
            )}
          </div>
        </div>
      )}

      {/* Tip for set 3 */}
      {needsSet3 && !isSemiFinal && !esWalkOver && (
        <p className="text-xs text-light-secondary px-1">
          Super tie-break: primero a 10 puntos con diferencia de 2.
        </p>
      )}

      {/* WO / Retiro toggle pills */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setEsWalkOver(!esWalkOver);
            if (!esWalkOver) setEsRetiro(false);
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
            esWalkOver
              ? 'border-amber-500 bg-amber-500/20 text-amber-300'
              : 'border-dark-border bg-dark-surface text-light-secondary hover:border-dark-border/80'
          }`}
        >
          Walk Over
        </button>
        <button
          onClick={() => {
            setEsRetiro(!esRetiro);
            if (!esRetiro) setEsWalkOver(false);
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
            esRetiro
              ? 'border-amber-500 bg-amber-500/20 text-amber-300'
              : 'border-dark-border bg-dark-surface text-light-secondary hover:border-dark-border/80'
          }`}
        >
          Retiro / Lesión
        </button>
      </div>

      {/* Winner selector (WO/Retiro) */}
      {(esWalkOver || esRetiro) && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-light-secondary">Pareja Ganadora</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setParejaGanadoraId(match.pareja1Id || '')}
              className={`py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                parejaGanadoraId === match.pareja1Id
                  ? 'bg-blue-600 text-white'
                  : 'border border-dark-border bg-dark-surface text-light-secondary hover:bg-dark-hover'
              }`}
            >
              {pareja1Label}
            </button>
            <button
              onClick={() => setParejaGanadoraId(match.pareja2Id || '')}
              className={`py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                parejaGanadoraId === match.pareja2Id
                  ? 'bg-red-600 text-white'
                  : 'border border-dark-border bg-dark-surface text-light-secondary hover:bg-dark-hover'
              }`}
            >
              {pareja2Label}
            </button>
          </div>
        </div>
      )}

      {/* Observaciones */}
      {(esRetiro || esWalkOver) && (
        <div>
          <label className="text-xs font-medium text-light-secondary block mb-1">
            Observaciones
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder={esRetiro ? 'Ej: Retiro por lesión de rodilla' : 'Opcional'}
            className="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-light-text placeholder:text-light-secondary/50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && !esWalkOver && !esRetiro && (
        <div className="space-y-1 p-2.5 bg-red-900/20 border border-red-600/30 rounded-lg">
          {validationErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={loading || (validationErrors.length > 0 && !esWalkOver && !esRetiro)}
        className="w-full"
        variant="primary"
      >
        {loading ? 'Cargando...' : isEditing ? 'Guardar Cambios' : 'Cargar Resultado'}
      </Button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// TAB: ARBITRAJE EN VIVO
// ═══════════════════════════════════════════════════════

interface ArbitrajeTabProps {
  match: Match;
  pareja1Label: string;
  pareja2Label: string;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onResultSaved: () => void;
  onClose: () => void;
}

const ArbitrajeTab: React.FC<ArbitrajeTabProps> = ({
  match,
  pareja1Label,
  pareja2Label,
  loading,
  setLoading,
  onResultSaved,
  onClose,
}) => {
  const scoring = usePadelScoring(match);
  const { state, addPoint, undoLastPoint, getPointDisplay, getSetScores, reset } = scoring;

  const handleConfirmResult = async () => {
    const scores = getSetScores();
    if (!scores) return;

    try {
      setLoading(true);

      const dto: CargarResultadoDto = {
        set1Pareja1: scores.set1P1,
        set1Pareja2: scores.set1P2,
        set2Pareja1: scores.set2P1,
        set2Pareja2: scores.set2P2,
        set3Pareja1: scores.set3P1,
        set3Pareja2: scores.set3P2,
        esWalkOver: false,
      };

      await matchesService.cargarResultado(match.id, dto);
      toast.success('Resultado confirmado exitosamente');
      onResultSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al confirmar resultado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Scoreboard: sets completados */}
      <div className="bg-dark-surface rounded-lg p-3 sm:p-4">
        {/* Header con labels de set */}
        <div className="grid grid-cols-[1fr_repeat(3,36px)_48px] sm:grid-cols-[1fr_repeat(3,48px)_60px] gap-1.5 sm:gap-2 items-center mb-2">
          <div></div>
          <div className="text-[10px] sm:text-xs text-center text-light-secondary font-medium">S1</div>
          <div className="text-[10px] sm:text-xs text-center text-light-secondary font-medium">S2</div>
          <div className="text-[10px] sm:text-xs text-center text-light-secondary font-medium">
            {state.isSuperTieBreak ? 'STB' : 'S3'}
          </div>
          <div className="text-[10px] sm:text-xs text-center text-light-secondary font-medium">Pts</div>
        </div>

        {/* Pareja 1 row */}
        <div className="grid grid-cols-[1fr_repeat(3,36px)_48px] sm:grid-cols-[1fr_repeat(3,48px)_60px] gap-1.5 sm:gap-2 items-center py-1.5 sm:py-2 border-b border-dark-border">
          <div className="text-xs sm:text-sm font-medium text-light-text truncate pr-1">
            {state.winner === 1 && <span className="text-green-400 mr-1">✓</span>}
            {pareja1Label}
          </div>
          {[0, 1, 2].map((setIdx) => (
            <div
              key={setIdx}
              className={`text-center font-mono text-base sm:text-lg font-bold ${
                state.sets[setIdx].isComplete
                  ? state.sets[setIdx].winnerId === 1
                    ? 'text-green-400'
                    : 'text-light-secondary'
                  : setIdx === state.currentSetIndex
                  ? 'text-primary-400'
                  : 'text-dark-border'
              }`}
            >
              {state.sets[setIdx].isComplete || setIdx === state.currentSetIndex
                ? state.sets[setIdx].gamesP1
                : '-'}
            </div>
          ))}
          <div className="text-center font-mono text-lg sm:text-xl font-bold text-primary-300">
            {!state.isFinished ? getPointDisplay(1) : '-'}
          </div>
        </div>

        {/* Pareja 2 row */}
        <div className="grid grid-cols-[1fr_repeat(3,36px)_48px] sm:grid-cols-[1fr_repeat(3,48px)_60px] gap-1.5 sm:gap-2 items-center py-1.5 sm:py-2">
          <div className="text-xs sm:text-sm font-medium text-light-text truncate pr-1">
            {state.winner === 2 && <span className="text-green-400 mr-1">✓</span>}
            {pareja2Label}
          </div>
          {[0, 1, 2].map((setIdx) => (
            <div
              key={setIdx}
              className={`text-center font-mono text-base sm:text-lg font-bold ${
                state.sets[setIdx].isComplete
                  ? state.sets[setIdx].winnerId === 2
                    ? 'text-green-400'
                    : 'text-light-secondary'
                  : setIdx === state.currentSetIndex
                  ? 'text-primary-400'
                  : 'text-dark-border'
              }`}
            >
              {state.sets[setIdx].isComplete || setIdx === state.currentSetIndex
                ? state.sets[setIdx].gamesP2
                : '-'}
            </div>
          ))}
          <div className="text-center font-mono text-lg sm:text-xl font-bold text-primary-300">
            {!state.isFinished ? getPointDisplay(2) : '-'}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="text-center text-xs text-light-secondary">
        {state.isFinished ? (
          <span className="text-green-400 font-medium">
            Partido terminado — {state.winner === 1 ? pareja1Label : pareja2Label} gana
          </span>
        ) : state.isSuperTieBreak ? (
          <span className="text-yellow-400">Super Tie-Break en curso</span>
        ) : state.isTieBreak ? (
          <span className="text-yellow-400">Tie-Break en curso</span>
        ) : (
          <span>
            Set {state.currentSetIndex + 1} — Game en curso
            {state.currentSetIndex === 2 && !scoring.isSemiFinalOrFinal && ' (Super Tie-Break)'}
          </span>
        )}
      </div>

      {/* Point buttons */}
      {!state.isFinished ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={() => addPoint(1)}
            className="py-3 sm:py-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors active:scale-95"
          >
            + Punto
            <br />
            <span className="text-[10px] sm:text-xs opacity-80 truncate block px-1">{pareja1Label}</span>
          </button>
          <button
            onClick={() => addPoint(2)}
            className="py-3 sm:py-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors active:scale-95"
          >
            + Punto
            <br />
            <span className="text-[10px] sm:text-xs opacity-80 truncate block px-1">{pareja2Label}</span>
          </button>
        </div>
      ) : (
        <Button
          onClick={handleConfirmResult}
          disabled={loading}
          className="w-full"
          variant="primary"
        >
          {loading ? 'Confirmando...' : '✓ Confirmar Resultado'}
        </Button>
      )}

      {/* Undo + Reset */}
      <div className="flex gap-2">
        <button
          onClick={undoLastPoint}
          disabled={state.history.length === 0}
          className="flex-1 py-2 rounded-lg text-sm text-light-secondary border border-dark-border hover:bg-dark-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ↩ Deshacer
        </button>
        <button
          onClick={reset}
          className="py-2 px-4 rounded-lg text-sm text-red-400 border border-dark-border hover:bg-dark-surface transition-colors"
        >
          Reiniciar
        </button>
      </div>

      {/* Point count */}
      <div className="text-center text-xs text-light-secondary/50">
        {state.history.length} puntos jugados
      </div>
    </div>
  );
};

export default ScoreModal;

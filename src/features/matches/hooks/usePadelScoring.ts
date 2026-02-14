import { useState, useCallback, useMemo } from 'react';
import type { Match } from '@/types';

// ═══════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════

interface SetScore {
  gamesP1: number;
  gamesP2: number;
  /** Tie-break points (only when games are 6-6) */
  tieBreakP1: number;
  tieBreakP2: number;
  isComplete: boolean;
  winnerId: 1 | 2 | null;
}

interface PointEvent {
  type: 'point';
  pareja: 1 | 2;
  /** Snapshot del estado ANTES del punto (para undo) */
  snapshot: ScoringSnapshot;
}

interface ScoringSnapshot {
  sets: SetScore[];
  currentSetIndex: number;
  pointsP1: number;
  pointsP2: number;
  isTieBreak: boolean;
  isSuperTieBreak: boolean;
  isFinished: boolean;
}

export interface PadelScoringState {
  sets: SetScore[];
  currentSetIndex: number;
  /** Puntos del game actual: representación numérica interna (0,1,2,3 = 0,15,30,40) */
  pointsP1: number;
  pointsP2: number;
  /** Tie-break en curso (6-6 en set) */
  isTieBreak: boolean;
  /** Super tie-break (set 3 en rondas normales) */
  isSuperTieBreak: boolean;
  /** Partido terminado */
  isFinished: boolean;
  /** ID de pareja ganadora (1 o 2) */
  winner: 1 | 2 | null;
  /** History para undo */
  history: PointEvent[];
}

interface SetScoresResult {
  set1P1: number;
  set1P2: number;
  set2P1: number;
  set2P2: number;
  set3P1?: number;
  set3P2?: number;
}

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const POINT_LABELS = ['0', '15', '30', '40'];

// ═══════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════

export function usePadelScoring(match: Match) {
  const isSemiFinalOrFinal = useMemo(
    () => ['SEMIFINAL', 'FINAL'].includes(match.ronda),
    [match.ronda],
  );

  /** Máximo de sets: 3 para semi/final, 2 + super tie-break para el resto */
  const maxSets = isSemiFinalOrFinal ? 3 : 3; // Siempre 3 slots, pero set 3 puede ser STB

  const createEmptySet = (): SetScore => ({
    gamesP1: 0,
    gamesP2: 0,
    tieBreakP1: 0,
    tieBreakP2: 0,
    isComplete: false,
    winnerId: null,
  });

  const [state, setState] = useState<PadelScoringState>({
    sets: [createEmptySet(), createEmptySet(), createEmptySet()],
    currentSetIndex: 0,
    pointsP1: 0,
    pointsP2: 0,
    isTieBreak: false,
    isSuperTieBreak: false,
    isFinished: false,
    winner: null,
    history: [],
  });

  // ─────────────────────────────────────────────────────
  // DISPLAY HELPERS
  // ─────────────────────────────────────────────────────

  /** Obtener label del punto actual para display */
  const getPointDisplay = useCallback(
    (pareja: 1 | 2): string => {
      if (state.isFinished) return '-';

      const { isTieBreak, isSuperTieBreak, pointsP1, pointsP2 } = state;

      if (isTieBreak || isSuperTieBreak) {
        return String(pareja === 1 ? pointsP1 : pointsP2);
      }

      const pts = pareja === 1 ? pointsP1 : pointsP2;
      const otherPts = pareja === 1 ? pointsP2 : pointsP1;

      // Punto de oro: 40-40 → "PO"
      if (pts >= 3 && otherPts >= 3) {
        return 'PO';
      }

      return POINT_LABELS[Math.min(pts, 3)] || String(pts);
    },
    [state],
  );

  // ─────────────────────────────────────────────────────
  // CORE SCORING LOGIC
  // ─────────────────────────────────────────────────────

  const addPoint = useCallback(
    (pareja: 1 | 2) => {
      if (state.isFinished) return;

      setState((prev) => {
        // Guardar snapshot para undo
        const snapshot: ScoringSnapshot = {
          sets: prev.sets.map((s) => ({ ...s })),
          currentSetIndex: prev.currentSetIndex,
          pointsP1: prev.pointsP1,
          pointsP2: prev.pointsP2,
          isTieBreak: prev.isTieBreak,
          isSuperTieBreak: prev.isSuperTieBreak,
          isFinished: prev.isFinished,
        };

        const newHistory = [...prev.history, { type: 'point' as const, pareja, snapshot }];
        const newSets = prev.sets.map((s) => ({ ...s }));
        let { currentSetIndex, pointsP1, pointsP2, isTieBreak, isSuperTieBreak, isFinished } = prev;
        let winner: 1 | 2 | null = prev.winner;

        // ── SUPER TIE-BREAK ──
        if (isSuperTieBreak) {
          if (pareja === 1) pointsP1++;
          else pointsP2++;

          // Check win: primero a 10, diferencia 2
          const max = Math.max(pointsP1, pointsP2);
          const diff = Math.abs(pointsP1 - pointsP2);
          if (max >= 10 && diff >= 2) {
            const stbWinner: 1 | 2 = pointsP1 > pointsP2 ? 1 : 2;
            newSets[currentSetIndex].gamesP1 = pointsP1;
            newSets[currentSetIndex].gamesP2 = pointsP2;
            newSets[currentSetIndex].isComplete = true;
            newSets[currentSetIndex].winnerId = stbWinner;
            isFinished = true;
            winner = stbWinner;

            // Contar sets ganados para determinar ganador final
            const setsP1 = newSets.filter((s) => s.winnerId === 1).length;
            const setsP2 = newSets.filter((s) => s.winnerId === 2).length;
            winner = setsP1 > setsP2 ? 1 : 2;
          }

          return { sets: newSets, currentSetIndex, pointsP1, pointsP2, isTieBreak, isSuperTieBreak, isFinished, winner, history: newHistory };
        }

        // ── TIE-BREAK (6-6) ──
        if (isTieBreak) {
          if (pareja === 1) pointsP1++;
          else pointsP2++;

          // Check win: primero a 7, diferencia 2
          const max = Math.max(pointsP1, pointsP2);
          const diff = Math.abs(pointsP1 - pointsP2);
          if (max >= 7 && diff >= 2) {
            const tbWinner: 1 | 2 = pointsP1 > pointsP2 ? 1 : 2;
            // El tie-break vale 1 game
            if (tbWinner === 1) {
              newSets[currentSetIndex].gamesP1 = 7;
              newSets[currentSetIndex].gamesP2 = 6;
            } else {
              newSets[currentSetIndex].gamesP1 = 6;
              newSets[currentSetIndex].gamesP2 = 7;
            }
            newSets[currentSetIndex].tieBreakP1 = pareja === 1 ? pointsP1 : pointsP1;
            newSets[currentSetIndex].tieBreakP2 = pareja === 2 ? pointsP2 : pointsP2;
            newSets[currentSetIndex].isComplete = true;
            newSets[currentSetIndex].winnerId = tbWinner;

            // Reset para siguiente set
            pointsP1 = 0;
            pointsP2 = 0;
            isTieBreak = false;

            // Check si terminó el match
            const setsP1 = newSets.filter((s) => s.winnerId === 1).length;
            const setsP2 = newSets.filter((s) => s.winnerId === 2).length;
            const setsNeeded = isSemiFinalOrFinal ? 2 : 2;

            if (setsP1 >= setsNeeded || setsP2 >= setsNeeded) {
              isFinished = true;
              winner = setsP1 >= setsNeeded ? 1 : 2;
            } else if (setsP1 === 1 && setsP2 === 1 && !isSemiFinalOrFinal) {
              // 1-1 en rondas normales → super tie-break
              currentSetIndex++;
              isSuperTieBreak = true;
              pointsP1 = 0;
              pointsP2 = 0;
            } else {
              currentSetIndex++;
            }
          }

          return { sets: newSets, currentSetIndex, pointsP1, pointsP2, isTieBreak, isSuperTieBreak, isFinished, winner, history: newHistory };
        }

        // ── GAME NORMAL (punto de oro) ──
        if (pareja === 1) pointsP1++;
        else pointsP2++;

        // Check si alguien ganó el game
        let gameWon = false;
        let gameWinner: 1 | 2 | null = null;

        if (pointsP1 >= 4 || pointsP2 >= 4) {
          // Punto de oro: 40-40 (3-3) → el siguiente punto gana
          if (pointsP1 >= 3 && pointsP2 >= 3) {
            // Ambos en 40+: el que acaba de anotar gana (punto de oro)
            gameWon = true;
            gameWinner = pareja;
          } else if (pointsP1 >= 4 && pointsP2 < 3) {
            gameWon = true;
            gameWinner = 1;
          } else if (pointsP2 >= 4 && pointsP1 < 3) {
            gameWon = true;
            gameWinner = 2;
          }
        }

        if (gameWon && gameWinner) {
          // Sumar game al set actual
          if (gameWinner === 1) newSets[currentSetIndex].gamesP1++;
          else newSets[currentSetIndex].gamesP2++;

          // Reset puntos
          pointsP1 = 0;
          pointsP2 = 0;

          const g1 = newSets[currentSetIndex].gamesP1;
          const g2 = newSets[currentSetIndex].gamesP2;

          // Check si alguien ganó el set
          let setWon = false;
          let setWinner: 1 | 2 | null = null;

          if ((g1 >= 6 || g2 >= 6) && Math.abs(g1 - g2) >= 2) {
            setWon = true;
            setWinner = g1 > g2 ? 1 : 2;
          } else if (g1 === 6 && g2 === 6) {
            // Tie-break
            isTieBreak = true;
          }

          if (setWon && setWinner) {
            newSets[currentSetIndex].isComplete = true;
            newSets[currentSetIndex].winnerId = setWinner;

            // Check si terminó el match
            const setsP1 = newSets.filter((s) => s.winnerId === 1).length;
            const setsP2 = newSets.filter((s) => s.winnerId === 2).length;
            const setsNeeded = isSemiFinalOrFinal ? 2 : 2;

            if (setsP1 >= setsNeeded || setsP2 >= setsNeeded) {
              isFinished = true;
              winner = setsP1 >= setsNeeded ? 1 : 2;
            } else if (setsP1 === 1 && setsP2 === 1 && !isSemiFinalOrFinal) {
              // 1-1 en rondas normales → super tie-break
              currentSetIndex++;
              isSuperTieBreak = true;
              pointsP1 = 0;
              pointsP2 = 0;
            } else {
              currentSetIndex++;
            }
          }
        }

        return { sets: newSets, currentSetIndex, pointsP1, pointsP2, isTieBreak, isSuperTieBreak, isFinished, winner, history: newHistory };
      });
    },
    [state.isFinished, isSemiFinalOrFinal],
  );

  // ─────────────────────────────────────────────────────
  // UNDO
  // ─────────────────────────────────────────────────────

  const undoLastPoint = useCallback(() => {
    setState((prev) => {
      if (prev.history.length === 0) return prev;

      const newHistory = [...prev.history];
      const lastEvent = newHistory.pop()!;
      const snap = lastEvent.snapshot;

      return {
        sets: snap.sets.map((s) => ({ ...s })),
        currentSetIndex: snap.currentSetIndex,
        pointsP1: snap.pointsP1,
        pointsP2: snap.pointsP2,
        isTieBreak: snap.isTieBreak,
        isSuperTieBreak: snap.isSuperTieBreak,
        isFinished: snap.isFinished,
        winner: null,
        history: newHistory,
      };
    });
  }, []);

  // ─────────────────────────────────────────────────────
  // GET SET SCORES (para enviar al backend)
  // ─────────────────────────────────────────────────────

  const getSetScores = useCallback((): SetScoresResult | null => {
    if (!state.isFinished) return null;

    const s = state.sets;
    const result: SetScoresResult = {
      set1P1: s[0].gamesP1,
      set1P2: s[0].gamesP2,
      set2P1: s[1].gamesP1,
      set2P2: s[1].gamesP2,
    };

    if (s[2].isComplete) {
      result.set3P1 = s[2].gamesP1;
      result.set3P2 = s[2].gamesP2;
    }

    return result;
  }, [state.sets, state.isFinished]);

  // ─────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setState({
      sets: [createEmptySet(), createEmptySet(), createEmptySet()],
      currentSetIndex: 0,
      pointsP1: 0,
      pointsP2: 0,
      isTieBreak: false,
      isSuperTieBreak: false,
      isFinished: false,
      winner: null,
      history: [],
    });
  }, []);

  return {
    state,
    addPoint,
    undoLastPoint,
    getSetScores,
    getPointDisplay,
    reset,
    isSemiFinalOrFinal,
    maxSets,
  };
}

export type { SetScoresResult };

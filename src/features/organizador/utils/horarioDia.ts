/**
 * Horario default por TIPO de día — realidad Paraguay.
 * - Días de semana (lun–vie): se trabaja hasta ~17–18h → arranca 18:00.
 * - Fin de semana (sáb–dom): se puede jugar desde la tarde temprano → arranca 14:00.
 *
 * FUENTE ÚNICA: la usan la pantalla "Configurar y sortear" y el botón
 * "Armar automático". Cambiar acá cambia en los dos lados.
 */

export const HORARIO_SEMANA = { horaInicio: '18:00', horaFin: '23:00' };
export const HORARIO_FINDE = { horaInicio: '14:00', horaFin: '23:00' };

/** true si la fecha YYYY-MM-DD cae sábado o domingo (cálculo en UTC para evitar timezone). */
export function esFinDeSemana(fecha: string): boolean {
  const [y, m, d] = fecha.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0=Dom, 6=Sáb
  return dow === 0 || dow === 6;
}

/** Horario sugerido para un día según sea de semana o de fin de semana. */
export function horarioPorTipoDia(fecha: string): { horaInicio: string; horaFin: string } {
  return esFinDeSemana(fecha) ? { ...HORARIO_FINDE } : { ...HORARIO_SEMANA };
}

export function tipoDiaLabel(fecha: string): 'finde' | 'semana' {
  return esFinDeSemana(fecha) ? 'finde' : 'semana';
}

/** Fases del cuadro, en orden, para los chips editables por día. */
export const FASES_BRACKET = [
  'ZONA',
  'REPECHAJE',
  'DIECISEISAVOS',
  'OCTAVOS',
  'CUARTOS',
  'SEMIS',
  'FINAL',
] as const;

const FASE_LABELS: Record<string, string> = {
  ZONA: 'Zona',
  REPECHAJE: 'Repechaje',
  TREINTAYDOSAVOS: '32avos',
  DIECISEISAVOS: '16avos',
  OCTAVOS: 'Octavos',
  CUARTOS: 'Cuartos',
  SEMIS: 'Semis',
  FINAL: 'Final',
};

export function faseLabel(fase: string): string {
  return FASE_LABELS[fase] || fase;
}

/** El back guarda fasesPermitidas como string "ZONA,REPECHAJE". Lo parseamos a array. */
export function parseFases(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

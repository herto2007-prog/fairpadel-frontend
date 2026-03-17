/**
 * Utilidad compartida para obtener los colores de las fases del bracket
 */

export const FASES_ORDENADAS = [
  'ZONA',
  'REPECHAJE', 
  'TREINTAYDOSAVOS',
  'DIECISEISAVOS',
  'OCTAVOS',
  'CUARTOS',
  'SEMIS',
  'FINAL',
] as const;

export type FaseType = typeof FASES_ORDENADAS[number];

export function getColorFase(fase: string): string {
  switch (fase) {
    case 'ZONA':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'REPECHAJE':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'TREINTAYDOSAVOS':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'DIECISEISAVOS':
      return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    case 'OCTAVOS':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'CUARTOS':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    case 'SEMIS':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'FINAL':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

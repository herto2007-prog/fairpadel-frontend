// ═══════════════════════════════════════════════════════
// HOOK - Determinar fase del usuario
// ═══════════════════════════════════════════════════════

import { UserFase } from '../types/dashboard.types';

interface UseUserFaseParams {
  torneosJugados: number;
  diasDesdeRegistro: number;
  seguidores: number;
  torneosUltimos30Dias: number;
  esPremium: boolean;
}

/**
 * Determina la fase del usuario basado en su actividad
 * 
 * NOVATO: 0 torneos y < 7 días registrado
 * ACTIVO: 1-4 torneos o < 5 torneos en últimos 30 días
 * REGULAR: 5+ torneos en últimos 30 días O 10+ seguidores
 * PREMIUM: Usuario con suscripción premium
 */
export function determineUserFase({
  torneosJugados,
  diasDesdeRegistro,
  seguidores,
  torneosUltimos30Dias,
  esPremium,
}: UseUserFaseParams): UserFase {
  // Premium siempre es premium (aunque también caiga en otra categoría)
  if (esPremium) {
    return 'PREMIUM';
  }

  // NOVATO: Nunca ha jugado y es nuevo
  if (torneosJugados === 0 && diasDesdeRegistro < 7) {
    return 'NOVATO';
  }

  // REGULAR: Usuario comprometido
  if (torneosUltimos30Dias >= 5 || seguidores >= 10 || torneosJugados >= 10) {
    return 'REGULAR';
  }

  // ACTIVO: Ha jugado al menos 1 torneo pero no es regular aún
  if (torneosJugados >= 1 || diasDesdeRegistro >= 7) {
    return 'ACTIVO';
  }

  // Default: NOVATO
  return 'NOVATO';
}

/**
 * Verifica si el perfil está completo
 */
export function isPerfilCompleto(perfil: {
  fotoUrl?: string;
  bio?: string;
  ciudad?: string;
}): boolean {
  return !!perfil.fotoUrl && !!perfil.bio && !!perfil.ciudad;
}

/**
 * Genera el checklist de onboarding basado en el estado actual
 */
export function generateChecklist(
  perfil: {
    nombre: string;
    emailVerificado: boolean;
    fotoUrl?: string;
    bio?: string;
  },
  stats: { torneosJugados: number }
): { items: Array<{ id: string; titulo: string; descripcion: string; completado: boolean; link?: string }>; progreso: number } {
  const items = [
    {
      id: 'email',
      titulo: 'Verificar email',
      descripcion: 'Confirma tu dirección de correo',
      completado: perfil.emailVerificado,
      link: '/perfil/verificar-email',
    },
    {
      id: 'foto',
      titulo: 'Subir foto de perfil',
      descripcion: 'Los jugadores confían más en perfiles con foto',
      completado: !!perfil.fotoUrl,
      link: '/perfil',
    },
    {
      id: 'bio',
      titulo: 'Completar biografía',
      descripcion: 'Cuéntanos sobre ti y tu estilo de juego',
      completado: !!perfil.bio,
      link: '/perfil',
    },
    {
      id: 'primer-torneo',
      titulo: 'Inscribirse en primer torneo',
      descripcion: '¡Empieza tu camino en FairPadel!',
      completado: stats.torneosJugados > 0,
      link: '/torneos',
    },
  ];

  const completados = items.filter(i => i.completado).length;
  const progreso = Math.round((completados / items.length) * 100);

  return { items, progreso };
}

/**
 * Formatea mensajes de stats para no mostrar ceros
 */
export function formatStatMensaje(tipo: 'victorias' | 'torneos' | 'efectividad', valor: number): string {
  if (valor === 0) {
    switch (tipo) {
      case 'victorias':
        return 'Tu primera victoria te espera 🏆';
      case 'torneos':
        return 'Inscríbete en tu primer torneo';
      case 'efectividad':
        return 'Comienza tu historial de partidos';
    }
  }

  switch (tipo) {
    case 'victorias':
      return `${valor} victoria${valor > 1 ? 's' : ''}`;
    case 'torneos':
      return `${valor} torneo${valor > 1 ? 's' : ''} jugado${valor > 1 ? 's' : ''}`;
    case 'efectividad':
      return `${valor}% efectividad`;
  }
}

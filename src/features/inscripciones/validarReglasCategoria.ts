// ⚠️ FUENTE DE VERDAD: backend `src/modules/inscripciones/inscripciones-validacion.ts`.
// Este archivo es un PORT VERBATIM de esa función pura para validar en el cliente
// con EXACTAMENTE las mismas reglas que aplica el servidor al confirmar la inscripción.
// Si cambia una regla, cambiala en el backend y copiala acá igual (y su test).

export type GeneroJugador = 'MASCULINO' | 'FEMENINO';

export interface CategoriaRegla {
  orden: number;
  nombre: string;
  tipo: string; // 'MASCULINO' | 'FEMENINO'
}

export interface ResultadoRegla {
  permitido: boolean;
  mensaje: string;
  esCategoriaInferior?: boolean;
  advertencia?: string;
}

/**
 * Valida las reglas de categoría según género y nivel.
 * (Solo STANDARD: MIXTO/SUMAS se validan con la pareja en el backend.)
 */
export function validarReglasCategoria(
  jugadorGenero: GeneroJugador,
  categoriaJugador: CategoriaRegla,
  categoriaTarget: CategoriaRegla,
): ResultadoRegla {
  const ordenJugador = categoriaJugador.orden;
  const ordenTarget = categoriaTarget.orden;
  const esTargetDamas = categoriaTarget.tipo === 'FEMENINO';

  // REGLA 1: Hombres NO pueden en categorías Damas
  if (jugadorGenero === 'MASCULINO' && esTargetDamas) {
    return {
      permitido: false,
      mensaje: 'Los jugadores masculinos no pueden inscribirse en categorías femeninas',
    };
  }

  // REGLA 2: Categoría igual o superior - permitida para todos
  if (ordenTarget <= ordenJugador) {
    return {
      permitido: true,
      mensaje: ordenTarget === ordenJugador
        ? 'Categoría de tu nivel'
        : 'Categoría superior - ¡Desafío aceptado!',
      esCategoriaInferior: false,
    };
  }

  // REGLA 3: Categorías INFERIORES (ordenTarget > ordenJugador)
  // Hombres: NO pueden bajar a inferiores (bajo ninguna circunstancia)
  if (jugadorGenero === 'MASCULINO') {
    return {
      permitido: false,
      mensaje: `No puedes inscribirte en ${categoriaTarget.nombre} siendo ${categoriaJugador.nombre}`,
      esCategoriaInferior: true,
    };
  }

  // Mujeres en categorías Damas (su género): NO pueden bajar
  if (esTargetDamas) {
    return {
      permitido: false,
      mensaje: `No puedes inscribirte en ${categoriaTarget.nombre} siendo ${categoriaJugador.nombre}`,
      esCategoriaInferior: true,
    };
  }

  // Mujeres en categorías Caballeros: SÍ pueden bajar UNA como excepción
  const diferencia = ordenTarget - ordenJugador;
  if (diferencia > 1) {
    return {
      permitido: false,
      mensaje: `Solo puedes bajar UNA categoría como máximo. ${categoriaTarget.nombre} es muy inferior a tu categoría actual.`,
      esCategoriaInferior: true,
    };
  }

  return {
    permitido: true,
    mensaje: 'Categoría permitida (excepción de una categoría inferior)',
    esCategoriaInferior: true,
    advertencia: 'Estás usando tu excepción de bajar una categoría en caballeros. Esta acción solo puede realizarse una vez.',
  };
}

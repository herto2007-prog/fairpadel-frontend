/**
 * Formatea una fecha al formato Paraguay (dd/mm/yyyy)
 */
export function formatDatePY(dateString: string | Date): string {
  if (!dateString) return '-';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formatea fecha y hora al formato Paraguay
 */
export function formatDateTimePY(dateString: string | Date): string {
  if (!dateString) return '-';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea solo la hora
 */
export function formatTime(dateString: string | Date): string {
  if (!dateString) return '-';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleTimeString('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calcula días restantes hasta una fecha
 */
export function getDiasRestantes(dateString: string | Date): number {
  if (!dateString) return 0;
  
  const target = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Formatea días restantes con texto descriptivo
 */
export function formatDiasRestantes(dateString: string | Date): string {
  const dias = getDiasRestantes(dateString);
  
  if (dias < 0) return 'Vencido';
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `${dias} días`;
}

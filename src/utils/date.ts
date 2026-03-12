/**
 * UTILIDADES DE FECHA PARA PARAGUAY
 * 
 * Todas las fechas en el sistema se manejan en hora de Paraguay (UTC-3)
 * Estas funciones aseguran consistencia entre frontend y backend
 */

const TIMEZONE = 'America/Asuncion';
const LOCALE = 'es-PY';

/**
 * Obtiene la fecha/hora actual en Paraguay
 */
export function nowPY(): Date {
  return new Date();
}

/**
 * Formatea una fecha al formato Paraguay (dd/mm/yyyy)
 * Maneja correctamente el timezone de Paraguay
 */
export function formatDatePY(dateString: string | Date): string {
  if (!dateString) return '-';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formatea fecha y hora al formato Paraguay
 * Ejemplo: 12/03/2025 18:30
 */
export function formatDateTimePY(dateString: string | Date): string {
  if (!dateString) return '-';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Formatea solo la hora en formato Paraguay (24h)
 * Ejemplo: 18:30
 */
export function formatTime(dateString: string | Date): string {
  if (!dateString) return '-';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleTimeString(LOCALE, {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Convierte una fecha a string ISO manteniendo la hora de Paraguay
 * Esto es crucial para enviar fechas al backend correctamente
 */
export function toISOStringPY(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Crear fecha interpretando como hora local de Paraguay
  const paraguayString = d.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  return new Date(paraguayString).toISOString();
}

/**
 * Obtiene solo la fecha en formato YYYY-MM-DD para Paraguay
 * Útil para inputs tipo date
 */
export function getDateOnlyPY(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', {
    timeZone: TIMEZONE,
  });
}

/**
 * Obtiene solo la hora en formato HH:mm para Paraguay
 * Útil para inputs tipo time
 */
export function getTimeOnlyPY(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(LOCALE, {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Parsea un string de fecha como hora de Paraguay
 * @param dateString Puede ser ISO, YYYY-MM-DD, o cualquier formato
 * @returns Date en hora de Paraguay
 */
export function parseDatePY(dateString: string): Date {
  // Si es formato YYYY-MM-DD (sin hora), asumir 00:00 Paraguay
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(`${dateString}T00:00:00-03:00`);
  }

  // Si tiene hora, parsear normalmente
  return new Date(dateString);
}

/**
 * Calcula días restantes hasta una fecha
 * Usando hora de Paraguay
 */
export function getDiasRestantes(dateString: string | Date): number {
  if (!dateString) return 0;
  
  const target = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  
  // Normalizar ambas fechas a Paraguay
  const targetPY = new Date(target.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const nowPY = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  
  const diffTime = targetPY.getTime() - nowPY.getTime();
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

/**
 * Genera un rango de fechas entre inicio y fin
 * Todas las fechas son en hora de Paraguay
 */
export function getDatesRangePY(fechaInicio: string, fechaFin: string): { 
  fecha: string; 
  dia: number; 
  num: number; 
  mes: string;
  diaNombre: string;
}[] {
  const fechas: { fecha: string; dia: number; num: number; mes: string; diaNombre: string }[] = [];
  const inicio = parseDatePY(fechaInicio);
  const fin = parseDatePY(fechaFin);
  
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    fechas.push({
      fecha: date.toISOString().split('T')[0],
      dia: date.getDay(),
      num: date.getDate(),
      mes: meses[date.getMonth()],
      diaNombre: diasSemana[date.getDay()],
    });
  }
  
  return fechas;
}

/**
 * Obtiene el nombre del mes en español
 */
export function getMonthNamePY(monthIndex: number): string {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return meses[monthIndex];
}

/**
 * Obtiene el nombre abreviado del mes
 */
export function getMonthShortPY(monthIndex: number): string {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return meses[monthIndex];
}

/**
 * Verifica si una fecha es hoy en Paraguay
 */
export function isTodayPY(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const today = new Date();
  
  const dateStr = date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  const todayStr = today.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  
  return dateStr === todayStr;
}

/**
 * Compara dos fechas (solo la parte de fecha, no hora)
 * Retorna: -1 si date1 < date2, 0 si son iguales, 1 si date1 > date2
 */
export function compareDatesPY(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const str1 = d1.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  const str2 = d2.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  
  if (str1 < str2) return -1;
  if (str1 > str2) return 1;
  return 0;
}

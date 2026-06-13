// Utilidades de fechas. La semana es lunes-viernes (semana laboral).
// Todas las fechas de actividad/venta se normalizan a medianoche local para
// que el agrupado por día y por mes sea estable.

import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  format,
  isWeekend,
  eachDayOfInterval,
  differenceInCalendarDays,
} from "date-fns";

/** Medianoche local del día (para guardar fechas sin hora). */
export function dayStart(d: Date): Date {
  return startOfDay(d);
}

/** "aaaa-mm" de una fecha. */
export function monthKey(d: Date): string {
  return format(d, "yyyy-MM");
}

/** Rango [inicio, fin] del mes que contiene la fecha. */
export function monthRange(d: Date): { start: Date; end: Date } {
  return { start: startOfMonth(d), end: endOfMonth(d) };
}

/** Rango de un mes dado por "aaaa-mm". */
export function monthRangeFromKey(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  const ref = new Date(y, m - 1, 15);
  return monthRange(ref);
}

/** Lunes (inicio) de la semana que contiene la fecha. */
export function weekStart(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

/**
 * Rango lunes-viernes de la semana que contiene la fecha.
 * weekEnd es el viernes a las 23:59:59 (la reunión es el viernes).
 */
export function workWeekRange(d: Date): { start: Date; end: Date } {
  const monday = startOfWeek(d, { weekStartsOn: 1 });
  const friday = addDays(monday, 4);
  return { start: startOfDay(monday), end: endOfDay(friday) };
}

/** Semana natural completa (lunes-domingo). */
export function fullWeekRange(d: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(d, { weekStartsOn: 1 }),
    end: endOfWeek(d, { weekStartsOn: 1 }),
  };
}

/** Día laborable anterior (salta fines de semana). */
export function previousWorkday(d: Date): Date {
  let prev = subDays(startOfDay(d), 1);
  while (isWeekend(prev)) prev = subDays(prev, 1);
  return prev;
}

/** Días laborables (L-V) dentro de un intervalo. */
export function weekdaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d));
}

/** Diferencia en días de calendario (saleDate - leadEntryDate). */
export function daysBetween(later: Date, earlier: Date): number {
  return differenceInCalendarDays(later, earlier);
}

export { isWeekend, addDays, subDays, startOfDay, endOfDay };

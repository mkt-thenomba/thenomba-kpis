// ─────────────────────────────────────────────────────────────────────────
// CÁLCULOS PUROS (sin base de datos) — testeables de forma aislada.
//
// Aquí vive la lógica que materializa la REGLA RECTORA: el total de compañía
// se obtiene contando/sumando ventas reales, nunca atribuciones. Las funciones
// de "compañía" reciben SOLO filas de venta; no existe ninguna firma que
// acepte atribuciones para calcular un total de compañía.
// ─────────────────────────────────────────────────────────────────────────

import { THRESHOLDS } from "@/types/domain";

export type SemaforoEstado = "ok" | "warn" | "bad";

export interface TargetProgress {
  value: number;
  target: number;
  pct: number; // recortado a 100 para la barra
  rawPct: number; // sin recortar
}

export function progress(value: number, target: number): TargetProgress {
  const rawPct = target > 0 ? (value / target) * 100 : 0;
  return { value, target, pct: Math.min(100, rawPct), rawPct };
}

/** Conversión (%) = ventas / contactos. Devuelve 0 si no hay contactos. */
export function conversionPct(sales: number, contacts: number): number {
  return contacts > 0 ? (sales / contacts) * 100 : 0;
}

/** ¿Los últimos `days` valores están TODOS por debajo del umbral? */
export function isSustainedBelow(
  chronological: number[],
  threshold: number,
  days = THRESHOLDS.sustainedDays
): boolean {
  if (chronological.length < days) return false;
  return chronological.slice(-days).every((v) => v < threshold);
}

// ── Compañía: SOLO desde ventas reales ──────────────────────────────────────

export interface SaleLike {
  amount: number;
}

/**
 * Total real de compañía: número de ventas = nº de filas; facturación = suma
 * de importes. NO recibe atribuciones por diseño: es imposible "inflar" el
 * total con ellas.
 */
export function companyTotals(sales: SaleLike[]): {
  salesCount: number;
  revenue: number;
} {
  return {
    salesCount: sales.length,
    revenue: sales.reduce((acc, s) => acc + s.amount, 0),
  };
}

/** Cuenta en cuántas ventas aparece cada touchpoint (presencia única por venta). */
export function touchpointCounts(
  salesTouchpoints: string[][]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tps of salesTouchpoints) {
    for (const tp of Array.from(new Set(tps))) {
      counts.set(tp, (counts.get(tp) ?? 0) + 1);
    }
  }
  return counts;
}

// ── Proyección de cierre de mes ──────────────────────────────────────────────

export interface ProjectionInput {
  revenueSoFar: number;
  salesSoFar: number;
  revenueTarget: number;
  salesTarget: number;
  daysElapsed: number;
  daysInMonth: number;
}

export interface ProjectionResult {
  daysRemaining: number;
  projectedRevenue: number;
  projectedSales: number;
  revenuePerDayNeeded: number;
  salesPerDayNeeded: number;
  onTrack: boolean;
}

export function projectMonth(i: ProjectionInput): ProjectionResult {
  const daysRemaining = Math.max(0, i.daysInMonth - i.daysElapsed);
  const revRate = i.daysElapsed > 0 ? i.revenueSoFar / i.daysElapsed : 0;
  const salesRate = i.daysElapsed > 0 ? i.salesSoFar / i.daysElapsed : 0;
  const projectedRevenue = Math.round(revRate * i.daysInMonth);
  const projectedSales = Math.round(salesRate * i.daysInMonth);
  const revGap = Math.max(0, i.revenueTarget - i.revenueSoFar);
  const salesGap = Math.max(0, i.salesTarget - i.salesSoFar);
  return {
    daysRemaining,
    projectedRevenue,
    projectedSales,
    revenuePerDayNeeded: daysRemaining > 0 ? revGap / daysRemaining : revGap,
    salesPerDayNeeded:
      daysRemaining > 0 ? Math.ceil(salesGap / daysRemaining) : salesGap,
    onTrack: projectedRevenue >= i.revenueTarget,
  };
}

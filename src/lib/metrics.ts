// ─────────────────────────────────────────────────────────────────────────
// CAPA DE CÁLCULO — el corazón del panel.
//
// REGLA RECTORA INVIOLABLE:
//   El total real de ventas de compañía sale SIEMPRE de contar/sumar la
//   tabla Sale (la fuente de verdad). Las atribuciones (attributedJosep,
//   JosepDaily.attributedSales, RodrigoDaily.attributableSales, ...) se
//   solapan entre sí y JAMÁS se suman para obtener el total de compañía.
//
//   → Las funciones de "compañía" leen SOLO Sale.
//   → Las funciones de "atribución" leen las tablas diarias y devuelven
//     siempre valores etiquetados como atribuidos, nunca como total.
//
// Estas funciones son la única vía para obtener totales. Los componentes no
// calculan agregados por su cuenta.
// ─────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db";
import {
  monthKey,
  monthRangeFromKey,
  monthRange,
  workWeekRange,
  weekStart,
  weekdaysInRange,
  endOfDay,
} from "@/lib/dates";
import {
  THRESHOLDS,
  type Touchpoint,
  type EntryChannel,
  type Tramo,
} from "@/types/domain";
import {
  progress,
  isSustainedBelow,
  touchpointCounts,
  projectMonth,
  type SemaforoEstado,
  type TargetProgress,
} from "@/lib/calc";

// Reexporta los tipos puros para que los componentes importen desde metrics.
export type { SemaforoEstado, TargetProgress } from "@/lib/calc";
export { isSustainedBelow } from "@/lib/calc";

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface SemaforoResult {
  estado: SemaforoEstado;
  /** true si el KPI lleva `sustainedDays` por debajo de umbral → aviso de lectura */
  sustained: boolean;
  message?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function decToNum(d: unknown): number {
  return d == null ? 0 : Number(d);
}

/** Semáforo simple: verde si value cumple el mínimo, rojo si no. */
export function semaforo(
  value: number,
  min: number,
  opts: { sustained?: boolean; higherIsBetter?: boolean } = {}
): SemaforoResult {
  const higher = opts.higherIsBetter ?? true;
  const meets = higher ? value >= min : value <= min;
  const estado: SemaforoEstado = meets ? "ok" : "bad";
  return { estado, sustained: opts.sustained ?? false };
}

// ── COMPAÑÍA (fuente de verdad: SOLO Sale) ──────────────────────────────────

export interface CompanyMonth {
  month: string;
  salesCount: number; // nº real de ventas (filas en Sale)
  revenue: number; // facturación acumulada del mes
  salesTarget: number;
  revenueTarget: number;
  salesProgress: TargetProgress;
  revenueProgress: TargetProgress;
}

export async function getCompanyMonth(month: string): Promise<CompanyMonth> {
  const { start, end } = monthRangeFromKey(month);

  // El total REAL sale solo de contar/sumar Sale. Nunca de atribuciones.
  const [agg, target] = await Promise.all([
    prisma.sale.aggregate({
      where: { saleDate: { gte: start, lte: end } },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.target.findUnique({
      where: { month_scope: { month, scope: "COMPANY" } },
    }),
  ]);

  const salesCount = agg._count._all;
  const revenue = decToNum(agg._sum.amount);
  const salesTarget = target?.salesTarget ?? 0;
  const revenueTarget = decToNum(target?.revenueTarget);

  return {
    month,
    salesCount,
    revenue,
    salesTarget,
    revenueTarget,
    salesProgress: progress(salesCount, salesTarget),
    revenueProgress: progress(revenue, revenueTarget),
  };
}

export interface Gate50k {
  revenue: number;
  threshold: number;
  passed: boolean;
  pct: number;
  semaforo: SemaforoResult;
}

/** Puerta de los 50.000 €: ¿la facturación real del mes supera el umbral? */
export async function getGate50k(month: string): Promise<Gate50k> {
  const { revenue } = await getCompanyMonth(month);
  const threshold = THRESHOLDS.gate50k;
  const passed = revenue >= threshold;
  return {
    revenue,
    threshold,
    passed,
    pct: Math.min(100, (revenue / threshold) * 100),
    semaforo: { estado: passed ? "ok" : "bad", sustained: false },
  };
}

// ── ACUMULADOS DE DINERO (semana / mes / año) — SOLO desde Sale ─────────────

export interface RevenueAccumulators {
  week: number; // facturación de la semana en curso (lunes → hoy)
  month: number; // facturación del mes en curso
  year: number; // facturación del año en curso
}

async function sumRevenue(gte: Date, lte: Date): Promise<number> {
  const agg = await prisma.sale.aggregate({
    _sum: { amount: true },
    where: { saleDate: { gte, lte } },
  });
  return decToNum(agg._sum.amount);
}

/** Facturación acumulada de la semana, el mes y el año (toda desde Sale). */
export async function getRevenueAccumulators(
  today: Date
): Promise<RevenueAccumulators> {
  const monday = weekStart(today);
  const { start: monthStart, end: monthEnd } = monthRange(today);
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

  const [week, month, year] = await Promise.all([
    sumRevenue(monday, endOfDay(today)),
    sumRevenue(monthStart, monthEnd),
    sumRevenue(yearStart, yearEnd),
  ]);
  return { week, month, year };
}

// ── PROYECCIÓN DE CIERRE DE MES (derivada de Sale) ──────────────────────────

export interface MonthProjection {
  revenueSoFar: number;
  salesSoFar: number;
  revenueTarget: number;
  salesTarget: number;
  daysElapsed: number;
  daysInMonth: number;
  daysRemaining: number;
  projectedRevenue: number; // a este ritmo
  projectedSales: number;
  revenuePerDayNeeded: number; // para llegar al objetivo
  salesPerDayNeeded: number;
  onTrack: boolean;
}

export async function getMonthProjection(
  month: string,
  today: Date
): Promise<MonthProjection> {
  const { end } = monthRangeFromKey(month);
  const company = await getCompanyMonth(month);

  const daysInMonth = end.getDate();
  // Días transcurridos: si el mes es el actual, hasta hoy; si es pasado, todo.
  const isCurrentMonth = monthKey(today) === month;
  const daysElapsed = isCurrentMonth
    ? Math.min(today.getDate(), daysInMonth)
    : today > end
      ? daysInMonth
      : 0;
  const p = projectMonth({
    revenueSoFar: company.revenue,
    salesSoFar: company.salesCount,
    revenueTarget: company.revenueTarget,
    salesTarget: company.salesTarget,
    daysElapsed,
    daysInMonth,
  });

  return {
    revenueSoFar: company.revenue,
    salesSoFar: company.salesCount,
    revenueTarget: company.revenueTarget,
    salesTarget: company.salesTarget,
    daysElapsed,
    daysInMonth,
    daysRemaining: p.daysRemaining,
    projectedRevenue: p.projectedRevenue,
    projectedSales: p.projectedSales,
    revenuePerDayNeeded: p.revenuePerDayNeeded,
    salesPerDayNeeded: p.salesPerDayNeeded,
    onTrack: p.onTrack,
  };
}

// ── ANALÍTICA DE VENTAS (desde Sale) ────────────────────────────────────────

export async function getSalesByChannel(
  month: string
): Promise<{ channel: EntryChannel; count: number; revenue: number }[]> {
  const { start, end } = monthRangeFromKey(month);
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: start, lte: end } },
    select: { entryChannel: true, amount: true },
  });
  const map = new Map<string, { count: number; revenue: number }>();
  for (const s of sales) {
    const cur = map.get(s.entryChannel) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += decToNum(s.amount);
    map.set(s.entryChannel, cur);
  }
  return Array.from(map.entries())
    .map(([channel, v]) => ({ channel: channel as EntryChannel, ...v }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Ranking de touchpoints: en cuántas ventas aparece cada uno (los que más
 * convierten = los que están presentes en más ventas cerradas).
 */
export async function getTouchpointRanking(
  month: string
): Promise<{ touchpoint: Touchpoint; count: number; pct: number }[]> {
  const { start, end } = monthRangeFromKey(month);
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: start, lte: end } },
    select: { touchpoints: true },
  });
  const total = sales.length;
  const parsed: string[][] = sales.map((s) => {
    try {
      return JSON.parse(s.touchpoints || "[]");
    } catch {
      return [];
    }
  });
  const counts = touchpointCounts(parsed);
  return Array.from(counts.entries())
    .map(([touchpoint, count]) => ({
      touchpoint: touchpoint as Touchpoint,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Tiempo medio (días) desde la entrada del lead hasta la venta. */
export async function getAvgLeadToSaleDays(month: string): Promise<number | null> {
  const { start, end } = monthRangeFromKey(month);
  const sales = await prisma.sale.findMany({
    where: {
      saleDate: { gte: start, lte: end },
      daysLeadToSale: { not: null },
    },
    select: { daysLeadToSale: true },
  });
  if (sales.length === 0) return null;
  const sum = sales.reduce((acc, s) => acc + (s.daysLeadToSale ?? 0), 0);
  return Math.round((sum / sales.length) * 10) / 10;
}

export async function getByDiscountCode(
  month: string
): Promise<{ code: string; count: number; revenue: number }[]> {
  const { start, end } = monthRangeFromKey(month);
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: start, lte: end } },
    select: { discountCode: true, amount: true },
  });
  const map = new Map<string, { count: number; revenue: number }>();
  for (const s of sales) {
    const code = s.discountCode?.trim() || "Sin código";
    const cur = map.get(code) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += decToNum(s.amount);
    map.set(code, cur);
  }
  return Array.from(map.entries())
    .map(([code, v]) => ({ code, ...v }))
    .sort((a, b) => b.count - a.count);
}

// ── JOSEP (INBOUND) ──────────────────────────────────────────────────────────

export interface JosepWeek {
  contacts: number; // contactos acumulados de la semana
  contactsTarget: number; // 250
  contactsProgress: TargetProgress;
  slaPct: number; // % de días con SLA cumplido
  attributedSalesWeek: number;
  leadsWithoutAction: number; // máximo de la semana
  daysLogged: number;
  conversionPct: number; // ventas atribuidas / contactos (semana)
  // Semáforos (con aviso sostenido a 5 días)
  semContacts: SemaforoResult;
  semSla: SemaforoResult;
  semLeads: SemaforoResult;
  semConversion: SemaforoResult;
}

export async function getJosepWeek(ref: Date): Promise<JosepWeek> {
  const { start, end } = workWeekRange(ref);
  const rows = await prisma.josepDaily.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });

  const contacts = rows.reduce((a, r) => a + r.callContacts, 0);
  const attributedSalesWeek = rows.reduce((a, r) => a + r.attributedSales, 0);
  const leadsWithoutAction = rows.reduce(
    (a, r) => Math.max(a, r.leadsWithoutNextAction),
    0
  );
  const daysLogged = rows.length;
  const slaDays = rows.filter((r) => r.whatsappSlaMet).length;
  const slaPct = daysLogged > 0 ? (slaDays / daysLogged) * 100 : 0;
  const conversionPct = contacts > 0 ? (attributedSalesWeek / contacts) * 100 : 0;

  // Series para el aviso sostenido (últimos 5 días laborables registrados).
  const contactSeries = rows.map((r) => r.callContacts);
  const slaSeries = rows.map((r) => (r.whatsappSlaMet ? 100 : 0));
  const conversionSeries = rows
    .filter((r) => r.callContacts > 0)
    .map((r) => (r.attributedSales / r.callContacts) * 100);

  return {
    contacts,
    contactsTarget: THRESHOLDS.josepCallContactsWeek,
    contactsProgress: progress(contacts, THRESHOLDS.josepCallContactsWeek),
    slaPct,
    attributedSalesWeek,
    leadsWithoutAction,
    daysLogged,
    conversionPct,
    semContacts: {
      ...semaforo(contacts, THRESHOLDS.josepCallContactsWeek),
      sustained: isSustainedBelow(contactSeries, THRESHOLDS.josepCallContactsDay),
    },
    semSla: {
      ...semaforo(slaPct, THRESHOLDS.josepSlaPct),
      sustained: isSustainedBelow(slaSeries, THRESHOLDS.josepSlaPct),
    },
    semLeads: semaforo(leadsWithoutAction, THRESHOLDS.josepLeadsWithoutAction, {
      higherIsBetter: false,
    }),
    semConversion: {
      ...semaforo(conversionPct, THRESHOLDS.josepConversionPct),
      sustained: isSustainedBelow(
        conversionSeries,
        THRESHOLDS.josepConversionPct
      ),
    },
  };
}

export interface JosepMonth {
  attributedSales: number; // ventas ATRIBUIDAS del mes (no suman al total)
  attributedTarget: number;
  attributedProgress: TargetProgress;
  contacts: number;
  conversionPct: number;
}

export async function getJosepMonth(month: string): Promise<JosepMonth> {
  const { start, end } = monthRangeFromKey(month);
  const [rows, target] = await Promise.all([
    prisma.josepDaily.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.target.findUnique({
      where: { month_scope: { month, scope: "JOSEP" } },
    }),
  ]);
  const attributedSales = rows.reduce((a, r) => a + r.attributedSales, 0);
  const contacts = rows.reduce((a, r) => a + r.callContacts, 0);
  const attributedTarget = target?.salesTarget ?? 0;
  return {
    attributedSales,
    attributedTarget,
    attributedProgress: progress(attributedSales, attributedTarget),
    contacts,
    conversionPct: contacts > 0 ? (attributedSales / contacts) * 100 : 0,
  };
}

// ── RODRIGO (AGENCY) ───────────────────────────────────────────────────────

export interface RodrigoWeek {
  prospects: number;
  prospectsTarget: number;
  iberoProspects: number;
  iberoTarget: number;
  verifiedPosts: number;
  verifiedPostsTarget: number;
  bitlyClicksWeek: number;
  semProspects: SemaforoResult;
  semIbero: SemaforoResult;
  semPosts: SemaforoResult;
}

export async function getRodrigoWeek(ref: Date): Promise<RodrigoWeek> {
  const { start, end } = workWeekRange(ref);
  const rows = await prisma.rodrigoDaily.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });
  const prospects = rows.reduce((a, r) => a + r.newProspects, 0);
  const iberoProspects = rows.reduce((a, r) => a + r.prospectsIberoamerica, 0);
  const verifiedPosts = rows.reduce((a, r) => a + r.verifiedPosts, 0);
  const bitlyClicksWeek = rows.reduce((a, r) => a + r.bitlyClicks, 0);

  return {
    prospects,
    prospectsTarget: THRESHOLDS.rodrigoProspectsWeek,
    iberoProspects,
    iberoTarget: THRESHOLDS.rodrigoIberoWeek,
    verifiedPosts,
    verifiedPostsTarget: THRESHOLDS.rodrigoVerifiedPostsWeek,
    bitlyClicksWeek,
    semProspects: semaforo(prospects, THRESHOLDS.rodrigoProspectsWeek),
    semIbero: semaforo(iberoProspects, THRESHOLDS.rodrigoIberoWeek),
    semPosts: semaforo(verifiedPosts, THRESHOLDS.rodrigoVerifiedPostsWeek),
  };
}

export interface RodrigoMonth {
  attributableByTramo: Record<Tramo, number>; // ventas ATRIBUIBLES por tramo
  topTarget: number;
  restoTarget: number;
  topProgress: TargetProgress;
  restoProgress: TargetProgress;
  bitlyClicks: number;
  bitlyTarget: number;
  bitlyProgress: TargetProgress;
  ambassadors: number; // embajadores firmados (activos) en el mes
  semBitly: SemaforoResult;
}

export async function getRodrigoMonth(month: string): Promise<RodrigoMonth> {
  const { start, end } = monthRangeFromKey(month);
  const [rows, topT, restoT] = await Promise.all([
    prisma.rodrigoDaily.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.target.findUnique({
      where: { month_scope: { month, scope: "RODRIGO_TOP" } },
    }),
    prisma.target.findUnique({
      where: { month_scope: { month, scope: "RODRIGO_RESTO" } },
    }),
  ]);

  const attributableByTramo: Record<Tramo, number> = {
    TOP: 0,
    RESTO: 0,
    MIXTO: 0,
  };
  let bitlyClicks = 0;
  let ambassadors = 0;
  for (const r of rows) {
    const tramo = (r.tramo as Tramo) in attributableByTramo
      ? (r.tramo as Tramo)
      : "MIXTO";
    attributableByTramo[tramo] += r.attributableSales;
    bitlyClicks += r.bitlyClicks;
    ambassadors += r.ambassadorsSigned;
  }

  const topTarget = topT?.salesTarget ?? 0;
  const restoTarget = restoT?.salesTarget ?? 0;

  return {
    attributableByTramo,
    topTarget,
    restoTarget,
    topProgress: progress(attributableByTramo.TOP, topTarget),
    restoProgress: progress(attributableByTramo.RESTO, restoTarget),
    bitlyClicks,
    bitlyTarget: THRESHOLDS.rodrigoBitlyClicksMonth,
    bitlyProgress: progress(bitlyClicks, THRESHOLDS.rodrigoBitlyClicksMonth),
    ambassadors,
    semBitly: semaforo(bitlyClicks, THRESHOLDS.rodrigoBitlyClicksMonth),
  };
}

// ── FUNSEX (lista de interesados vs hitos) ──────────────────────────────────

import { FUNSEX_MILESTONES } from "@/types/domain";

export interface FunsexProgress {
  total: number; // último tamaño conocido de la lista
  lastUpdate: Date | null;
  milestones: { date: string; min: number; met: boolean }[];
  nextMilestone: { date: string; min: number } | null;
  series: { date: Date; total: number }[];
}

export async function getFunsexProgress(today: Date): Promise<FunsexProgress> {
  const rows = await prisma.funsexInterest.findMany({
    orderBy: { date: "asc" },
  });
  const latest = rows.at(-1) ?? null;
  const total = latest?.total ?? 0;

  const milestones = FUNSEX_MILESTONES.map((m) => ({
    date: m.date,
    min: m.min,
    // Hito cumplido si la lista alcanzó el mínimo en o antes de la fecha hito.
    met:
      rows.some(
        (r) => r.date <= new Date(m.date + "T23:59:59") && r.total >= m.min
      ) || total >= m.min,
  }));

  const next =
    FUNSEX_MILESTONES.find((m) => new Date(m.date) >= today && total < m.min) ??
    null;

  return {
    total,
    lastUpdate: latest?.date ?? null,
    milestones,
    nextMilestone: next ? { date: next.date, min: next.min } : null,
    series: rows.map((r) => ({ date: r.date, total: r.total })),
  };
}

// ── RECORDATORIO DE CARGA ────────────────────────────────────────────────────

import { previousWorkday } from "@/lib/dates";

export interface LoadReminder {
  josepPending: boolean;
  rodrigoPending: boolean;
  previousWorkday: Date;
}

/** ¿Falta la carga del día laborable anterior? */
export async function getLoadReminder(today: Date): Promise<LoadReminder> {
  const prev = previousWorkday(today);
  const dayStart = new Date(prev);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(prev);
  dayEnd.setHours(23, 59, 59, 999);

  const [josep, rodrigo] = await Promise.all([
    prisma.josepDaily.findFirst({
      where: { date: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.rodrigoDaily.findFirst({
      where: { date: { gte: dayStart, lte: dayEnd } },
    }),
  ]);

  return {
    josepPending: !josep,
    rodrigoPending: !rodrigo,
    previousWorkday: prev,
  };
}

// Exporta utilidades de fecha de uso frecuente en pantallas.
export { monthKey, workWeekRange, weekdaysInRange };

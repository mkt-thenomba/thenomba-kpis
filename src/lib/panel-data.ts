// Reúne TODO lo que muestra el panel de dirección en una sola llamada.
// Lo consumen tanto la pantalla del viernes (/) como la vista de presentación
// (/informe). Todos los totales de compañía salen de Sale; la actividad, de
// las tablas diarias. Nunca se suman atribuciones para el total.

import { prisma } from "@/lib/db";
import {
  getCompanyMonth,
  getGate50k,
  getRevenueAccumulators,
  getMonthProjection,
  getJosepWeek,
  getJosepMonth,
  getSalesByChannel,
  getTouchpointRanking,
  getAvgLeadToSaleDays,
  getByDiscountCode,
  getRodrigoMonth,
  getFunsexProgress,
  monthKey,
} from "@/lib/metrics";
import { workWeekRange } from "@/lib/dates";

export async function getPanelData(today: Date) {
  const month = monthKey(today);
  const { start: weekStart, end: weekEnd } = workWeekRange(today);

  const [
    company,
    gate,
    revenue,
    projection,
    josepWeek,
    josepMonth,
    salesByChannel,
    touchpoints,
    avgLeadToSale,
    byCode,
    rodrigoMonth,
    funsex,
    report,
  ] = await Promise.all([
    getCompanyMonth(month),
    getGate50k(month),
    getRevenueAccumulators(today),
    getMonthProjection(month, today),
    getJosepWeek(today),
    getJosepMonth(month),
    getSalesByChannel(month),
    getTouchpointRanking(month),
    getAvgLeadToSaleDays(month),
    getByDiscountCode(month),
    getRodrigoMonth(month),
    getFunsexProgress(today),
    prisma.weeklyReport.findUnique({ where: { weekStart } }),
  ]);

  return {
    today,
    month,
    weekStart,
    weekEnd,
    company,
    gate,
    revenue,
    projection,
    josepWeek,
    josepMonth,
    salesByChannel,
    touchpoints,
    avgLeadToSale,
    byCode,
    rodrigoMonth,
    funsex,
    pabloReading: report?.pabloReading ?? "",
    generatedAt: report?.generatedAt ?? null,
  };
}

export type PanelData = Awaited<ReturnType<typeof getPanelData>>;

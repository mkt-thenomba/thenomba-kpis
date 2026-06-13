"use server";

// Server Actions del informe semanal.
//   · saveReading: persiste "Mi lectura" (único campo manual del informe).
//   · generateWeeklyReport: consolida el rango lunes-viernes de la semana en
//     curso desde las tablas base y crea/actualiza el WeeklyReport, dejando
//     intacta "Mi lectura".
//
// REGLA RECTORA: companySalesReal sale de getCompanyMonth (solo Sale), nunca
// de sumar atribuciones.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guards";
import { workWeekRange } from "@/lib/dates";
import {
  getCompanyMonth,
  getGate50k,
  getJosepWeek,
  getJosepMonth,
  getRodrigoMonth,
  monthKey,
} from "@/lib/metrics";

export interface ReportState {
  ok: boolean;
  savedAt: number | null;
}

/** Guarda el texto de "Mi lectura" para la semana en curso. */
export async function saveReading(
  _prev: ReportState,
  formData: FormData
): Promise<ReportState> {
  await requireRole("ADMIN");
  const today = new Date();
  const { start, end } = workWeekRange(today);
  const pabloReading = String(formData.get("pabloReading") ?? "");

  await prisma.weeklyReport.upsert({
    where: { weekStart: start },
    update: { pabloReading },
    create: { weekStart: start, weekEnd: end, pabloReading },
  });

  revalidatePath("/");
  revalidatePath("/informe");
  return { ok: true, savedAt: Date.now() };
}

/** Consolida la semana en curso en el WeeklyReport (mantiene "Mi lectura"). */
export async function generateWeeklyReport() {
  await requireRole("ADMIN");
  const today = new Date();
  const { start, end } = workWeekRange(today);
  const month = monthKey(today);

  const [company, gate, josepWeek, josepMonth, rodrigoMonth] = await Promise.all([
    getCompanyMonth(month),
    getGate50k(month),
    getJosepWeek(today),
    getJosepMonth(month),
    getRodrigoMonth(month),
  ]);

  const rodrigoAttributable =
    rodrigoMonth.attributableByTramo.TOP +
    rodrigoMonth.attributableByTramo.RESTO +
    rodrigoMonth.attributableByTramo.MIXTO;

  const consolidated = {
    weekEnd: end,
    companySalesReal: company.salesCount, // SOLO desde Sale
    monthRevenueAccrued: company.revenue,
    monthRevenueTarget: company.revenueTarget,
    gate50kPassed: gate.passed,
    josepContacts: josepWeek.contacts,
    josepSlaPct: josepWeek.slaPct,
    josepAttributed: josepMonth.attributedSales,
    rodrigoAttributable,
    rodrigoBitlyClicks: rodrigoMonth.bitlyClicks,
    rodrigoAmbassadors: rodrigoMonth.ambassadors,
    generatedAt: new Date(),
  };

  await prisma.weeklyReport.upsert({
    where: { weekStart: start },
    update: consolidated, // no toca pabloReading
    create: { weekStart: start, pabloReading: "", ...consolidated },
  });

  revalidatePath("/");
  revalidatePath("/informe");
}

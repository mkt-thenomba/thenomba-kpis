// Objetivos sembrados (año operativo 2026). Cifras EXACTAS de la dirección,
// no inventadas. Consumidos por prisma/seed.ts y por la capa de cálculo.
//
// Formato de cada fila: { month: "aaaa-mm", scope, salesTarget, revenueTarget }

import type { TargetScope } from "@/types/domain";

export interface TargetSeed {
  month: string; // "aaaa-mm"
  scope: TargetScope;
  salesTarget: number; // nº de ventas objetivo
  revenueTarget: number; // facturación objetivo en €
}

export const TARGET_SEEDS: TargetSeed[] = [
  // ── Compañía (fuente de verdad: total real de ventas) ──
  { month: "2026-06", scope: "COMPANY", salesTarget: 70, revenueTarget: 32000 },
  { month: "2026-07", scope: "COMPANY", salesTarget: 110, revenueTarget: 40000 },
  { month: "2026-08", scope: "COMPANY", salesTarget: 105, revenueTarget: 40000 },
  { month: "2026-09", scope: "COMPANY", salesTarget: 210, revenueTarget: 70000 },
  { month: "2026-10", scope: "COMPANY", salesTarget: 120, revenueTarget: 50000 },
  { month: "2026-11", scope: "COMPANY", salesTarget: 120, revenueTarget: 50000 },
  { month: "2026-12", scope: "COMPANY", salesTarget: 210, revenueTarget: 80000 },

  // ── Josep: ventas ATRIBUIDAS objetivo (no suman al total de compañía) ──
  { month: "2026-07", scope: "JOSEP", salesTarget: 30, revenueTarget: 0 },
  { month: "2026-08", scope: "JOSEP", salesTarget: 40, revenueTarget: 0 },
  { month: "2026-09", scope: "JOSEP", salesTarget: 70, revenueTarget: 0 },
  { month: "2026-10", scope: "JOSEP", salesTarget: 45, revenueTarget: 0 },
  { month: "2026-11", scope: "JOSEP", salesTarget: 45, revenueTarget: 0 },
  { month: "2026-12", scope: "JOSEP", salesTarget: 70, revenueTarget: 0 },

  // ── Rodrigo Top ──
  { month: "2026-06", scope: "RODRIGO_TOP", salesTarget: 10, revenueTarget: 0 },
  { month: "2026-07", scope: "RODRIGO_TOP", salesTarget: 10, revenueTarget: 0 },
  { month: "2026-08", scope: "RODRIGO_TOP", salesTarget: 10, revenueTarget: 0 },
  { month: "2026-09", scope: "RODRIGO_TOP", salesTarget: 10, revenueTarget: 0 },
  { month: "2026-10", scope: "RODRIGO_TOP", salesTarget: 20, revenueTarget: 0 },
  { month: "2026-11", scope: "RODRIGO_TOP", salesTarget: 20, revenueTarget: 0 },
  { month: "2026-12", scope: "RODRIGO_TOP", salesTarget: 20, revenueTarget: 0 },

  // ── Rodrigo Resto ──
  { month: "2026-06", scope: "RODRIGO_RESTO", salesTarget: 10, revenueTarget: 0 },
  { month: "2026-07", scope: "RODRIGO_RESTO", salesTarget: 10, revenueTarget: 0 },
  { month: "2026-08", scope: "RODRIGO_RESTO", salesTarget: 10, revenueTarget: 0 },
  { month: "2026-09", scope: "RODRIGO_RESTO", salesTarget: 20, revenueTarget: 0 },
  { month: "2026-10", scope: "RODRIGO_RESTO", salesTarget: 25, revenueTarget: 0 },
  { month: "2026-11", scope: "RODRIGO_RESTO", salesTarget: 30, revenueTarget: 0 },
  { month: "2026-12", scope: "RODRIGO_RESTO", salesTarget: 40, revenueTarget: 0 },

  // ── FunSex preventa (1-jul a 31-ago): rango 180-250 ventas / 40.000-60.000 €.
  //    Guardamos el mínimo del rango como objetivo; el rango se documenta abajo.
  { month: "2026-07", scope: "FUNSEX", salesTarget: 180, revenueTarget: 40000 },
  { month: "2026-08", scope: "FUNSEX", salesTarget: 180, revenueTarget: 40000 },
];

// Rango de la preventa FunSex (para mostrar "180-250 ventas / 40.000-60.000 €")
export const FUNSEX_PRESALE = {
  start: "2026-07-01",
  end: "2026-08-31",
  salesMin: 180,
  salesMax: 250,
  revenueMin: 40000,
  revenueMax: 60000,
} as const;

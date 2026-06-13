// ─────────────────────────────────────────────────────────────────────────
// CÁLCULO DE SUELDOS VARIABLES (panel /variables, solo ADMIN).
//
// Fórmulas tomadas del documento "Propuesta de Estructura del Área de Ventas
// B2C" (sección 8, Condiciones de equipo). Todo el dinero y las ventas reales
// salen de Sale (regla rectora); las atribuciones, de las tablas diarias.
//
// Tres datos no los rastrea la app y se introducen a mano por mes
// (VariableInputs): el 30% de agency cobrado, el bono de embajadores y si los
// reembolsos de FunSex quedaron por debajo del 8%.
// ─────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db";
import { monthRangeFromKey } from "@/lib/dates";
import { getCompanyMonth, getRodrigoMonth } from "@/lib/metrics";
import { FUNSEX_PRESALE } from "@/lib/targets";

// Reglas (constantes del documento). Editar aquí si cambian.
export const VARIABLE_RULES = {
  josep: {
    perSaleToTarget: 15, // € por venta atribuida hasta el objetivo
    perSaleAboveTarget: 25, // € por venta por encima del objetivo (sin tope)
    monthlyContactMin: 1050, // mínimo mensual de contactos
    activityGateFactor: 0.8, // se exige ≥80% del mínimo
    slaMin: 90, // SLA mínimo (%)
  },
  rodrigo: {
    gateSalesMin: 10, // puerta 1: ≥10 ventas atribuibles
    gateRevenueMin: 50000, // puerta 2: ≥50.000 € facturados (compañía)
    perSaleToTarget: 8, // € por venta atribuible hasta el objetivo
    perSaleAboveTarget: 15, // € por venta por encima del objetivo total
    agencyPct: 0.05, // 5% del 30% de agency cobrado
    ambassadorBonus: 100, // bono primer mes con >20 embajadores activos
  },
  // Variable A de Pablo por tramos de facturación B2C del mes.
  pabloVentas: [
    { min: 150000, amount: 3500 },
    { min: 100000, amount: 2000 },
    { min: 70000, amount: 1000 },
    { min: 50000, amount: 500 },
  ],
  // Variable B de Pablo (FunSex): % de la facturación de preventa (jul–ago).
  funsex: {
    payMonth: "2026-09", // pago único en septiembre
    tiers: [
      { min: 60000, pct: 0.03 },
      { min: 50000, pct: 0.025 },
      { min: 40000, pct: 0.02 },
    ],
  },
} as const;

// ── Aritmética pura (testeable, sin BD) ─────────────────────────────────────

/** Variable de Josep por ventas: 15 € hasta objetivo, 25 € por encima. */
export function josepPay(attributed: number, objetivo: number) {
  const r = VARIABLE_RULES.josep;
  const toTargetUnits = Math.min(attributed, objetivo);
  const aboveUnits = Math.max(0, attributed - objetivo);
  const toTarget = toTargetUnits * r.perSaleToTarget;
  const above = aboveUnits * r.perSaleAboveTarget;
  return { toTargetUnits, aboveUnits, toTarget, above, total: toTarget + above };
}

/** Base de Rodrigo por ventas: 8 € hasta objetivo, 15 € por encima. */
export function rodrigoBase(attributable: number, objetivo: number) {
  const r = VARIABLE_RULES.rodrigo;
  const toTargetUnits = Math.min(attributable, objetivo);
  const aboveUnits = Math.max(0, attributable - objetivo);
  const toTarget = toTargetUnits * r.perSaleToTarget;
  const above = aboveUnits * r.perSaleAboveTarget;
  return { toTargetUnits, aboveUnits, toTarget, above, total: toTarget + above };
}

/** Variable A de Pablo: importe del tramo de facturación alcanzado. */
export function pabloVentasAmount(revenue: number): number {
  return VARIABLE_RULES.pabloVentas.find((t) => revenue >= t.min)?.amount ?? 0;
}

/** Variable B de Pablo (FunSex): % del tramo de preventa alcanzado × facturación. */
export function funsexAmount(revenue: number): number {
  const tier = VARIABLE_RULES.funsex.tiers.find((t) => revenue >= t.min);
  return tier ? revenue * tier.pct : 0;
}

export interface VariableLine {
  label: string;
  detail?: string;
  value: number;
}

export interface PersonVariable {
  name: string;
  role: string;
  total: number;
  lines: VariableLine[];
  gateOk: boolean;
  gateNote?: string;
}

export interface VariablesResult {
  month: string;
  josep: PersonVariable;
  rodrigo: PersonVariable;
  pablo: PersonVariable;
  total: number;
  inputs: {
    agencyCollected: number;
    rodrigoAmbassadorBonus: boolean;
    funsexRefundsOk: boolean;
  };
}

function dec(d: unknown): number {
  return d == null ? 0 : Number(d);
}

async function getTargetSales(month: string, scope: string): Promise<number> {
  const t = await prisma.target.findUnique({
    where: { month_scope: { month, scope } },
  });
  return t?.salesTarget ?? 0;
}

// ── Josep ────────────────────────────────────────────────────────────────
async function computeJosep(month: string): Promise<PersonVariable> {
  const { start, end } = monthRangeFromKey(month);
  const [rows, objetivo] = await Promise.all([
    prisma.josepDaily.findMany({ where: { date: { gte: start, lte: end } } }),
    getTargetSales(month, "JOSEP"),
  ]);

  const attributed = rows.reduce((a, r) => a + r.attributedSales, 0);
  const contacts = rows.reduce((a, r) => a + r.callContacts, 0);
  const daysLogged = rows.length;
  const slaPct =
    daysLogged > 0
      ? (rows.filter((r) => r.whatsappSlaMet).length / daysLogged) * 100
      : 0;

  const r = VARIABLE_RULES.josep;
  const contactsGate = contacts >= r.activityGateFactor * r.monthlyContactMin;
  const slaGate = slaPct >= r.activityGateFactor * r.slaMin;
  const gateOk = contactsGate && slaGate;

  const pay = josepPay(attributed, objetivo);
  const total = gateOk ? pay.total : 0;

  return {
    name: "Josep Adolf",
    role: "Ventas inbound",
    total,
    gateOk,
    gateNote: gateOk
      ? `Actividad suficiente (${contacts} contactos, SLA ${Math.round(slaPct)} %).`
      : `Variable a 0: actividad por debajo del 80% del mínimo (${contacts}/${Math.round(r.activityGateFactor * r.monthlyContactMin)} contactos, SLA ${Math.round(slaPct)} %/${Math.round(r.activityGateFactor * r.slaMin)} %).`,
    lines: [
      {
        label: `Hasta objetivo (${pay.toTargetUnits} × ${r.perSaleToTarget} €)`,
        detail: `Ventas atribuidas: ${attributed} · objetivo: ${objetivo || "—"}`,
        value: gateOk ? pay.toTarget : 0,
      },
      {
        label: `Por encima del objetivo (${pay.aboveUnits} × ${r.perSaleAboveTarget} €)`,
        value: gateOk ? pay.above : 0,
      },
    ],
  };
}

// ── Rodrigo ──────────────────────────────────────────────────────────────
async function computeRodrigo(
  month: string,
  agencyCollected: number,
  ambassadorBonus: boolean
): Promise<PersonVariable> {
  const [rodrigo, company] = await Promise.all([
    getRodrigoMonth(month),
    getCompanyMonth(month),
  ]);

  const attributable =
    rodrigo.attributableByTramo.TOP +
    rodrigo.attributableByTramo.RESTO +
    rodrigo.attributableByTramo.MIXTO;
  const objetivo = rodrigo.topTarget + rodrigo.restoTarget;

  const r = VARIABLE_RULES.rodrigo;
  const salesGate = attributable >= r.gateSalesMin;
  const revenueGate = company.revenue >= r.gateRevenueMin;
  const gateOk = salesGate && revenueGate;

  const pay = rodrigoBase(attributable, objetivo);
  const agency = agencyCollected * r.agencyPct;
  const bono = ambassadorBonus ? r.ambassadorBonus : 0;
  const total = gateOk ? pay.total + agency + bono : 0;

  const gateNote = gateOk
    ? "Puerta doble superada (≥10 ventas atribuibles y ≥50.000 € facturados)."
    : `Variable a 0: ${!salesGate ? `faltan ventas atribuibles (${attributable}/${r.gateSalesMin})` : ""}${!salesGate && !revenueGate ? " y " : ""}${!revenueGate ? `facturación por debajo de 50.000 € (${Math.round(company.revenue).toLocaleString("es-ES")} €)` : ""}.`;

  return {
    name: "Rodrigo Sangrador",
    role: "Agency + Embajadores",
    total,
    gateOk,
    gateNote,
    lines: [
      {
        label: `Hasta objetivo (${pay.toTargetUnits} × ${r.perSaleToTarget} €)`,
        detail: `Ventas atribuibles: ${attributable} · objetivo: ${objetivo}`,
        value: gateOk ? pay.toTarget : 0,
      },
      {
        label: `Por encima del objetivo (${pay.aboveUnits} × ${r.perSaleAboveTarget} €)`,
        value: gateOk ? pay.above : 0,
      },
      {
        label: "5% del 30% de agency cobrado",
        detail: `Agency cobrado introducido: ${agencyCollected.toLocaleString("es-ES")} €`,
        value: gateOk ? agency : 0,
      },
      {
        label: "Bono embajadores (>20 activos, primer mes)",
        value: gateOk ? bono : 0,
      },
    ],
  };
}

// ── Pablo (Variable A ventas + Variable B FunSex) ──────────────────────────
async function computePablo(
  month: string,
  funsexRefundsOk: boolean
): Promise<PersonVariable> {
  const company = await getCompanyMonth(month);

  // Variable A: tramo por facturación del mes.
  const tramo = VARIABLE_RULES.pabloVentas.find((t) => company.revenue >= t.min);
  const variableA = pabloVentasAmount(company.revenue);

  // Variable B: % de la facturación de preventa FunSex (jul–ago), pago en sept.
  const preStart = new Date(FUNSEX_PRESALE.start + "T00:00:00");
  const preEnd = new Date(FUNSEX_PRESALE.end + "T23:59:59");
  const funsexAgg = await prisma.sale.aggregate({
    _sum: { amount: true },
    where: { product: "FUNSEX", saleDate: { gte: preStart, lte: preEnd } },
  });
  const funsexRevenue = dec(funsexAgg._sum.amount);
  const tier = VARIABLE_RULES.funsex.tiers.find((t) => funsexRevenue >= t.min);
  const funsexValue = funsexAmount(funsexRevenue);
  const isPayMonth = month === VARIABLE_RULES.funsex.payMonth;
  // Entra en el total solo en septiembre y si se cumple la condición de reembolsos.
  const funsexPayable = isPayMonth && funsexRefundsOk ? funsexValue : 0;

  const total = variableA + funsexPayable;

  const lines: VariableLine[] = [
    {
      label: "Variable A · ventas",
      detail: tramo
        ? `Facturación ${Math.round(company.revenue).toLocaleString("es-ES")} € → tramo ≥${tramo.min.toLocaleString("es-ES")} €`
        : `Facturación ${Math.round(company.revenue).toLocaleString("es-ES")} € (por debajo de 50.000 €)`,
      value: variableA,
    },
    {
      label: `Variable B · FunSex (${tier ? (tier.pct * 100).toLocaleString("es-ES") + " %" : "—"})`,
      detail: isPayMonth
        ? funsexRefundsOk
          ? `Preventa ${Math.round(funsexRevenue).toLocaleString("es-ES")} € · se paga este mes`
          : `Preventa ${Math.round(funsexRevenue).toLocaleString("es-ES")} € · pendiente condición reembolsos <8%`
        : `Preventa ${Math.round(funsexRevenue).toLocaleString("es-ES")} € · pago único en septiembre`,
      value: funsexPayable,
    },
  ];

  return {
    name: "Pablo Canela",
    role: "Responsable de Ventas B2C",
    total,
    gateOk: true,
    lines,
  };
}

/** Calcula los variables de todo el equipo para un mes "aaaa-mm". */
export async function getVariables(month: string): Promise<VariablesResult> {
  const inputsRow = await prisma.variableInputs.findUnique({ where: { month } });
  const agencyCollected = dec(inputsRow?.agencyCollected);
  const rodrigoAmbassadorBonus = inputsRow?.rodrigoAmbassadorBonus ?? false;
  const funsexRefundsOk = inputsRow?.funsexRefundsOk ?? false;

  const [josep, rodrigo, pablo] = await Promise.all([
    computeJosep(month),
    computeRodrigo(month, agencyCollected, rodrigoAmbassadorBonus),
    computePablo(month, funsexRefundsOk),
  ]);

  return {
    month,
    josep,
    rodrigo,
    pablo,
    total: josep.total + rodrigo.total + pablo.total,
    inputs: { agencyCollected, rodrigoAmbassadorBonus, funsexRefundsOk },
  };
}

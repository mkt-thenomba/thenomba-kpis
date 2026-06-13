"use server";

// Server Actions para la carga diaria de Josep y Rodrigo.
// Hacen upsert por fecha (un único registro por día, sin duplicar) y revalidan
// el rol en el servidor: no se confía en que el middleware sea suficiente.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guards";
import { dayStart } from "@/lib/dates";
import type { Tramo } from "@/types/domain";

function toInt(v: FormDataEntryValue | null, fallback = 0): number {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
function toBool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}
function parseDate(v: FormDataEntryValue | null): Date {
  const s = String(v ?? "");
  const d = s ? new Date(s + "T00:00:00") : new Date();
  return dayStart(isNaN(d.getTime()) ? new Date() : d);
}

export async function saveJosepDaily(formData: FormData) {
  await requireRole("ADMIN", "INBOUND");
  const date = parseDate(formData.get("date"));

  const data = {
    callContacts: toInt(formData.get("callContacts")),
    whatsappSlaMet: toBool(formData.get("whatsappSlaMet")),
    whatsappProactive: toInt(formData.get("whatsappProactive")),
    leadsWithoutNextAction: toInt(formData.get("leadsWithoutNextAction")),
    touchpointsLogged: toBool(formData.get("touchpointsLogged")),
    attributedSales: toInt(formData.get("attributedSales")),
    failedPaymentsRecovered: toInt(formData.get("failedPaymentsRecovered")),
    notes: String(formData.get("notes") ?? ""),
  };

  await prisma.josepDaily.upsert({
    where: { date },
    update: data,
    create: { date, ...data },
  });

  revalidatePath("/josep");
  revalidatePath("/");
}

export async function saveRodrigoDaily(formData: FormData) {
  await requireRole("ADMIN", "AGENCY");
  const date = parseDate(formData.get("date"));

  const tramoRaw = String(formData.get("tramo") ?? "MIXTO");
  const tramo: Tramo = (["TOP", "RESTO", "MIXTO"] as const).includes(
    tramoRaw as Tramo
  )
    ? (tramoRaw as Tramo)
    : "MIXTO";

  const data = {
    newProspects: toInt(formData.get("newProspects")),
    prospectsIberoamerica: toInt(formData.get("prospectsIberoamerica")),
    ambassadorsSigned: toInt(formData.get("ambassadorsSigned")),
    verifiedPosts: toInt(formData.get("verifiedPosts")),
    bitlyClicks: toInt(formData.get("bitlyClicks")),
    agencyPieces: toInt(formData.get("agencyPieces")),
    networkContacted14d: toBool(formData.get("networkContacted14d")),
    attributableSales: toInt(formData.get("attributableSales")),
    tramo,
    notes: String(formData.get("notes") ?? ""),
  };

  await prisma.rodrigoDaily.upsert({
    where: { date },
    update: data,
    create: { date, ...data },
  });

  revalidatePath("/rodrigo");
  revalidatePath("/");
}

// ── Variantes con estado para useFormState (confirmación "Guardado ✓") ──────

export interface SaveState {
  ok: boolean;
  savedAt: number | null;
}

export async function saveJosepDailyState(
  _prev: SaveState,
  formData: FormData
): Promise<SaveState> {
  await saveJosepDaily(formData);
  return { ok: true, savedAt: Date.now() };
}

export async function saveRodrigoDailyState(
  _prev: SaveState,
  formData: FormData
): Promise<SaveState> {
  await saveRodrigoDaily(formData);
  return { ok: true, savedAt: Date.now() };
}


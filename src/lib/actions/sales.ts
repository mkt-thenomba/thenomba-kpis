"use server";

// Server Actions del Registro de Ventas (la fuente de verdad).
// Solo ADMIN. Calcula daysLeadToSale en el servidor desde las dos fechas;
// nunca se confía en un valor enviado por el cliente.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guards";
import { dayStart, daysBetween } from "@/lib/dates";
import {
  PRODUCTS,
  PAYMENT_TYPES,
  ENTRY_CHANNELS,
  TOUCHPOINTS,
  type Product,
  type PaymentType,
  type EntryChannel,
  type Touchpoint,
} from "@/types/domain";

export interface SaveState {
  ok: boolean;
  error?: string;
  savedAt: number | null;
}

function oneOf<T extends readonly string[]>(
  v: FormDataEntryValue | null,
  allowed: T,
  fallback: T[number]
): T[number] {
  const s = String(v ?? "");
  return (allowed as readonly string[]).includes(s) ? (s as T[number]) : fallback;
}

function parseDateOrNull(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : dayStart(d);
}

// Construye (y valida) los datos de una venta desde el formulario.
// daysLeadToSale se calcula SIEMPRE en el servidor desde las dos fechas.
function parseSaleForm(
  formData: FormData
): { error: string } | { data: Parameters<typeof prisma.sale.create>[0]["data"] } {
  const saleDate = parseDateOrNull(formData.get("saleDate"));
  const customerName = String(formData.get("customerName") ?? "").trim();
  const amount = parseFloat(String(formData.get("amount") ?? ""));

  if (!saleDate) return { error: "Falta la fecha de venta." };
  if (!customerName) return { error: "Falta el nombre del cliente." };
  if (!Number.isFinite(amount) || amount < 0) return { error: "Importe no válido." };

  const leadEntryDate = parseDateOrNull(formData.get("leadEntryDate"));
  const daysLeadToSale =
    leadEntryDate && saleDate ? daysBetween(saleDate, leadEntryDate) : null;

  const tps = formData
    .getAll("touchpoints")
    .map(String)
    .filter((t): t is Touchpoint => (TOUCHPOINTS as readonly string[]).includes(t));

  const discountCode = String(formData.get("discountCode") ?? "").trim() || null;

  return {
    data: {
      saleDate,
      customerName,
      product: oneOf<typeof PRODUCTS>(formData.get("product"), PRODUCTS, "YOUTH") as Product,
      amount,
      paymentType: oneOf<typeof PAYMENT_TYPES>(
        formData.get("paymentType"),
        PAYMENT_TYPES,
        "UNICO"
      ) as PaymentType,
      discountCode,
      entryChannel: oneOf<typeof ENTRY_CHANNELS>(
        formData.get("entryChannel"),
        ENTRY_CHANNELS,
        "ORGANICO"
      ) as EntryChannel,
      leadEntryDate,
      daysLeadToSale,
      attributedJosep: formData.get("attributedJosep") === "on",
      attributedCode: discountCode ? true : formData.get("attributedCode") === "on",
      attributedPaid: formData.get("attributedPaid") === "on",
      touchpoints: JSON.stringify(tps),
    },
  };
}

export async function createSaleState(
  _prev: SaveState,
  formData: FormData
): Promise<SaveState> {
  await requireRole("ADMIN", "INBOUND");

  const parsed = parseSaleForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error, savedAt: null };

  await prisma.sale.create({ data: parsed.data });

  revalidatePath("/ventas");
  revalidatePath("/");
  return { ok: true, savedAt: Date.now() };
}

export async function updateSaleState(
  _prev: SaveState,
  formData: FormData
): Promise<SaveState> {
  await requireRole("ADMIN", "INBOUND");

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Venta no encontrada.", savedAt: null };

  const parsed = parseSaleForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error, savedAt: null };

  await prisma.sale.update({ where: { id }, data: parsed.data });

  revalidatePath("/ventas");
  revalidatePath("/");
  return { ok: true, savedAt: Date.now() };
}

export async function deleteSale(formData: FormData) {
  await requireRole("ADMIN", "INBOUND");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.sale.delete({ where: { id } });
    revalidatePath("/ventas");
    revalidatePath("/");
  }
}

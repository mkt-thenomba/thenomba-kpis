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

export async function createSaleState(
  _prev: SaveState,
  formData: FormData
): Promise<SaveState> {
  await requireRole("ADMIN");

  const saleDate = parseDateOrNull(formData.get("saleDate"));
  const customerName = String(formData.get("customerName") ?? "").trim();
  const amount = parseFloat(String(formData.get("amount") ?? ""));

  if (!saleDate) return { ok: false, error: "Falta la fecha de venta.", savedAt: null };
  if (!customerName)
    return { ok: false, error: "Falta el nombre del cliente.", savedAt: null };
  if (!Number.isFinite(amount) || amount < 0)
    return { ok: false, error: "Importe no válido.", savedAt: null };

  const leadEntryDate = parseDateOrNull(formData.get("leadEntryDate"));
  // daysLeadToSale calculado SOLO en el servidor.
  const daysLeadToSale =
    leadEntryDate && saleDate ? daysBetween(saleDate, leadEntryDate) : null;

  // Touchpoints: checkboxes con name="touchpoints" (múltiples valores).
  const tps = formData
    .getAll("touchpoints")
    .map(String)
    .filter((t): t is Touchpoint => (TOUCHPOINTS as readonly string[]).includes(t));

  const discountCode = String(formData.get("discountCode") ?? "").trim() || null;

  await prisma.sale.create({
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
  });

  revalidatePath("/ventas");
  revalidatePath("/");
  return { ok: true, savedAt: Date.now() };
}

export async function deleteSale(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.sale.delete({ where: { id } });
    revalidatePath("/ventas");
    revalidatePath("/");
  }
}

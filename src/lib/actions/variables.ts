"use server";

// Guarda los datos manuales mensuales que alimentan el cálculo de variables
// (agency cobrado, bono de embajadores, reembolsos FunSex). Solo ADMIN.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guards";

export interface VariableInputsState {
  ok: boolean;
  savedAt: number | null;
}

export async function saveVariableInputs(
  _prev: VariableInputsState,
  formData: FormData
): Promise<VariableInputsState> {
  await requireRole("ADMIN");

  const month = String(formData.get("month") ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return { ok: false, savedAt: null };
  }

  const agencyRaw = parseFloat(String(formData.get("agencyCollected") ?? "0"));
  const agencyCollected = Number.isFinite(agencyRaw) && agencyRaw >= 0 ? agencyRaw : 0;
  const rodrigoAmbassadorBonus = formData.get("rodrigoAmbassadorBonus") === "on";
  const funsexRefundsOk = formData.get("funsexRefundsOk") === "on";

  const data = { agencyCollected, rodrigoAmbassadorBonus, funsexRefundsOk };

  await prisma.variableInputs.upsert({
    where: { month },
    update: data,
    create: { month, ...data },
  });

  revalidatePath("/variables");
  return { ok: true, savedAt: Date.now() };
}

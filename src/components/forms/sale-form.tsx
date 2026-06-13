"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createSaleState, type SaveState } from "@/lib/actions/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  PRODUCTS,
  PRODUCT_LABELS,
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  ENTRY_CHANNELS,
  ENTRY_CHANNEL_LABELS,
  TOUCHPOINTS,
  TOUCHPOINT_LABELS,
} from "@/types/domain";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : "Registrar venta"}
    </Button>
  );
}

export function SaleForm({ todayISO }: { todayISO: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<SaveState, FormData>(
    async (prev, fd) => {
      const res = await createSaleState(prev, fd);
      if (res.ok) formRef.current?.reset();
      return res;
    },
    { ok: false, savedAt: null }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar una venta</CardTitle>
        <p className="text-sm text-muted-foreground">
          Los días entre la entrada del lead y la venta se calculan solos.
        </p>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="saleDate">Fecha de venta</Label>
              <Input id="saleDate" name="saleDate" type="date" defaultValue={todayISO} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerName">Cliente</Label>
              <Input id="customerName" name="customerName" placeholder="Nombre y apellidos" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product">Producto</Label>
              <Select id="product" name="product">
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {PRODUCT_LABELS[p]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Importe (€)</Label>
              <Input id="amount" name="amount" type="number" min={0} step="0.01" placeholder="0,00" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentType">Forma de pago</Label>
              <Select id="paymentType" name="paymentType">
                {PAYMENT_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {PAYMENT_TYPE_LABELS[p]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entryChannel">Canal de entrada</Label>
              <Select id="entryChannel" name="entryChannel">
                {ENTRY_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {ENTRY_CHANNEL_LABELS[c]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leadEntryDate">Entrada del lead (opcional)</Label>
              <Input id="leadEntryDate" name="leadEntryDate" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discountCode">Código de descuento (opcional)</Label>
              <Input id="discountCode" name="discountCode" placeholder="p. ej. VERANO" />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Atribuciones{" "}
              <span className="font-normal text-muted-foreground">
                (pueden solaparse; no suman al total de compañía)
              </span>
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="attributedJosep" className="h-4 w-4 accent-[hsl(var(--primary))]" />
                Atribuida a Josep
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="attributedPaid" className="h-4 w-4 accent-[hsl(var(--primary))]" />
                Atribuida a canal de pago
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="attributedCode" className="h-4 w-4 accent-[hsl(var(--primary))]" />
                Atribuida a código
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Touchpoints presentes</legend>
            <div className="flex flex-wrap gap-3">
              {TOUCHPOINTS.map((t) => (
                <label key={t} className="flex items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm">
                  <input type="checkbox" name="touchpoints" value={t} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  {TOUCHPOINT_LABELS[t]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <SubmitButton />
            {state.ok && <span className="text-sm text-ok">Venta registrada.</span>}
            {state.error && <span className="text-sm text-bad">{state.error}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

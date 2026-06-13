"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveJosepDailyState, type SaveState } from "@/lib/actions/daily";
import { NumberField, ToggleField } from "@/components/forms/fields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { THRESHOLDS } from "@/types/domain";
import { Check } from "lucide-react";

export interface JosepDefaults {
  date: string; // ISO yyyy-mm-dd
  callContacts: number;
  whatsappSlaMet: boolean;
  whatsappProactive: number;
  leadsWithoutNextAction: number;
  touchpointsLogged: boolean;
  attributedSales: number;
  failedPaymentsRecovered: number;
  notes: string;
  existed: boolean;
}

function SubmitButton({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-44">
      {pending ? (
        "Guardando…"
      ) : saved ? (
        <>
          <Check className="h-4 w-4" /> Guardado
        </>
      ) : (
        "Guardar el día"
      )}
    </Button>
  );
}

export function JosepForm({ defaults }: { defaults: JosepDefaults }) {
  const [state, formAction] = useFormState<SaveState, FormData>(
    saveJosepDailyState,
    { ok: false, savedAt: null }
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="date" value={defaults.date} />
      <Card>
        <CardHeader>
          <CardTitle>Actividad del día</CardTitle>
          {defaults.existed && (
            <p className="text-sm text-muted-foreground">
              Ya había datos de hoy: los estás editando (no se duplica).
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              name="callContacts"
              label="Contactos por llamada (>60s)"
              defaultValue={defaults.callContacts}
              threshold={THRESHOLDS.josepCallContactsDay}
              hint={`Mínimo del día: ${THRESHOLDS.josepCallContactsDay}`}
            />
            <NumberField
              name="leadsWithoutNextAction"
              label="Contactos sin próxima acción"
              defaultValue={defaults.leadsWithoutNextAction}
              threshold={THRESHOLDS.josepLeadsWithoutAction}
              higherIsBetter={false}
              hint="Objetivo: 0"
            />
            <NumberField
              name="whatsappProactive"
              label="WhatsApp proactivos"
              defaultValue={defaults.whatsappProactive}
            />
            <NumberField
              name="attributedSales"
              label="Ventas atribuidas (no suman al total)"
              defaultValue={defaults.attributedSales}
            />
            <NumberField
              name="failedPaymentsRecovered"
              label="Pagos fallidos recuperados"
              defaultValue={defaults.failedPaymentsRecovered}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              name="whatsappSlaMet"
              label="SLA de WhatsApp cumplido"
              defaultChecked={defaults.whatsappSlaMet}
              hint="Entrantes respondidos en menos de 2 h"
            />
            <ToggleField
              name="touchpointsLogged"
              label="Touchpoints registrados"
              defaultChecked={defaults.touchpointsLogged}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={defaults.notes}
              placeholder="Lo que quieras dejar anotado del día…"
            />
          </div>

          <div className="flex items-center gap-3">
            <SubmitButton saved={state.ok} />
            {state.ok && (
              <span className="text-sm text-ok">Cambios guardados.</span>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

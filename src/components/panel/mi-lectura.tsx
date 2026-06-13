"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveReading, type ReportState } from "@/lib/actions/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

function SaveBtn({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : saved ? (
        <>
          <Check className="h-4 w-4" /> Guardado
        </>
      ) : (
        "Guardar mi lectura"
      )}
    </Button>
  );
}

export function MiLectura({ defaultValue }: { defaultValue: string }) {
  const [state, formAction] = useFormState<ReportState, FormData>(saveReading, {
    ok: false,
    savedAt: null,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi lectura</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tu análisis y la decisión de la semana. Es el único texto que escribes
          a mano; el resto se calcula solo.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <Textarea
            name="pabloReading"
            defaultValue={defaultValue}
            rows={6}
            placeholder="Qué ha pasado esta semana, qué decido y por qué…"
          />
          <div className="flex items-center gap-3">
            <SaveBtn saved={state.ok} />
            {state.ok && <span className="text-sm text-ok">Lectura guardada.</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

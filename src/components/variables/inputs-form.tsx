"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  saveVariableInputs,
  type VariableInputsState,
} from "@/lib/actions/variables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export interface VariableInputsDefaults {
  month: string;
  agencyCollected: number;
  rodrigoAmbassadorBonus: boolean;
  funsexRefundsOk: boolean;
}

function SaveBtn({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : saved ? (
        <>
          <Check className="h-4 w-4" /> Guardado
        </>
      ) : (
        "Guardar datos del mes"
      )}
    </Button>
  );
}

export function VariableInputsForm({
  defaults,
}: {
  defaults: VariableInputsDefaults;
}) {
  const [state, formAction] = useFormState<VariableInputsState, FormData>(
    saveVariableInputs,
    { ok: false, savedAt: null }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Datos del mes (a mano)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Lo que la app no rastrea sola. Afecta al variable de Rodrigo y al tuyo.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="month" value={defaults.month} />
          <div className="space-y-1.5">
            <Label htmlFor="agencyCollected">
              30% de agency cobrado este mes (€)
            </Label>
            <Input
              id="agencyCollected"
              name="agencyCollected"
              type="number"
              min={0}
              step="0.01"
              defaultValue={defaults.agencyCollected || ""}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Rodrigo cobra el 5% de esta cifra.
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-md border border-input bg-card p-3">
            <span className="text-sm font-medium">
              Primer mes con más de 20 embajadores activos
              <span className="block text-xs font-normal text-muted-foreground">
                Activa el bono único de 100 € a Rodrigo.
              </span>
            </span>
            <input
              type="checkbox"
              name="rodrigoAmbassadorBonus"
              defaultChecked={defaults.rodrigoAmbassadorBonus}
              className="h-6 w-6 accent-[hsl(var(--primary))]"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-md border border-input bg-card p-3">
            <span className="text-sm font-medium">
              Reembolsos de FunSex por debajo del 8%
              <span className="block text-xs font-normal text-muted-foreground">
                Condición para pagar tu Variable B de FunSex (en septiembre).
              </span>
            </span>
            <input
              type="checkbox"
              name="funsexRefundsOk"
              defaultChecked={defaults.funsexRefundsOk}
              className="h-6 w-6 accent-[hsl(var(--primary))]"
            />
          </label>

          <div className="flex items-center gap-3">
            <SaveBtn saved={state.ok} />
            {state.ok && <span className="text-sm text-ok">Guardado.</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

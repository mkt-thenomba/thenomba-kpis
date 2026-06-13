"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SemaforoDot } from "@/components/kpi/semaforo";
import type { SemaforoEstado } from "@/lib/metrics";

function estadoFor(
  value: number,
  threshold: number | undefined,
  higherIsBetter: boolean
): SemaforoEstado | null {
  if (threshold === undefined) return null;
  const meets = higherIsBetter ? value >= threshold : value <= threshold;
  return meets ? "ok" : "bad";
}

/** Campo numérico grande con semáforo en vivo según el umbral. */
export function NumberField({
  name,
  label,
  defaultValue,
  threshold,
  higherIsBetter = true,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: number;
  threshold?: number;
  higherIsBetter?: boolean;
  hint?: string;
}) {
  const [value, setValue] = useState<number>(defaultValue);
  const estado = estadoFor(value, threshold, higherIsBetter);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={name}>{label}</Label>
        {estado && <SemaforoDot estado={estado} />}
      </div>
      <Input
        id={name}
        name={name}
        type="number"
        min={0}
        inputMode="numeric"
        defaultValue={defaultValue}
        onChange={(e) => setValue(parseInt(e.target.value || "0", 10))}
        className="text-lg font-semibold"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Interruptor sí/no (checkbox grande). */
export function ToggleField({
  name,
  label,
  defaultChecked,
  hint,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
  hint?: string;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label
      htmlFor={name}
      className="flex cursor-pointer items-center justify-between rounded-md border border-input bg-card p-3"
    >
      <div>
        <span className="text-sm font-medium">{label}</span>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="h-6 w-6 accent-[hsl(var(--primary))]"
      />
    </label>
  );
}

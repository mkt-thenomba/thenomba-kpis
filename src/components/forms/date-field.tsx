"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fecha } from "@/lib/format";

/**
 * Selector del día que se está registrando. Al cambiarlo, recarga la pantalla
 * con los datos de ese día (para editarlo o recuperar uno que se pasó). Su
 * valor viaja con el formulario (name="date"), así que al guardar se asigna a
 * la fecha elegida.
 */
export function DateField({
  value,
  isToday,
  basePath,
  name = "date",
}: {
  value: string; // ISO yyyy-mm-dd
  isToday: boolean;
  basePath: string; // p. ej. "/josep"
  name?: string;
}) {
  const router = useRouter();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>Día que estás registrando</Label>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          id={name}
          name={name}
          type="date"
          defaultValue={value}
          onChange={(e) => {
            if (e.target.value) router.push(`${basePath}?date=${e.target.value}`);
          }}
          className="max-w-[220px]"
        />
        {!isToday && (
          <span className="text-sm text-warn">
            Registrando el {fecha(value)} (no hoy).{" "}
            <button
              type="button"
              onClick={() => router.push(basePath)}
              className="underline"
            >
              Volver a hoy
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

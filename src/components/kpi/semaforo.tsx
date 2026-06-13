import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { SemaforoEstado, SemaforoResult } from "@/lib/metrics";

const DOT: Record<SemaforoEstado, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
};

const LABEL: Record<SemaforoEstado, string> = {
  ok: "Cumple",
  warn: "Atención",
  bad: "Por debajo",
};

/** Punto de semáforo (verde / ámbar / rojo). */
export function SemaforoDot({
  estado,
  className,
}: {
  estado: SemaforoEstado;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block h-3 w-3 rounded-full", DOT[estado], className)}
      aria-label={LABEL[estado]}
      title={LABEL[estado]}
    />
  );
}

/**
 * Semáforo completo: punto + etiqueta, y si el KPI lleva días sostenidos por
 * debajo del umbral, un aviso de lectura (no solo el número).
 */
export function Semaforo({
  result,
  showLabel = true,
  className,
}: {
  result: SemaforoResult;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SemaforoDot estado={result.estado} />
      {showLabel && (
        <span
          className={cn(
            "text-sm font-medium",
            result.estado === "ok" && "text-ok",
            result.estado === "warn" && "text-warn",
            result.estado === "bad" && "text-bad"
          )}
        >
          {LABEL[result.estado]}
        </span>
      )}
      {result.sustained && (
        <span className="inline-flex items-center gap-1 rounded-full bg-bad/10 px-2 py-0.5 text-xs font-semibold text-bad">
          <AlertTriangle className="h-3 w-3" />
          5 días bajo umbral
        </span>
      )}
    </div>
  );
}

/** Aviso de lectura destacado para colocar junto a un bloque. */
export function AvisoSostenido({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-bad/30 bg-bad/5 p-3 text-sm text-bad">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{texto}</span>
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/kpi/progress-bar";
import { Semaforo } from "@/components/kpi/semaforo";
import { cn } from "@/lib/utils";
import type { SemaforoResult } from "@/lib/metrics";

/**
 * Tarjeta de KPI reutilizable: título, valor grande, (opcional) objetivo con
 * barra de progreso y (opcional) semáforo. Formatear el valor fuera con las
 * funciones de lib/format.
 */
export function KpiCard({
  title,
  value,
  hint,
  target,
  progressPct,
  semaforo,
  className,
}: {
  title: string;
  value: string;
  hint?: string;
  target?: string;
  progressPct?: number;
  semaforo?: SemaforoResult;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {semaforo && <Semaforo result={semaforo} showLabel={false} />}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {target && (
        <p className="mt-1 text-sm text-muted-foreground">
          Objetivo: <span className="font-medium text-foreground">{target}</span>
        </p>
      )}
      {progressPct !== undefined && (
        <ProgressBar pct={progressPct} className="mt-3" />
      )}
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      {semaforo?.sustained && (
        <p className="mt-2 text-xs font-semibold text-bad">
          ⚠ Lleva 5 días por debajo del umbral
        </p>
      )}
    </Card>
  );
}

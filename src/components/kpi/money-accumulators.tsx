import { Card } from "@/components/ui/card";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RevenueAccumulators } from "@/lib/metrics";

/**
 * Acumulado de facturación en tres horizontes: semana, mes y año.
 * Todo el dinero sale del registro de ventas (regla rectora), nunca de
 * atribuciones. Se reutiliza en el panel, el informe y el registro de ventas.
 */
export function MoneyAccumulators({
  data,
  title = "Facturación acumulada",
  className,
}: {
  data: RevenueAccumulators;
  title?: string;
  className?: string;
}) {
  const tiles = [
    { label: "Semana", value: data.week },
    { label: "Mes", value: data.month },
    { label: "Año", value: data.year },
  ];
  return (
    <Card className={cn("p-5", className)}>
      <p className="mb-3 text-sm font-medium text-muted-foreground">{title}</p>
      <div className="grid grid-cols-3 divide-x divide-border">
        {tiles.map((t) => (
          <div key={t.label} className="px-2 first:pl-0 last:pr-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {eur(t.value)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

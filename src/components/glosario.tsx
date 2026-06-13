import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlosarioItem {
  term: string;
  def: string;
}

/**
 * Glosario lateral: explica, casilla por casilla, qué significa cada campo del
 * apartado. Pensado para que quien carga los datos (no técnico) sepa
 * exactamente qué meter en cada sitio.
 */
export function Glosario({
  items,
  title = "Glosario",
  className,
}: {
  items: GlosarioItem[];
  title?: string;
  className?: string;
}) {
  return (
    <Card className={cn("bg-secondary/40", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Qué significa cada casilla.
        </p>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {items.map((it) => (
            <div key={it.term}>
              <dt className="text-sm font-semibold">{it.term}</dt>
              <dd className="text-sm leading-snug text-muted-foreground">
                {it.def}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

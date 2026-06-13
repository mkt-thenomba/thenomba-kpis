import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eurCents } from "@/lib/format";
import type { PersonVariable } from "@/lib/variables";

export function PersonVariableCard({ person }: { person: PersonVariable }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{person.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{person.role}</p>
          </div>
          <Badge variant={person.gateOk ? "ok" : "bad"}>
            {person.gateOk ? "Cobra" : "Sin variable"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">
          {eurCents(person.total)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">a pagar este mes</p>

        <ul className="mt-4 space-y-2 border-t border-border pt-3">
          {person.lines.map((l, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
              <span>
                {l.label}
                {l.detail && (
                  <span className="block text-xs text-muted-foreground">
                    {l.detail}
                  </span>
                )}
              </span>
              <span className="shrink-0 tabular-nums font-medium">
                {eurCents(l.value)}
              </span>
            </li>
          ))}
        </ul>

        {person.gateNote && (
          <p className="mt-3 text-xs text-muted-foreground">{person.gateNote}</p>
        )}
      </CardContent>
    </Card>
  );
}

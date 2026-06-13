import { requireRole } from "@/lib/guards";
import { dayStart } from "@/lib/dates";
import { monthKey } from "@/lib/metrics";
import { getVariables } from "@/lib/variables";
import { VariableInputsForm } from "@/components/variables/inputs-form";
import { PersonVariableCard } from "@/components/variables/person-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { eurCents, mesLargo } from "@/lib/format";

// Meses operativos (jun–dic 2026).
const MONTHS = [
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
  "2026-10",
  "2026-11",
  "2026-12",
];

export default async function VariablesPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  await requireRole("ADMIN");

  const today = dayStart(new Date());
  const current = monthKey(today);
  const month =
    searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month)
      ? searchParams.month
      : MONTHS.includes(current)
        ? current
        : "2026-06";

  const v = await getVariables(month);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sueldos variables</h1>
          <p className="text-muted-foreground">
            Cuánto cobra cada uno este mes, calculado con los datos reales.
          </p>
        </div>
        {/* Selector de mes (GET) */}
        <form method="get" className="flex items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="month">Mes</Label>
            <Select id="month" name="month" defaultValue={month}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {mesLargo(m)}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="outline">
            Ver
          </Button>
        </form>
      </div>

      {/* Total a pagar */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="text-sm opacity-80">Total a pagar en {mesLargo(month)}</p>
            <p className="text-4xl font-bold tracking-tight">
              {eurCents(v.total)}
            </p>
          </div>
          <p className="max-w-xs text-sm opacity-80">
            Suma de los variables de Josep, Rodrigo y Pablo. Se paga en el cierre
            del primer lunes del mes siguiente.
          </p>
        </CardContent>
      </Card>

      {/* Desglose por persona */}
      <div className="grid gap-4 lg:grid-cols-3">
        <PersonVariableCard person={v.josep} />
        <PersonVariableCard person={v.rodrigo} />
        <PersonVariableCard person={v.pablo} />
      </div>

      {/* Datos manuales del mes */}
      <VariableInputsForm
        defaults={{
          month,
          agencyCollected: v.inputs.agencyCollected,
          rodrigoAmbassadorBonus: v.inputs.rodrigoAmbassadorBonus,
          funsexRefundsOk: v.inputs.funsexRefundsOk,
        }}
      />

      <p className="text-xs text-muted-foreground">
        Las fórmulas salen del documento de estructura del área de ventas. El
        dinero y las ventas reales se cuentan desde el registro de ventas; las
        atribuciones, desde las cargas diarias. Nada de esto altera el total de
        compañía.
      </p>
    </div>
  );
}

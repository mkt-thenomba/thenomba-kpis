import { requireRole } from "@/lib/guards";
import { dayStart } from "@/lib/dates";
import { getPanelData } from "@/lib/panel-data";
import { getLoadReminder } from "@/lib/metrics";
import { PanelView } from "@/components/panel/panel-view";
import { MiLectura } from "@/components/panel/mi-lectura";
import { ReportActions } from "@/components/panel/report-actions";
import { AvisoSostenido } from "@/components/kpi/semaforo";
import { Card, CardContent } from "@/components/ui/card";
import { fecha, fechaLarga } from "@/lib/format";

export default async function PanelPage() {
  // ADMIN: panel completo (acciones + Mi lectura editable).
  // VIEWER (Jose Lerín): mismo resumen pero en solo lectura.
  const user = await requireRole("ADMIN", "VIEWER");
  const isAdmin = user.role === "ADMIN";
  const today = dayStart(new Date());

  const [data, reminder] = await Promise.all([
    getPanelData(today),
    getLoadReminder(today),
  ]);

  const pendientes: string[] = [];
  if (reminder.josepPending) pendientes.push("Josep");
  if (reminder.rodrigoPending) pendientes.push("Rodrigo");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isAdmin ? "Panel de dirección" : "Panel de resumen"}
          </h1>
          <p className="text-muted-foreground">{fechaLarga(today)}</p>
        </div>
        {isAdmin && <ReportActions />}
      </div>

      {isAdmin && pendientes.length > 0 && (
        <AvisoSostenido
          texto={`Sin carga del ${fecha(reminder.previousWorkday)}: ${pendientes.join(" y ")}. Pídeles que registren el día antes de leer los datos.`}
        />
      )}

      <PanelView data={data} />

      {isAdmin ? (
        <MiLectura defaultValue={data.pabloReading} />
      ) : (
        <Card>
          <CardContent className="pt-5">
            <h2 className="mb-2 text-lg font-semibold">Mi lectura</h2>
            {data.pabloReading.trim() ? (
              <p className="whitespace-pre-wrap leading-relaxed">
                {data.pabloReading}
              </p>
            ) : (
              <p className="text-muted-foreground">
                (Sin análisis escrito todavía.)
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

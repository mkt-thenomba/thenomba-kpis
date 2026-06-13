import { requireRole } from "@/lib/guards";
import { dayStart } from "@/lib/dates";
import { getPanelData } from "@/lib/panel-data";
import { getLoadReminder } from "@/lib/metrics";
import { PanelView } from "@/components/panel/panel-view";
import { MiLectura } from "@/components/panel/mi-lectura";
import { ReportActions } from "@/components/panel/report-actions";
import { AvisoSostenido } from "@/components/kpi/semaforo";
import { fecha, fechaLarga } from "@/lib/format";

export default async function PanelPage() {
  await requireRole("ADMIN");
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
          <h1 className="text-2xl font-bold tracking-tight">Panel de dirección</h1>
          <p className="text-muted-foreground">{fechaLarga(today)}</p>
        </div>
        <ReportActions />
      </div>

      {pendientes.length > 0 && (
        <AvisoSostenido
          texto={`Sin carga del ${fecha(reminder.previousWorkday)}: ${pendientes.join(" y ")}. Pídeles que registren el día antes de leer los datos.`}
        />
      )}

      <PanelView data={data} />

      <MiLectura defaultValue={data.pabloReading} />
    </div>
  );
}

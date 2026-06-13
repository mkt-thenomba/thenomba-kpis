import { format } from "date-fns";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { dayStart } from "@/lib/dates";
import {
  getJosepWeek,
  getJosepMonth,
  getLoadReminder,
  monthKey,
} from "@/lib/metrics";
import { JosepForm, type JosepDefaults } from "@/components/forms/josep-form";
import { KpiCard } from "@/components/kpi/kpi-card";
import { AvisoSostenido } from "@/components/kpi/semaforo";
import { fecha, fechaLarga, pct, num } from "@/lib/format";

export default async function JosepPage() {
  await requireRole("ADMIN", "INBOUND");

  const today = dayStart(new Date());
  const todayISO = format(today, "yyyy-MM-dd");

  const [existing, week, month, reminder] = await Promise.all([
    prisma.josepDaily.findUnique({ where: { date: today } }),
    getJosepWeek(today),
    getJosepMonth(monthKey(today)),
    getLoadReminder(today),
  ]);

  const defaults: JosepDefaults = {
    date: todayISO,
    callContacts: existing?.callContacts ?? 0,
    whatsappSlaMet: existing?.whatsappSlaMet ?? false,
    whatsappProactive: existing?.whatsappProactive ?? 0,
    leadsWithoutNextAction: existing?.leadsWithoutNextAction ?? 0,
    touchpointsLogged: existing?.touchpointsLogged ?? false,
    attributedSales: existing?.attributedSales ?? 0,
    failedPaymentsRecovered: existing?.failedPaymentsRecovered ?? 0,
    notes: existing?.notes ?? "",
    existed: !!existing,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Carga diaria · Josep</h1>
        <p className="text-muted-foreground">{fechaLarga(today)}</p>
      </div>

      {reminder.josepPending && (
        <AvisoSostenido
          texto={`Falta la carga del ${fecha(reminder.previousWorkday)}. Recuerda registrar también ese día.`}
        />
      )}

      <JosepForm defaults={defaults} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Mi semana de un vistazo</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="Contactos de la semana"
            value={num(week.contacts)}
            target={`${num(week.contactsTarget)}`}
            progressPct={week.contactsProgress.pct}
            semaforo={week.semContacts}
          />
          <KpiCard
            title="SLA de WhatsApp"
            value={pct(week.slaPct, true)}
            target="≥ 90 %"
            semaforo={week.semSla}
          />
          <KpiCard
            title="Ventas atribuidas (mes)"
            value={num(month.attributedSales)}
            target={
              month.attributedTarget > 0 ? num(month.attributedTarget) : "—"
            }
            progressPct={month.attributedProgress.pct}
            hint="No suman al total de compañía"
          />
        </div>
      </div>
    </div>
  );
}

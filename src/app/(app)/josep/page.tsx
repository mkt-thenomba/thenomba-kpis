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
import { Glosario, type GlosarioItem } from "@/components/glosario";
import { fecha, fechaLarga, pct, num } from "@/lib/format";

// Definiciones de las casillas de la carga de Josep. Son reglas de negocio:
// ajústalas si alguna no coincide con cómo lo medís.
const JOSEP_GLOSARIO: GlosarioItem[] = [
  {
    term: "Contactos por llamada (>60s)",
    def: "Llamadas atendidas de más de 60 segundos durante el día (conversaciones reales, no llamadas perdidas).",
  },
  {
    term: "Contactos sin próxima acción",
    def: "Leads con los que has hablado pero que se quedan sin un siguiente paso agendado. El objetivo es 0: todos deben tener próxima acción.",
  },
  {
    term: "WhatsApp proactivos",
    def: "Mensajes de WhatsApp que inicias tú para mover un lead (no cuentan las respuestas a mensajes entrantes).",
  },
  {
    term: "WhatsApp Leads (entrantes)",
    def: "Leads nuevos que han escrito por WhatsApp pidiendo información ese día (conversaciones entrantes nuevas, no seguimientos).",
  },
  {
    term: "Ventas atribuidas",
    def: "Ventas cerradas que en los últimos 30 días han pasado por una llamada o un WhatsApp tuyo. No suman al total del equipo: solo indican tu aportación.",
  },
  {
    term: "Pagos fallidos recuperados",
    def: "Cobros que fallaron (tarjeta rechazada, cuota impagada…) y que has logrado recuperar tras gestionarlos.",
  },
  {
    term: "SLA de WhatsApp cumplido",
    def: "Marca sí si ese día respondiste todos los WhatsApp entrantes en menos de 2 horas.",
  },
  {
    term: "Touchpoints registrados",
    def: "Marca sí si has anotado los puntos de contacto (dosier, clase muestra, llamada…) de los leads del día.",
  },
];

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
    whatsappLeads: existing?.whatsappLeads ?? 0,
    leadsWithoutNextAction: existing?.leadsWithoutNextAction ?? 0,
    touchpointsLogged: existing?.touchpointsLogged ?? false,
    attributedSales: existing?.attributedSales ?? 0,
    failedPaymentsRecovered: existing?.failedPaymentsRecovered ?? 0,
    notes: existing?.notes ?? "",
    existed: !!existing,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Carga diaria · Josep</h1>
        <p className="text-muted-foreground">{fechaLarga(today)}</p>
      </div>

      {reminder.josepPending && (
        <AvisoSostenido
          texto={`Falta la carga del ${fecha(reminder.previousWorkday)}. Recuerda registrar también ese día.`}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
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
                hint="No suman al total del equipo"
              />
            </div>
          </div>
        </div>

        <Glosario className="h-fit xl:sticky xl:top-20" items={JOSEP_GLOSARIO} />
      </div>
    </div>
  );
}

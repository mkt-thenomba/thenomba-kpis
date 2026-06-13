import { format } from "date-fns";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { dayStart } from "@/lib/dates";
import { getRodrigoWeek, getRodrigoMonth, getLoadReminder, monthKey } from "@/lib/metrics";
import { RodrigoForm, type RodrigoDefaults } from "@/components/forms/rodrigo-form";
import { KpiCard } from "@/components/kpi/kpi-card";
import { AvisoSostenido } from "@/components/kpi/semaforo";
import { fecha, fechaLarga, num } from "@/lib/format";
import type { Tramo } from "@/types/domain";

export default async function RodrigoPage() {
  await requireRole("ADMIN", "AGENCY");

  const today = dayStart(new Date());
  const todayISO = format(today, "yyyy-MM-dd");

  const [existing, week, month, reminder] = await Promise.all([
    prisma.rodrigoDaily.findUnique({ where: { date: today } }),
    getRodrigoWeek(today),
    getRodrigoMonth(monthKey(today)),
    getLoadReminder(today),
  ]);

  const defaults: RodrigoDefaults = {
    date: todayISO,
    newProspects: existing?.newProspects ?? 0,
    prospectsIberoamerica: existing?.prospectsIberoamerica ?? 0,
    ambassadorsSigned: existing?.ambassadorsSigned ?? 0,
    verifiedPosts: existing?.verifiedPosts ?? 0,
    bitlyClicks: existing?.bitlyClicks ?? 0,
    agencyPieces: existing?.agencyPieces ?? 0,
    networkContacted14d: existing?.networkContacted14d ?? false,
    attributableSales: existing?.attributableSales ?? 0,
    tramo: (existing?.tramo as Tramo) ?? "MIXTO",
    notes: existing?.notes ?? "",
    existed: !!existing,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Carga diaria · Rodrigo
        </h1>
        <p className="text-muted-foreground">{fechaLarga(today)}</p>
      </div>

      {reminder.rodrigoPending && (
        <AvisoSostenido
          texto={`Falta la carga del ${fecha(reminder.previousWorkday)}. Recuerda registrar también ese día.`}
        />
      )}

      <RodrigoForm defaults={defaults} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Mi semana de un vistazo</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="Captaciones de la semana"
            value={num(week.prospects)}
            target={num(week.prospectsTarget)}
            progressPct={week.prospects ? (week.prospects / week.prospectsTarget) * 100 : 0}
            semaforo={week.semProspects}
          />
          <KpiCard
            title="Publicaciones verificadas"
            value={num(week.verifiedPosts)}
            target={`≥ ${num(week.verifiedPostsTarget)}`}
            semaforo={week.semPosts}
          />
          <KpiCard
            title="Clicks Bitly (mes)"
            value={num(month.bitlyClicks)}
            target={`≥ ${num(month.bitlyTarget)}`}
            progressPct={month.bitlyProgress.pct}
            semaforo={month.semBitly}
          />
        </div>
      </div>
    </div>
  );
}

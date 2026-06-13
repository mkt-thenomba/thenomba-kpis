import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi/kpi-card";
import { ProgressBar } from "@/components/kpi/progress-bar";
import { SemaforoDot } from "@/components/kpi/semaforo";
import { Badge } from "@/components/ui/badge";
import { ChannelChart } from "@/components/charts/channel-chart";
import { BarList } from "@/components/charts/bar-list";
import { MoneyAccumulators } from "@/components/kpi/money-accumulators";
import { eur, num, pct, fecha, mesLargo } from "@/lib/format";
import {
  ENTRY_CHANNEL_LABELS,
  TOUCHPOINT_LABELS,
  type EntryChannel,
  type Touchpoint,
} from "@/types/domain";
import { Check, Clock } from "lucide-react";
import type { PanelData } from "@/lib/panel-data";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-2 text-lg font-semibold tracking-tight">{children}</h2>
  );
}

export function PanelView({ data }: { data: PanelData }) {
  const { company, gate, projection, josepWeek, josepMonth, rodrigoMonth, funsex } =
    data;

  const channelData = data.salesByChannel.map((c) => ({
    label: ENTRY_CHANNEL_LABELS[c.channel as EntryChannel] ?? c.channel,
    count: c.count,
  }));

  const touchpointItems = data.touchpoints.map((t) => ({
    label: TOUCHPOINT_LABELS[t.touchpoint as Touchpoint] ?? t.touchpoint,
    value: t.count,
    suffix: `${t.count} · ${pct(t.pct, true)}`,
  }));

  const codeItems = data.byCode.map((c) => ({
    label: c.code,
    value: c.count,
    suffix: `${c.count} · ${eur(c.revenue)}`,
  }));

  return (
    <div className="space-y-8">
      {/* ── CABECERA: COMPAÑÍA (fuente de verdad) ── */}
      <section>
        <SectionTitle>Equipo Ventas B2C · {mesLargo(data.month)}</SectionTitle>
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            title="Ventas reales del equipo"
            value={num(company.salesCount)}
            target={num(company.salesTarget)}
            progressPct={company.salesProgress.pct}
            hint="Contadas solo desde el registro de ventas"
          />
          <KpiCard
            title="Facturación acumulada"
            value={eur(company.revenue)}
            target={eur(company.revenueTarget)}
            progressPct={company.revenueProgress.pct}
          />
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Puerta de los 50.000 €
              </p>
              <SemaforoDot estado={gate.semaforo.estado} />
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {eur(gate.revenue)}
            </p>
            <ProgressBar pct={gate.pct} className="mt-3" />
            <p className="mt-2 text-sm">
              {gate.passed ? (
                <span className="font-medium text-ok">Puerta superada</span>
              ) : (
                <span className="text-muted-foreground">
                  Faltan {eur(gate.threshold - gate.revenue)} para superarla
                </span>
              )}
            </p>
          </Card>
        </div>

        {/* Facturación acumulada: semana / mes / año (toda desde Sale) */}
        <MoneyAccumulators data={data.revenue} className="mt-4" />

        {/* Proyección de cierre */}
        <Card className="mt-4 p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Proyección de cierre de mes
          </p>
          <p className="mt-2 text-base">
            A este ritmo cierras en{" "}
            <span className="font-bold">{eur(projection.projectedRevenue)}</span>{" "}
            ({num(projection.projectedSales)} ventas).{" "}
            {projection.daysRemaining > 0 ? (
              <>
                Para llegar al objetivo necesitas{" "}
                <span className="font-bold">
                  {eur(Math.round(projection.revenuePerDayNeeded))}
                </span>{" "}
                y{" "}
                <span className="font-bold">
                  {num(projection.salesPerDayNeeded)} ventas
                </span>{" "}
                al día durante los {projection.daysRemaining} días que quedan.
              </>
            ) : (
              <>Mes cerrado.</>
            )}
          </p>
          <div className="mt-3">
            {projection.onTrack ? (
              <Badge variant="ok">En camino al objetivo</Badge>
            ) : (
              <Badge variant="bad">Por debajo del objetivo</Badge>
            )}
          </div>
        </Card>
      </section>

      {/* ── BLOQUE A: JOSEP ── */}
      <section>
        <SectionTitle>Bloque A · Josep (captación entrante)</SectionTitle>
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard
            title="Contactos de la semana"
            value={num(josepWeek.contacts)}
            target={num(josepWeek.contactsTarget)}
            progressPct={josepWeek.contactsProgress.pct}
            semaforo={josepWeek.semContacts}
          />
          <KpiCard
            title="SLA de WhatsApp"
            value={pct(josepWeek.slaPct, true)}
            target="≥ 90 %"
            semaforo={josepWeek.semSla}
          />
          <KpiCard
            title="Ventas atribuidas (mes)"
            value={num(josepMonth.attributedSales)}
            target={josepMonth.attributedTarget > 0 ? num(josepMonth.attributedTarget) : "—"}
            progressPct={josepMonth.attributedProgress.pct}
            hint="No suman al total del equipo"
          />
          <KpiCard
            title="Conversión contacto→venta"
            value={pct(josepWeek.conversionPct, true)}
            target="≥ 4 %"
            semaforo={josepWeek.semConversion}
          />
        </div>
      </section>

      {/* ── BLOQUE B: VENTAS ── */}
      <section>
        <SectionTitle>Bloque B · Ventas</SectionTitle>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ventas por canal de entrada</CardTitle>
            </CardHeader>
            <CardContent>
              <ChannelChart data={channelData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Touchpoints que más convierten
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                En cuántas ventas cerradas aparece cada uno
              </p>
            </CardHeader>
            <CardContent>
              <BarList items={touchpointItems} emptyText="Sin ventas en el mes." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tiempo medio lead→venta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {data.avgLeadToSale === null
                  ? "—"
                  : `${num(data.avgLeadToSale)} días`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Desde la entrada del lead hasta el cierre
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Desglose por código</CardTitle>
            </CardHeader>
            <CardContent>
              <BarList items={codeItems} emptyText="Sin ventas en el mes." />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── BLOQUE C: RODRIGO ── */}
      <section>
        <SectionTitle>Bloque C · Rodrigo (agencia)</SectionTitle>
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard
            title="Atribuibles · Top (mes)"
            value={num(rodrigoMonth.attributableByTramo.TOP)}
            target={rodrigoMonth.topTarget > 0 ? num(rodrigoMonth.topTarget) : "—"}
            progressPct={rodrigoMonth.topProgress.pct}
            hint="No suman al total del equipo"
          />
          <KpiCard
            title="Atribuibles · Resto (mes)"
            value={num(rodrigoMonth.attributableByTramo.RESTO)}
            target={rodrigoMonth.restoTarget > 0 ? num(rodrigoMonth.restoTarget) : "—"}
            progressPct={rodrigoMonth.restoProgress.pct}
            hint="No suman al total del equipo"
          />
          <KpiCard
            title="Clicks de Bitly (mes)"
            value={num(rodrigoMonth.bitlyClicks)}
            target={`≥ ${num(rodrigoMonth.bitlyTarget)}`}
            progressPct={rodrigoMonth.bitlyProgress.pct}
            semaforo={rodrigoMonth.semBitly}
          />
          <KpiCard
            title="Embajadores firmados (mes)"
            value={num(rodrigoMonth.ambassadors)}
          />
        </div>
      </section>

      {/* ── BLOQUE FUNSEX ── */}
      <section>
        <SectionTitle>FunSex · lista de interesados</SectionTitle>
        <Card>
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Lista actual</p>
                <p className="text-4xl font-bold">{num(funsex.total)}</p>
                {funsex.lastUpdate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Actualizada el {fecha(funsex.lastUpdate)}
                  </p>
                )}
              </div>
              {funsex.nextMilestone && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Próximo hito</p>
                  <p className="text-lg font-semibold">
                    ≥ {num(funsex.nextMilestone.min)} a {fecha(funsex.nextMilestone.date)}
                  </p>
                </div>
              )}
            </div>
            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {funsex.milestones.map((m) => (
                <li
                  key={m.date}
                  className="flex items-center gap-2 rounded-md border border-border p-3"
                >
                  {m.met ? (
                    <Check className="h-5 w-5 text-ok" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">≥ {num(m.min)}</p>
                    <p className="text-xs text-muted-foreground">
                      a {fecha(m.date)} · {m.met ? "cumplido" : "pendiente"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

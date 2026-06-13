import Link from "next/link";
import { requireRole } from "@/lib/guards";
import { dayStart } from "@/lib/dates";
import { getPanelData } from "@/lib/panel-data";
import { PanelView } from "@/components/panel/panel-view";
import { PrintButton } from "@/components/panel/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { fecha, fechaLarga } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

// Vista de presentación a pantalla completa, pensada para proyectar en la
// reunión del viernes. Sin navegación; todo ordenado y con la fecha del informe.
export default async function InformePage() {
  await requireRole("ADMIN");
  const today = dayStart(new Date());
  const data = await getPanelData(today);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Barra superior (no se imprime) */}
        <div className="no-print mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </Link>
          <PrintButton />
        </div>

        {/* Cabecera del informe */}
        <header className="mb-8 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
              TN
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                TheNomba · Informe de ventas
              </h1>
              <p className="text-muted-foreground">{fechaLarga(today)}</p>
            </div>
          </div>
        </header>

        <PanelView data={data} />

        {/* Mi lectura (texto consolidado, solo lectura en el informe) */}
        <section className="mt-8">
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
              {data.generatedAt && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Informe consolidado el {fecha(data.generatedAt)}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

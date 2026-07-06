"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveRodrigoDailyState, type SaveState } from "@/lib/actions/daily";
import { NumberField, ToggleField } from "@/components/forms/fields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TRAMOS, TRAMO_LABELS, type Tramo } from "@/types/domain";
import { Check } from "lucide-react";

export interface RodrigoDefaults {
  date: string;
  newProspects: number;
  prospectsIberoamerica: number;
  ambassadorsSigned: number;
  verifiedPosts: number;
  bitlyClicks: number;
  agencyPieces: number;
  networkContacted14d: boolean;
  attributableSales: number;
  tramo: Tramo;
  ambassadorsWithCode: number;
  ambassadorsActive: number;
  socialActions: number;
  outreachAttempts: number;
  outreachMeetings: number;
  outreachProposals: number;
  notes: string;
  existed: boolean;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function SubmitButton({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-44">
      {pending ? (
        "Guardando…"
      ) : saved ? (
        <>
          <Check className="h-4 w-4" /> Guardado
        </>
      ) : (
        "Guardar el día"
      )}
    </Button>
  );
}

export function RodrigoForm({ defaults }: { defaults: RodrigoDefaults }) {
  const [state, formAction] = useFormState<SaveState, FormData>(
    saveRodrigoDailyState,
    { ok: false, savedAt: null }
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="date" value={defaults.date} />
      <Card>
        <CardHeader>
          <CardTitle>Actividad del día</CardTitle>
          {defaults.existed && (
            <p className="text-sm text-muted-foreground">
              Ya había datos de hoy: los estás editando (no se duplica).
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ventas y captación */}
          <div className="space-y-3">
            <SectionLabel>Ventas y captación</SectionLabel>
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField
                name="attributableSales"
                label="Ventas atribuibles (no suman al total)"
                defaultValue={defaults.attributableSales}
              />
              <div className="space-y-1.5">
                <Label htmlFor="tramo">Tramo</Label>
                <Select id="tramo" name="tramo" defaultValue={defaults.tramo}>
                  {TRAMOS.map((t) => (
                    <option key={t} value={t}>
                      {TRAMO_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <NumberField
                name="newProspects"
                label="Captaciones nuevas"
                defaultValue={defaults.newProspects}
                hint="Objetivo semanal: 15"
              />
              <NumberField
                name="prospectsIberoamerica"
                label="De ellas, Iberoamérica"
                defaultValue={defaults.prospectsIberoamerica}
                hint="Objetivo semanal: ≥ 5"
              />
            </div>
          </div>

          {/* Embajadores */}
          <div className="space-y-3">
            <SectionLabel>Embajadores</SectionLabel>
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField
                name="ambassadorsWithCode"
                label="Embajadores con código"
                defaultValue={defaults.ambassadorsWithCode}
                hint="Total con acuerdo cerrado (foto de hoy)"
              />
              <NumberField
                name="ambassadorsActive"
                label="Embajadores activos"
                defaultValue={defaults.ambassadorsActive}
                hint="Han publicado algo esta semana"
              />
              <NumberField
                name="socialActions"
                label="Acciones en RRSS"
                defaultValue={defaults.socialActions}
                hint="Stories, posts, reels… (3 piezas = 3)"
              />
              <NumberField
                name="verifiedPosts"
                label="Publicaciones verificadas"
                defaultValue={defaults.verifiedPosts}
                hint="Objetivo semanal: ≥ 10"
              />
            </div>
          </div>

          {/* Captación de nuevos embajadores (embudo) */}
          <div className="space-y-3">
            <SectionLabel>Captación de nuevos embajadores</SectionLabel>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField
                name="outreachAttempts"
                label="Intentos"
                defaultValue={defaults.outreachAttempts}
                hint="Mensajes enviados"
              />
              <NumberField
                name="outreachMeetings"
                label="Reuniones"
                defaultValue={defaults.outreachMeetings}
                hint="Llamada o videollamada"
              />
              <NumberField
                name="outreachProposals"
                label="Propuestas"
                defaultValue={defaults.outreachProposals}
                hint="Propuesta enviada"
              />
              <NumberField
                name="ambassadorsSigned"
                label="Cierres"
                defaultValue={defaults.ambassadorsSigned}
                hint="Contrato firmado"
              />
            </div>
          </div>

          {/* Agency */}
          <div className="space-y-3">
            <SectionLabel>Agency</SectionLabel>
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField
                name="agencyPieces"
                label="Acciones de agency"
                defaultValue={defaults.agencyPieces}
                hint="Stories, posts, vídeos de YouTube…"
              />
              <NumberField
                name="bitlyClicks"
                label="Clicks de Bitly"
                defaultValue={defaults.bitlyClicks}
                hint="Objetivo mensual: ≥ 2.000"
              />
            </div>
          </div>

          <ToggleField
            name="networkContacted14d"
            label="Red contactada en los últimos 14 días"
            defaultChecked={defaults.networkContacted14d}
          />

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={defaults.notes}
              placeholder="Lo que quieras dejar anotado del día…"
            />
          </div>

          <div className="flex items-center gap-3">
            <SubmitButton saved={state.ok} />
            {state.ok && (
              <span className="text-sm text-ok">Cambios guardados.</span>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { generateWeeklyReport } from "@/lib/actions/report";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw } from "lucide-react";

function GenerateBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      {pending ? "Generando…" : "Generar informe del viernes"}
    </Button>
  );
}

export function ReportActions() {
  return (
    <div className="no-print flex flex-wrap gap-2">
      <form action={generateWeeklyReport}>
        <GenerateBtn />
      </form>
      <Button asChild>
        <Link href="/informe" target="_blank">
          <FileText className="h-4 w-4" />
          Presentar informe
        </Link>
      </Button>
    </div>
  );
}

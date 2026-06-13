import { cn } from "@/lib/utils";

/**
 * Barra de progreso hacia un objetivo. El color refleja el avance:
 * verde si va sobrado, ámbar si va justo, rojo si va muy por detrás.
 */
export function ProgressBar({
  pct,
  className,
  tone,
}: {
  pct: number; // 0-100
  className?: string;
  tone?: "auto" | "primary";
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  let color = "bg-primary";
  if (tone !== "primary") {
    if (clamped >= 80) color = "bg-ok";
    else if (clamped >= 50) color = "bg-warn";
    else color = "bg-bad";
  }
  return (
    <div
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// Lista de barras horizontales (server component, sin JS de cliente).
// Útil para rankings: touchpoints, desglose por código, etc.

export function BarList({
  items,
  emptyText = "Sin datos.",
}: {
  items: { label: string; value: number; suffix?: string }[];
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium">{it.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {it.suffix ?? it.value}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

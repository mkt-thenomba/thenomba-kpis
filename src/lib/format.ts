// Formato con locale es-ES: euros con € y separador de miles con punto,
// fechas dd/mm/aaaa, porcentajes. Toda la UI debe formatear a través de aquí
// para no esparcir `toLocaleString` por los componentes.

const EUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const EUR_CENTS = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUM = new Intl.NumberFormat("es-ES");

const FECHA = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const FECHA_LARGA = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Euros sin decimales: 32.000 € */
export function eur(value: number): string {
  return EUR.format(value);
}

/** Euros con céntimos: 1.234,50 € */
export function eurCents(value: number): string {
  return EUR_CENTS.format(value);
}

/** Número con separador de miles: 2.000 */
export function num(value: number): string {
  return NUM.format(value);
}

/** Porcentaje: pct(0.045) → "4,5 %" ; pct(4.5, true) → "4,5 %" si ya viene en escala 0-100 */
export function pct(value: number, alreadyPercent = false): string {
  const v = alreadyPercent ? value : value * 100;
  return `${NUM.format(Math.round(v * 10) / 10)} %`;
}

/** Fecha dd/mm/aaaa */
export function fecha(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return FECHA.format(d);
}

/** Fecha larga con la inicial en mayúscula: "Viernes, 13 de junio de 2026" */
export function fechaLarga(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const s = FECHA_LARGA.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Nombre del mes a partir de "aaaa-mm": "junio de 2026" */
export function mesLargo(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(d);
}

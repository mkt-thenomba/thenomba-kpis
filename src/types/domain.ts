// Tipos de dominio y etiquetas en castellano.
//
// Los "enums" se guardan como String en SQLite (ver schema.prisma). Aquí
// viven las uniones de TypeScript que los validan y los mapas de etiquetas
// que se muestran en la interfaz (siempre en castellano de España).

// ── Roles ──────────────────────────────────────────────────────────────
export const ROLES = ["ADMIN", "INBOUND", "AGENCY"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Dirección",
  INBOUND: "Captación entrante",
  AGENCY: "Agencia",
};

// ── Producto ─────────────────────────────────────────────────────────────
export const PRODUCTS = [
  "YOUTH",
  "TALENT",
  "EXECUTIVE",
  "LEGACY",
  "FUNSEX",
] as const;
export type Product = (typeof PRODUCTS)[number];

export const PRODUCT_LABELS: Record<Product, string> = {
  YOUTH: "Youth",
  TALENT: "Talent",
  EXECUTIVE: "Executive",
  LEGACY: "Legacy",
  FUNSEX: "FunSex",
};

// ── Forma de pago ─────────────────────────────────────────────────────────
export const PAYMENT_TYPES = ["UNICO", "CUOTAS", "SUSCRIPCION"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  UNICO: "Pago único",
  CUOTAS: "En cuotas",
  SUSCRIPCION: "Suscripción",
};

// ── Canal de entrada ──────────────────────────────────────────────────────
export const ENTRY_CHANNELS = [
  "TEST_FILOSOFIA",
  "DOSSIER",
  "VIDEO_MUESTRA",
  "MINIVIAJE",
  "WHATSAPP_DIRECTO",
  "SOLICITA_LLAMADA",
  "EMBAJADOR",
  "CAMPANA_PAGO",
  "ALADETRES",
  "ORGANICO",
] as const;
export type EntryChannel = (typeof ENTRY_CHANNELS)[number];

export const ENTRY_CHANNEL_LABELS: Record<EntryChannel, string> = {
  TEST_FILOSOFIA: "Test de filosofía",
  DOSSIER: "Dosier",
  VIDEO_MUESTRA: "Vídeo muestra",
  MINIVIAJE: "Miniviaje",
  WHATSAPP_DIRECTO: "WhatsApp directo",
  SOLICITA_LLAMADA: "Solicita llamada",
  EMBAJADOR: "Embajador",
  CAMPANA_PAGO: "Campaña de pago",
  ALADETRES: "Aladetres",
  ORGANICO: "Orgánico",
};

// ¿Qué canales se consideran "de pago"? (para coherencia con attributedPaid)
export const PAID_CHANNELS: EntryChannel[] = ["CAMPANA_PAGO"];

// ── Touchpoints (puntos de contacto presentes en una venta) ───────────────
export const TOUCHPOINTS = [
  "DOSSIER",
  "CLASE_MUESTRA",
  "TEST",
  "MINIVIAJE",
  "WHATSAPP",
  "LLAMADA",
  "SESION_PRIVADA",
  "PUERTAS_ABIERTAS",
  "EMAILS_CLAVE",
] as const;
export type Touchpoint = (typeof TOUCHPOINTS)[number];

export const TOUCHPOINT_LABELS: Record<Touchpoint, string> = {
  DOSSIER: "Dosier",
  CLASE_MUESTRA: "Clase muestra",
  TEST: "Test",
  MINIVIAJE: "Miniviaje",
  WHATSAPP: "WhatsApp",
  LLAMADA: "Llamada",
  SESION_PRIVADA: "Sesión privada",
  PUERTAS_ABIERTAS: "Puertas abiertas",
  EMAILS_CLAVE: "Emails clave",
};

// ── Tramo de Rodrigo ──────────────────────────────────────────────────────
export const TRAMOS = ["TOP", "RESTO", "MIXTO"] as const;
export type Tramo = (typeof TRAMOS)[number];

export const TRAMO_LABELS: Record<Tramo, string> = {
  TOP: "Top",
  RESTO: "Resto",
  MIXTO: "Mixto",
};

// ── Ámbito de objetivo ────────────────────────────────────────────────────
export const TARGET_SCOPES = [
  "COMPANY",
  "JOSEP",
  "RODRIGO_TOP",
  "RODRIGO_RESTO",
  "FUNSEX",
] as const;
export type TargetScope = (typeof TARGET_SCOPES)[number];

// ── Umbrales de los semáforos (reglas de negocio) ─────────────────────────
export const THRESHOLDS = {
  josepCallContactsDay: 50, // contactos/día mínimos
  josepCallContactsWeek: 250, // contactos/semana objetivo
  josepSlaPct: 90, // % SLA WhatsApp mínimo
  josepLeadsWithoutAction: 0, // máximo de leads sin acción
  josepConversionPct: 4, // conversión contacto→venta mínima (%)
  rodrigoProspectsWeek: 15, // captaciones/semana
  rodrigoIberoWeek: 5, // de ellas, Iberoamérica
  rodrigoVerifiedPostsWeek: 10, // publicaciones verificadas/semana
  rodrigoBitlyClicksMonth: 2000, // clicks Bitly/mes
  gate50k: 50000, // puerta de los 50.000 €
  sustainedDays: 5, // ventana "sostenido" para el aviso de lectura
} as const;

// Hitos de la lista de interesados de FunSex (fecha ISO → mínimo acumulado).
// Año operativo 2026.
export const FUNSEX_MILESTONES = [
  { date: "2026-06-30", min: 800 },
  { date: "2026-07-31", min: 1600 },
  { date: "2026-08-31", min: 2400 },
] as const;

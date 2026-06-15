// Seed de la base de datos.
//
//   1) Tres usuarios (Pablo/ADMIN, Josep/INBOUND, Rodrigo/AGENCY).
//   2) Objetivos EXACTOS de la dirección (no inventados) → src/lib/targets.
//   3) Lista de interesados FunSex (snapshots).
//   4) 2-3 semanas de datos de ejemplo realistas y coherentes con los
//      objetivos, para ver el panel lleno desde el primer arranque.
//
// Los datos de ejemplo se anclan a la fecha actual, así que el panel siempre
// se ve "fresco". Para vaciar solo los datos de ejemplo (manteniendo usuarios
// y objetivos): `npm run seed:reset`.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TARGET_SEEDS } from "../src/lib/targets";
import {
  PRODUCTS,
  PAYMENT_TYPES,
  ENTRY_CHANNELS,
  TOUCHPOINTS,
  type Product,
} from "../src/types/domain";

const prisma = new PrismaClient();

// ── PRNG determinista (mulberry32) para reproducibilidad ────────────────────
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260613);
const randInt = (min: number, max: number) =>
  Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;

// Precio de referencia por producto (€). Los importes reales llevan jitter.
const PRICE: Record<Product, number> = {
  YOUTH: 290,
  TALENT: 490,
  EXECUTIVE: 990,
  LEGACY: 1490,
  FUNSEX: 120,
};

// ── Fechas ──────────────────────────────────────────────────────────────────
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function isWeekend(d: Date): boolean {
  const g = d.getDay();
  return g === 0 || g === 6;
}
function previousWorkday(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - 1);
  while (isWeekend(x)) x.setDate(x.getDate() - 1);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

async function seedUsers() {
  const users = [
    { email: "pablo@thenomba.es", name: "Pablo Canela", role: "ADMIN", pass: "Pablo2026!" },
    { email: "josep@thenomba.es", name: "Josep Adolf", role: "INBOUND", pass: "Josep2026!" },
    { email: "rodrigo@thenomba.es", name: "Rodrigo Sangrador", role: "AGENCY", pass: "Rodrigo2026!" },
  ];
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.pass, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
    });
  }
  console.log(`✓ ${users.length} usuarios`);
}

async function seedTargets() {
  for (const t of TARGET_SEEDS) {
    await prisma.target.upsert({
      where: { month_scope: { month: t.month, scope: t.scope } },
      update: { salesTarget: t.salesTarget, revenueTarget: t.revenueTarget },
      create: t,
    });
  }
  console.log(`✓ ${TARGET_SEEDS.length} objetivos`);
}

async function seedFunsex(today: Date) {
  // 5 snapshots semanales acercándose al hito de 800 (a 30-jun).
  let total = 380;
  const snaps: { date: Date; total: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const date = startOfDay(addDays(today, -i * 7 - 1));
    snaps.push({ date, total });
    total += randInt(70, 110);
  }
  for (const s of snaps) {
    await prisma.funsexInterest.upsert({
      where: { date: s.date },
      update: { total: s.total },
      create: { date: s.date, total: s.total },
    });
  }
  console.log(`✓ ${snaps.length} snapshots FunSex (último: ${snaps.at(-1)?.total})`);
}

async function seedExampleData(today: Date) {
  // Rango: ~3 semanas hasta el día laborable anterior (deja hoy sin cargar).
  const lastDay = previousWorkday(today);
  let cursor = startOfDay(addDays(lastDay, -22));
  while (cursor.getDay() !== 1) cursor = addDays(cursor, 1); // arranca en lunes

  const weekdays: Date[] = [];
  for (let d = new Date(cursor); d <= lastDay; d = addDays(d, 1)) {
    if (!isWeekend(d)) weekdays.push(startOfDay(new Date(d)));
  }

  let totalSales = 0;
  let totalRevenue = 0;

  for (const day of weekdays) {
    // ── Josep (INBOUND) ──
    const contacts = randInt(44, 66);
    const josepAttr = randInt(0, 3);
    await prisma.josepDaily.upsert({
      where: { date: day },
      update: {},
      create: {
        date: day,
        callContacts: contacts,
        whatsappSlaMet: chance(0.85),
        whatsappProactive: randInt(5, 18),
        whatsappLeads: randInt(8, 25),
        leadsWithoutNextAction: chance(0.7) ? 0 : randInt(1, 3),
        touchpointsLogged: chance(0.9),
        attributedSales: josepAttr,
        failedPaymentsRecovered: chance(0.3) ? randInt(1, 2) : 0,
        notes: "",
      },
    });

    // ── Rodrigo (AGENCY) ──
    await prisma.rodrigoDaily.upsert({
      where: { date: day },
      update: {},
      create: {
        date: day,
        newProspects: randInt(2, 5),
        prospectsIberoamerica: randInt(0, 2),
        ambassadorsSigned: chance(0.25) ? 1 : 0,
        verifiedPosts: randInt(1, 3),
        bitlyClicks: randInt(70, 220),
        agencyPieces: randInt(1, 3),
        networkContacted14d: chance(0.8),
        attributableSales: randInt(0, 2),
        tramo: pick(["TOP", "RESTO", "MIXTO"] as const),
        notes: "",
      },
    });

    // ── Ventas (FUENTE DE VERDAD) ──
    // ~2-3 ventas por día laborable. El total real saldrá de contar estas filas.
    const salesToday = randInt(1, 3);
    for (let i = 0; i < salesToday; i++) {
      const product = pick(PRODUCTS.filter((p) => p !== "FUNSEX")); // FunSex arranca en julio
      const base = PRICE[product];
      const amount = Math.round((base * (0.9 + rnd() * 0.25)) / 5) * 5;
      const channel = pick(ENTRY_CHANNELS);
      const hasCode = chance(0.3);
      const leadDays = randInt(2, 45);
      const leadEntryDate = startOfDay(addDays(day, -leadDays));
      const tps = [...TOUCHPOINTS]
        .sort(() => rnd() - 0.5)
        .slice(0, randInt(1, 4));

      await prisma.sale.create({
        data: {
          saleDate: day,
          customerName: `Cliente ${totalSales + 1}`,
          product,
          amount,
          paymentType: pick(PAYMENT_TYPES),
          discountCode: hasCode ? pick(["VERANO", "AMIGO", "ALUMNI", "LANZA"]) : null,
          entryChannel: channel,
          leadEntryDate,
          daysLeadToSale: leadDays,
          attributedJosep: chance(0.55),
          attributedCode: hasCode,
          attributedPaid: channel === "CAMPANA_PAGO" ? true : chance(0.1),
          touchpoints: JSON.stringify(tps),
        },
      });
      totalSales++;
      totalRevenue += amount;
    }
  }
  console.log(
    `✓ Datos de ejemplo: ${weekdays.length} días laborables, ${totalSales} ventas reales, ${Math.round(totalRevenue)} € facturados`
  );
}

async function main() {
  const today = startOfDay(new Date());

  // Los datos de ejemplo NO se siembran en producción (Vercel). Localmente sí,
  // para ver el panel lleno. Forzable con SEED_EXAMPLE=true|false.
  const onVercel = !!process.env.VERCEL;
  const withExample = process.env.SEED_EXAMPLE
    ? process.env.SEED_EXAMPLE === "true"
    : !onVercel;

  console.log("Sembrando base de datos…");
  await seedUsers();
  await seedTargets();
  if (withExample) {
    await seedFunsex(today);
    await seedExampleData(today);
    console.log("Incluidos datos de ejemplo (entorno de desarrollo).");
  } else {
    console.log("Producción: solo usuarios y objetivos (sin datos de ejemplo).");
  }
  console.log("Listo. Contraseñas iniciales en el README.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

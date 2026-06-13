// Borra SOLO los datos de ejemplo (ventas, actividad diaria, informes y la
// lista de interesados FunSex), manteniendo usuarios y objetivos.
//
//   npm run seed:reset        → vacía los datos de ejemplo
//   npm run seed              → vuelve a llenarlos
//
// Útil para pasar de "panel de demostración" a "panel en producción" sin
// perder los logins ni los objetivos.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [sales, josep, rodrigo, funsex, reports] = await Promise.all([
    prisma.sale.deleteMany(),
    prisma.josepDaily.deleteMany(),
    prisma.rodrigoDaily.deleteMany(),
    prisma.funsexInterest.deleteMany(),
    prisma.weeklyReport.deleteMany(),
  ]);
  console.log("Datos de ejemplo borrados:");
  console.log(`  ventas: ${sales.count}`);
  console.log(`  días Josep: ${josep.count}`);
  console.log(`  días Rodrigo: ${rodrigo.count}`);
  console.log(`  snapshots FunSex: ${funsex.count}`);
  console.log(`  informes semanales: ${reports.count}`);
  console.log("Usuarios y objetivos intactos.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

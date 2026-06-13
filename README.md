# Panel de KPIs de Ventas B2C — TheNomba

Panel web para seguir las ventas B2C de TheNomba y preparar el informe de
dirección del viernes. Tres usuarios con tres vistas distintas.

> **Producción online**: la app se despliega en **Vercel** con **PostgreSQL
> (Neon)**. La guía paso a paso está en [`DEPLOY.md`](./DEPLOY.md).
> Lo de abajo es para ejecutarla en tu ordenador (desarrollo).

## Regla de oro (importante)

> El **número real de ventas de la compañía** sale **solo** del *Registro de
> ventas*. Las ventas **atribuidas** a Josep, a Rodrigo o al canal de pago
> **pueden solaparse** y **nunca se suman** para dar el total de compañía.

El panel está construido sobre esta regla: los totales de compañía se cuentan
únicamente desde el registro de ventas; las atribuciones se muestran siempre
etiquetadas como tales.

## Qué necesitas (una sola vez)

1. **Node.js** (versión 18 o superior). En un Mac con Homebrew:
   ```bash
   brew install node
   ```
2. Abre la carpeta del proyecto en una terminal:
   ```bash
   cd ~/thenomba-kpis
   ```

## Puesta en marcha

Para desarrollo local necesitas una base de datos **PostgreSQL** (lo más
sencillo: la cadena de conexión de tu base de datos Neon, o una rama de
desarrollo de Neon). Copia `.env.example` a `.env` y rellena `DATABASE_URL`.

```bash
# 1) Instala las dependencias
npm install

# 2) Crea las tablas en tu base de datos
npm run db:push

# 3) Rellena usuarios, objetivos y datos de ejemplo
npm run seed

# 4) Arranca la aplicación
npm run dev
```

Luego abre **http://localhost:3000** en el navegador.

> El paso 3, **en local**, deja el panel lleno con 2-3 semanas de datos de
> ejemplo para verlo funcionando. En Vercel (producción) el seed siembra solo
> usuarios y objetivos, sin datos de ejemplo.

## Usuarios y contraseñas iniciales

| Persona            | Correo                | Contraseña     | Ve…                          |
| ------------------ | --------------------- | -------------- | ---------------------------- |
| Pablo (Dirección)  | `pablo@thenomba.es`   | `Pablo2026!`   | Todo: panel, ventas, cargas  |
| Josep (Entrante)   | `josep@thenomba.es`   | `Josep2026!`   | Solo su pantalla de carga    |
| Rodrigo (Agencia)  | `rodrigo@thenomba.es` | `Rodrigo2026!` | Solo su pantalla de carga    |

### Cambiar una contraseña

Edita `prisma/seed.ts` (sección de usuarios), cambia el campo `pass` de la
persona y vuelve a ejecutar:

```bash
npm run seed
```

El `seed` actualiza los usuarios existentes (no los duplica) con la nueva
contraseña. El resto de datos no se ve afectado.

## Las pantallas

- **Panel de dirección** (`/`, solo Pablo): la pantalla del viernes. Ventas
  reales del mes vs objetivo, facturación, puerta de los 50.000 €, bloques de
  Josep, ventas, Rodrigo y FunSex, proyección de cierre y "Mi lectura".
- **Registro de ventas** (`/ventas`, solo Pablo): cargar cada venta. Los días
  entre la entrada del lead y la venta se calculan solos. Con filtros.
- **Carga de Josep** (`/josep`): su parte diaria, rellenable en ~30 s, con
  semáforos por KPI.
- **Carga de Rodrigo** (`/rodrigo`): igual de ágil, con sus KPIs.

## Botones del viernes

- **Generar informe del viernes**: consolida la semana en curso (lunes-viernes)
  desde los datos cargados y guarda el informe. Solo te queda escribir
  *"Mi lectura"*.
- **Presentar informe**: abre una vista limpia a pantalla completa con la fecha,
  pensada para proyectar en la reunión (y se puede imprimir o guardar como PDF
  desde el navegador).

## Semáforos

Cada KPI lleva un semáforo verde/rojo según su umbral. Si un indicador lleva
**5 días seguidos** por debajo del umbral (p. ej. SLA < 90 % o conversión < 4 %),
aparece además un **aviso de lectura** para que no se quede en "solo un número".

## Copia de seguridad

En producción los datos viven en la base de datos **Neon**. Neon hace copias
automáticas y permite "viajar en el tiempo" a un punto anterior desde su panel.
Para una copia manual puntual, desde el panel de Neon puedes exportar la base de
datos, o con `pg_dump` usando la cadena de conexión:

```bash
pg_dump "$DATABASE_URL" > thenomba-$(date +%Y%m%d).sql
```

## Empezar "en limpio" (quitar los datos de ejemplo)

Cuando quieras pasar del panel de demostración a usarlo de verdad:

```bash
npm run seed:reset
```

Esto borra **solo** los datos de ejemplo (ventas, cargas diarias, informes y la
lista de FunSex). **Mantiene** los usuarios y los objetivos. A partir de ahí
empiezas a cargar tus datos reales.

## Comandos útiles

| Comando              | Para qué                                             |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Arrancar la aplicación (modo desarrollo)             |
| `npm run build`      | Compilar para producción                             |
| `npm start`          | Arrancar la versión compilada                        |
| `npm run seed`       | Rellenar usuarios, objetivos y datos de ejemplo      |
| `npm run seed:reset` | Borrar solo los datos de ejemplo                     |
| `npm run db:push`    | Crear/actualizar las tablas en la base de datos      |
| `npm run db:studio`  | Abrir Prisma Studio para ver/editar la base de datos |
| `npm test`           | Ejecutar los tests (incluida la "regla de oro")      |

## Detalles técnicos

- **Next.js 14** (App Router) + **TypeScript**, **Tailwind** + componentes
  propios estilo shadcn/ui, **Recharts** para las gráficas.
- **Prisma + PostgreSQL (Neon)** en producción. La capa de acceso a datos
  (`src/lib`) no usa nada exclusivo de un motor; el esquema se aplica con
  `prisma db push`. (El proyecto nació con SQLite local y migrar fue solo
  cambiar la configuración del datasource.)
- **NextAuth** con login por correo y contraseña; tres roles: `ADMIN`,
  `INBOUND`, `AGENCY`. El acceso por rol se protege en el middleware y se
  revalida en el servidor.
- Interfaz en castellano de España; código en inglés; formato `es-ES`
  (fechas dd/mm/aaaa, euros con `€` y miles con punto).

### Estructura

```
prisma/        schema.prisma · seed.ts · reset.ts · migrations/
src/
  app/         login · (app)/{panel · josep · rodrigo · ventas} · informe · api/auth
  lib/         db · metrics · calc · format · dates · auth · guards · targets · actions/
  components/  ui/ · kpi/ · forms/ · charts/ · panel/ · nav
  types/       domain · next-auth.d.ts
```

El "corazón" del cálculo está en `src/lib/calc.ts` (funciones puras, con tests)
y `src/lib/metrics.ts` (consultas). Ahí es donde vive la regla de oro.

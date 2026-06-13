# Poner el panel online en Vercel — guía paso a paso

Tiempo estimado: ~15 minutos. La base de datos es **Neon (PostgreSQL)**, creada
desde dentro de Vercel, igual que en `aladetres-production`.

El código ya está preparado: al desplegar, Vercel **crea las tablas solas** y
**siembra los 3 usuarios y los objetivos** automáticamente (sin datos de
ejemplo). Tú solo tendrás que ir cargando las ventas reales desde la app.

---

## 1. El repositorio en GitHub

Ya está subido (público) en la cuenta `mkt-thenomba`. Si aún no, desde
`~/thenomba-kpis`:

```bash
git init
git add .
git commit -m "Panel de ventas TheNomba"
gh repo create mkt-thenomba/thenomba-kpis --public --source=. --remote=origin --push
```

> El `.env` y la base de datos local **no se suben** (están en `.gitignore`).

## 2. Importar el repo en Vercel

1. Entra en **https://vercel.com/new**
2. **Import Git Repository** → autoriza GitHub si lo pide → elige
   `thenomba-kpis`.
3. Configuración:
   - **Framework Preset**: `Next.js` (lo detecta solo).
   - **Root Directory**: `./`
   - Build & Output: déjalo por defecto (usará `vercel-build`, ya configurado).
4. **No pulses Deploy todavía.** Primero la base de datos y las variables.

## 3. Crear la base de datos Neon (desde Vercel)

En el panel del proyecto recién importado:

1. Pestaña **Storage** → **Create Database** → **Neon** (Postgres).
2. Región: la más cercana a España (**Frankfurt `fra1`** o **Washington** si no
   hay europea; vale cualquiera).
3. **Create** y **Connect** al proyecto.

Esto añade solo las variables de conexión: `DATABASE_URL` y
`DATABASE_URL_UNPOOLED` (entre otras). La app ya las usa con esos nombres.

> Si por lo que sea solo aparece `DATABASE_URL` y **no** `DATABASE_URL_UNPOOLED`,
> crea tú esta segunda en el paso 4 con **el mismo valor** que `DATABASE_URL`.

## 4. Variables de entorno

En **Settings → Environment Variables**, añade (entorno: *Production*, y también
*Preview* si quieres):

| Nombre            | Valor                                                            |
| ----------------- | ---------------------------------------------------------------- |
| `NEXTAUTH_SECRET` | un secreto aleatorio largo (ver abajo cómo generarlo)            |
| `NEXTAUTH_URL`    | la URL de tu proyecto, p. ej. `https://thenomba-kpis.vercel.app` |

> **Genera el `NEXTAUTH_SECRET`** en tu terminal y pega el resultado en Vercel
> (no lo escribas en ningún archivo del repositorio):
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
> ```
>
> La `NEXTAUTH_URL` exacta la sabrás tras el primer deploy (Vercel te da el
> dominio `…vercel.app`). Puedes desplegar, copiar la URL, ponerla aquí y
> **volver a desplegar** (Deployments → ⋯ → Redeploy).

## 5. Desplegar

Pulsa **Deploy**. En el build verás que:
- genera el cliente Prisma,
- crea las tablas en Neon (`prisma db push`),
- siembra usuarios y objetivos,
- compila la app.

## 6. Entrar y verificar

Abre la URL del proyecto. Deberías ver el login. Entra como dirección:

- **Correo**: `pablo@thenomba.es`
- **Contraseña**: `Pablo2026!`

Comprueba que el panel carga (sin ventas todavía: es normal, lo llenas tú).
Los otros accesos:

- Josep: `josep@thenomba.es` / `Josep2026!`
- Rodrigo: `rodrigo@thenomba.es` / `Rodrigo2026!`

> **Cambia las contraseñas** antes de pasarlo a producción de verdad: edita
> `prisma/seed.ts` (campo `pass` de cada usuario), haz commit + push, y Vercel
> volverá a desplegar y actualizará las contraseñas.

## 7. Cargar junio

Entra en **Registro de ventas** y empieza a meter las ventas reales de junio.
El panel y el informe del viernes se recalculan solos.

---

## Notas

- **Datos de ejemplo**: en Vercel no se siembran (solo usuarios + objetivos). Si
  algún día quisieras llenarlo de ejemplo en algún entorno, añade la variable
  `SEED_EXAMPLE=true` y vuelve a desplegar (no recomendado en producción).
- **Objetivos**: ya están sembrados (jun–dic 2026). Para cambiarlos, edita
  `src/lib/targets.ts`, commit + push.
- **Cada despliegue** vuelve a aplicar el esquema y a sembrar usuarios/objetivos
  de forma idempotente (no borra tus ventas).
- **Copia de seguridad**: Neon hace copias automáticas; ver README.

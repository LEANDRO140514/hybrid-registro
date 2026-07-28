# hybrid-registro — Landing de emergencia HYBRID EXPERIENCE (PLANB-LANDING-01)

Landing **temporal e independiente** para capturar inscripciones de HYBRID
EXPERIENCE mientras se termina de construir **Ready2Hybrid** (el sistema
definitivo). Clon de `hybrid-event-landing`, desvinculado de su historial de
git — mismo diseño visual, cero cambios de marca. Lo único operativo/nuevo es
la ruta `/inscribir`.

Sitio en vivo: **https://hybrid-registro.enforma.mx**

## Qué hace

1. El visitante entra al landing (idéntico al original) y da clic en
   "Inscribirse" en una categoría.
2. Llega a `/inscribir?cat=CODIGO`, llena sus datos (y los de su equipo si
   la categoría es Dobles/Relay).
3. Al enviar: se guarda el registro en InsForge, se genera un código QR y un
   boleto PDF (client-side), se muestra el link de pago de Mercado Pago
   correspondiente, y se manda un correo de confirmación (Resend) con QR +
   PDF adjuntos.
4. El pago ocurre **fuera del sitio**, directo en Mercado Pago. No hay
   webhook — el registro queda en `status = 'pending'` hasta que alguien lo
   reconcilia manualmente.

## Dónde vive cada cosa

| Pieza | Dónde |
|---|---|
| Frontend | Este repo, Vite + React + TanStack Router + MUI. Deploy: Vercel, proyecto `hybrid-registro` (team `enforma-c9d3af17`) |
| Base de datos | InsForge, proyecto **enforma** (`https://3e9sriq7.us-east.insforge.app`), tabla `public.hybrid_registro_inscripciones` |
| Envío de correo | Resend (workspace de ENFORMA), dominio verificado `mail.hybrid-registro.enforma.mx`, API key guardada como secreto `RESEND_API_KEY` en InsForge |
| Función de correo | InsForge edge function `send-registration-email` (`functions/send-registration-email.ts`) |
| Links de pago | `src/config/paymentLinks.ts` — hardcodeados, uno por **concepto** (no por precio, ver abajo) |

## La tabla `hybrid_registro_inscripciones`

Aislada a propósito — **no** es la misma tabla (`pending_registrations`,
`orders`) que usa el checkout sandbox de `hybrid-event-landing`; esas usan un
`category_id` numérico incompatible con nuestros códigos de catálogo.

```
id                UUID (generado en el cliente, no por default de la BD)
category_code     TEXT   -- código del catálogo, ej. 'DOB-VIE-MM'
category_name     TEXT
category_bloque   TEXT   -- COMPITE | EXPERIENCE | ASISTE
team_name         TEXT   NULL
participants      JSONB  -- array de nombres
contact_name      TEXT
contact_email     TEXT
contact_phone     TEXT
amount            NUMERIC
currency          TEXT   default 'MXN'
status            TEXT   default 'pending'  -- se marca 'paid' a mano
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

RLS: `anon` **solo puede INSERT** (`WITH CHECK status = 'pending'`). No puede
leer ni su propio registro — la conciliación de pagos y cualquier lectura se
hace con el CLI/dashboard de InsForge (`project_admin`, que sí pasa por
encima de RLS).

### Ver / exportar los registros

```bash
npx @insforge/cli db query "select * from hybrid_registro_inscripciones order by created_at desc" --json
```

Para exportar todo a CSV/JSON (por ejemplo, para migrarlo a Ready2Hybrid):

```bash
npx @insforge/cli db query "select * from hybrid_registro_inscripciones" --json > inscripciones.json
```

O usa `npx @insforge/cli db` con las referencias de export/import del CLI si
se necesita algo más estructurado.

## Links de pago — por concepto, no por precio

`src/config/paymentLinks.ts` mapea cada categoría a uno de **10 conceptos**
(`PaymentGroupKey`), no a su precio numérico — necesario porque **Workout
Experience** y **Fotógrafo 1 día** cuestan lo mismo ($350) pero son productos
y links de Mercado Pago distintos. Si se necesita actualizar o reemplazar un
link, es ahí donde se edita.

## Pendientes reales

- **Número de WhatsApp de soporte** (`src/config/supportConfig.ts`,
  `SUPPORT_WHATSAPP_NUMBER`) — sigue en `null`. Sin él, la pantalla de
  confirmación no muestra botón de WhatsApp cuando falta un link de pago
  (hoy no aplica: los 10 conceptos ya tienen link).
- **Correo con plan de pago**: `insforge.emails.send()` nativo de InsForge
  requiere plan pagado (el proyecto está en free) — por eso se usa Resend en
  su lugar vía edge function, no el módulo de email de InsForge.

## Exportar / migrar a Ready2Hybrid

Cuando Ready2Hybrid esté listo para reemplazar esta landing:

1. Exporta todos los registros de `hybrid_registro_inscripciones` (query de
   arriba). Cada fila trae `category_code` — mapéalo al catálogo/producto
   equivalente de Ready2Hybrid.
2. Revisa `status` por fila: `'pending'` significa que nunca se confirmó el
   pago manualmente — cross-referencia contra el dashboard de Mercado Pago
   antes de dar por válida una inscripción.
3. `participants` es un array JSON (nombres sueltos, sin estructura por
   persona) — Ready2Hybrid probablemente necesite datos más estructurados
   por atleta; esto es una migración con transformación, no un import 1:1.
4. Una vez migrados los datos, actualizar los CTA del landing (`ProductCard`
   en `src/pages/LandingPage.tsx`) para apuntar de nuevo a
   `registro.enforma.mx` (Ready2Hybrid) en vez de `/inscribir`, o simplemente
   apagar este deploy.
5. Este repo puede archivarse — es un clon independiente, no tiene que
   fusionarse de vuelta a `hybrid-event-landing` ni a ningún monorepo.

## Desarrollo

```bash
npm install
npm run dev       # servidor local
npm run build     # tsc -b && vite build
```

### Variables de entorno (`.env`, no versionado)

```
VITE_INSFORGE_URL=https://3e9sriq7.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=<anon key del proyecto enforma>
```

### Deploy

```bash
vercel --prod --scope enforma-c9d3af17
```

El dominio `hybrid-registro.enforma.mx` ya está enlazado al proyecto en
Vercel; el deploy a producción lo actualiza automáticamente.

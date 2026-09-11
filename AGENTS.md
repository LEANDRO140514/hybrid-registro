# AGENTS.md

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **enforma** (API base `https://3e9sriq7.us-east.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->

<!-- SKILLS-LIBRARY:START -->
## Capability Policy — Algorithmus Skills Library

- [Skills Library](https://github.com/LEANDRO140514/skills-library) es la fuente gobernada de
  capacidades reutilizables. Doctrina: `docs/SKILLS_PHILOSOPHY.md` del repo.
- Checkout canónico en esta máquina: `C:\skills-library`. Registro: `C:\skills-library\_INDEX.csv`.
  Este proyecto **consume** (Modo A: resolución gobernada directa); no copia ni modifica la biblioteca.
- Usá primero la capacidad ya activa en el runtime (p. ej. las skills InsForge de arriba).
- Si no alcanza, resolvé por la biblioteca gobernada (`skill-router` → `find-skills`) antes de salir afuera.
- El discovery externo ocurre sólo tras un miss local real (`not_found` genuino).
- Las capacidades externas entran como candidatas, nunca como confiables. No instales Skills directamente.
- Sólo un `not_found` genuino habilita crear una Skill (`skill-creator`).
- Usá sólo las capacidades que la tarea necesita — nada "por si acaso".
- Promote y Deploy son aprobaciones separadas. Una copia de runtime nunca es canónica.
- Si la tarea no necesita una Skill, hacé la tarea.

### Cómo resolver

`./scripts/find-skills.sh <nombre>` / `--query "<texto>"` desde el checkout, en **Git Bash**
(no PowerShell). Requiere Python 3 — instalado en esta máquina (3.12.10; `python`, `python3` y `py`
resuelven al intérprete real). Un agente también puede resolver leyendo `_INDEX.csv` directamente y
aplicando las reglas de abajo.

| status | cuándo | qué hacer |
|---|---|---|
| `allow` | `mias` (no `deny`, no `_archivo/`), o `comunidad` con `scan_verdict=allow` | usar / cargar |
| `review` | `scan_verdict=review` **con** `scan_waiver` no vacío | leer el waiver primero, después usar |
| `blocked` | ruta bajo `_archivo/`, `deny`, `review` sin waiver, o `comunidad` sin scan | **no usar** → `BLOCKED_BY_GOVERNANCE` (mostrar `razon_archivo` si aplica) |
| `unindexed` | carpeta en disco sin fila en `_INDEX.csv` | no usable; falta promoción |
| `not_found` | ningún match de nombre | único status que habilita construir |

`blocked` **no** es `not_found`. Si governance bloquea, pará y reportalo; no busques un atajo.
<!-- SKILLS-LIBRARY:END -->

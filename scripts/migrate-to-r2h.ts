/**
 * migrate-to-r2h.ts
 * Migra inscripciones pagadas de Plan B → esquema SPEC-032 de Ready2Hybrid.
 *
 * USO:
 *   npx tsx scripts/migrate-to-r2h.ts            # migración real
 *   npx tsx scripts/migrate-to-r2h.ts --dry-run  # solo lee y muestra el plan
 *
 * Variables de entorno (.env.migrate o export manual):
 *   PLANB_INSFORGE_URL   URL del proyecto InsForge de Plan B
 *   PLANB_SERVICE_KEY    Service role key de Plan B  (lee sin restricción RLS)
 *   R2H_INSFORGE_URL     URL del proyecto InsForge de R2H
 *   R2H_SERVICE_KEY      Service role key de R2H     (escribe con project_admin)
 *   R2H_EVENT_CODE       Código del evento (ej: 'HEX-2026')
 *
 * GARANTÍAS:
 *   · Solo procesa filas con status = 'paid'.
 *   · Idempotente: detecta filas ya migradas por external_reference = 'planb:{id}'
 *     en la tabla orders de R2H y las omite sin error.
 *   · --dry-run nunca escribe nada. Imprime el plan completo por fila.
 *   · Procesa una fila a la vez para aislar fallos.
 *
 * LIMITACIONES CONOCIDAS AL MOMENTO DE ESCRIBIR ESTE SCRIPT (julio 2026):
 *   · buyer_contacts y participants son shells en R2H (sin campos personales).
 *     Los datos de contacto (nombre, email, teléfono) se almacenan en
 *     registrations.registration_snapshot y orders.commercial_snapshot.
 *     Cuando R2H cierre las decisiones abiertas OD-* sobre campos personales,
 *     añadir columnas y actualizar con UPDATE desde el snapshot.
 *   · PUB-3D y FOT-3D (pases 3 días) tienen MULTIDAY_ENTITLEMENT_BLOCKED
 *     en R2H (OD-020 abierta). Sus tickets quedan en estado PENDING; los
 *     entitlements se crean manualmente después.
 *   · mp_payment_id puede ser NULL si la conciliación fue manual y no se
 *     anotó en Plan B. En ese caso payments no se crea; la orden queda
 *     con state = 'PAID' sin referencia de proveedor.
 *
 * ORDEN DE INSERCIÓN (respeta FKs):
 *   1. buyer_contacts
 *   2. participants      (N por inscripción, uno por nombre en el array)
 *   3. orders
 *   4. order_items
 *   5. teams + team_members   (solo productos con team_size > 1)
 *   6. registrations     (uno por participante)
 *   7. payments          (solo si mp_payment_id no es null)
 *   8. ticket_issue_one_registration()   (RPC de R2H por cada registration)
 *   9. activity_log
 */

import { createClient } from '@insforge/sdk'
import * as fs from 'node:fs'
import * as path from 'node:path'

// ─── Carga .env.migrate si existe ──────────────────────────────────────────
const envFile = path.resolve(process.cwd(), '.env.migrate')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const DRY_RUN = process.argv.includes('--dry-run')

// ─── Variables de entorno ───────────────────────────────────────────────────
function requireEnv(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Falta variable de entorno: ${key}`)
  return v
}

const PLANB_URL = requireEnv('PLANB_INSFORGE_URL')
const PLANB_KEY = requireEnv('PLANB_SERVICE_KEY')
const R2H_URL = requireEnv('R2H_INSFORGE_URL')
const R2H_KEY = requireEnv('R2H_SERVICE_KEY')
const R2H_EVENT_CODE = requireEnv('R2H_EVENT_CODE')

// ─── Clientes ───────────────────────────────────────────────────────────────
const planb = createClient({ baseUrl: PLANB_URL, anonKey: PLANB_KEY })
const r2h = createClient({ baseUrl: R2H_URL, anonKey: R2H_KEY })

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface PlanbRow {
  id: string
  category_code: string
  category_name: string
  category_bloque: string
  team_name: string | null
  participants: string[]           // array de nombres; índice 0 = contacto
  contact_name: string
  contact_email: string
  contact_phone: string
  amount: number                   // pesos MXN
  currency: string
  status: string
  mp_payment_id: string | null
  notes: string | null
  created_at: string
}

interface R2hProduct {
  id: string
  code: string
  team_size: number
  price_cents: number
  day: string | null
  journey: string | null
}

interface MigrationResult {
  id: string
  category_code: string
  contact_name: string
  skipped: boolean
  skip_reason?: string
  error?: string
  r2h_order_id?: string
  registrations_created?: number
  ticket_results?: unknown[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function amountToCents(pesos: number): number {
  return Math.round(pesos * 100)
}

function log(msg: string) {
  process.stdout.write(msg + '\n')
}

function warn(msg: string) {
  process.stderr.write('[WARN] ' + msg + '\n')
}

// ─── Leer catálogo de productos de R2H ─────────────────────────────────────
async function loadR2hProducts(): Promise<Map<string, R2hProduct>> {
  const { data, error } = await r2h.database
    .from('products')
    .select('id, code, team_size, price_cents, day, journey')
    .eq('event_code', R2H_EVENT_CODE)

  if (error || !data) throw new Error(`No se pudo leer products de R2H: ${JSON.stringify(error)}`)

  const map = new Map<string, R2hProduct>()
  for (const p of data as R2hProduct[]) map.set(p.code, p)
  return map
}

// ─── Verificar si ya fue migrada ────────────────────────────────────────────
async function isAlreadyMigrated(planbId: string): Promise<boolean> {
  const { data } = await r2h.database
    .from('orders')
    .select('id')
    .eq('external_reference', `planb:${planbId}`)
    .limit(1)

  return Array.isArray(data) && data.length > 0
}

// ─── Migrar una fila ─────────────────────────────────────────────────────────
async function migrateRow(
  row: PlanbRow,
  products: Map<string, R2hProduct>,
): Promise<MigrationResult> {
  const base: MigrationResult = {
    id: row.id,
    category_code: row.category_code,
    contact_name: row.contact_name,
    skipped: false,
  }

  // 1. Buscar producto en R2H
  const product = products.get(row.category_code)
  if (!product) {
    return { ...base, skipped: true, skip_reason: `Producto ${row.category_code} no existe en R2H` }
  }

  // 2. Idempotencia: ya migrado?
  if (!DRY_RUN && await isAlreadyMigrated(row.id)) {
    return { ...base, skipped: true, skip_reason: 'Ya migrado (external_reference encontrado)' }
  }

  const isMultiday = row.category_code.endsWith('-3D')
  const isTeam = product.team_size > 1
  const amountCents = amountToCents(row.amount)

  // Snapshot completo de Plan B (persiste en R2H para referencia)
  const planbSnapshot = {
    planb_id: row.id,
    category_code: row.category_code,
    category_name: row.category_name,
    category_bloque: row.category_bloque,
    contact_name: row.contact_name,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    team_name: row.team_name,
    participants: row.participants,
    amount_pesos: row.amount,
    amount_cents: amountCents,
    currency: row.currency,
    mp_payment_id: row.mp_payment_id,
    notes: row.notes,
    planb_created_at: row.created_at,
    migrated_at: new Date().toISOString(),
    migration_notes: [
      isMultiday ? 'MULTIDAY: entitlements requieren acción manual (OD-020 abierta)' : null,
      !row.mp_payment_id ? 'SIN mp_payment_id: payment no creado, conciliación manual' : null,
    ].filter(Boolean),
  }

  if (DRY_RUN) {
    log(`  [DRY-RUN] ${row.id} → ${row.category_code} (${row.contact_name})`)
    log(`    producto R2H: ${product.id} | ${product.code} | team_size=${product.team_size}`)
    log(`    amount: $${row.amount} MXN → ${amountCents} cents`)
    log(`    participantes: ${row.participants.join(', ')}`)
    if (isTeam) log(`    equipo: "${row.team_name}"`)
    if (isMultiday) log(`    ⚠ MULTIDAY: entitlements manuales`)
    if (!row.mp_payment_id) log(`    ⚠ SIN mp_payment_id`)
    return { ...base, skipped: false, r2h_order_id: '[dry-run]' }
  }

  // ─── 1. buyer_contacts (shell) ───────────────────────────────────────────
  const { data: bcData, error: bcErr } = await r2h.database
    .from('buyer_contacts')
    .insert({ public_ref: `planb:${row.id}`, state: 'ACTIVE' })
    .select('id')
    .single()

  if (bcErr || !bcData) throw new Error(`buyer_contacts: ${JSON.stringify(bcErr)}`)
  const buyerContactId: string = (bcData as { id: string }).id

  // ─── 2. participants (un shell por nombre) ───────────────────────────────
  const participantIds: string[] = []
  for (let i = 0; i < row.participants.length; i++) {
    const name = row.participants[i]
    const { data: pData, error: pErr } = await r2h.database
      .from('participants')
      .insert({
        public_ref: `planb:${row.id}:p${i}`,
        buyer_contact_id: i === 0 ? buyerContactId : null,
        participation_type: 'COMPETITOR',
        state: 'STARTED',
      })
      .select('id')
      .single()

    if (pErr || !pData) throw new Error(`participant[${i}] "${name}": ${JSON.stringify(pErr)}`)
    participantIds.push((pData as { id: string }).id)
  }

  // ─── 3. orders ──────────────────────────────────────────────────────────
  const { data: ordData, error: ordErr } = await r2h.database
    .from('orders')
    .insert({
      buyer_contact_id: buyerContactId,
      state: 'PAID',
      currency: 'MXN',
      subtotal_cents: amountCents,
      total_cents: amountCents,
      external_reference: `planb:${row.id}`,
      commercial_snapshot: planbSnapshot,
    })
    .select('id')
    .single()

  if (ordErr || !ordData) throw new Error(`orders: ${JSON.stringify(ordErr)}`)
  const orderId: string = (ordData as { id: string }).id

  // ─── 4. order_items ─────────────────────────────────────────────────────
  const { error: oiErr } = await r2h.database
    .from('order_items')
    .insert({
      order_id: orderId,
      product_id: product.id,
      product_code: product.code,
      quantity: 1,
      unit_price_cents: amountCents,
      item_total_cents: amountCents,
      currency: 'MXN',
      journey: product.journey,
      commercial_snapshot: { planb_amount_pesos: row.amount },
    })

  if (oiErr) throw new Error(`order_items: ${JSON.stringify(oiErr)}`)

  // ─── 5. teams + team_members (si aplica) ────────────────────────────────
  let teamId: string | null = null
  const teamMemberIds: string[] = []

  if (isTeam) {
    const { data: tmData, error: tmErr } = await r2h.database
      .from('teams')
      .insert({
        public_ref: `planb:${row.id}:team`,
        product_id: product.id,
        product_code: product.code,
        name: row.team_name ?? row.participants.join(' & '),
        required_size: product.team_size,
        slots_complete: participantIds.length,
        roster_state: 'PAID_ROSTER_COMPLETE',
        payment_state: 'PAID',
      })
      .select('id')
      .single()

    if (tmErr || !tmData) throw new Error(`teams: ${JSON.stringify(tmErr)}`)
    teamId = (tmData as { id: string }).id

    for (let i = 0; i < participantIds.length; i++) {
      const { data: membData, error: membErr } = await r2h.database
        .from('team_members')
        .insert({
          team_id: teamId,
          position: i + 1,
          role: i === 0 ? 'CAPTAIN' : 'INVITEE',
          participant_id: participantIds[i],
          state: 'COMPLETE',
        })
        .select('id')
        .single()

      if (membErr || !membData) throw new Error(`team_members[${i}]: ${JSON.stringify(membErr)}`)
      teamMemberIds.push((membData as { id: string }).id)
    }
  }

  // ─── 6. registrations (una por participante) ─────────────────────────────
  const registrationIds: string[] = []

  for (let i = 0; i < participantIds.length; i++) {
    const { data: regData, error: regErr } = await r2h.database
      .from('registrations')
      .insert({
        event_code: R2H_EVENT_CODE,
        product_id: product.id,
        product_code: product.code,
        participant_id: participantIds[i],
        access_holder_id: null,
        order_id: orderId,
        team_id: teamId,
        team_member_id: teamMemberIds[i] ?? null,
        journey: product.journey,
        state: 'ACTIVE',
        registration_snapshot: {
          ...planbSnapshot,
          participant_index: i,
          participant_name: row.participants[i],
        },
      })
      .select('id')
      .single()

    if (regErr || !regData) throw new Error(`registrations[${i}]: ${JSON.stringify(regErr)}`)
    registrationIds.push((regData as { id: string }).id)
  }

  // ─── 7. payments (solo si hay mp_payment_id) ─────────────────────────────
  if (row.mp_payment_id) {
    const { error: payErr } = await r2h.database
      .from('payments')
      .insert({
        provider: 'mercadopago',
        provider_payment_id: row.mp_payment_id,
        order_id: orderId,
        external_state: 'approved',
        normalized_state: 'APPROVED',
        amount_cents: amountCents,
        currency: 'MXN',
        external_reference: `planb:${row.id}`,
        reconciliation_state: 'MATCHED',
      })

    if (payErr) throw new Error(`payments: ${JSON.stringify(payErr)}`)
  }

  // ─── 8. ticket_issue_one_registration() por registration ─────────────────
  const ticketResults: unknown[] = []

  for (const regId of registrationIds) {
    if (isMultiday) {
      // R2H tiene MULTIDAY_ENTITLEMENT_BLOCKED (OD-020 abierta).
      // Registramos la omisión; los entitlements se crean manualmente.
      ticketResults.push({ registration_id: regId, ok: false, error_code: 'MULTIDAY_MANUAL_REQUIRED' })
      warn(`  MULTIDAY: ticket para registration ${regId} requiere acción manual`)
      continue
    }

    const { data: tData, error: tErr } = await r2h.database
      .rpc('ticket_issue_one_registration', { p_registration_id: regId })

    if (tErr) {
      warn(`  ticket_issue_one_registration(${regId}): ${JSON.stringify(tErr)}`)
      ticketResults.push({ registration_id: regId, ok: false, error: tErr })
    } else {
      ticketResults.push(tData)
    }
  }

  // ─── 9. activity_log ─────────────────────────────────────────────────────
  await r2h.database.from('activity_log').insert({
    named_action: 'PLANB_MIGRATION',
    entity_type: 'order',
    entity_ref: orderId,
    result: 'OK',
    sanitized_metadata: {
      planb_id: row.id,
      category_code: row.category_code,
      contact_name: row.contact_name,
      registrations: registrationIds,
      tickets: ticketResults,
    },
  })

  return {
    ...base,
    r2h_order_id: orderId,
    registrations_created: registrationIds.length,
    ticket_results: ticketResults,
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────
async function main() {
  log(`\n══════════════════════════════════════════════`)
  log(`  migrate-to-r2h  ${DRY_RUN ? '(DRY RUN — nada se escribe)' : '(PRODUCCIÓN)'}`)
  log(`  Fuente:  ${PLANB_URL}`)
  log(`  Destino: ${R2H_URL}  evento: ${R2H_EVENT_CODE}`)
  log(`══════════════════════════════════════════════\n`)

  // Leer filas pagadas de Plan B
  const { data: rows, error: readErr } = await planb.database
    .from('hybrid_registro_inscripciones')
    .select('*')
    .eq('status', 'paid')
    .order('created_at', { ascending: true })

  if (readErr || !rows) throw new Error(`Lectura Plan B: ${JSON.stringify(readErr)}`)
  log(`Filas con status=paid: ${rows.length}\n`)

  if (rows.length === 0) {
    log('Nada que migrar.')
    return
  }

  const products = await loadR2hProducts()
  log(`Productos en R2H (evento ${R2H_EVENT_CODE}): ${products.size}\n`)

  const results: MigrationResult[] = []

  for (const row of rows as PlanbRow[]) {
    log(`▶ ${row.id.slice(0, 8)}… ${row.category_code} — ${row.contact_name}`)
    try {
      const result = await migrateRow(row, products)
      results.push(result)
      if (result.skipped) {
        log(`  ⏭  OMITIDA: ${result.skip_reason}`)
      } else {
        log(`  ✓  order=${result.r2h_order_id} | registrations=${result.registrations_created}`)
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      results.push({ id: row.id, category_code: row.category_code, contact_name: row.contact_name, skipped: false, error: errMsg })
      log(`  ✗  ERROR: ${errMsg}`)
    }
    log('')
  }

  // Resumen
  const ok = results.filter(r => !r.skipped && !r.error).length
  const skipped = results.filter(r => r.skipped).length
  const errors = results.filter(r => r.error).length

  log('══════════════════════════════════════════════')
  log(`  RESUMEN${DRY_RUN ? ' (dry-run)' : ''}`)
  log(`  Procesadas: ${rows.length}`)
  log(`  Migradas:   ${ok}`)
  log(`  Omitidas:   ${skipped}`)
  log(`  Errores:    ${errors}`)
  log('══════════════════════════════════════════════\n')

  if (errors > 0) {
    log('Filas con error:')
    for (const r of results.filter(r => r.error)) {
      log(`  ${r.id} (${r.category_code} — ${r.contact_name}): ${r.error}`)
    }
    process.exit(1)
  }
}

main().catch(err => {
  process.stderr.write(String(err) + '\n')
  process.exit(1)
})

// ─────────────────────────────────────────────────────────────────────────────
// THREE MINDS — Cross-Device Data Layer (JSONBlob)
// ─────────────────────────────────────────────────────────────────────────────
//
// ARCHITECTURE: JSONBlob is the single source of truth for ALL devices.
//   Desktop  →  saveCheckin() → localStorage (optimistic) + JSONBlob (authoritative)
//   Mobile   →  getCheckins()  → reads JSONBlob first, falls back to localStorage
//
// ⚠️  CRITICAL SYNC RULE — READ THIS BEFORE TOUCHING THIS FILE:
//
//   localStorage is per-device and per-browser. It is ONLY a fallback cache
//   for offline/error scenarios. It is NEVER a sync mechanism between devices.
//
//   Data flow must always be:
//     WRITE: device → localStorage (optimistic) + JSONBlob (authoritative)
//     READ:  JSONBlob (primary) → localStorage (offline fallback only)
//
//   If JSONBlob writes fail silently (no timeout, no retry), the data will
//   only live in the writing device's localStorage. All other devices will
//   see nothing.
//
// ⚠️  BLOB EXPIRY RULE — READ THIS TOO:
//
//   JSONBlob.com expires blobs after ~30 days of inactivity. If the blob is
//   gone (404), every device falls back to its own empty localStorage and
//   shows nothing. This happened once already (old blob 019ddd44... expired).
//
//   Fix embedded here (two layers):
//     1. fetchWithTimeout + withRetry: survive transient mobile network failures
//     2. migrateLocalToBlob(): if a freshly-created blob is empty but this
//        device's localStorage has check-ins, push them up immediately so
//        all devices see the data again without manual re-entry.
//
//   If you ever create a new blob (POST /api/jsonBlob), update BLOB_ID below
//   and the self-healing migration will take care of the rest on next load.
//
// Blob ID: 019de51c-cfaf-7299-8f2f-30500be073a9  (created May 1, 2026)
// API:     GET/PUT https://jsonblob.com/api/jsonBlob/{ID}
// ─────────────────────────────────────────────────────────────────────────────

const BLOB_ID = '019de51c-cfaf-7299-8f2f-30500be073a9'
const BLOB_URL = `https://jsonblob.com/api/jsonBlob/${BLOB_ID}`
const HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' }

// Always configured — no env var needed
export const dbConfigured = () => true

const LS_CHECKINS = 'tm_checkins'
const LS_DISTRESS = 'tm_distress'

/* ─── localStorage helpers ──────────────────────────────── */
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || fallback) } catch { return JSON.parse(fallback) }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

/* ─── fetch with timeout ─────────────────────────────────────────────────────
 * WHY: Mobile browsers (especially iOS Safari) can silently hang on fetch
 * calls for 30–60 seconds before failing. Without a timeout, saveCheckin()
 * appears to succeed (optimistic localStorage write) but the JSONBlob write
 * never completes. Any other device then reads an outdated or empty blob.
 *
 * FIX: Wrap every fetch in an AbortController with an 8-second timeout.
 * ─────────────────────────────────────────────────────────────────────────── */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

/* ─── retry with exponential backoff ─────────────────────────────────────────
 * WHY: Mobile connections are intermittent. A single retry after a short wait
 * recovers the majority of transient failures (e.g., 4G handoff, signal loss).
 * ─────────────────────────────────────────────────────────────────────────── */
const MAX_RETRIES = 3
const RETRY_BASE_MS = 600

async function withRetry(fn, label) {
  let lastErr
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1) // 600ms, 1200ms
        console.warn(`[ThreeMinds] ${label} failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms:`, err.message)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastErr
}

/* ─── blob read / write ─────────────────────────────────── */
async function readBlob() {
  const res = await fetchWithTimeout(
    BLOB_URL + '?t=' + Date.now(),
    { headers: HEADERS, cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`JSONBlob read failed: ${res.status}`)
  return await res.json()
}

async function writeBlob(data) {
  const res = await fetchWithTimeout(BLOB_URL, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`JSONBlob write failed: ${res.status}`)
}

/* ─── self-healing localStorage → blob migration ─────────────────────────────
 * WHY: When a blob expires (or a new one is created after expiry), the blob
 * starts empty. Any device that had check-ins cached in localStorage would
 * keep showing them locally — but every OTHER device sees nothing.
 *
 * FIX: If the blob has no check-ins but this device's localStorage does, push
 * localStorage data into the blob immediately. This restores cross-device sync
 * without requiring the user to re-enter any data manually.
 *
 * This runs automatically inside getCheckins() whenever the blob is empty.
 * It is safe to call repeatedly — subsequent calls find the blob non-empty
 * and skip the migration.
 * ─────────────────────────────────────────────────────────────────────────── */
async function migrateLocalToBlob(currentBlobData) {
  const cached = lsGet(LS_CHECKINS, '[]')
  if (!cached || cached.length === 0) return currentBlobData // nothing to migrate

  console.info(`[ThreeMinds] Blob is empty but localStorage has ${cached.length} check-ins — migrating to blob now...`)

  // Convert cached array back to keyed object
  const checkins = {}
  cached.forEach(c => { checkins[c.id] = c })

  const merged = { ...currentBlobData, checkins }

  // Also restore distress if cached
  const cachedDistress = lsGet(LS_DISTRESS, 'null')
  if (cachedDistress) merged.distress = cachedDistress

  try {
    await withRetry(() => writeBlob(merged), 'migrateLocalToBlob')
    console.info(`[ThreeMinds] Migration complete — ${cached.length} check-ins now in blob.`)
    return merged
  } catch (e) {
    console.warn('[ThreeMinds] Migration write failed:', e.message)
    return currentBlobData
  }
}

/* ─── CHECKINS ─────────────────────────────────────────────────────────────── */

export async function getCheckins() {
  try {
    // Always read from JSONBlob first — it is the only source of truth across devices.
    // localStorage is only used as an offline fallback (same device, no network).
    let data = await withRetry(readBlob, 'getCheckins')

    // Self-healing: if blob has no check-ins, push up any localStorage data.
    // This recovers from blob expiry without user intervention.
    if (!data.checkins || Object.keys(data.checkins).length === 0) {
      data = await migrateLocalToBlob(data)
    }

    if (!data.checkins || typeof data.checkins !== 'object') return []
    const list = Object.values(data.checkins).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    lsSet(LS_CHECKINS, list) // keep local cache fresh for offline fallback
    return list
  } catch (e) {
    console.warn('[ThreeMinds] JSONBlob read failed after retries, using local cache:', e.message)
    return lsGet(LS_CHECKINS, '[]')
  }
}

export async function saveCheckin(checkin) {
  const record = { ...checkin, id: Date.now(), timestamp: new Date().toISOString() }

  // Optimistic local update — makes the UI feel instant on this device.
  // ⚠️ This does NOT sync to other devices. The JSONBlob write below is what
  // makes the data available cross-device. If the write fails (even after
  // retries), the record only lives here in localStorage.
  const cached = lsGet(LS_CHECKINS, '[]')
  lsSet(LS_CHECKINS, [record, ...cached].slice(0, 90))

  try {
    // Read → migrate if empty → merge new record → write.
    let current = await withRetry(readBlob, 'saveCheckin:read')

    // If blob is empty, migrate localStorage before adding new record
    if (!current.checkins || Object.keys(current.checkins).length === 0) {
      current = await migrateLocalToBlob(current)
    }

    current.checkins = current.checkins || {}
    current.checkins[record.id] = record
    await withRetry(() => writeBlob(current), 'saveCheckin:write')
  } catch (e) {
    console.warn('[ThreeMinds] JSONBlob write failed after retries — saved locally only:', e.message)
  }

  return record
}

/* ─── DISTRESS ─────────────────────────────────────────────────────────────── */

export async function getDistress() {
  try {
    const data = await withRetry(readBlob, 'getDistress')
    const distress = data.distress || null
    distress ? lsSet(LS_DISTRESS, distress) : localStorage.removeItem(LS_DISTRESS)
    return distress
  } catch (e) {
    console.warn('[ThreeMinds] JSONBlob distress read failed after retries:', e.message)
    return lsGet(LS_DISTRESS, 'null')
  }
}

export async function setDistress(active) {
  const distressData = active ? { active: true, timestamp: new Date().toISOString() } : null
  distressData ? lsSet(LS_DISTRESS, distressData) : localStorage.removeItem(LS_DISTRESS)

  try {
    const current = await withRetry(readBlob, 'setDistress:read')
    current.distress = distressData
    await withRetry(() => writeBlob(current), 'setDistress:write')
  } catch (e) {
    console.warn('[ThreeMinds] JSONBlob distress write failed after retries:', e.message)
  }
}

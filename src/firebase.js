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
//   see nothing. This was the root cause of the desktop-saves / mobile-blank bug.
//
//   Fix embedded here: fetchWithTimeout + writeBlobWithRetry + readBlobWithRetry
//   ensure that network failures are retried before falling back to cache.
//
// Blob ID: 019ddd44-3ab5-7590-8dec-b4f80a11210c
// API:     GET/PUT https://jsonblob.com/api/jsonBlob/{ID}
// ─────────────────────────────────────────────────────────────────────────────

const BLOB_ID = '019ddd44-3ab5-7590-8dec-b4f80a11210c'
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
 * On mobile networks, 8s is generous but not so long that UX suffers.
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
 * recovers the majority of transient failures (e.g., 4G handoff, brief
 * signal loss). Without retry, one bad network moment = data loss.
 *
 * FIX: Up to MAX_RETRIES attempts with doubling delay between each.
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

/* ─── CHECKINS ─────────────────────────────────────────────────────────────── */

export async function getCheckins() {
  try {
    // Always read from JSONBlob first — it is the only source of truth across devices.
    // localStorage is only used as an offline fallback (same device, no network).
    const data = await withRetry(readBlob, 'getCheckins')
    if (!data.checkins || typeof data.checkins !== 'object') return []
    const list = Object.values(data.checkins).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    lsSet(LS_CHECKINS, list) // update local cache so offline fallback stays fresh
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
    // Read → merge → write. Retried up to 3× to survive mobile network blips.
    const current = await withRetry(readBlob, 'saveCheckin:read')
    current.checkins = current.checkins || {}
    current.checkins[record.id] = record
    await withRetry(() => writeBlob(current), 'saveCheckin:write')
  } catch (e) {
    // If all retries exhausted, data is local-only. The family view will NOT
    // see this check-in until the next successful write to JSONBlob.
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

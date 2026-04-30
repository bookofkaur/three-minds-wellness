// JSONBlob — cross-device data store (no token, no auth, no revocation ever)
// Read/write via public REST API using a UUID blob identifier (not a secret).
// Blob ID: 019ddd44-3ab5-7590-8dec-b4f80a11210c
// API: GET/PUT https://jsonblob.com/api/jsonBlob/{ID}

const BLOB_ID = '019ddd44-3ab5-7590-8dec-b4f80a11210c'
const BLOB_URL = `https://jsonblob.com/api/jsonBlob/${BLOB_ID}`
const HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' }

// Always configured — no env var needed
export const dbConfigured = () => true

const LS_CHECKINS = 'tm_checkins'
const LS_DISTRESS = 'tm_distress'

/* ─── helpers ──────────────────────────────────────────── */
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || fallback) } catch { return JSON.parse(fallback) }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

async function readBlob() {
  const res = await fetch(BLOB_URL + '?t=' + Date.now(), { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error(`JSONBlob read failed: ${res.status}`)
  return await res.json()
}

async function writeBlob(data) {
  const res = await fetch(BLOB_URL, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`JSONBlob write failed: ${res.status}`)
}

/* ─── CHECKINS ─────────────────────────────────────────── */

export async function getCheckins() {
  try {
    const data = await readBlob()
    if (!data.checkins || typeof data.checkins !== 'object') return []
    const list = Object.values(data.checkins).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    lsSet(LS_CHECKINS, list) // cache for offline fallback
    return list
  } catch (e) {
    console.warn('[ThreeMinds] JSONBlob read failed, using cache:', e.message)
    return lsGet(LS_CHECKINS, '[]')
  }
}

export async function saveCheckin(checkin) {
  const record = { ...checkin, id: Date.now(), timestamp: new Date().toISOString() }

  // Optimistic local update
  const cached = lsGet(LS_CHECKINS, '[]')
  lsSet(LS_CHECKINS, [record, ...cached].slice(0, 90))

  try {
    const current = await readBlob()
    current.checkins = current.checkins || {}
    current.checkins[record.id] = record
    await writeBlob(current)
  } catch (e) {
    console.warn('[ThreeMinds] JSONBlob write failed, saved locally only:', e.message)
  }

  return record
}

/* ─── DISTRESS ─────────────────────────────────────────── */

export async function getDistress() {
  try {
    const data = await readBlob()
    const distress = data.distress || null
    distress ? lsSet(LS_DISTRESS, distress) : localStorage.removeItem(LS_DISTRESS)
    return distress
  } catch (e) {
    console.warn('[ThreeMinds] JSONBlob distress read failed:', e.message)
    return lsGet(LS_DISTRESS, 'null')
  }
}

export async function setDistress(active) {
  const distressData = active ? { active: true, timestamp: new Date().toISOString() } : null
  distressData ? lsSet(LS_DISTRESS, distressData) : localStorage.removeItem(LS_DISTRESS)

  try {
    const current = await readBlob()
    current.distress = distressData
    await writeBlob(current)
  } catch (e) {
    console.warn('[ThreeMinds] JSONBlob distress write failed:', e.message)
  }
}

// Firebase Realtime Database — lightweight REST wrapper (no SDK needed)
// The DB_URL is NOT a secret — it's a public identifier, security is via Rules.
// Rules are set to public read/write for this MVP.

// Vite replaces import.meta.env.VITE_DB_URL at build time
export const DB_URL = (import.meta.env.VITE_DB_URL || '').replace(/\/$/, '')

export const dbConfigured = () => Boolean(DB_URL)

const LS_CHECKINS = 'tm_checkins'
const LS_DISTRESS = 'tm_distress'

/* ─── helpers ──────────────────────────────────────────── */
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || fallback) } catch { return JSON.parse(fallback) }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

/* ─── CHECKINS ─────────────────────────────────────────── */

export async function getCheckins() {
  if (dbConfigured()) {
    try {
      const res = await fetch(`${DB_URL}/checkins.json?orderBy="timestamp"`, { cache: 'no-store' })
      const data = await res.json()
      if (!data || typeof data !== 'object') return []
      const list = Object.values(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      lsSet(LS_CHECKINS, list)           // cache for offline fallback
      return list
    } catch (e) {
      console.warn('[ThreeMinds] Firebase read failed, using cache:', e.message)
    }
  }
  return lsGet(LS_CHECKINS, '[]')
}

export async function saveCheckin(checkin) {
  const record = { ...checkin, id: Date.now(), timestamp: new Date().toISOString() }

  // Optimistic local update
  const cached = lsGet(LS_CHECKINS, '[]')
  lsSet(LS_CHECKINS, [record, ...cached].slice(0, 90))

  if (dbConfigured()) {
    try {
      await fetch(`${DB_URL}/checkins/${record.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
    } catch (e) {
      console.warn('[ThreeMinds] Firebase write failed, saved locally only:', e.message)
    }
  }
  return record
}

/* ─── DISTRESS ─────────────────────────────────────────── */

export async function getDistress() {
  if (dbConfigured()) {
    try {
      const res = await fetch(`${DB_URL}/distress.json`, { cache: 'no-store' })
      const data = await res.json()
      data ? lsSet(LS_DISTRESS, data) : localStorage.removeItem(LS_DISTRESS)
      return data || null
    } catch (e) {
      console.warn('[ThreeMinds] Firebase distress read failed:', e.message)
    }
  }
  return lsGet(LS_DISTRESS, 'null')
}

export async function setDistress(active) {
  const data = active ? { active: true, timestamp: new Date().toISOString() } : null
  data ? lsSet(LS_DISTRESS, data) : localStorage.removeItem(LS_DISTRESS)

  if (dbConfigured()) {
    try {
      if (active) {
        await fetch(`${DB_URL}/distress.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      } else {
        await fetch(`${DB_URL}/distress.json`, { method: 'DELETE' })
      }
    } catch (e) {
      console.warn('[ThreeMinds] Firebase distress write failed:', e.message)
    }
  }
}

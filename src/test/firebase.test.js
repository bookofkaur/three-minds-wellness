/**
 * firebase.js (JSONBlob layer) — unit tests
 * Mocks globalThis.fetch so no real network calls are made.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  dbConfigured,
  getCheckins,
  saveCheckin,
  getDistress,
  setDistress,
} from '../firebase'

// ─── helpers ────────────────────────────────────────────
const EMPTY_BLOB = { checkins: {}, distress: null }

function mockFetch(responseData, ok = true) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => responseData,
  })
}

// ─── tests ───────────────────────────────────────────────

describe('dbConfigured()', () => {
  it('always returns true (JSONBlob needs no token)', () => {
    expect(dbConfigured()).toBe(true)
  })
})

describe('getCheckins()', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns empty array when blob has no checkins', async () => {
    mockFetch(EMPTY_BLOB)
    const result = await getCheckins()
    expect(result).toEqual([])
  })

  it('returns checkins sorted by timestamp (newest first)', async () => {
    mockFetch({
      checkins: {
        1: { id: 1, mood: 7, timestamp: '2026-04-01T10:00:00.000Z' },
        2: { id: 2, mood: 8, timestamp: '2026-04-02T10:00:00.000Z' },
      },
      distress: null,
    })
    const result = await getCheckins()
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(2)   // newer first
    expect(result[1].id).toBe(1)
  })

  it('falls back to localStorage on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
    const cached = [{ id: 99, mood: 5, timestamp: '2026-04-01T00:00:00.000Z' }]
    localStorage.setItem('tm_checkins', JSON.stringify(cached))
    const result = await getCheckins()
    expect(result).toEqual(cached)
    localStorage.removeItem('tm_checkins')
  })

  it('returns empty array on error with no cache', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    localStorage.removeItem('tm_checkins')
    const result = await getCheckins()
    expect(result).toEqual([])
  })
})

describe('saveCheckin()', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns a record with id and timestamp', async () => {
    const spy = mockFetch({ checkins: {}, distress: null })
    const checkin = { mood: 8, energy: 7, sleep: 7, mindState: 'luffy', notes: '' }
    const result = await saveCheckin(checkin)
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('timestamp')
    expect(result.mood).toBe(8)
    expect(spy).toHaveBeenCalled()
  })

  it('saves to localStorage immediately (optimistic update)', async () => {
    mockFetch({ checkins: {}, distress: null })
    localStorage.removeItem('tm_checkins')
    await saveCheckin({ mood: 6, energy: 6, sleep: 6, mindState: 'gohan', notes: '' })
    const cached = JSON.parse(localStorage.getItem('tm_checkins') || '[]')
    expect(cached).toHaveLength(1)
    expect(cached[0].mood).toBe(6)
  })

  it('still returns record even when blob write fails', async () => {
    // First call (readBlob) succeeds, second call (writeBlob) fails
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => EMPTY_BLOB })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
    const result = await saveCheckin({ mood: 5, energy: 5, sleep: 5, mindState: 'shikamaru', notes: '' })
    expect(result).toHaveProperty('id')
  })
})

describe('getDistress()', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns null when no distress', async () => {
    mockFetch(EMPTY_BLOB)
    expect(await getDistress()).toBeNull()
  })

  it('returns distress object when active', async () => {
    mockFetch({ checkins: {}, distress: { active: true, timestamp: '2026-04-30T00:00:00.000Z' } })
    const result = await getDistress()
    expect(result).not.toBeNull()
    expect(result.active).toBe(true)
  })

  it('falls back to localStorage on error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    localStorage.removeItem('tm_distress')
    expect(await getDistress()).toBeNull()
  })
})

describe('setDistress()', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sets distress active=true', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => EMPTY_BLOB })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ checkins: {}, distress: { active: true } }) })
    await setDistress(true)
    const stored = JSON.parse(localStorage.getItem('tm_distress') || 'null')
    expect(stored).not.toBeNull()
    expect(stored.active).toBe(true)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('clears distress when active=false', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ checkins: {}, distress: { active: true } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => EMPTY_BLOB })
    await setDistress(false)
    expect(localStorage.getItem('tm_distress')).toBeNull()
  })
})

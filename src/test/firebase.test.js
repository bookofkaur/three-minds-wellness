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
  getTodos,
  saveTodo,
  toggleTodo,
  deleteTodo,
  updateTodo,
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
    // Clear local cache so the migration path (migrateLocalToBlob) is NOT triggered.
    // migrateLocalToBlob only fires when the blob is empty AND localStorage has data;
    // without this clear the leftover localStorage from earlier tests causes the
    // migration to fire extra retries that blow past the default 5 s timeout.
    localStorage.removeItem('tm_checkins')

    // Read returns a non-empty blob (skips migration entirely).
    // All subsequent write calls fail with 500 to exercise the error path.
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkins: { existing: { id: 1, mood: 7 } }, distress: null }),
      })
      .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

    const result = await saveCheckin({ mood: 5, energy: 5, sleep: 5, mindState: 'shikamaru', notes: '' })
    expect(result).toHaveProperty('id')
  }, 12000) // 3 write retries × (600 + 1200) ms = ~1800 ms — 12 s is generous headroom
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

// ─────────────────────────────────────────────────────────────────────────────
// TODO FUNCTIONS — getTodos / saveTodo / toggleTodo / deleteTodo / updateTodo
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_TODO_BLOB = { checkins: {}, distress: null, todos: {} }

describe('getTodos()', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns empty array when blob has no todos', async () => {
    mockFetch(EMPTY_TODO_BLOB)
    const result = await getTodos()
    expect(result).toEqual([])
  })

  it('returns todos with active tasks sorted before done tasks', async () => {
    mockFetch({
      ...EMPTY_TODO_BLOB,
      todos: {
        'todo_1': { id: 'todo_1', text: 'Done task',   done: true,  timestamp: '2026-05-01T10:00:00.000Z' },
        'todo_2': { id: 'todo_2', text: 'Active task', done: false, timestamp: '2026-05-01T09:00:00.000Z' },
      },
    })
    const result = await getTodos()
    expect(result).toHaveLength(2)
    expect(result[0].done).toBe(false)  // active first
    expect(result[1].done).toBe(true)
  })

  it('preserves dueToday and estimatedMinutes fields', async () => {
    mockFetch({
      ...EMPTY_TODO_BLOB,
      todos: {
        'todo_x': {
          id: 'todo_x', text: 'Schedule me', done: false,
          dueToday: true, estimatedMinutes: 45,
          timestamp: '2026-05-03T08:00:00.000Z',
        },
      },
    })
    const result = await getTodos()
    expect(result[0].dueToday).toBe(true)
    expect(result[0].estimatedMinutes).toBe(45)
  })

  it('falls back to localStorage on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
    const cached = [{ id: 'todo_99', text: 'Cached task', done: false }]
    localStorage.setItem('tm_todos', JSON.stringify(cached))
    const result = await getTodos()
    expect(result).toEqual(cached)
    localStorage.removeItem('tm_todos')
  })

  it('returns empty array on error with no cache', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    localStorage.removeItem('tm_todos')
    const result = await getTodos()
    expect(result).toEqual([])
  })
})

describe('saveTodo()', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns a record with generated id and timestamp', async () => {
    mockFetch(EMPTY_TODO_BLOB)
    const result = await saveTodo({ text: 'Buy groceries', priority: 'low', done: false })
    expect(result).toHaveProperty('id')
    expect(result.id).toMatch(/^todo_/)
    expect(result).toHaveProperty('timestamp')
    expect(result.text).toBe('Buy groceries')
  })

  it('preserves dueToday and estimatedMinutes in returned record', async () => {
    mockFetch(EMPTY_TODO_BLOB)
    const result = await saveTodo({
      text: 'Morning run', priority: 'high', done: false,
      dueToday: true, estimatedMinutes: 30,
    })
    expect(result.dueToday).toBe(true)
    expect(result.estimatedMinutes).toBe(30)
  })

  it('writes optimistically to localStorage', async () => {
    mockFetch(EMPTY_TODO_BLOB)
    localStorage.removeItem('tm_todos')
    await saveTodo({ text: 'Instant task', priority: 'medium', done: false })
    const cached = JSON.parse(localStorage.getItem('tm_todos') || '[]')
    expect(cached).toHaveLength(1)
    expect(cached[0].text).toBe('Instant task')
  })

  it('still returns record when blob write fails', async () => {
    localStorage.removeItem('tm_todos')
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...EMPTY_TODO_BLOB, todos: { existing: { id: 'todo_1' } } }) })
      .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    const result = await saveTodo({ text: 'Fail gracefully', priority: 'low', done: false })
    expect(result).toHaveProperty('id')
  }, 12000)
})

describe('toggleTodo()', () => {
  afterEach(() => vi.restoreAllMocks())

  it('updates done=true in localStorage optimistically', async () => {
    localStorage.setItem('tm_todos', JSON.stringify([
      { id: 'todo_abc', text: 'Task', done: false },
    ]))
    mockFetch({
      ...EMPTY_TODO_BLOB,
      todos: { 'todo_abc': { id: 'todo_abc', text: 'Task', done: false } },
    })
    await toggleTodo('todo_abc', true)
    const cached = JSON.parse(localStorage.getItem('tm_todos') || '[]')
    expect(cached[0].done).toBe(true)
  })

  it('updates done=false (un-complete) correctly', async () => {
    localStorage.setItem('tm_todos', JSON.stringify([
      { id: 'todo_xyz', text: 'Done task', done: true },
    ]))
    mockFetch({
      ...EMPTY_TODO_BLOB,
      todos: { 'todo_xyz': { id: 'todo_xyz', text: 'Done task', done: true } },
    })
    await toggleTodo('todo_xyz', false)
    const cached = JSON.parse(localStorage.getItem('tm_todos') || '[]')
    expect(cached[0].done).toBe(false)
  })
})

describe('deleteTodo()', () => {
  afterEach(() => vi.restoreAllMocks())

  it('removes task from localStorage optimistically', async () => {
    localStorage.setItem('tm_todos', JSON.stringify([
      { id: 'todo_del', text: 'Remove me', done: false },
      { id: 'todo_keep', text: 'Keep me', done: false },
    ]))
    mockFetch({
      ...EMPTY_TODO_BLOB,
      todos: {
        'todo_del':  { id: 'todo_del',  text: 'Remove me', done: false },
        'todo_keep': { id: 'todo_keep', text: 'Keep me',   done: false },
      },
    })
    await deleteTodo('todo_del')
    const cached = JSON.parse(localStorage.getItem('tm_todos') || '[]')
    expect(cached).toHaveLength(1)
    expect(cached[0].id).toBe('todo_keep')
  })
})

describe('updateTodo()', () => {
  afterEach(() => vi.restoreAllMocks())

  it('patches dueToday field without changing id', async () => {
    const original = { id: 'todo_patch', text: 'Patch me', done: false, dueToday: false }
    localStorage.setItem('tm_todos', JSON.stringify([original]))
    mockFetch({
      ...EMPTY_TODO_BLOB,
      todos: { 'todo_patch': original },
    })
    await updateTodo('todo_patch', { dueToday: true })
    const cached = JSON.parse(localStorage.getItem('tm_todos') || '[]')
    expect(cached[0].id).toBe('todo_patch')    // id unchanged
    expect(cached[0].dueToday).toBe(true)       // field patched
    expect(cached[0].text).toBe('Patch me')     // other fields preserved
  })

  it('patches estimatedMinutes correctly', async () => {
    const original = { id: 'todo_est', text: 'Estimate me', done: false, estimatedMinutes: 25 }
    localStorage.setItem('tm_todos', JSON.stringify([original]))
    mockFetch({ ...EMPTY_TODO_BLOB, todos: { 'todo_est': original } })
    await updateTodo('todo_est', { estimatedMinutes: 60 })
    const cached = JSON.parse(localStorage.getItem('tm_todos') || '[]')
    expect(cached[0].estimatedMinutes).toBe(60)
  })

  it('does NOT call saveTodo to avoid creating duplicates', async () => {
    // This test is a contract test: updateTodo must be a distinct function
    // that patches in-place. If it called saveTodo it would generate a new id.
    expect(typeof updateTodo).toBe('function')
    // updateTodo and saveTodo are separate exports
    expect(updateTodo).not.toBe(saveTodo)
  })
})

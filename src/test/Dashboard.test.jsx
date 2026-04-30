/**
 * Dashboard component — unit tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Dashboard from '../components/Dashboard'

vi.mock('../firebase', () => ({
  getCheckins: vi.fn(),
  getDistress: vi.fn(),
  setDistress: vi.fn().mockResolvedValue(undefined),
}))

import { getCheckins, getDistress } from '../firebase'

const VIEWS = { DASHBOARD: 'dashboard', CHECKIN: 'checkin', HISTORY: 'history', FAMILY: 'family' }
const mockNavigate = vi.fn()
const mockToast = vi.fn()

function makeCheckin(overrides = {}) {
  return {
    id: Date.now(),
    mood: 7,
    energy: 6,
    sleepHours: 7,
    mind: 'luffy',
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  getDistress.mockResolvedValue(null)
})

describe('Dashboard component', () => {
  it('renders loading state initially', () => {
    getCheckins.mockResolvedValue([])
    render(<Dashboard onNavigate={mockNavigate} VIEWS={VIEWS} showToast={mockToast} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders "No check-in yet today" when there are no checkins', async () => {
    getCheckins.mockResolvedValue([])
    render(<Dashboard onNavigate={mockNavigate} VIEWS={VIEWS} showToast={mockToast} />)
    await waitFor(() => {
      // The actual DOM text: "No check-in yet today — tap Check In"
      expect(screen.getByText(/No check-in yet today/i)).toBeInTheDocument()
    })
  })

  it('renders the current mind state when checkin exists', async () => {
    getCheckins.mockResolvedValue([makeCheckin({ mind: 'gohan' })])
    render(<Dashboard onNavigate={mockNavigate} VIEWS={VIEWS} showToast={mockToast} />)
    await waitFor(() => {
      expect(screen.getByText('Gohan')).toBeInTheDocument()
    })
  })

  it('shows streak count', async () => {
    getCheckins.mockResolvedValue([makeCheckin()])
    render(<Dashboard onNavigate={mockNavigate} VIEWS={VIEWS} showToast={mockToast} />)
    await waitFor(() => {
      expect(screen.getByText(/streak/i)).toBeInTheDocument()
    })
  })

  it('shows sleep warning when last 2 checkins have sleep < 5', async () => {
    const checkins = [
      makeCheckin({ sleepHours: 4, timestamp: new Date(Date.now() - 1000).toISOString() }),
      makeCheckin({ sleepHours: 3, timestamp: new Date(Date.now() - 2000).toISOString() }),
    ]
    getCheckins.mockResolvedValue(checkins)
    render(<Dashboard onNavigate={mockNavigate} VIEWS={VIEWS} showToast={mockToast} />)
    await waitFor(() => {
      expect(screen.getByText(/sleep under 5hrs/i)).toBeInTheDocument()
    })
  })

  it('shows mood warning when last 3 checkins have mood < 4', async () => {
    const checkins = [
      makeCheckin({ mood: 3, timestamp: new Date(Date.now() - 1000).toISOString() }),
      makeCheckin({ mood: 2, timestamp: new Date(Date.now() - 2000).toISOString() }),
      makeCheckin({ mood: 3, timestamp: new Date(Date.now() - 3000).toISOString() }),
    ]
    getCheckins.mockResolvedValue(checkins)
    render(<Dashboard onNavigate={mockNavigate} VIEWS={VIEWS} showToast={mockToast} />)
    await waitFor(() => {
      expect(screen.getByText(/mood has been low/i)).toBeInTheDocument()
    })
  })

  it('renders "clear signal" button when distress is active', async () => {
    getCheckins.mockResolvedValue([makeCheckin()])
    getDistress.mockResolvedValue({ active: true, timestamp: new Date().toISOString() })
    render(<Dashboard onNavigate={mockNavigate} VIEWS={VIEWS} showToast={mockToast} />)
    await waitFor(() => {
      // When distress is active, Dashboard shows a "clear signal" button
      expect(screen.getByText(/clear signal/i)).toBeInTheDocument()
    })
  })
})

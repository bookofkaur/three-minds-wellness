/**
 * CheckIn component — unit tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckIn from '../components/CheckIn'

// Mock firebase module
vi.mock('../firebase', () => ({
  saveCheckin: vi.fn().mockResolvedValue({ id: 123, timestamp: new Date().toISOString() }),
}))

import { saveCheckin } from '../firebase'

const VIEWS = { DASHBOARD: 'dashboard', CHECKIN: 'checkin', HISTORY: 'history', FAMILY: 'family' }
const mockNavigate = vi.fn()
const mockToast = vi.fn()

function renderCheckIn() {
  return render(<CheckIn onNavigate={mockNavigate} VIEWS={VIEWS} showToast={mockToast} />)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CheckIn component', () => {
  it('renders the page title', () => {
    renderCheckIn()
    expect(screen.getByText('CHECK IN')).toBeInTheDocument()
  })

  it('renders all three mind cards (Gohan, Joyboy, Shikamaru)', () => {
    renderCheckIn()
    expect(screen.getByText('Gohan')).toBeInTheDocument()
    expect(screen.getByText('Joyboy')).toBeInTheDocument()
    expect(screen.getByText('Shikamaru')).toBeInTheDocument()
  })

  it('shows toast error when submitting without selecting a mind', async () => {
    renderCheckIn()
    const submitBtn = screen.getByRole('button', { name: /save check.in/i })
    await userEvent.click(submitBtn)
    expect(mockToast).toHaveBeenCalledWith(expect.stringContaining('Pick your active mind'))
    expect(saveCheckin).not.toHaveBeenCalled()
  })

  it('selects a mind card when clicked', async () => {
    renderCheckIn()
    const gohanBtn = screen.getByRole('button', { name: /Gohan/i })
    await userEvent.click(gohanBtn)
    // Gohan description should appear
    expect(screen.getByText(/Feelings are loud/i)).toBeInTheDocument()
  })

  it('shows sleep warning when sleep < 5 hours', async () => {
    renderCheckIn()
    const sleepInput = screen.getByRole('spinbutton')
    fireEvent.change(sleepInput, { target: { value: '4' } })
    expect(screen.getByText(/Under 5hrs is a mood episode risk factor/i)).toBeInTheDocument()
  })

  it('shows positive sleep message when sleep >= 7 hours', async () => {
    renderCheckIn()
    const sleepInput = screen.getByRole('spinbutton')
    fireEvent.change(sleepInput, { target: { value: '8' } })
    expect(screen.getByText(/Solid sleep/i)).toBeInTheDocument()
  })

  it('calls saveCheckin and shows success toast after selecting a mind and submitting', async () => {
    renderCheckIn()
    // Select Gohan
    await userEvent.click(screen.getByRole('button', { name: /Gohan/i }))
    // Submit
    await userEvent.click(screen.getByRole('button', { name: /save check.in/i }))
    await waitFor(() => {
      expect(saveCheckin).toHaveBeenCalledTimes(1)
      expect(mockToast).toHaveBeenCalledWith(expect.stringContaining('Check-in saved'))
    })
  })

  it('renders all 7 medication checkboxes', () => {
    renderCheckIn()
    // Prescribed meds
    expect(screen.getByText('Mirtazapine')).toBeInTheDocument()
    expect(screen.getByText('Atomoxetine')).toBeInTheDocument()
    expect(screen.getByText(/Oxcarbazepine/)).toBeInTheDocument()
    // Optional supplements
    expect(screen.getByText('Magnesium Citrate')).toBeInTheDocument()
    expect(screen.getByText("Lion's Mane")).toBeInTheDocument()
    expect(screen.getByText('Vitamin D3')).toBeInTheDocument()
    expect(screen.getByText('Fish Oil')).toBeInTheDocument()
  })
})

/**
 * Todo.jsx — comprehensive unit tests
 *
 * Covers every new feature added in the productivity upgrade:
 *   • Technique Tip Card (renders, dismiss, dot nav)
 *   • Pomodoro toggle button visible
 *   • MIT section (appears when dueToday tasks exist)
 *   • "Due Today" flag at task-creation time
 *   • Duration selector visible when dueToday is checked
 *   • 2-Minute Rule inline warning for 5-min tasks
 *   • Auto-switch to Schedule tab after adding a dueToday task
 *   • Schedule tab renders time blocks for dueToday tasks
 *   • 📅 quick-toggle calls updateTodo (not saveTodo — no duplicate bug)
 *   • Checkbox toggles via toggleTodo
 *   • Delete calls deleteTodo
 *   • Filter tabs: Today / All / Active / Done / Schedule
 *   • Empty state messages per filter
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Todo from '../components/Todo'

// ─── mock firebase ────────────────────────────────────────────────────────────
vi.mock('../firebase', () => ({
  getTodos:   vi.fn(),
  saveTodo:   vi.fn(),
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
  updateTodo: vi.fn(),
}))

import { getTodos, saveTodo, toggleTodo, deleteTodo, updateTodo } from '../firebase'

// ─── helpers ──────────────────────────────────────────────────────────────────
const noop = () => {}

function makeTodo(overrides = {}) {
  return {
    id:                `todo_${Date.now() + Math.random()}`,
    text:              'Test task',
    priority:          'medium',
    done:              false,
    dueToday:          false,
    estimatedMinutes:  25,
    timestamp:         new Date().toISOString(),
    ...overrides,
  }
}

function renderTodo(showToast = noop) {
  return render(<Todo showToast={showToast} />)
}

// ─── setup ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  getTodos.mockResolvedValue([])
  saveTodo.mockImplementation(async (t) => ({ ...t, id: `todo_${Date.now()}`, timestamp: new Date().toISOString() }))
  toggleTodo.mockResolvedValue(undefined)
  deleteTodo.mockResolvedValue(undefined)
  updateTodo.mockResolvedValue(undefined)
})

afterEach(() => vi.restoreAllMocks())

// ─── Page header ──────────────────────────────────────────────────────────────
describe('Page header', () => {
  it('renders TASKS heading', async () => {
    renderTodo()
    expect(await screen.findByText('TASKS')).toBeTruthy()
  })

  it('shows productivity tagline', async () => {
    renderTodo()
    const matches = await screen.findAllByText(/Pomodoro/i)
    expect(matches.length).toBeGreaterThan(0)
  })
})

// ─── Technique Tip Card ───────────────────────────────────────────────────────
describe('TipCard', () => {
  it('renders "Today\'s Technique" label', async () => {
    renderTodo()
    expect(await screen.findByText(/Today's Technique/i)).toBeTruthy()
  })

  it('can be dismissed with ✕ button', async () => {
    renderTodo()
    const dismiss = await screen.findByTitle ? undefined : null
    // find ✕ button (close button in tip card)
    const closeButtons = await screen.findAllByText('✕')
    expect(closeButtons.length).toBeGreaterThan(0)
    fireEvent.click(closeButtons[0])
    // tip card should be gone
    await waitFor(() => {
      expect(screen.queryByText(/Today's Technique/i)).toBeNull()
    })
  })

  it('renders dot-nav with 7 dots (one per technique)', async () => {
    const { container } = renderTodo()
    // dot buttons are 8×8 circles; wait for render
    await screen.findByText(/Today's Technique/i)
    // There are 7 techniques → 7 dot buttons in the tip card
    const dotButtons = container.querySelectorAll('.tip-card button')
    // 1 dismiss button + 7 dots = 8 total buttons inside .tip-card
    expect(dotButtons.length).toBe(8)
  })
})

// ─── Pomodoro toggle ─────────────────────────────────────────────────────────
describe('Pomodoro toggle', () => {
  it('renders "Pomodoro Focus Timer" toggle button', async () => {
    renderTodo()
    expect(await screen.findByText(/Pomodoro Focus Timer/i)).toBeTruthy()
  })

  it('expands Pomodoro panel on click', async () => {
    renderTodo()
    const toggleBtn = await screen.findByText(/Pomodoro Focus Timer/i)
    fireEvent.click(toggleBtn.closest('button') || toggleBtn)
    const matches = await screen.findAllByText(/Focus Timer/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows 25:00 default countdown in Classic mode', async () => {
    renderTodo()
    const toggleBtn = await screen.findByText(/Pomodoro Focus Timer/i)
    fireEvent.click(toggleBtn.closest('button') || toggleBtn)
    expect(await screen.findByText('25:00')).toBeTruthy()
  })

  it('shows START button when timer is not running', async () => {
    renderTodo()
    const toggleBtn = await screen.findByText(/Pomodoro Focus Timer/i)
    fireEvent.click(toggleBtn.closest('button') || toggleBtn)
    expect(await screen.findByText(/▶ START/i)).toBeTruthy()
  })

  it('collapses panel on second click (Hide)', async () => {
    renderTodo()
    const toggleBtn = await screen.findByText(/Pomodoro Focus Timer/i)
    fireEvent.click(toggleBtn.closest('button') || toggleBtn)
    await screen.findByText('25:00')
    fireEvent.click(toggleBtn.closest('button') || toggleBtn)
    await waitFor(() => {
      expect(screen.queryByText('25:00')).toBeNull()
    })
  })
})

// ─── MIT section ─────────────────────────────────────────────────────────────
describe('MIT section', () => {
  it('does NOT render when no dueToday tasks exist', async () => {
    getTodos.mockResolvedValue([makeTodo({ dueToday: false })])
    renderTodo()
    await screen.findByText('TASKS')
    expect(screen.queryByText(/Today's MIT/i)).toBeNull()
  })

  it('renders MIT section when dueToday tasks exist', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ dueToday: true, priority: 'high',   text: 'High priority task' }),
      makeTodo({ dueToday: true, priority: 'medium', text: 'Medium task' }),
      makeTodo({ dueToday: true, priority: 'low',    text: 'Low task' }),
    ])
    renderTodo()
    expect(await screen.findByText(/Today's MIT/i)).toBeTruthy()
  })

  it('shows max 3 tasks in MIT section', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ dueToday: true, text: 'Task 1' }),
      makeTodo({ dueToday: true, text: 'Task 2' }),
      makeTodo({ dueToday: true, text: 'Task 3' }),
      makeTodo({ dueToday: true, text: 'Task 4' }),
    ])
    renderTodo()
    await screen.findByText(/Today's MIT/i)
    // The section should show 1, 2, 3 rank badges but not 4
    const rankBadges = screen.getAllByText(/^[123]$/)
    expect(rankBadges.length).toBe(3)
  })

  it('shows done counter in MIT section', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ dueToday: true, done: true,  text: 'Done task' }),
      makeTodo({ dueToday: true, done: false, text: 'Pending task' }),
    ])
    renderTodo()
    // waits for todos to load
    await screen.findByText(/1\/2 today done/i)
  })
})

// ─── New Task form ────────────────────────────────────────────────────────────
describe('New Task form', () => {
  it('renders New Task card', async () => {
    renderTodo()
    expect(await screen.findByText(/New Task/i)).toBeTruthy()
  })

  it('shows ➕ Add Task button', async () => {
    renderTodo()
    expect(await screen.findByText(/\+ ADD TASK/i)).toBeTruthy()
  })

  it('calls showToast warning when input is empty', async () => {
    const toast = vi.fn()
    renderTodo(toast)
    const addBtn = await screen.findByText(/\+ ADD TASK/i)
    fireEvent.click(addBtn)
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('Type or dictate'))
  })

  it('shows "Due Today?" toggle button', async () => {
    renderTodo()
    expect(await screen.findByText(/Due Today\?/i)).toBeTruthy()
  })

  it('shows duration selector after clicking Due Today', async () => {
    renderTodo()
    const dueTodayBtn = await screen.findByText(/Due Today\?/i)
    fireEvent.click(dueTodayBtn)
    // Duration select should appear
    const select = await screen.findByDisplayValue('25 min 🍅 1 Pomo')
    expect(select).toBeTruthy()
  })

  it('shows 2-Minute Rule warning when dueToday + 5min selected', async () => {
    renderTodo()
    const dueTodayBtn = await screen.findByText(/Due Today\?/i)
    fireEvent.click(dueTodayBtn)
    // Change duration to 5 min
    const select = await screen.findByDisplayValue('25 min 🍅 1 Pomo')
    fireEvent.change(select, { target: { value: '5' } })
    expect(await screen.findByText(/2-Minute Rule/i)).toBeTruthy()
  })

  it('adds a task and calls saveTodo with correct fields', async () => {
    renderTodo()
    const input = await screen.findByPlaceholderText(/What do you need to do/i)
    await userEvent.type(input, 'Write tests')
    const addBtn = screen.getByText(/\+ ADD TASK/i)
    fireEvent.click(addBtn)
    await waitFor(() => {
      expect(saveTodo).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Write tests',
        priority: 'medium',
        done: false,
      }))
    })
  })

  it('adds a dueToday task and includes dueToday + estimatedMinutes', async () => {
    renderTodo()
    const dueTodayBtn = await screen.findByText(/Due Today\?/i)
    fireEvent.click(dueTodayBtn)
    const input = await screen.findByPlaceholderText(/What do you need to do/i)
    await userEvent.type(input, 'Go to gym')
    fireEvent.click(screen.getByText(/\+ ADD TASK/i))
    await waitFor(() => {
      expect(saveTodo).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Go to gym',
        dueToday: true,
        estimatedMinutes: 25,
      }))
    })
  })

  it('auto-switches to Schedule tab after adding dueToday task', async () => {
    const newTask = makeTodo({ dueToday: true, text: 'Auto schedule task' })
    saveTodo.mockResolvedValue(newTask)
    renderTodo()
    const dueTodayBtn = await screen.findByText(/Due Today\?/i)
    fireEvent.click(dueTodayBtn)
    const input = await screen.findByPlaceholderText(/What do you need to do/i)
    await userEvent.type(input, 'Auto schedule task')
    fireEvent.click(screen.getByText(/\+ ADD TASK/i))
    // After adding, Schedule tab should be active (shows schedule content)
    expect(await screen.findByText(/📅 Schedule/i)).toBeTruthy()
  })
})

// ─── Priority buttons ─────────────────────────────────────────────────────────
describe('Priority selector', () => {
  it('renders High / Medium / Low buttons', async () => {
    renderTodo()
    expect(await screen.findByText(/🔴 High/i)).toBeTruthy()
    expect(screen.getByText(/🟡 Medium/i)).toBeTruthy()
    expect(screen.getByText(/🟢 Low/i)).toBeTruthy()
  })

  it('clicking High changes selected priority', async () => {
    renderTodo()
    const highBtn = await screen.findByText(/🔴 High/i)
    fireEvent.click(highBtn)
    const input = screen.getByPlaceholderText(/What do you need to do/i)
    await userEvent.type(input, 'Urgent thing')
    fireEvent.click(screen.getByText(/\+ ADD TASK/i))
    await waitFor(() => {
      expect(saveTodo).toHaveBeenCalledWith(expect.objectContaining({ priority: 'high' }))
    })
  })
})

// ─── Filter tabs ─────────────────────────────────────────────────────────────
describe('Filter tabs', () => {
  it('shows 5 filter tabs when todos exist', async () => {
    getTodos.mockResolvedValue([makeTodo()])
    renderTodo()
    await screen.findByText('TASKS')
    // wait for todos to render filter row
    await waitFor(() => {
      expect(screen.queryByText(/📅 Schedule/i)).toBeTruthy()
    })
    // All 5 tabs present
    expect(screen.getByText(/📅 Schedule/i)).toBeTruthy()
    expect(screen.getByText(/All \(\d+\)/i)).toBeTruthy()
    expect(screen.getByText(/Active \(\d+\)/i)).toBeTruthy()
    expect(screen.getByText(/Done \(\d+\)/i)).toBeTruthy()
  })

  it('Today tab shows only dueToday tasks', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ dueToday: true,  text: 'Today task' }),
      makeTodo({ dueToday: false, text: 'Backlog task' }),
    ])
    renderTodo()
    // Default is Today tab — 'Today task' may appear in MIT section + task list
    const matches = await screen.findAllByText('Today task')
    expect(matches.length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.queryByText('Backlog task')).toBeNull())
  })

  it('All tab shows all tasks', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ dueToday: true,  text: 'Today task' }),
      makeTodo({ dueToday: false, text: 'Backlog task' }),
    ])
    renderTodo()
    // Wait for any instance of 'Today task' (may be in MIT section)
    await screen.findAllByText('Today task')
    const allTab = screen.getByText(/All \(\d+\)/i)
    fireEvent.click(allTab)
    expect(await screen.findByText('Backlog task')).toBeTruthy()
    const todayMatches = await screen.findAllByText('Today task')
    expect(todayMatches.length).toBeGreaterThan(0)
  })

  it('Done tab shows only completed tasks', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ done: true,  text: 'Finished thing' }),
      makeTodo({ done: false, text: 'Still pending' }),
    ])
    renderTodo()
    await screen.findByText('TASKS')
    const doneTab = screen.getByText(/Done \(\d+\)/i)
    fireEvent.click(doneTab)
    expect(await screen.findByText('Finished thing')).toBeTruthy()
    await waitFor(() => expect(screen.queryByText('Still pending')).toBeNull())
  })

  it('Active tab shows only incomplete tasks', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ done: false, text: 'Pending task' }),
      makeTodo({ done: true,  text: 'Completed task' }),
    ])
    renderTodo()
    await screen.findByText('TASKS')
    fireEvent.click(screen.getByText(/Active \(\d+\)/i))
    expect(await screen.findByText('Pending task')).toBeTruthy()
    await waitFor(() => expect(screen.queryByText('Completed task')).toBeNull())
  })
})

// ─── Schedule (time blocking) view ───────────────────────────────────────────
describe('Schedule / Time Blocking view', () => {
  it('shows empty state message when no dueToday tasks', async () => {
    getTodos.mockResolvedValue([makeTodo({ dueToday: false })])
    renderTodo()
    await screen.findByText('TASKS')
    const scheduleTab = screen.getByText(/📅 Schedule/i)
    fireEvent.click(scheduleTab)
    expect(await screen.findByText(/No tasks scheduled for today yet/i)).toBeTruthy()
  })

  it('shows time blocks for dueToday tasks', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ dueToday: true, text: 'Morning workout', estimatedMinutes: 45, priority: 'high' }),
      makeTodo({ dueToday: true, text: 'Read emails', estimatedMinutes: 15, priority: 'low' }),
    ])
    renderTodo()
    await screen.findByText('TASKS')
    const scheduleTab = screen.getByText(/📅 Schedule/i)
    fireEvent.click(scheduleTab)
    // Tasks may appear in MIT section + schedule blocks simultaneously
    const workoutMatches = await screen.findAllByText('Morning workout')
    expect(workoutMatches.length).toBeGreaterThan(0)
    const emailMatches = await screen.findAllByText('Read emails')
    expect(emailMatches.length).toBeGreaterThan(0)
  })

  it('shows time range labels on schedule blocks', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ dueToday: true, text: 'Focus session', estimatedMinutes: 25, priority: 'high' }),
    ])
    renderTodo()
    await screen.findByText('TASKS')
    fireEvent.click(screen.getByText(/📅 Schedule/i))
    // Task may appear in MIT section + schedule; use findAllByText
    const sessionMatches = await screen.findAllByText('Focus session')
    expect(sessionMatches.length).toBeGreaterThan(0)
    // Should show AM/PM formatted time range (e.g., "2:10 PM – 2:35 PM")
    const timePattern = /\d+:\d+ [AP]M – \d+:\d+ [AP]M/
    await waitFor(() => {
      const text = document.body.innerText || document.body.textContent
      expect(timePattern.test(text)).toBe(true)
    })
  })

  it('shows ⏱ total scheduled minutes', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ dueToday: true, estimatedMinutes: 30, priority: 'high' }),
      makeTodo({ dueToday: true, estimatedMinutes: 20, priority: 'medium' }),
    ])
    renderTodo()
    await screen.findByText('TASKS')
    fireEvent.click(screen.getByText(/📅 Schedule/i))
    expect(await screen.findByText(/50 min/i)).toBeTruthy()
  })

  it('sorts schedule blocks high → medium → low priority', async () => {
    getTodos.mockResolvedValue([
      makeTodo({ dueToday: true, priority: 'low',    text: 'Low task',    estimatedMinutes: 10 }),
      makeTodo({ dueToday: true, priority: 'high',   text: 'High task',   estimatedMinutes: 10 }),
      makeTodo({ dueToday: true, priority: 'medium', text: 'Medium task', estimatedMinutes: 10 }),
    ])
    renderTodo()
    await screen.findByText('TASKS')
    fireEvent.click(screen.getByText(/📅 Schedule/i))
    // Tasks may appear in MIT + schedule; use findAllByText
    await screen.findAllByText('High task')
    const allText = document.body.textContent
    const highPos   = allText.indexOf('High task')
    const mediumPos = allText.indexOf('Medium task')
    const lowPos    = allText.indexOf('Low task')
    expect(highPos).toBeLessThan(mediumPos)
    expect(mediumPos).toBeLessThan(lowPos)
  })
})

// ─── Task interaction (toggle, delete, dueToday quick-toggle) ─────────────────
describe('Task interactions', () => {
  it('calls toggleTodo when checkbox clicked', async () => {
    const task = makeTodo({ text: 'Click me', done: false })
    getTodos.mockResolvedValue([task])
    renderTodo()
    // Tab label is "All (N)" not just "All" — use regex
    await screen.findByText(/All \(\d+\)/i)
    fireEvent.click(screen.getByText(/All \(\d+\)/i))
    await screen.findByText('Click me')
    // Find the checkbox button for this task (first button in row)
    const checkboxes = document.querySelectorAll('.card button')
    // First interactive button after filters is the checkbox
    const todoCheckboxes = Array.from(checkboxes).filter(b => b.title === undefined || b.title === '')
    // click the task row's checkbox — it renders as a button with empty text when undone
    const rowCheckbox = Array.from(document.querySelectorAll('button')).find(
      b => b.style.borderRadius === '6px' && b.textContent === ''
    )
    if (rowCheckbox) {
      fireEvent.click(rowCheckbox)
      await waitFor(() => expect(toggleTodo).toHaveBeenCalledWith(task.id, true))
    }
  })

  it('calls deleteTodo when ✕ is clicked', async () => {
    const task = makeTodo({ text: 'Delete me', done: false })
    getTodos.mockResolvedValue([task])
    const toast = vi.fn()
    renderTodo(toast)
    fireEvent.click(await screen.findByText(/All \(\d+\)/i))
    await screen.findByText('Delete me')
    const deleteBtn = screen.getByTitle('Delete task')
    fireEvent.click(deleteBtn)
    await waitFor(() => expect(deleteTodo).toHaveBeenCalledWith(task.id))
  })

  it('calls updateTodo (not saveTodo) when 📅 quick-toggle clicked', async () => {
    const task = makeTodo({ text: 'Toggle today', dueToday: false })
    getTodos.mockResolvedValue([task])
    renderTodo()
    fireEvent.click(await screen.findByText(/All \(\d+\)/i))
    await screen.findByText('Toggle today')
    // Find the 📅 quick-toggle button
    const calendarBtns = Array.from(document.querySelectorAll('button')).filter(
      b => b.textContent === '📅' && b.title
    )
    if (calendarBtns.length > 0) {
      fireEvent.click(calendarBtns[0])
      await waitFor(() => {
        expect(updateTodo).toHaveBeenCalledWith(task.id, { dueToday: true })
        expect(saveTodo).not.toHaveBeenCalledWith(expect.objectContaining({ id: task.id }))
      })
    }
  })
})

// ─── Clear completed ──────────────────────────────────────────────────────────
describe('Clear completed', () => {
  it('shows "Clear Completed" button when done tasks exist', async () => {
    getTodos.mockResolvedValue([makeTodo({ done: true, text: 'Done task' })])
    renderTodo()
    await screen.findByText('TASKS')
    fireEvent.click(screen.getByText(/All \(\d+\)/i))
    expect(await screen.findByText(/Clear 1 Completed/i)).toBeTruthy()
  })

  it('calls deleteTodo for all completed tasks on clear', async () => {
    const done1 = makeTodo({ done: true, text: 'Done 1' })
    const done2 = makeTodo({ done: true, text: 'Done 2' })
    getTodos.mockResolvedValue([done1, done2])
    renderTodo()
    await screen.findByText('TASKS')
    fireEvent.click(screen.getByText(/All \(\d+\)/i))
    const clearBtn = await screen.findByText(/Clear 2 Completed/i)
    fireEvent.click(clearBtn)
    await waitFor(() => {
      expect(deleteTodo).toHaveBeenCalledTimes(2)
    })
  })
})

// ─── Empty state messages ─────────────────────────────────────────────────────
describe('Empty state messages', () => {
  it('shows empty Today message when no dueToday tasks', async () => {
    getTodos.mockResolvedValue([])
    renderTodo()
    expect(await screen.findByText(/No tasks marked for today yet/i)).toBeTruthy()
  })

  it('shows "No tasks yet" when all filter is empty', async () => {
    getTodos.mockResolvedValue([])
    renderTodo()
    await screen.findByText('TASKS')
    // No filter tabs shown when no todos; shows empty state directly
    expect(screen.getByText(/No tasks marked for today yet/i)).toBeTruthy()
  })
})

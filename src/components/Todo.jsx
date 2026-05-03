import { useState, useEffect, useRef, useCallback } from 'react'
import { getTodos, saveTodo, toggleTodo, deleteTodo, updateTodo } from '../firebase'

// ── Web Speech API — 100% free, no API key, built into Chrome/Edge/Safari ──
function useSpeechToText({ onResult, onError }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = () => {
    if (!supported) {
      onError?.('Speech recognition is not supported in this browser. Use Chrome or Safari.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = (e) => {
      setListening(false)
      if (e.error === 'not-allowed') {
        onError?.('Microphone permission denied. Please allow mic access in your browser settings.')
      } else if (e.error === 'no-speech') {
        onError?.("Didn't catch that — try again.")
      } else {
        onError?.(`Speech error: ${e.error}`)
      }
    }
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || ''
      if (transcript.trim()) onResult?.(transcript.trim())
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stop = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return { listening, supported, start, stop }
}

// ── Constants ──────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { label: '🔴 High',   color: 'var(--red)',             bg: 'rgba(230,57,70,0.12)' },
  medium: { label: '🟡 Medium', color: 'var(--yellow)',          bg: 'rgba(244,162,97,0.12)' },
  low:    { label: '🟢 Low',    color: 'var(--shika-secondary)', bg: 'rgba(82,183,136,0.12)' },
}

const DURATION_OPTIONS = [5, 15, 25, 30, 45, 60, 90]

// Pomodoro modes: [workMin, breakMin, longBreakMin, label, description]
const POMO_MODES = {
  classic: { work: 25, shortBreak: 5,  longBreak: 15, label: '🍅 Classic',  desc: '25/5 — Original Pomodoro' },
  focus:   { work: 52, shortBreak: 17, longBreak: 20, label: '🎯 Focus',    desc: '52/17 — Peak flow research' },
  quick:   { work: 15, shortBreak: 5,  longBreak: 10, label: '⚡ Quick',    desc: '15/5 — High difficulty tasks' },
  deep:    { work: 90, shortBreak: 20, longBreak: 30, label: '🌊 Deep',     desc: '90/20 — Ultradian rhythm' },
  trial:   { work: 10, shortBreak: 5,  longBreak: 10, label: '🔔 10-Min',   desc: '10-min trial — beat initiation' },
}

// Daily rotating technique tips
const TECHNIQUE_TIPS = [
  {
    id: 'pomodoro',
    emoji: '🍅',
    title: 'Pomodoro Technique',
    body: 'Work for 25 minutes, then take a 5-minute break. The timer creates artificial urgency — your ADHD brain loves urgency. After 4 sessions, take a 15-min long break.',
    action: 'Start a Pomodoro below',
    color: 'var(--red)',
    bg: 'rgba(230,57,70,0.08)',
  },
  {
    id: 'timeblock',
    emoji: '📅',
    title: 'Auto Time Blocking',
    body: 'Mark tasks as "Due Today" + set a duration. The app builds your visual schedule automatically — your calendar becomes a prosthetic frontal lobe for time blindness.',
    action: 'Add a task with duration',
    color: 'var(--gohan-primary)',
    bg: 'rgba(255,107,53,0.08)',
  },
  {
    id: 'mit',
    emoji: '🎯',
    title: 'MIT Method — Top 3 Only',
    body: "Identify your 3 Most Important Tasks for today. On low-energy days, 3 tasks done = a win. Your brain can't handle a 40-item list — 3 gives it a clear finish line.",
    action: 'See your Top 3 below',
    color: 'var(--yellow)',
    bg: 'rgba(244,162,97,0.08)',
  },
  {
    id: '2min',
    emoji: '⚡',
    title: '2-Minute Rule',
    body: "If a task takes less than 2 minutes, do it NOW — don't schedule it. Adding it to a list creates more mental overhead than just doing it. Act immediately.",
    action: 'Review your quick tasks',
    color: 'var(--shika-secondary)',
    bg: 'rgba(82,183,136,0.08)',
  },
  {
    id: 'ivylee',
    emoji: '🌿',
    title: 'Ivy Lee Method',
    body: "Tonight, write exactly 6 tasks for tomorrow in priority order. Start with #1 — don't touch #2 until #1 is done. Pre-commitment the night before kills morning decision paralysis.",
    action: 'Tag 6 tasks for tomorrow',
    color: 'var(--shika-secondary)',
    bg: 'rgba(82,183,136,0.08)',
  },
  {
    id: 'bodydouble',
    emoji: '👥',
    title: 'Body Doubling',
    body: 'Work alongside someone — even virtually. The social presence signal activates your ADHD brain\'s task engagement system. Try a "study with me" YouTube stream. Research shows up to 400% improvement.',
    action: 'Open a study stream',
    color: 'var(--yellow)',
    bg: 'rgba(244,162,97,0.08)',
  },
  {
    id: 'tenmin',
    emoji: '🔔',
    title: '10-Minute Rule',
    body: "Avoiding a task? Tell yourself you'll only work on it for 10 minutes — then you can stop. Task initiation is the neurological barrier, not execution. Once started, the brain usually engages.",
    action: 'Start a 10-min trial timer',
    color: 'var(--red)',
    bg: 'rgba(230,57,70,0.08)',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatHHMM(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function buildSchedule(todayTasks) {
  // Sort: high first, then medium, then low; within same priority by timestamp asc
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sorted = [...todayTasks].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 1
    const pb = priorityOrder[b.priority] ?? 1
    if (pa !== pb) return pa - pb
    return (a.timestamp || 0) - (b.timestamp || 0)
  })

  const now = new Date()
  // Start schedule from current time, rounded up to next 5-min block
  let cursor = new Date(now)
  cursor.setSeconds(0, 0)
  const rem = cursor.getMinutes() % 5
  if (rem !== 0) cursor.setMinutes(cursor.getMinutes() + (5 - rem))

  const DAY_END = new Date(now)
  DAY_END.setHours(22, 0, 0, 0)

  return sorted.map((task) => {
    const duration = task.estimatedMinutes || 25
    const start = new Date(cursor)
    const end = new Date(cursor.getTime() + duration * 60000)

    // Move cursor forward with a 5-min buffer between tasks
    cursor = new Date(end.getTime() + 5 * 60000)

    return {
      ...task,
      blockStart: start,
      blockEnd: end,
      overflowsDay: end > DAY_END,
    }
  })
}

// ── Pomodoro Timer Component ───────────────────────────────────────────────

function PomodoroTimer({ showToast, todos, onPomoComplete }) {
  const [mode, setMode]           = useState('classic')
  const [phase, setPhase]         = useState('work')   // work | shortBreak | longBreak
  const [running, setRunning]     = useState(false)
  const [seconds, setSeconds]     = useState(POMO_MODES.classic.work * 60)
  const [session, setSession]     = useState(0)         // completed work sessions today
  const [linkedTask, setLinkedTask] = useState(null)
  const [showModes, setShowModes] = useState(false)
  const intervalRef               = useRef(null)

  const cfg = POMO_MODES[mode]
  const totalSec = phase === 'work'
    ? cfg.work * 60
    : phase === 'longBreak'
      ? cfg.longBreak * 60
      : cfg.shortBreak * 60

  const progress = 1 - seconds / totalSec
  const RADIUS = 54
  const CIRC = 2 * Math.PI * RADIUS
  const strokeDash = CIRC * (1 - progress)

  // Load session count from localStorage
  useEffect(() => {
    const key = `pomo_session_${getTodayKey()}`
    setSession(parseInt(localStorage.getItem(key) || '0', 10))
  }, [])

  const reset = useCallback((newMode = mode, newPhase = 'work') => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setPhase(newPhase)
    const m = POMO_MODES[newMode]
    const sec = newPhase === 'work' ? m.work * 60
      : newPhase === 'longBreak' ? m.longBreak * 60
      : m.shortBreak * 60
    setSeconds(sec)
  }, [mode])

  const tick = useCallback(() => {
    setSeconds(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current)
        setRunning(false)

        if (phase === 'work') {
          const newSession = session + 1
          setSession(newSession)
          localStorage.setItem(`pomo_session_${getTodayKey()}`, newSession)
          onPomoComplete?.(linkedTask?.id)

          if (newSession % 4 === 0) {
            showToast('🎉 4 Pomodoros done! Take a long break — you earned it.')
            setPhase('longBreak')
            setSeconds(POMO_MODES[mode].longBreak * 60)
          } else {
            showToast('✅ Pomodoro done! 5-min break time 🧠')
            setPhase('shortBreak')
            setSeconds(POMO_MODES[mode].shortBreak * 60)
          }
        } else {
          showToast("⏰ Break's over — back to work!")
          setPhase('work')
          setSeconds(POMO_MODES[mode].work * 60)
        }
        return 0
      }
      return prev - 1
    })
  }, [phase, session, mode, linkedTask, showToast, onPomoComplete])

  const toggle = () => {
    if (running) {
      clearInterval(intervalRef.current)
      setRunning(false)
    } else {
      intervalRef.current = setInterval(tick, 1000)
      setRunning(true)
    }
  }

  // Re-attach interval with fresh tick closure when deps change while running
  useEffect(() => {
    if (running) {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(tick, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [tick, running])

  const selectMode = (newMode) => {
    setMode(newMode)
    setShowModes(false)
    reset(newMode, 'work')
  }

  const phaseColor = phase === 'work'
    ? 'var(--red)'
    : 'var(--shika-secondary)'

  const activeTodos = todos.filter(t => !t.done)

  return (
    <div className="pomo-card card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="card-title" style={{ margin: 0 }}>
          🍅 Focus Timer
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {Array.from({ length: Math.min(session, 8) }).map((_, i) => (
            <span key={i} style={{ fontSize: 12 }}>🍅</span>
          ))}
          {session > 8 && <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>+{session - 8}</span>}
          {session === 0 && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>No sessions today</span>}
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <button
          onClick={() => setShowModes(v => !v)}
          style={{
            width: '100%', padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span>{cfg.label} — {cfg.desc}</span>
          <span style={{ opacity: 0.5 }}>{showModes ? '▲' : '▼'}</span>
        </button>
        {showModes && (
          <div style={{
            position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 100,
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            {Object.entries(POMO_MODES).map(([key, m]) => (
              <button
                key={key}
                onClick={() => selectMode(key)}
                style={{
                  width: '100%', padding: '10px 14px', background: mode === key ? 'rgba(255,107,53,0.12)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--card-border)', cursor: 'pointer',
                  color: mode === key ? 'var(--gohan-primary)' : 'var(--text-primary)',
                  fontSize: 12, fontWeight: 600, textAlign: 'left',
                }}
              >
                {m.label} — {m.desc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timer ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
        <div className="pomo-ring-wrap">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
            <circle
              cx="70" cy="70" r={RADIUS}
              fill="none"
              stroke={phaseColor}
              strokeWidth="8"
              strokeDasharray={CIRC}
              strokeDashoffset={strokeDash}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
            />
          </svg>
          <div className="pomo-ring-text">
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: phaseColor, lineHeight: 1 }}>
              {formatTime(seconds)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>
              {phase === 'work' ? '⚡ Focus' : phase === 'shortBreak' ? '☕ Break' : '😴 Long Break'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            onClick={toggle}
            className="btn-primary"
            style={{
              padding: '10px 28px', fontSize: 14, fontWeight: 800,
              background: running ? 'rgba(230,57,70,0.2)' : undefined,
              borderColor: running ? 'var(--red)' : undefined,
              color: running ? 'var(--red)' : undefined,
            }}
          >
            {running ? '⏸ PAUSE' : seconds === totalSec ? '▶ START' : '▶ RESUME'}
          </button>
          <button
            onClick={() => reset(mode, 'work')}
            style={{
              padding: '10px 16px', borderRadius: 10, fontSize: 13,
              border: '1px solid var(--card-border)', background: 'transparent',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            ↺
          </button>
        </div>
      </div>

      {/* Link to task */}
      {activeTodos.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            🔗 Link this session to a task
          </div>
          <select
            value={linkedTask?.id || ''}
            onChange={e => {
              const t = activeTodos.find(x => x.id === e.target.value)
              setLinkedTask(t || null)
            }}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 12,
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            <option value="">— No task linked —</option>
            {activeTodos.map(t => (
              <option key={t.id} value={t.id}>
                {PRIORITY_CONFIG[t.priority]?.label?.split(' ')[0]} {t.text.slice(0, 50)}
              </option>
            ))}
          </select>
          {linkedTask && (
            <div style={{ fontSize: 11, color: 'var(--shika-secondary)', marginTop: 6 }}>
              ✅ Focusing on: <strong>{linkedTask.text.slice(0, 60)}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Technique Tip Card ────────────────────────────────────────────────────

function TipCard({ showToast }) {
  const todayIndex = new Date().getDay() % TECHNIQUE_TIPS.length
  const [tipIndex, setTipIndex] = useState(todayIndex)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const tip = TECHNIQUE_TIPS[tipIndex]

  return (
    <div className="tip-card" style={{ background: tip.bg, borderColor: tip.color }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: tip.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            {tip.emoji} Today's Technique
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            {tip.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {tip.body}
          </div>
          <div style={{ fontSize: 11, color: tip.color, fontWeight: 700, marginTop: 8 }}>
            → {tip.action}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, padding: '2px 4px', flexShrink: 0 }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {TECHNIQUE_TIPS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTipIndex(i)}
            style={{
              width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: i === tipIndex ? tip.color : 'rgba(255,255,255,0.15)',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Today's Schedule (Time Blocks) ─────────────────────────────────────────

function TodaySchedule({ todos, onToggle }) {
  const todayTasks = todos.filter(t => t.dueToday)
  if (todayTasks.length === 0) {
    return (
      <div className="card">
        <div className="card-title">📅 Today's Schedule</div>
        <div className="no-checkin-msg" style={{ padding: '20px 0' }}>
          <span className="big-emoji">📅</span>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            No tasks scheduled for today yet.<br />
            Mark a task as "Due Today" + set a duration to auto-build your schedule.
          </p>
        </div>
      </div>
    )
  }

  const schedule = buildSchedule(todayTasks)
  const now = new Date()
  const totalMin = schedule.reduce((sum, t) => sum + (t.estimatedMinutes || 25), 0)
  const availMin = Math.max(0, Math.floor((new Date().setHours(22, 0, 0, 0) - now) / 60000))
  const overcommitted = totalMin > availMin

  return (
    <div className="card">
      <div className="card-title">📅 Today's Schedule</div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          ⏱ <strong style={{ color: overcommitted ? 'var(--red)' : 'var(--shika-secondary)' }}>{totalMin} min</strong> scheduled
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          🕐 <strong>{availMin} min</strong> available today
        </div>
        {overcommitted && (
          <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>
            ⚠️ Overcommitted — remove or reschedule tasks
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {schedule.map((block) => {
          const cfg = PRIORITY_CONFIG[block.priority] || PRIORITY_CONFIG.medium
          const isPast = block.blockEnd < now
          const isCurrent = block.blockStart <= now && block.blockEnd > now
          return (
            <div
              key={block.id}
              className={`time-block ${isCurrent ? 'time-block--current' : ''} ${block.done ? 'time-block--done' : ''}`}
              style={{ borderLeftColor: cfg.color }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Checkbox */}
                <button
                  onClick={() => onToggle(block.id)}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${block.done ? 'var(--shika-secondary)' : cfg.color}`,
                    background: block.done ? 'rgba(82,183,136,0.2)' : 'transparent',
                    cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {block.done ? '✓' : ''}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: block.done ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: block.done ? 'line-through' : 'none',
                    lineHeight: 1.3,
                  }}>
                    {block.text}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: cfg.color, fontWeight: 700 }}>
                      {formatHHMM(block.blockStart)} – {formatHHMM(block.blockEnd)}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      {block.estimatedMinutes || 25} min
                    </span>
                    {isCurrent && !block.done && (
                      <span style={{ fontSize: 10, background: 'rgba(255,107,53,0.2)', color: 'var(--gohan-primary)', fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                        NOW
                      </span>
                    )}
                    {block.overflowsDay && (
                      <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>⚠️ Runs late</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MIT — Most Important Tasks ─────────────────────────────────────────────

function MITSection({ todos, onToggle }) {
  const todayTasks = todos.filter(t => t.dueToday && !t.done)
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const top3 = [...todayTasks]
    .sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1))
    .slice(0, 3)

  if (top3.length === 0) return null

  const allDone = top3.every(t => t.done) || top3.length === 0
  const doneCount = todos.filter(t => t.dueToday && t.done).length
  const totalToday = todos.filter(t => t.dueToday).length

  return (
    <div className="mit-card card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="card-title" style={{ margin: 0 }}>🎯 Today's MIT — Top 3</div>
        {totalToday > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {doneCount}/{totalToday} today done
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Your 3 Most Important Tasks. On hard days, completing these = a win.
      </div>

      {top3.map((task, i) => {
        const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
        return (
          <div
            key={task.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderBottom: i < 2 ? '1px solid var(--card-border)' : 'none',
              opacity: task.done ? 0.5 : 1,
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 900, fontSize: 12,
              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}`,
            }}>
              {i + 1}
            </div>
            <button
              onClick={() => onToggle(task.id)}
              style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                border: `2px solid ${task.done ? 'var(--shika-secondary)' : cfg.color}`,
                background: task.done ? 'rgba(82,183,136,0.2)' : 'transparent',
                cursor: 'pointer', fontSize: 11,
              }}
            >
              {task.done ? '✓' : ''}
            </button>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: task.done ? 'var(--text-secondary)' : 'var(--text-primary)',
              textDecoration: task.done ? 'line-through' : 'none',
              flex: 1,
            }}>
              {task.text}
            </div>
          </div>
        )
      })}

      {allDone && doneCount >= 3 && (
        <div style={{
          textAlign: 'center', marginTop: 14, padding: '10px', borderRadius: 10,
          background: 'rgba(82,183,136,0.1)', border: '1px solid var(--shika-secondary)',
          fontSize: 13, fontWeight: 700, color: 'var(--shika-secondary)',
        }}>
          🎉 All 3 MITs done! That's a successful day.
        </div>
      )}
    </div>
  )
}

// ── Main Todo Component ────────────────────────────────────────────────────

export default function Todo({ showToast }) {
  const [todos, setTodos]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [input, setInput]         = useState('')
  const [priority, setPriority]   = useState('medium')
  const [dueToday, setDueToday]   = useState(false)
  const [estMin, setEstMin]       = useState(25)
  const [filter, setFilter]       = useState('today') // today | all | active | done | schedule
  const [saving, setSaving]       = useState(false)
  const [pomoCount, setPomoCount] = useState({})     // taskId → count
  const [showPomo, setShowPomo]   = useState(false)
  const inputRef = useRef(null)

  const { listening, supported, start, stop } = useSpeechToText({
    onResult: (text) => {
      setInput(prev => prev ? `${prev} ${text}` : text)
      inputRef.current?.focus()
      showToast('🎙️ Got it — edit if needed, then add')
    },
    onError: (msg) => showToast(`⚠️ ${msg}`),
  })

  const load = async () => {
    setLoading(true)
    const data = await getTodos()
    setTodos(data)
    setLoading(false)

    // Load pomo counts from localStorage
    const key = `pomo_tasks_${getTodayKey()}`
    const saved = JSON.parse(localStorage.getItem(key) || '{}')
    setPomoCount(saved)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    const text = input.trim()
    if (!text) { showToast('⚠️ Type or dictate something first'); return }

    // 2-Minute Rule: warn for very quick tasks
    if (estMin <= 5 && dueToday) {
      showToast('⚡ 2-Minute Rule: This is quick — consider just doing it right now!')
    }

    setSaving(true)
    const newTodo = await saveTodo({ text, priority, done: false, dueToday, estimatedMinutes: estMin })
    setTodos(prev => [newTodo, ...prev])
    setInput('')
    setPriority('medium')
    setDueToday(false)
    setEstMin(25)
    setSaving(false)
    showToast('✅ Task added')

    // Auto-switch to schedule view when adding today's task
    if (dueToday) setFilter('schedule')
  }

  const handleToggle = async (id) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    await toggleTodo(id, !todo.done)
  }

  const handleDelete = async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id))
    await deleteTodo(id)
    showToast('🗑️ Task removed')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() }
  }

  const handlePomoComplete = (taskId) => {
    if (!taskId) return
    const key = `pomo_tasks_${getTodayKey()}`
    const updated = { ...pomoCount, [taskId]: (pomoCount[taskId] || 0) + 1 }
    setPomoCount(updated)
    localStorage.setItem(key, JSON.stringify(updated))
  }

  // Mark / unmark due today from list — uses updateTodo to patch in-place
  // (saveTodo always generates a new id, which would create duplicates)
  const handleToggleDueToday = async (id) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    const newDueToday = !todo.dueToday
    setTodos(prev => prev.map(t => t.id === id ? { ...t, dueToday: newDueToday } : t))
    await updateTodo(id, { dueToday: newDueToday })
  }

  const filtered = todos.filter(t => {
    if (filter === 'today')    return t.dueToday
    if (filter === 'active')   return !t.done
    if (filter === 'done')     return t.done
    if (filter === 'schedule') return t.dueToday
    return true
  })

  const todayCount  = todos.filter(t => t.dueToday).length
  const activeCount = todos.filter(t => !t.done).length
  const doneCount   = todos.filter(t => t.done).length

  const TAB_CONFIG = [
    { key: 'today',    label: `Today (${todayCount})` },
    { key: 'schedule', label: '📅 Schedule' },
    { key: 'all',      label: `All (${todos.length})` },
    { key: 'active',   label: `Active (${activeCount})` },
    { key: 'done',     label: `Done (${doneCount})` },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <h1>TASKS</h1>
        <p>Time-blocking · Pomodoro · MIT · Built for your ADHD brain.</p>
      </div>

      {/* ── Technique Tip Card ──────────────────────────────── */}
      <TipCard showToast={showToast} />

      {/* ── Pomodoro Toggle ─────────────────────────────────── */}
      <button
        onClick={() => setShowPomo(v => !v)}
        style={{
          width: '100%', marginBottom: 12, padding: '11px 16px',
          borderRadius: 12, border: '1px solid var(--card-border)',
          background: showPomo ? 'rgba(230,57,70,0.1)' : 'rgba(255,255,255,0.04)',
          color: showPomo ? 'var(--red)' : 'var(--text-secondary)',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span>🍅 Pomodoro Focus Timer</span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>{showPomo ? 'Hide ▲' : 'Show ▼'}</span>
      </button>

      {showPomo && (
        <PomodoroTimer
          showToast={showToast}
          todos={todos}
          onPomoComplete={handlePomoComplete}
        />
      )}

      {/* ── MIT Section ─────────────────────────────────────── */}
      <MITSection todos={todos} onToggle={handleToggle} />

      {/* ── New Task Input ──────────────────────────────────── */}
      <div className="card">
        <div className="card-title">➕ New Task</div>

        {!supported && (
          <div style={{ background: 'rgba(244,162,97,0.1)', border: '1px solid var(--yellow)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--yellow)', marginBottom: 12 }}>
            ⚠️ Voice input requires Chrome or Safari. Typing still works perfectly.
          </div>
        )}

        {/* Text + mic */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={listening ? '🎙️ Listening...' : 'What do you need to do?'}
            style={{
              flex: 1,
              background: listening ? 'rgba(230,57,70,0.08)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${listening ? 'var(--red)' : 'var(--card-border)'}`,
              borderRadius: 12, padding: '12px 14px',
              color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
              fontSize: 14, outline: 'none', transition: 'all 0.2s',
            }}
          />
          {supported && (
            <button
              onClick={listening ? stop : start}
              title={listening ? 'Stop recording' : 'Dictate task'}
              style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                border: `1px solid ${listening ? 'var(--red)' : 'var(--card-border)'}`,
                background: listening ? 'rgba(230,57,70,0.2)' : 'rgba(255,255,255,0.05)',
                fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: listening ? 'pulse-red 1.5s infinite' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {listening ? '⏹️' : '🎙️'}
            </button>
          )}
        </div>

        {listening && (
          <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>
            🎙️ Speak now — I'm listening...
          </div>
        )}

        {/* Priority */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setPriority(key)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${priority === key ? cfg.color : 'var(--card-border)'}`,
              background: priority === key ? cfg.bg : 'transparent',
              color: priority === key ? cfg.color : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Due Today + Duration row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Due today toggle */}
          <button
            onClick={() => setDueToday(v => !v)}
            style={{
              padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${dueToday ? 'var(--gohan-primary)' : 'var(--card-border)'}`,
              background: dueToday ? 'rgba(255,107,53,0.12)' : 'transparent',
              color: dueToday ? 'var(--gohan-primary)' : 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            {dueToday ? '📅 Due Today ✓' : '📅 Due Today?'}
          </button>

          {/* Duration selector */}
          {dueToday && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>⏱</span>
              <select
                value={estMin}
                onChange={e => setEstMin(Number(e.target.value))}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 10, fontSize: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                }}
              >
                {DURATION_OPTIONS.map(m => (
                  <option key={m} value={m}>{m} min{m <= 5 ? ' ⚡ Quick' : m <= 25 ? ' 🍅 1 Pomo' : m <= 50 ? ' 🍅🍅' : ' 🌊 Deep'}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {dueToday && estMin <= 5 && (
          <div style={{ fontSize: 11, color: 'var(--yellow)', background: 'rgba(244,162,97,0.08)', border: '1px solid var(--yellow)', borderRadius: 8, padding: '7px 10px', marginBottom: 10 }}>
            ⚡ <strong>2-Minute Rule:</strong> This is quick — consider just doing it right now instead of scheduling it.
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleAdd}
          disabled={saving}
          style={{ opacity: saving ? 0.7 : 1 }}
        >
          {saving ? '⏳ ADDING...' : '+ ADD TASK'}
        </button>
      </div>

      {/* ── Tab Filters ─────────────────────────────────────── */}
      {todos.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {TAB_CONFIG.map(f => (
            <button
              key={f.key}
              className="btn-secondary"
              style={{
                flex: '1 1 auto',
                background: filter === f.key ? 'rgba(255,107,53,0.15)' : 'transparent',
                color: filter === f.key ? 'var(--gohan-primary)' : 'var(--text-secondary)',
                borderColor: filter === f.key ? 'var(--gohan-primary)' : 'var(--card-border)',
                fontSize: 11, padding: '8px 6px', whiteSpace: 'nowrap',
              }}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Schedule View ────────────────────────────────────── */}
      {filter === 'schedule' && (
        <TodaySchedule todos={todos} onToggle={handleToggle} />
      )}

      {/* ── Task List ─────────────────────────────────────────── */}
      {filter !== 'schedule' && (
        loading ? (
          <div className="card">
            <div className="no-checkin-msg"><span className="big-emoji">🔄</span>Loading tasks...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="no-checkin-msg">
              <span className="big-emoji">{filter === 'done' ? '🎉' : filter === 'today' ? '📅' : '📋'}</span>
              {filter === 'done'
                ? 'No completed tasks yet.'
                : filter === 'today'
                  ? 'No tasks marked for today yet. Add one above with "📅 Due Today".'
                  : filter === 'active'
                    ? 'All caught up! Nothing active.'
                    : 'No tasks yet — add one above.'}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '8px 12px' }}>
            {filtered.map((todo, i) => {
              const cfg = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium
              const pomos = pomoCount[todo.id] || 0
              return (
                <div
                  key={todo.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 8px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--card-border)' : 'none',
                    opacity: todo.done ? 0.55 : 1, transition: 'opacity 0.2s',
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(todo.id)}
                    style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      border: `2px solid ${todo.done ? 'var(--shika-secondary)' : cfg.color}`,
                      background: todo.done ? 'rgba(82,183,136,0.2)' : 'transparent',
                      cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 1,
                    }}
                  >
                    {todo.done ? '✓' : ''}
                  </button>

                  {/* Text + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: todo.done ? 'var(--text-secondary)' : 'var(--text-primary)',
                      textDecoration: todo.done ? 'line-through' : 'none',
                      lineHeight: 1.4, wordBreak: 'break-word',
                    }}>
                      {todo.text}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      {todo.dueToday && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,107,53,0.1)', color: 'var(--gohan-primary)' }}>
                          📅 Today {todo.estimatedMinutes ? `· ${todo.estimatedMinutes}m` : ''}
                        </span>
                      )}
                      {pomos > 0 && (
                        <span style={{ fontSize: 11 }} title={`${pomos} Pomodoro${pomos > 1 ? 's' : ''} completed`}>
                          {'🍅'.repeat(Math.min(pomos, 5))}{pomos > 5 ? `+${pomos - 5}` : ''}
                        </span>
                      )}
                      {todo.timestamp && (
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                          {new Date(todo.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Due today quick-toggle */}
                  <button
                    onClick={() => handleToggleDueToday(todo.id)}
                    title={todo.dueToday ? 'Remove from today' : 'Add to today'}
                    style={{
                      background: 'none', border: 'none',
                      color: todo.dueToday ? 'var(--gohan-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: 14, padding: 4, flexShrink: 0, opacity: todo.dueToday ? 1 : 0.35,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    📅
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(todo.id)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0, opacity: 0.4,
                      transition: 'opacity 0.15s',
                    }}
                    title="Delete task"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── Clear completed ─────────────────────────────────── */}
      {doneCount > 0 && filter !== 'schedule' && (
        <button
          className="btn-secondary"
          style={{ width: '100%', fontSize: 13 }}
          onClick={async () => {
            const done = todos.filter(t => t.done)
            setTodos(prev => prev.filter(t => !t.done))
            await Promise.all(done.map(t => deleteTodo(t.id)))
            showToast(`🗑️ Cleared ${done.length} completed task${done.length > 1 ? 's' : ''}`)
          }}
        >
          🗑️ Clear {doneCount} Completed
        </button>
      )}

      <div style={{ height: 8 }} />
    </div>
  )
}

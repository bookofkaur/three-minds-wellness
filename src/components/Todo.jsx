import { useState, useEffect, useRef } from 'react'
import { getTodos, saveTodo, toggleTodo, deleteTodo } from '../firebase'

// ── Web Speech API — 100% free, no API key, built into Chrome/Edge/Safari ──
// This replaces Whisper (which requires a paid OpenAI API key).
// SpeechRecognition runs entirely in the browser — no network cost.
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

const PRIORITY_CONFIG = {
  high:   { label: '🔴 High',   color: 'var(--red)',             bg: 'rgba(230,57,70,0.12)' },
  medium: { label: '🟡 Medium', color: 'var(--yellow)',          bg: 'rgba(244,162,97,0.12)' },
  low:    { label: '🟢 Low',    color: 'var(--shika-secondary)', bg: 'rgba(82,183,136,0.12)' },
}

export default function Todo({ showToast }) {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all') // all | active | done
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  // ── Speech to text ─────────────────────────────────────────
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
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    const text = input.trim()
    if (!text) { showToast('⚠️ Type or dictate something first'); return }
    setSaving(true)
    const newTodo = await saveTodo({ text, priority, done: false })
    setTodos(prev => [newTodo, ...prev])
    setInput('')
    setPriority('medium')
    setSaving(false)
    showToast('✅ Task added')
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

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })
  const activeCount = todos.filter(t => !t.done).length
  const doneCount = todos.filter(t => t.done).length

  return (
    <div className="page">
      <div className="page-header">
        <h1>TASKS</h1>
        <p>Your to-do list. Voice or type — your call.</p>
      </div>

      {/* ── Voice / Text input ─────────────────────────────── */}
      <div className="card">
        <div className="card-title">➕ New Task</div>

        {/* Voice input banner */}
        {!supported && (
          <div style={{ background: 'rgba(244,162,97,0.1)', border: '1px solid var(--yellow)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--yellow)', marginBottom: 12 }}>
            ⚠️ Voice input requires Chrome or Safari. Typing still works perfectly.
          </div>
        )}

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
              borderRadius: 12,
              padding: '12px 14px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
            }}
          />
          {/* Mic button */}
          {supported && (
            <button
              onClick={listening ? stop : start}
              title={listening ? 'Stop recording' : 'Dictate task (free voice input)'}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                border: `1px solid ${listening ? 'var(--red)' : 'var(--card-border)'}`,
                background: listening ? 'rgba(230,57,70,0.2)' : 'rgba(255,255,255,0.05)',
                fontSize: 20,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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

        {/* Priority selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setPriority(key)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${priority === key ? cfg.color : 'var(--card-border)'}`,
                background: priority === key ? cfg.bg : 'transparent',
                color: priority === key ? cfg.color : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={handleAdd}
          disabled={saving}
          style={{ opacity: saving ? 0.7 : 1, marginTop: 0 }}
        >
          {saving ? '⏳ ADDING...' : '+ ADD TASK'}
        </button>

        {supported && (
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 10, opacity: 0.7 }}>
            🎙️ Free voice input via Web Speech API · Works in Chrome & Safari
          </p>
        )}
      </div>

      {/* ── Stats row ──────────────────────────────────────── */}
      {todos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'all',    label: `All (${todos.length})` },
            { key: 'active', label: `Active (${activeCount})` },
            { key: 'done',   label: `Done (${doneCount})` },
          ].map(f => (
            <button
              key={f.key}
              className="btn-secondary"
              style={{
                flex: 1,
                background: filter === f.key ? 'rgba(255,107,53,0.15)' : 'transparent',
                color: filter === f.key ? 'var(--gohan-primary)' : 'var(--text-secondary)',
                borderColor: filter === f.key ? 'var(--gohan-primary)' : 'var(--card-border)',
                fontSize: 12, padding: '9px 4px',
              }}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Todo list ──────────────────────────────────────── */}
      {loading ? (
        <div className="card">
          <div className="no-checkin-msg"><span className="big-emoji">🔄</span>Loading tasks...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="no-checkin-msg">
            <span className="big-emoji">{filter === 'done' ? '🎉' : '📋'}</span>
            {filter === 'done' ? 'No completed tasks yet.' : filter === 'active' ? 'All caught up! Nothing active.' : 'No tasks yet — add one above.'}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '8px 12px' }}>
          {filtered.map((todo, i) => {
            const cfg = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium
            return (
              <div
                key={todo.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 8px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--card-border)' : 'none',
                  opacity: todo.done ? 0.55 : 1,
                  transition: 'opacity 0.2s',
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
                  <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: cfg.bg, color: cfg.color,
                    }}>
                      {cfg.label}
                    </span>
                    {todo.timestamp && (
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        {new Date(todo.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(todo.id)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0, opacity: 0.5,
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
      )}

      {/* ── Clear completed ─────────────────────────────────── */}
      {doneCount > 0 && (
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

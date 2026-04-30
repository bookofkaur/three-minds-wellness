import { useState, useEffect } from 'react'
import { getCheckins, getDistress, setDistress } from '../App'

const MINDS = {
  gohan: { emoji: '🔥', name: 'Gohan', label: 'Emotional Mind', color: '#ff6b35', desc: 'Feeling everything deeply right now.' },
  luffy: { emoji: '⚓', name: 'Joyboy', label: 'Middle Mind', color: '#e63946', desc: 'Balanced, present, and centered.' },
  shika: { emoji: '🧠', name: 'Shikamaru', label: 'Logical Mind', color: '#52b788', desc: 'Strategic and in analysis mode.' },
}

function getStatus(checkins) {
  if (!checkins.length) return 'unknown'
  const last = checkins[0]
  const now = new Date()
  const lastTime = new Date(last.timestamp)
  const hoursSince = (now - lastTime) / 3600000

  if (hoursSince > 24) return 'unseen'

  const recentMood = checkins.slice(0, 3).map(c => c.mood)
  const avgMood = recentMood.reduce((a, b) => a + b, 0) / recentMood.length
  const recentSleep = checkins.slice(0, 2).map(c => parseFloat(c.sleepHours))
  const lowSleep = recentSleep.filter(s => s < 5).length

  if (avgMood < 4 || lowSleep >= 2) return 'red'
  if (avgMood < 6 || lowSleep >= 1) return 'yellow'
  return 'green'
}

function getStreak(checkins) {
  if (!checkins.length) return 0
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 30; i++) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    const dayStr = day.toDateString()
    const found = checkins.find(c => new Date(c.timestamp).toDateString() === dayStr)
    if (found) streak++
    else if (i > 0) break
  }
  return streak
}

function getWarnings(checkins) {
  const warnings = []
  if (checkins.length >= 2) {
    const recentSleep = checkins.slice(0, 2).map(c => parseFloat(c.sleepHours))
    if (recentSleep.every(s => s < 5)) {
      warnings.push({ type: 'red', msg: 'Sleep under 5hrs for 2+ days. Sleep disruption is a major trigger for mood episodes. Rest is medicine.' })
    } else if (recentSleep.some(s => s < 6)) {
      warnings.push({ type: 'yellow', msg: 'Sleep has been low recently. Watch this — it feeds racing thoughts.' })
    }
  }
  if (checkins.length >= 3) {
    const recentMood = checkins.slice(0, 3).map(c => c.mood)
    if (recentMood.every(m => m < 4)) {
      warnings.push({ type: 'red', msg: 'Mood has been low for 3+ days. This is your brain asking for support — not weakness.' })
    }
  }
  return warnings
}

export default function Dashboard({ onNavigate, VIEWS, showToast }) {
  const [checkins, setCheckins] = useState([])
  const [distress, setDistressState] = useState(null)

  useEffect(() => {
    setCheckins(getCheckins())
    setDistressState(getDistress())
  }, [])

  const latest = checkins[0]
  const status = getStatus(checkins)
  const streak = getStreak(checkins)
  const warnings = getWarnings(checkins)
  const activeMind = latest ? MINDS[latest.mind] : null

  const handleDistress = () => {
    setDistress(true)
    setDistressState({ active: true })
    showToast('🚨 Support signal sent to your network')
  }

  const clearDistress = () => {
    setDistress(false)
    setDistressState(null)
    showToast('✅ Signal cleared — glad you\'re okay')
  }

  const statusConfig = {
    green: { label: '✅ Stable', cls: 'status-green' },
    yellow: { label: '⚠️ Watch', cls: 'status-yellow' },
    red: { label: '🚨 Needs Support', cls: 'status-red' },
    unseen: { label: '👻 MIA', cls: 'status-yellow' },
    unknown: { label: '❓ No Data Yet', cls: 'status-yellow' },
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>THE THREE MINDS</h1>
        <p>Your daily wellness command center, D.</p>
      </div>

      {/* Distress active banner */}
      {distress?.active && (
        <div className="alert-banner" style={{ marginBottom: 16 }}>
          <span className="alert-icon">🚨</span>
          <div className="alert-text" style={{ flex: 1 }}>
            <h4>Support Signal Active</h4>
            <p>Your network can see you need support. Josh and Shenita have been flagged.</p>
          </div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: '8px 12px' }} onClick={clearDistress}>
            I'm OK
          </button>
        </div>
      )}

      {/* Warnings */}
      {warnings.map((w, i) => (
        <div key={i} className={`alert-banner ${w.type === 'yellow' ? 'yellow' : ''}`}>
          <span className="alert-icon">{w.type === 'red' ? '🚨' : '⚠️'}</span>
          <div className="alert-text">
            <h4>{w.type === 'red' ? 'Early Warning' : 'Heads Up'}</h4>
            <p>{w.msg}</p>
          </div>
        </div>
      ))}

      {/* Status */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span className="card-title">Current Status</span>
          <span className={`status-badge ${statusConfig[status].cls}`}>
            {statusConfig[status].label}
          </span>
        </div>

        {activeMind ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 52 }}>{activeMind.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: 1 }}>
                {activeMind.name}
              </div>
              <div style={{ color: activeMind.color, fontSize: 13, fontWeight: 700 }}>{activeMind.label}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>{activeMind.desc}</div>
            </div>
          </div>
        ) : (
          <div className="no-checkin-msg" style={{ padding: '16px 0' }}>
            <span>No check-in yet today — tap <strong>Check In</strong> below</span>
          </div>
        )}

        {latest && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mood</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gohan-secondary)' }}>{latest.mood}/10</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Energy</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--shika-secondary)' }}>{latest.energy}/10</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sleep</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: latest.sleepHours < 5 ? 'var(--red)' : 'var(--luffy-secondary)' }}>
                  {latest.sleepHours}h
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="streak-display">
          <div className="streak-number">🔥{streak}</div>
          <div className="streak-text">
            <h4>Day Streak</h4>
            <p>Consistency is your superpower. Keep going.</p>
          </div>
        </div>
      )}

      {/* Quick Check-In CTA */}
      <div className="card">
        <div className="card-title">
          {latest && new Date(latest.timestamp).toDateString() === new Date().toDateString()
            ? '✅ Checked In Today'
            : '📋 Daily Check-In'}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>
          {latest && new Date(latest.timestamp).toDateString() === new Date().toDateString()
            ? `Last check-in: ${new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — You can log another anytime.`
            : 'How are you doing right now? Takes 60 seconds.'}
        </p>
        <button className="btn-primary" onClick={() => onNavigate(VIEWS.CHECKIN)}>
          {latest && new Date(latest.timestamp).toDateString() === new Date().toDateString()
            ? 'LOG AGAIN'
            : 'CHECK IN NOW'}
        </button>
      </div>

      {/* Meds snapshot */}
      {latest && (
        <div className="card">
          <div className="card-title">💊 Meds Today</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['mirtazapine', 'atomoxetine', 'vitaminD', 'fishOil', 'magnesium'].map(med => {
              const taken = latest.meds?.[med]
              const labels = {
                mirtazapine: 'Mirtazapine',
                atomoxetine: 'Atomoxetine',
                vitaminD: 'Vitamin D',
                fishOil: 'Fish Oil',
                magnesium: 'Magnesium',
              }
              return (
                <span key={med} style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  background: taken ? 'rgba(82,183,136,0.2)' : 'rgba(255,255,255,0.05)',
                  color: taken ? 'var(--green)' : 'var(--text-secondary)',
                  border: `1px solid ${taken ? 'var(--green)' : 'var(--card-border)'}`,
                }}>
                  {taken ? '✓' : '○'} {labels[med]}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* SOS */}
      <div className="card">
        <div className="card-title">🆘 Need Support?</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
          One tap sends a signal to Josh and Shenita. No explanation needed.
        </p>
        {distress?.active ? (
          <button className="btn-secondary" style={{ width: '100%' }} onClick={clearDistress}>
            ✅ I'm okay now — clear signal
          </button>
        ) : (
          <button className="btn-distress" onClick={handleDistress}>
            🚨 I NEED SUPPORT
          </button>
        )}
      </div>
    </div>
  )
}

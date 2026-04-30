import { useState, useEffect } from 'react'
import { getCheckins, getDistress, setDistress, dbConfigured } from '../firebase'

const MINDS = {
  gohan: {
    emoji: '🔥', name: 'Gohan', label: 'Emotional Mind', color: '#ff6b35',
    familyDesc: "Feelings are loud right now — he's running on passion and intensity. Be a listening ear, not a problem solver. Don't try to logic him out of what he's feeling.",
  },
  luffy: {
    emoji: '⚓', name: 'Joyboy', label: 'Wise Mind (Balanced)', color: '#e63946',
    familyDesc: "He's centered and present — this is his best operating state. Great time to connect, celebrate wins, and just be normal together.",
  },
  shika: {
    emoji: '🧠', name: 'Shikamaru', label: 'Logical Mind', color: '#52b788',
    familyDesc: "He's in deep analysis mode — may seem distant or quiet. He's okay. Give him space to process, and reach out gently rather than demanding attention.",
  },
}

function getStatusInfo(checkins, distress) {
  if (distress?.active) return { label: '🚨 Needs Support Now', cls: 'status-red', level: 'red' }
  if (!checkins.length) return { label: '❓ No Data Yet', cls: 'status-yellow', level: 'yellow' }
  const last = checkins[0]
  const hoursSince = (new Date() - new Date(last.timestamp)) / 3600000
  if (hoursSince > 24) return { label: '👻 No Check-In in 24h+', cls: 'status-red', level: 'red' }
  const avgMood = checkins.slice(0, 3).reduce((s, c) => s + c.mood, 0) / Math.min(checkins.length, 3)
  const lowSleep = checkins.slice(0, 2).filter(c => parseFloat(c.sleepHours) < 5).length
  if (avgMood < 4 || lowSleep >= 2) return { label: '🚨 Needs Support', cls: 'status-red', level: 'red' }
  if (avgMood < 6 || lowSleep >= 1) return { label: '⚠️ Watch Closely', cls: 'status-yellow', level: 'yellow' }
  return { label: '✅ Doing Good', cls: 'status-green', level: 'green' }
}

function timeSince(iso) {
  const diff = (new Date() - new Date(iso)) / 60000
  if (diff < 1) return 'just now'
  if (diff < 60) return `${Math.round(diff)}m ago`
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`
  return `${Math.round(diff / 1440)}d ago`
}

export default function FamilyOnly({ showToast }) {
  const [checkins, setCheckins] = useState([])
  const [distress, setDistressState] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [c, d] = await Promise.all([getCheckins(), getDistress()])
    setCheckins(c)
    setDistressState(d)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Auto-refresh every 60 seconds
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const latest = checkins[0]
  const status = getStatusInfo(checkins, distress)
  const mindInfo = latest ? MINDS[latest.mind] : null

  const handleClearDistress = async () => {
    await setDistress(false)
    setDistressState(null)
    showToast('✅ Signal cleared')
  }

  const borderColor = status.level === 'red' ? 'var(--red)' : status.level === 'yellow' ? 'var(--yellow)' : 'var(--green)'

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header">
        <h1>DARRIAN'S STATUS</h1>
        <p>Updated live — share this link: <code style={{ fontSize: 11, opacity: 0.6 }}>?family</code></p>
      </div>

      {!dbConfigured() && (
        <div className="alert-banner yellow" style={{ marginBottom: 16 }}>
          <span className="alert-icon">⚙️</span>
          <div className="alert-text">
            <h4>Database not connected yet</h4>
            <p>Once the database is set up, this view will show live data from any device.</p>
          </div>
        </div>
      )}

      {/* Distress alert — full-screen treatment */}
      {distress?.active && (
        <div className="alert-banner" style={{ marginBottom: 16 }}>
          <span className="alert-icon">🚨</span>
          <div className="alert-text" style={{ flex: 1 }}>
            <h4 style={{ fontSize: 16, color: 'var(--red)' }}>Darrian Pressed the Support Button</h4>
            <p>He flagged that he needs support {timeSince(distress.timestamp)}. Reach out now — he doesn't have to explain anything.</p>
            <p style={{ marginTop: 6, fontWeight: 700, color: 'var(--text-primary)' }}>
              Text: "Hey, I'm here. No rush, no pressure." 💬
            </p>
          </div>
        </div>
      )}

      {/* Main status card */}
      <div className="card" style={{ borderColor, borderWidth: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span className="card-title" style={{ marginBottom: 0 }}>Right Now</span>
          <span className={`status-badge ${status.cls}`}>{loading ? '...' : status.label}</span>
        </div>

        {loading ? (
          <div className="no-checkin-msg" style={{ padding: '20px 0' }}>
            <span className="big-emoji">🔄</span>
            Loading...
          </div>
        ) : mindInfo ? (
          <>
            <div className="family-mind-display" style={{ padding: '12px 0' }}>
              <span className="family-mind-emoji">{mindInfo.emoji}</span>
              <div className="family-mind-name" style={{ color: mindInfo.color }}>{mindInfo.name}</div>
              <div style={{ color: mindInfo.color, fontSize: 13, fontWeight: 700, marginTop: 4, opacity: 0.8 }}>{mindInfo.label}</div>
              <p className="family-mind-desc">{mindInfo.familyDesc}</p>
            </div>
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--card-border)' }}>
              <div className="stat-row">
                <span className="stat-label">Last Check-In</span>
                <span className="stat-value">{timeSince(latest.timestamp)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Mood</span>
                <span className="stat-value" style={{ color: latest.mood >= 7 ? 'var(--green)' : latest.mood >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                  {latest.mood}/10
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Sleep</span>
                <span className="stat-value" style={{ color: latest.sleepHours >= 7 ? 'var(--green)' : latest.sleepHours >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                  {latest.sleepHours}h {parseFloat(latest.sleepHours) < 5 ? '⚠️' : ''}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Meds</span>
                <span className="stat-value">
                  {latest.meds
                    ? Object.values(latest.meds).every(Boolean) ? '✅ All Taken'
                    : Object.values(latest.meds).some(Boolean) ? '⚠️ Partial'
                    : '❌ None'
                    : '—'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="no-checkin-msg">
            <span className="big-emoji">🤷</span>
            No check-ins yet. If you're worried, text him directly.
          </div>
        )}
      </div>

      {/* How to show up */}
      <div className="card">
        <div className="card-title">💬 How to Show Up</div>
        {status.level === 'red' && (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 10 }}>🚨 <strong style={{ color: 'var(--text-primary)' }}>Reach out now. Don't wait for him to ask.</strong></p>
            <p style={{ marginBottom: 6 }}>✅ <em>"Hey, I'm thinking about you. No pressure — just checking in."</em></p>
            <p style={{ marginBottom: 6 }}>✅ Offer something specific: <em>"Want food? I can come by."</em></p>
            <p>❌ Avoid: <em>"Why didn't you call me?"</em> or <em>"Have you taken your meds?"</em></p>
          </div>
        )}
        {status.level === 'yellow' && (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 10 }}>⚠️ <strong style={{ color: 'var(--text-primary)' }}>He's managing — worth a gentle check-in.</strong></p>
            <p style={{ marginBottom: 6 }}>✅ <em>"Thinking about you, how's it going?"</em></p>
            <p>✅ Invite him to something low-key. Being around people is protective for his brain.</p>
          </div>
        )}
        {status.level === 'green' && (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 10 }}>✅ <strong style={{ color: 'var(--text-primary)' }}>Darrian is stable and doing well.</strong></p>
            <p style={{ marginBottom: 6 }}>Connect normally — hype him up, share something funny, ask about Georgia Tech.</p>
            <p>Keep encouraging sleep and routine. That consistency is what keeps him here.</p>
          </div>
        )}
      </div>

      {/* Understanding the three minds */}
      <div className="card">
        <div className="card-title">🧬 His Three Minds — What Each Means</div>
        {Object.values(MINDS).map(m => (
          <div key={m.name} style={{ display: 'flex', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: 30, flexShrink: 0 }}>{m.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: m.color, letterSpacing: 1 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.familyDesc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Trusted contacts */}
      <div className="card">
        <div className="card-title">📞 Primary Contacts</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>Coordinate here if you need to loop others in:</p>
        {[
          { initials: 'J', name: 'Josh', role: 'Close friend · Primary contact', color: 'linear-gradient(135deg, #ff6b35, #ff9f1c)' },
          { initials: 'S', name: 'Shenita', role: 'Trusted support · Primary contact', color: 'linear-gradient(135deg, #2d6a4f, #52b788)' },
        ].map(c => (
          <div key={c.name} className="contact-card">
            <div className="contact-avatar" style={{ background: c.color }}>{c.initials}</div>
            <div className="contact-info">
              <h4>{c.name}</h4>
              <p>{c.role}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Meds context */}
      <div className="card">
        <div className="card-title">💊 What He Takes & Why</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
          If he's skipping medications, that's an early warning sign worth mentioning gently:
        </p>
        {[
          { name: 'Mirtazapine', role: 'Mood + sleep stabilizer', note: 'Missing doses disrupts sleep — which triggers mood episodes' },
          { name: 'Atomoxetine', role: 'ADHD (non-stimulant)', note: 'Supports focus and impulse control throughout the day' },
          { name: 'Vitamin D · Fish Oil · Magnesium', role: 'Supplements', note: 'Brain health and sleep quality — small but consistent' },
        ].map(m => (
          <div key={m.name} style={{ marginBottom: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{m.name}</div>
            <div style={{ color: 'var(--shika-secondary)', fontSize: 12, fontWeight: 700 }}>{m.role}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 3 }}>{m.note}</div>
          </div>
        ))}
      </div>

      {/* Refresh button */}
      <button className="btn-secondary" style={{ width: '100%' }} onClick={load}>
        🔄 Refresh
      </button>

      {distress?.active && (
        <div style={{ marginTop: 10 }}>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={handleClearDistress}>
            ✅ Darrian is okay — clear signal
          </button>
        </div>
      )}
    </div>
  )
}

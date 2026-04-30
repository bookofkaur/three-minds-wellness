import { useState, useEffect } from 'react'
import { getCheckins, getDistress, setDistress } from '../App'

const MINDS = {
  gohan: {
    emoji: '🔥',
    name: 'Gohan',
    label: 'Emotional Mind',
    color: '#ff6b35',
    familyDesc: "Darrian is in his Emotional Mind right now — feelings are loud and he's running on passion and intensity. He may need space to feel, or a listening ear. Don't try to logic him out of it.",
  },
  luffy: {
    emoji: '⚓',
    name: 'Joyboy',
    label: 'Middle Mind (Wise Mind)',
    color: '#e63946',
    familyDesc: "Darrian is in his balanced state — Joyboy mode. He's centered, present, and doing well. This is his best self operating. Great time to connect.",
  },
  shika: {
    emoji: '🧠',
    name: 'Shikamaru',
    label: 'Logical Mind',
    color: '#52b788',
    familyDesc: "Darrian is in analytical mode — Shikamaru. He's detached, strategic, and thinking deeply. He's okay, but may seem distant. Give him room to process.",
  },
}

function getStatusInfo(checkins, distress) {
  if (distress?.active) return { label: '🚨 Needs Support', cls: 'status-red', level: 'red' }
  if (!checkins.length) return { label: '❓ No Data', cls: 'status-yellow', level: 'yellow' }

  const last = checkins[0]
  const hoursSince = (new Date() - new Date(last.timestamp)) / 3600000

  if (hoursSince > 24) return { label: '👻 No Check-In 24h+', cls: 'status-red', level: 'red' }

  const recentMood = checkins.slice(0, 3).map(c => c.mood)
  const avgMood = recentMood.reduce((a, b) => a + b, 0) / recentMood.length
  const recentSleep = checkins.slice(0, 2).map(c => parseFloat(c.sleepHours))
  const lowSleep = recentSleep.filter(s => s < 5).length

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

export default function FamilyView({ showToast }) {
  const [checkins, setCheckins] = useState([])
  const [distress, setDistressState] = useState(null)

  useEffect(() => {
    setCheckins(getCheckins())
    setDistressState(getDistress())
  }, [])

  const latest = checkins[0]
  const status = getStatusInfo(checkins, distress)
  const mindInfo = latest ? MINDS[latest.mind] : null

  const clearDistress = () => {
    setDistress(false)
    setDistressState(null)
    showToast("✅ Darrian marked as okay")
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>FAMILY VIEW</h1>
        <p>How Darrian is doing — for the people who have his back.</p>
      </div>

      {/* Distress alert */}
      {distress?.active && (
        <div className="alert-banner" style={{ marginBottom: 16 }}>
          <span className="alert-icon">🚨</span>
          <div className="alert-text" style={{ flex: 1 }}>
            <h4 style={{ fontSize: 16 }}>Darrian Needs Support</h4>
            <p>He pressed the support button {timeSince(distress.timestamp)}. Reach out now — no explanation needed from him.</p>
          </div>
        </div>
      )}

      {/* Main status */}
      <div className="card" style={{
        borderColor: status.level === 'red' ? 'var(--red)' : status.level === 'yellow' ? 'var(--yellow)' : 'var(--green)',
        borderWidth: 2,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Darrian's Status</div>
          <span className={`status-badge ${status.cls}`}>{status.label}</span>
        </div>

        {mindInfo ? (
          <div className="family-mind-display" style={{ padding: '12px 0' }}>
            <span className="family-mind-emoji">{mindInfo.emoji}</span>
            <div className="family-mind-name" style={{ color: mindInfo.color }}>{mindInfo.name}</div>
            <div style={{ color: mindInfo.color, fontSize: 13, fontWeight: 700, marginTop: 4, opacity: 0.8 }}>{mindInfo.label}</div>
            <p className="family-mind-desc">{mindInfo.familyDesc}</p>
          </div>
        ) : (
          <div className="no-checkin-msg">
            <span className="big-emoji">🤷</span>
            No check-in data yet. If you're worried, reach out directly.
          </div>
        )}

        {latest && (
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--card-border)' }}>
            <div className="stat-row">
              <span className="stat-label">Last Check-In</span>
              <span className="stat-value">{timeSince(latest.timestamp)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Mood Score</span>
              <span className="stat-value" style={{
                color: latest.mood >= 7 ? 'var(--green)' : latest.mood >= 5 ? 'var(--yellow)' : 'var(--red)'
              }}>
                {latest.mood}/10
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Sleep Last Night</span>
              <span className="stat-value" style={{
                color: latest.sleepHours >= 7 ? 'var(--green)' : latest.sleepHours >= 5 ? 'var(--yellow)' : 'var(--red)'
              }}>
                {latest.sleepHours} hours {latest.sleepHours < 5 ? '⚠️' : ''}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Medications</span>
              <span className="stat-value">
                {latest.meds ? (
                  Object.values(latest.meds).every(Boolean) ? '✅ All Taken' :
                  Object.values(latest.meds).some(Boolean) ? '⚠️ Partial' : '❌ None Logged'
                ) : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* What to do */}
      <div className="card">
        <div className="card-title">💬 How to Show Up</div>
        {status.level === 'red' && (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 12 }}>🚨 <strong style={{ color: 'var(--text-primary)' }}>Now is the time to reach out.</strong> Don't wait for him to ask.</p>
            <p style={{ marginBottom: 8 }}>✅ Text: <em>"Hey, I'm thinking about you. No pressure — just wanted to check in."</em></p>
            <p style={{ marginBottom: 8 }}>✅ Offer something specific: <em>"Want to grab food?"</em> or <em>"I can come over."</em></p>
            <p>❌ Don't say: <em>"Why didn't you tell me?"</em> or <em>"You need to see a doctor."</em></p>
          </div>
        )}
        {status.level === 'yellow' && (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 12 }}>⚠️ <strong style={{ color: 'var(--text-primary)' }}>He's managing but worth a check-in.</strong></p>
            <p style={{ marginBottom: 8 }}>✅ A simple text goes a long way: <em>"Thinking of you, how's it going?"</em></p>
            <p>✅ Invite him to something low-key. Social connection is protective for his brain.</p>
          </div>
        )}
        {status.level === 'green' && (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 12 }}>✅ <strong style={{ color: 'var(--text-primary)' }}>Darrian is stable and doing well.</strong></p>
            <p style={{ marginBottom: 8 }}>This is a great time to connect normally — celebrate what he's working on, share something funny.</p>
            <p>Keep encouraging the routine (check-ins, sleep, meds). Consistency is what keeps him here.</p>
          </div>
        )}
      </div>

      {/* Understanding his Three Minds */}
      <div className="card">
        <div className="card-title">🧬 His Three Minds</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Darrian experiences himself through three distinct internal states, each with its own needs:
        </p>
        {Object.values(MINDS).map(m => (
          <div key={m.name} style={{
            display: 'flex',
            gap: 14,
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: '1px solid var(--card-border)',
          }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>{m.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: m.color, letterSpacing: 1 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.familyDesc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* His medications - what family should know */}
      <div className="card">
        <div className="card-title">💊 His Medications</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Medication consistency is critical for Darrian. If he's skipping them, that's an early warning sign.
        </p>
        {[
          { name: 'Mirtazapine', role: 'Mood stabilizer + sleep support', note: 'Key medication — affects mood and rest' },
          { name: 'Atomoxetine', role: 'ADHD (non-stimulant)', note: 'Helps focus and impulse control' },
          { name: 'Vitamin D + Fish Oil + Magnesium', role: 'Supplements', note: 'Supports brain function and sleep quality' },
        ].map(med => (
          <div key={med.name} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{med.name}</div>
            <div style={{ color: 'var(--shika-secondary)', fontSize: 12, fontWeight: 700 }}>{med.role}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>{med.note}</div>
          </div>
        ))}
      </div>

      {/* Trusted contacts */}
      <div className="card">
        <div className="card-title">📞 Trusted Contacts</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
          Primary support network if you need to coordinate:
        </p>
        <div className="contact-card">
          <div className="contact-avatar">J</div>
          <div className="contact-info">
            <h4>Josh</h4>
            <p>Primary contact · Close friend</p>
          </div>
        </div>
        <div className="contact-card">
          <div className="contact-avatar" style={{ background: 'linear-gradient(135deg, var(--shika-primary), var(--shika-secondary))' }}>S</div>
          <div className="contact-info">
            <h4>Shenita</h4>
            <p>Primary contact · Trusted support</p>
          </div>
        </div>
      </div>

      {distress?.active && (
        <div style={{ marginTop: 8 }}>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={clearDistress}>
            ✅ Darrian is okay — clear signal
          </button>
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  )
}

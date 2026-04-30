import { useState, useEffect } from 'react'
import { getCheckins, getDistress, setDistress } from '../firebase'

const MINDS = {
  gohan: { emoji: '🔥', name: 'Gohan', label: 'Emotional Mind', color: '#ff6b35',
    familyDesc: "Darrian is in his Emotional Mind — feelings are loud and he's running on passion and intensity. Be a listener, not a problem-solver. Don't try to logic him out of it." },
  luffy: { emoji: '⚓', name: 'Joyboy', label: 'Middle Mind (Wise Mind)', color: '#e63946',
    familyDesc: "Darrian is in his balanced state — Joyboy mode. He's centered, present, and doing well. Great time to connect." },
  shika: { emoji: '🧠', name: 'Shikamaru', label: 'Logical Mind', color: '#52b788',
    familyDesc: "Darrian is in analytical mode — Shikamaru. He's detached, strategic, thinking deeply. He's okay, but may seem quiet. Give him room to process." },
}

function getStatusInfo(checkins, distress) {
  if (distress?.active) return { label: '🚨 Needs Support', cls: 'status-red', level: 'red' }
  if (!checkins.length) return { label: '❓ No Data', cls: 'status-yellow', level: 'yellow' }
  const last = checkins[0]
  const hoursSince = (new Date() - new Date(last.timestamp)) / 3600000
  if (hoursSince > 24) return { label: '👻 No Check-In 24h+', cls: 'status-red', level: 'red' }
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

export default function FamilyView({ showToast }) {
  const [checkins, setCheckins] = useState([])
  const [distress, setDistressState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCheckins(), getDistress()]).then(([c, d]) => {
      setCheckins(c); setDistressState(d); setLoading(false)
    })
  }, [])

  const latest = checkins[0]
  const status = getStatusInfo(checkins, distress)
  const mindInfo = latest ? MINDS[latest.mind] : null

  const clearDistress = async () => {
    await setDistress(false)
    setDistressState(null)
    showToast("✅ Darrian marked as okay")
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>FAMILY VIEW</h1>
        <p>Preview of what your people see at the family link.</p>
      </div>

      <div className="card" style={{
        borderColor: status.level === 'red' ? 'var(--red)' : status.level === 'yellow' ? 'var(--yellow)' : 'var(--green)',
        borderWidth: 2,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Darrian's Status</div>
          <span className={`status-badge ${status.cls}`}>{status.label}</span>
        </div>

        {loading ? (
          <div className="no-checkin-msg" style={{ padding: '16px 0' }}>Loading...</div>
        ) : mindInfo ? (
          <div className="family-mind-display" style={{ padding: '12px 0' }}>
            <span className="family-mind-emoji">{mindInfo.emoji}</span>
            <div className="family-mind-name" style={{ color: mindInfo.color }}>{mindInfo.name}</div>
            <div style={{ color: mindInfo.color, fontSize: 13, fontWeight: 700, marginTop: 4, opacity: 0.8 }}>{mindInfo.label}</div>
            <p className="family-mind-desc">{mindInfo.familyDesc}</p>
          </div>
        ) : (
          <div className="no-checkin-msg"><span className="big-emoji">🤷</span>No check-in data yet.</div>
        )}

        {latest && (
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--card-border)' }}>
            {[
              { label: 'Last Check-In', value: timeSince(latest.timestamp), color: null },
              { label: 'Mood Score', value: `${latest.mood}/10`, color: latest.mood >= 7 ? 'var(--green)' : latest.mood >= 5 ? 'var(--yellow)' : 'var(--red)' },
              { label: 'Sleep Last Night', value: `${latest.sleepHours}h${parseFloat(latest.sleepHours) < 5 ? ' ⚠️' : ''}`, color: parseFloat(latest.sleepHours) >= 7 ? 'var(--green)' : parseFloat(latest.sleepHours) >= 5 ? 'var(--yellow)' : 'var(--red)' },
              { label: 'Medications', value: latest.meds ? Object.values(latest.meds).every(Boolean) ? '✅ All Taken' : Object.values(latest.meds).some(Boolean) ? '⚠️ Partial' : '❌ None' : '—', color: null },
            ].map(r => (
              <div key={r.label} className="stat-row">
                <span className="stat-label">{r.label}</span>
                <span className="stat-value" style={r.color ? { color: r.color } : {}}>{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ background: 'rgba(82,183,136,0.08)', borderColor: 'var(--shika-secondary)' }}>
        <div className="card-title">🔗 Family Share Link</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
          Share this exact URL with Josh, Shenita, and your circle. They only see status — no Check In option:
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px',
          fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', color: 'var(--shika-secondary)',
          border: '1px solid var(--card-border)',
        }}>
          {window.location.origin}{window.location.pathname}?family
        </div>
      </div>

      {Object.values(MINDS).map(m => (
        <div key={m.name} style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: '16px', marginBottom: 10 }}>
          <span style={{ fontSize: 30, flexShrink: 0 }}>{m.emoji}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: m.color, letterSpacing: 1 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.familyDesc}</div>
          </div>
        </div>
      ))}

      <div className="card">
        <div className="card-title">📞 Trusted Contacts</div>
        {[
          { initials: 'J', name: 'Josh', role: 'Close friend · Primary contact', color: 'linear-gradient(135deg, #ff6b35, #ff9f1c)' },
          { initials: 'S', name: 'Shenita', role: 'Trusted support · Primary contact', color: 'linear-gradient(135deg, #2d6a4f, #52b788)' },
        ].map(c => (
          <div key={c.name} className="contact-card">
            <div className="contact-avatar" style={{ background: c.color }}>{c.initials}</div>
            <div className="contact-info"><h4>{c.name}</h4><p>{c.role}</p></div>
          </div>
        ))}
      </div>

      {distress?.active && (
        <button className="btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={clearDistress}>
          ✅ Darrian is okay — clear signal
        </button>
      )}
      <div style={{ height: 8 }} />
    </div>
  )
}

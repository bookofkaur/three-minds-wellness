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

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

function get7DayCheckins(checkins) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  return checkins.filter(c => new Date(c.timestamp) >= cutoff)
}

function getMedStatus(meds) {
  if (!meds) return { label: '—', color: 'var(--text-secondary)' }
  const vals = Object.values(meds)
  if (vals.every(Boolean)) return { label: '✅ All Taken', color: 'var(--green)' }
  if (vals.some(Boolean)) return { label: '⚠️ Partial', color: 'var(--yellow)' }
  return { label: '❌ None', color: 'var(--red)' }
}

function buildInsights(week) {
  if (!week.length) return null
  const moods = week.map(c => c.mood)
  const avgMood = (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1)
  const recentAvg = moods.slice(0, Math.ceil(moods.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(moods.length / 2)
  const olderAvg = moods.slice(Math.ceil(moods.length / 2)).reduce((a, b) => a + b, 0) / (moods.length - Math.ceil(moods.length / 2)) || recentAvg
  const moodTrend = recentAvg > olderAvg + 0.5 ? '↑' : recentAvg < olderAvg - 0.5 ? '↓' : '→'
  const moodTrendColor = moodTrend === '↑' ? 'var(--green)' : moodTrend === '↓' ? 'var(--red)' : 'var(--yellow)'
  const goodSleepNights = week.filter(c => parseFloat(c.sleepHours) >= 7).length
  const consecutiveLowSleep = (() => {
    let max = 0, cur = 0
    for (const c of week) {
      if (parseFloat(c.sleepHours) < 6) { cur++; max = Math.max(max, cur) } else cur = 0
    }
    return max
  })()
  const medsCheckins = week.filter(c => c.meds && Object.values(c.meds).length > 0)
  const medAdherence = medsCheckins.length
    ? Math.round((medsCheckins.filter(c => Object.values(c.meds).every(Boolean)).length / medsCheckins.length) * 100)
    : null
  const mindCounts = { gohan: 0, luffy: 0, shika: 0 }
  week.forEach(c => { if (mindCounts[c.mind] !== undefined) mindCounts[c.mind]++ })
  const warnings = []
  if (consecutiveLowSleep >= 2) warnings.push({ icon: '😴', text: `${consecutiveLowSleep} consecutive nights under 6h — early warning for mood episodes.` })
  if (moods.slice(0, 3).filter(m => m <= 3).length >= 2) warnings.push({ icon: '💙', text: 'Mood very low in recent check-ins. May need active support.' })
  if (medAdherence !== null && medAdherence < 60) warnings.push({ icon: '💊', text: `Meds taken ${medAdherence}% of this week. Missed meds can destabilize mood.` })
  if (mindCounts.gohan >= 4) warnings.push({ icon: '🔥', text: 'Mostly in Emotional Mind this week — may be overwhelmed.' })
  return { avgMood, moodTrend, moodTrendColor, goodSleepNights, medAdherence, mindCounts, warnings }
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
  const week = get7DayCheckins(checkins)
  const insights = buildInsights(week)

  const clearDistress = async () => {
    await setDistress(false)
    setDistressState(null)
    showToast("✅ Darrian marked as okay")
  }

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <h1>FAMILY VIEW</h1>
        <p style={{ fontSize: 13, opacity: 0.7 }}>Preview of exactly what family & friends see at the share link.</p>
      </div>

      {/* Main Status Card */}
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
          <>
            <div className="family-mind-display" style={{ padding: '12px 0' }}>
              <span className="family-mind-emoji">{mindInfo.emoji}</span>
              <div className="family-mind-name" style={{ color: mindInfo.color }}>{mindInfo.name}</div>
              <div style={{ color: mindInfo.color, fontSize: 13, fontWeight: 700, marginTop: 4, opacity: 0.8 }}>{mindInfo.label}</div>
              <p className="family-mind-desc">{mindInfo.familyDesc}</p>
            </div>
            <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--card-border)' }}>
              <div className="stat-row">
                <span className="stat-label">Last Check-In</span>
                <span className="stat-value" style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: 13 }}>{formatDateTime(latest.timestamp)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>{timeSince(latest.timestamp)}</span>
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Mood Score</span>
                <span className="stat-value" style={{ color: latest.mood >= 7 ? 'var(--green)' : latest.mood >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                  {latest.mood}/10
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Sleep Last Night</span>
                <span className="stat-value" style={{ color: parseFloat(latest.sleepHours) >= 7 ? 'var(--green)' : parseFloat(latest.sleepHours) >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                  {latest.sleepHours}h{parseFloat(latest.sleepHours) < 5 ? ' ⚠️' : ''}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Medications</span>
                <span className="stat-value" style={{ color: getMedStatus(latest.meds).color }}>
                  {getMedStatus(latest.meds).label}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="no-checkin-msg"><span className="big-emoji">🤷</span>No check-in data yet.</div>
        )}
      </div>

      {/* 7-Day Insights Dashboard */}
      {insights && (
        <div className="card">
          <div className="card-title">📊 7-Day Wellness Snapshot</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Avg Mood</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: parseFloat(insights.avgMood) >= 7 ? 'var(--green)' : parseFloat(insights.avgMood) >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                {insights.avgMood}<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>/10</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: insights.moodTrendColor }}>{insights.moodTrend}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Good Sleep</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: insights.goodSleepNights >= 5 ? 'var(--green)' : insights.goodSleepNights >= 3 ? 'var(--yellow)' : 'var(--red)' }}>
                {insights.goodSleepNights}<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>/{week.length}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>nights ≥ 7h</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Meds</div>
              {insights.medAdherence !== null ? (
                <div style={{ fontSize: 26, fontWeight: 900, color: insights.medAdherence >= 80 ? 'var(--green)' : insights.medAdherence >= 50 ? 'var(--yellow)' : 'var(--red)' }}>
                  {insights.medAdherence}<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>%</span>
                </div>
              ) : <div style={{ fontSize: 20, color: 'var(--text-secondary)', marginTop: 6 }}>—</div>}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Top Mind</div>
              {(() => {
                const top = Object.entries(insights.mindCounts).sort((a, b) => b[1] - a[1])[0]
                const m = top ? MINDS[top[0]] : null
                return m && top[1] > 0 ? (
                  <><div style={{ fontSize: 24 }}>{m.emoji}</div><div style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{m.name}</div></>
                ) : <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginTop: 6 }}>—</div>
              })()}
            </div>
          </div>
          {insights.warnings.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 8 }}>⚠️ PATTERN ALERTS</div>
              {insights.warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'rgba(255,107,53,0.1)', borderRadius: 10, marginBottom: 6, borderLeft: '3px solid var(--red)' }}>
                  <span style={{ fontSize: 18 }}>{w.icon}</span>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{w.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'rgba(82,183,136,0.1)', borderRadius: 10, borderLeft: '3px solid var(--green)' }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>No warning patterns this week.</p>
            </div>
          )}
        </div>
      )}

      {/* 7-Day History */}
      {week.length > 0 && (
        <div className="card">
          <div className="card-title">📅 Last 7 Days — History</div>
          {week.map((c, i) => {
            const m = MINDS[c.mind]
            const medSt = getMedStatus(c.meds)
            return (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '10px 0',
                borderBottom: i < week.length - 1 ? '1px solid var(--card-border)' : 'none',
              }}>
                <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{m ? m.emoji : '❓'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 1 }}>{formatDateTime(c.timestamp)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>{timeSince(c.timestamp)}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: c.mood >= 7 ? 'rgba(82,183,136,0.15)' : c.mood >= 5 ? 'rgba(255,184,0,0.15)' : 'rgba(230,57,70,0.15)', color: c.mood >= 7 ? 'var(--green)' : c.mood >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                      😊 {c.mood}/10
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: parseFloat(c.sleepHours) >= 7 ? 'rgba(82,183,136,0.15)' : parseFloat(c.sleepHours) >= 5 ? 'rgba(255,184,0,0.15)' : 'rgba(230,57,70,0.15)', color: parseFloat(c.sleepHours) >= 7 ? 'var(--green)' : parseFloat(c.sleepHours) >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                      😴 {c.sleepHours}h
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.07)', color: medSt.color }}>
                      💊 {medSt.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Share Link */}
      <div className="card" style={{ background: 'rgba(82,183,136,0.08)', borderColor: 'var(--shika-secondary)' }}>
        <div className="card-title">🔗 Family Share Link</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
          Share this URL with Jacoby, Shenita, and your circle. They only see status — no Check In tab:
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px',
          fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', color: 'var(--shika-secondary)',
          border: '1px solid var(--card-border)',
        }}>
          {window.location.origin}{window.location.pathname}?family
        </div>
      </div>

      {/* Three Minds reference */}
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

      {/* Trusted Contacts */}
      <div className="card">
        <div className="card-title">📞 Trusted Contacts</div>
        {[
          { initials: 'J', name: 'Jacoby', role: 'Close friend · Primary contact', color: 'linear-gradient(135deg, #ff6b35, #ff9f1c)' },
          { initials: 'S', name: 'Shenita', role: 'Trusted support · Primary contact', color: 'linear-gradient(135deg, #2d6a4f, #52b788)' },
        ].map(c => (
          <div key={c.name} className="contact-card">
            <div className="contact-avatar" style={{ background: c.color }}>{c.initials}</div>
            <div className="contact-info"><h4>{c.name}</h4><p>{c.role}</p></div>
          </div>
        ))}
      </div>

      {distress?.active && (
        <button className="btn-secondary" style={{ width: '100%', marginTop: 8, fontSize: 15, padding: '13px' }} onClick={clearDistress}>
          ✅ Darrian is okay — clear signal
        </button>
      )}
      <div style={{ height: 8 }} />
    </div>
  )
}

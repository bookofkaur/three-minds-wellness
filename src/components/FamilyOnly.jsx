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

// Only prescribed meds count toward adherence — not optional supplements
const PRESCRIBED_IDS = ['mirtazapine', 'atomoxetine', 'oxcarbazepine']
const PRESCRIBED_LABELS = {
  mirtazapine:   'Mirtazapine',
  atomoxetine:   'Atomoxetine',
  oxcarbazepine: 'Oxcarbazepine',
}

function getPrescribedMedRows(meds) {
  if (!meds) return []
  return PRESCRIBED_IDS.map(id => ({
    id,
    label: PRESCRIBED_LABELS[id],
    taken: !!meds[id],
  }))
}

function getPrescribedAdherence(meds) {
  if (!meds) return null
  const rows = getPrescribedMedRows(meds)
  if (!rows.length) return null
  const taken = rows.filter(r => r.taken).length
  return { taken, total: rows.length }
}

function getMedSummaryLabel(meds) {
  if (!meds) return { label: '—', color: 'var(--text-secondary)' }
  const adh = getPrescribedAdherence(meds)
  if (!adh) return { label: '—', color: 'var(--text-secondary)' }
  if (adh.taken === adh.total) return { label: `✅ All ${adh.total} taken`, color: 'var(--green)' }
  if (adh.taken === 0) return { label: '❌ None taken', color: 'var(--red)' }
  return { label: `⚠️ ${adh.taken}/${adh.total} taken`, color: 'var(--yellow)' }
}

function buildInsights(week) {
  if (!week.length) return null

  // Mood average + trend
  const moods = week.map(c => c.mood)
  const avgMood = (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1)
  const recentAvg = moods.slice(0, Math.ceil(moods.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(moods.length / 2)
  const olderAvg = moods.slice(Math.ceil(moods.length / 2)).reduce((a, b) => a + b, 0) / (moods.length - Math.ceil(moods.length / 2)) || recentAvg
  const moodTrend = recentAvg > olderAvg + 0.5 ? '↑' : recentAvg < olderAvg - 0.5 ? '↓' : '→'
  const moodTrendColor = moodTrend === '↑' ? 'var(--green)' : moodTrend === '↓' ? 'var(--red)' : 'var(--yellow)'

  // Sleep consistency (nights ≥ 7h)
  const goodSleepNights = week.filter(c => parseFloat(c.sleepHours) >= 7).length
  const lowSleepNights = week.filter(c => parseFloat(c.sleepHours) < 6).length
  const consecutiveLowSleep = (() => {
    let max = 0, cur = 0
    for (const c of week) {
      if (parseFloat(c.sleepHours) < 6) { cur++; max = Math.max(max, cur) } else cur = 0
    }
    return max
  })()

  // Medication adherence — prescribed meds only (mirtazapine, atomoxetine, oxcarbazepine)
  const PRESCRIBED = ['mirtazapine', 'atomoxetine', 'oxcarbazepine']
  const medsCheckins = week.filter(c => c.meds)
  const medAdherence = medsCheckins.length
    ? Math.round(
        medsCheckins.filter(c => PRESCRIBED.every(id => !!c.meds[id])).length / medsCheckins.length * 100
      )
    : null

  // Mind state breakdown
  const mindCounts = { gohan: 0, luffy: 0, shika: 0 }
  week.forEach(c => { if (mindCounts[c.mind] !== undefined) mindCounts[c.mind]++ })

  // Bipolar/ADHD early warnings (NIMH 2024 / CHADD 2025)
  const warnings = []
  if (consecutiveLowSleep >= 2) {
    warnings.push({ icon: '😴', text: `${consecutiveLowSleep} consecutive nights under 6h of sleep — a leading early warning for mood episodes. Consider a gentle check-in.` })
  }
  if (moods.slice(0, 3).filter(m => m <= 3).length >= 2) {
    warnings.push({ icon: '💙', text: 'Mood has been very low (3/10 or below) in recent check-ins. He may need more active support right now.' })
  }
  if (medAdherence !== null && medAdherence < 60) {
    warnings.push({ icon: '💊', text: `Medication taken only ${medAdherence}% of the time this week. Missed meds can destabilize mood — a soft mention may help.` })
  }
  if (mindCounts.gohan >= 4) {
    warnings.push({ icon: '🔥', text: 'He's been in Emotional Mind most of this week. He may be overwhelmed — showing up without expectations is helpful.' })
  }

  return { avgMood, moodTrend, moodTrendColor, goodSleepNights, lowSleepNights, consecutiveLowSleep, medAdherence, mindCounts, warnings }
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
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const latest = checkins[0]
  const status = getStatusInfo(checkins, distress)
  const mindInfo = latest ? MINDS[latest.mind] : null
  const week = get7DayCheckins(checkins)
  const insights = buildInsights(week)

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
        <p style={{ fontSize: 13, opacity: 0.7 }}>Updates every 60 seconds · Powered by Darrian's check-ins</p>
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

      {/* Distress Alert Banner */}
      {distress?.active && (
        <div className="alert-banner" style={{ marginBottom: 16 }}>
          <span className="alert-icon">🚨</span>
          <div className="alert-text" style={{ flex: 1 }}>
            <h4 style={{ fontSize: 16, color: 'var(--red)' }}>Darrian Pressed the Support Button</h4>
            <p>He flagged that he needs support <strong>{timeSince(distress.timestamp)}</strong></p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{formatDateTime(distress.timestamp)}</p>
            <p style={{ marginTop: 8, fontWeight: 700, color: 'var(--text-primary)' }}>
              Text: "Hey, I'm here. No rush, no pressure." 💬
            </p>
          </div>
        </div>
      )}

      {/* Main Status Card */}
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
                <span className="stat-value" style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: 14 }}>{formatDateTime(latest.timestamp)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>{timeSince(latest.timestamp)}</span>
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Mood</span>
                <span className="stat-value" style={{ color: latest.mood >= 7 ? 'var(--green)' : latest.mood >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                  {latest.mood}/10
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Sleep</span>
                <span className="stat-value" style={{ color: parseFloat(latest.sleepHours) >= 7 ? 'var(--green)' : parseFloat(latest.sleepHours) >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                  {latest.sleepHours}h {parseFloat(latest.sleepHours) < 5 ? '⚠️' : ''}
                </span>
              </div>
              {/* Individual prescribed meds */}
              <div style={{ paddingTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prescribed Meds</div>
                {getPrescribedMedRows(latest.meds).map(row => (
                  <div key={row.id} className="stat-row" style={{ paddingTop: 4, paddingBottom: 4 }}>
                    <span className="stat-label" style={{ fontSize: 13 }}>{row.label}</span>
                    <span className="stat-value" style={{ fontSize: 13, color: row.taken ? 'var(--green)' : 'var(--red)' }}>
                      {row.taken ? '✅ Taken' : '❌ Not taken'}
                    </span>
                  </div>
                ))}
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

      {/* ── 7-DAY INSIGHTS DASHBOARD ── */}
      {insights && (
        <div className="card">
          <div className="card-title">📊 Last 7 Days — Wellness Insights</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
            These numbers help you spot patterns before a crisis. You don't need to be an expert — just look for the warnings below.
          </p>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {/* Mood average */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg Mood</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: parseFloat(insights.avgMood) >= 7 ? 'var(--green)' : parseFloat(insights.avgMood) >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                {insights.avgMood}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>/10</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: insights.moodTrendColor, marginTop: 2 }}>{insights.moodTrend} trend</div>
            </div>

            {/* Sleep */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Good Sleep</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: insights.goodSleepNights >= 5 ? 'var(--green)' : insights.goodSleepNights >= 3 ? 'var(--yellow)' : 'var(--red)' }}>
                {insights.goodSleepNights}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>/{week.length}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>nights ≥ 7h</div>
            </div>

            {/* Med adherence */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Meds Taken</div>
              {insights.medAdherence !== null ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 900, color: insights.medAdherence >= 80 ? 'var(--green)' : insights.medAdherence >= 50 ? 'var(--yellow)' : 'var(--red)' }}>
                    {insights.medAdherence}
                    <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>%</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>of check-ins</div>
                </>
              ) : (
                <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginTop: 8 }}>—</div>
              )}
            </div>

            {/* Mind state */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Top Mind</div>
              {(() => {
                const top = Object.entries(insights.mindCounts).sort((a, b) => b[1] - a[1])[0]
                const m = top ? MINDS[top[0]] : null
                return m ? (
                  <>
                    <div style={{ fontSize: 28 }}>{m.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: m.color, marginTop: 2 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{top[1]}x this week</div>
                  </>
                ) : <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginTop: 8 }}>—</div>
              })()}
            </div>
          </div>

          {/* Mind breakdown bar */}
          {week.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 8 }}>MIND STATE THIS WEEK</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.entries(insights.mindCounts).map(([key, count]) => {
                  const m = MINDS[key]
                  const pct = week.length > 0 ? Math.round((count / week.length) * 100) : 0
                  return (
                    <div key={key} style={{ flex: pct || 1, background: m.color + '33', borderRadius: 8, padding: '8px 6px', textAlign: 'center', minWidth: 0, opacity: count === 0 ? 0.3 : 1 }}>
                      <div style={{ fontSize: 16 }}>{m.emoji}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: m.color }}>{pct}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Early warning alerts */}
          {insights.warnings.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 10 }}>⚠️ PATTERN ALERTS — READ THESE</div>
              {insights.warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'rgba(255, 107, 53, 0.1)', borderRadius: 12, marginBottom: 8, borderLeft: '3px solid var(--red)' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{w.icon}</span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{w.text}</p>
                </div>
              ))}
            </div>
          )}

          {insights.warnings.length === 0 && week.length > 0 && (
            <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'rgba(82, 183, 136, 0.1)', borderRadius: 12, borderLeft: '3px solid var(--green)' }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>No major warning patterns detected this week. Keep encouraging sleep, routine, and connection.</p>
            </div>
          )}
        </div>
      )}

      {/* ── 7-DAY CHECK-IN HISTORY ── */}
      {week.length > 0 && (
        <div className="card">
          <div className="card-title">📅 Last 7 Days — Check-In History</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
            Each row is one time Darrian logged in. Timestamps show exactly when — so you can tell if this is fresh news or older info.
          </p>
          {week.map((c, i) => {
            const m = MINDS[c.mind]
            const medSt = getMedSummaryLabel(c.meds)
            return (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px 0',
                borderBottom: i < week.length - 1 ? '1px solid var(--card-border)' : 'none',
                alignItems: 'flex-start'
              }}>
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{m ? m.emoji : '❓'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {formatDateTime(c.timestamp)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{timeSince(c.timestamp)}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                      background: c.mood >= 7 ? 'rgba(82,183,136,0.15)' : c.mood >= 5 ? 'rgba(255,184,0,0.15)' : 'rgba(230,57,70,0.15)',
                      color: c.mood >= 7 ? 'var(--green)' : c.mood >= 5 ? 'var(--yellow)' : 'var(--red)'
                    }}>😊 {c.mood}/10</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                      background: parseFloat(c.sleepHours) >= 7 ? 'rgba(82,183,136,0.15)' : parseFloat(c.sleepHours) >= 5 ? 'rgba(255,184,0,0.15)' : 'rgba(230,57,70,0.15)',
                      color: parseFloat(c.sleepHours) >= 7 ? 'var(--green)' : parseFloat(c.sleepHours) >= 5 ? 'var(--yellow)' : 'var(--red)'
                    }}>😴 {c.sleepHours}h</span>
                    {/* Prescribed meds summary badge */}
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.07)', color: medSt.color }}>
                      💊 {medSt.label}
                    </span>
                    {m && <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: m.color + '22', color: m.color }}>{m.emoji} {m.name}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* How to show up */}
      <div className="card">
        <div className="card-title">💬 How to Show Up</div>
        {status.level === 'red' && (
          <div style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 10 }}>🚨 <strong style={{ color: 'var(--text-primary)', fontSize: 16 }}>Reach out now. Don't wait for him to ask.</strong></p>
            <p style={{ marginBottom: 8 }}>✅ <em>"Hey, I'm thinking about you. No pressure — just checking in."</em></p>
            <p style={{ marginBottom: 8 }}>✅ Offer something specific: <em>"Want food? I can come by."</em></p>
            <p>❌ Avoid: <em>"Why didn't you call me?"</em> or <em>"Have you taken your meds?"</em></p>
          </div>
        )}
        {status.level === 'yellow' && (
          <div style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 10 }}>⚠️ <strong style={{ color: 'var(--text-primary)', fontSize: 16 }}>He's managing — worth a gentle check-in.</strong></p>
            <p style={{ marginBottom: 8 }}>✅ <em>"Thinking about you, how's it going?"</em></p>
            <p>✅ Invite him to something low-key. Being around people is protective for his brain.</p>
          </div>
        )}
        {status.level === 'green' && (
          <div style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 10 }}>✅ <strong style={{ color: 'var(--text-primary)', fontSize: 16 }}>Darrian is stable and doing well.</strong></p>
            <p style={{ marginBottom: 8 }}>Connect normally — hype him up, share something funny, ask about Georgia Tech.</p>
            <p>Keep encouraging sleep and routine. That consistency is what keeps him here. 💚</p>
          </div>
        )}
      </div>

      {/* Understanding the three minds */}
      <div className="card">
        <div className="card-title">🧬 His Three Minds — What Each Means</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
          Darrian tracks which mental "mode" he's in based on Dialectical Behavior Therapy (DBT). Here's what each one means for how to interact with him:
        </p>
        {Object.values(MINDS).map(m => (
          <div key={m.name} style={{ display: 'flex', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>{m.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: m.color, letterSpacing: 1 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.familyDesc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* About his diagnoses */}
      <div className="card">
        <div className="card-title">🧠 Understanding Darrian's Brain</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
          Darrian lives with <strong style={{ color: 'var(--text-primary)' }}>Bipolar Disorder</strong> and <strong style={{ color: 'var(--text-primary)' }}>ADHD</strong>. Knowing what to watch for helps you help him before things get hard.
        </p>
        {[
          {
            icon: '🌊', title: 'Bipolar — What to Watch For',
            items: [
              'Sleep dropping below 6h for 2+ nights in a row (top early warning sign)',
              'Mood swings that feel extreme — either very high energy or very low',
              'Pulling away from everyone, or suddenly way too "on"',
              'Skipping his medication (Mirtazapine is a mood + sleep stabilizer)',
            ]
          },
          {
            icon: '⚡', title: 'ADHD — What to Watch For',
            items: [
              'Missing check-ins for days — external reminders help a lot',
              'Seems scattered, forgetful, or overwhelmed? That\'s the ADHD talking',
              'Atomoxetine is his non-stimulant ADHD med — skipping it hurts his focus',
              'Consistency and routine are the best gifts you can give him',
            ]
          },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, color: 'var(--text-primary)' }}>{section.icon} {section.title}</div>
            {section.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Trusted contacts */}
      <div className="card">
        <div className="card-title">📞 Primary Contacts</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 14 }}>Coordinate here if you need to loop others in:</p>
        {[
          { initials: 'J', name: 'Jacoby', role: 'Close friend · Primary contact', color: 'linear-gradient(135deg, #ff6b35, #ff9f1c)' },
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
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 14, lineHeight: 1.6 }}>
          If he's skipping medications, that's an early warning sign worth mentioning gently — not as a lecture, just as a caring nudge:
        </p>
        {[
          { name: 'Mirtazapine', role: 'Rx · Mood + sleep stabilizer', note: 'Missing doses disrupts sleep — which triggers mood episodes. Most important one to keep consistent.' },
          { name: 'Atomoxetine', role: 'Rx · ADHD (non-stimulant)', note: 'Supports focus and impulse control throughout the day. Helps him stay on track with tasks and goals.' },
          { name: 'Oxcarbazepine (Trileptal)', role: 'Rx · Mood stabilizer', note: 'Helps prevent manic and depressive mood swings. Skipping this is a significant early warning sign.' },
          { name: 'Magnesium Citrate · Lion\'s Mane · Vitamin D3 · Fish Oil', role: 'Optional supplements', note: 'Brain health and sleep quality — beneficial but not required every single day.' },
        ].map(m => (
          <div key={m.name} style={{ marginBottom: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{m.name}</div>
            <div style={{ color: 'var(--shika-secondary)', fontSize: 12, fontWeight: 700 }}>{m.role}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{m.note}</div>
          </div>
        ))}
      </div>

      {/* Refresh */}
      <button className="btn-secondary" style={{ width: '100%', fontSize: 16, padding: '14px' }} onClick={load}>
        🔄 Refresh Data
      </button>

      {distress?.active && (
        <div style={{ marginTop: 10 }}>
          <button className="btn-secondary" style={{ width: '100%', fontSize: 16, padding: '14px' }} onClick={handleClearDistress}>
            ✅ Darrian is okay — clear the support signal
          </button>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)', marginTop: 20, opacity: 0.5 }}>
        Built with love for Darrian · Auto-refreshes every 60s
      </p>
    </div>
  )
}

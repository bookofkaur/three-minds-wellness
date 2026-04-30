import { useState, useEffect } from 'react'
import { getCheckins } from '../App'

const MIND_INFO = {
  gohan: { emoji: '🔥', name: 'Gohan', color: '#ff6b35', dotCls: 'dot-gohan' },
  luffy: { emoji: '⚓', name: 'Joyboy', color: '#e63946', dotCls: 'dot-luffy' },
  shika: { emoji: '🧠', name: 'Shikamaru', color: '#52b788', dotCls: 'dot-shika' },
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function History() {
  const [checkins, setCheckins] = useState([])
  const [range, setRange] = useState(7)

  useEffect(() => {
    setCheckins(getCheckins())
  }, [])

  const filtered = checkins.slice(0, range)

  // Averages
  const avg = (arr, key) => {
    if (!arr.length) return '-'
    return (arr.reduce((s, c) => s + (parseFloat(c[key]) || 0), 0) / arr.length).toFixed(1)
  }

  const moodColor = (v) => {
    if (v <= 3) return 'var(--red)'
    if (v <= 6) return 'var(--yellow)'
    return 'var(--green)'
  }

  const sleepColor = (v) => {
    if (v < 5) return 'var(--red)'
    if (v < 7) return 'var(--yellow)'
    return 'var(--green)'
  }

  // Mind frequency
  const mindCounts = filtered.reduce((acc, c) => {
    acc[c.mind] = (acc[c.mind] || 0) + 1
    return acc
  }, {})

  return (
    <div className="page">
      <div className="page-header">
        <h1>HISTORY</h1>
        <p>Your patterns tell the real story.</p>
      </div>

      {/* Range selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[7, 14, 30].map(r => (
          <button
            key={r}
            className="btn-secondary"
            style={{
              flex: 1,
              background: range === r ? 'rgba(255,107,53,0.15)' : 'transparent',
              color: range === r ? 'var(--gohan-primary)' : 'var(--text-secondary)',
              borderColor: range === r ? 'var(--gohan-primary)' : 'var(--card-border)',
            }}
            onClick={() => setRange(r)}
          >
            {r} Days
          </button>
        ))}
      </div>

      {checkins.length === 0 ? (
        <div className="card">
          <div className="no-checkin-msg">
            <span className="big-emoji">📊</span>
            No check-ins yet. Start today — your data builds your self-awareness.
          </div>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="card">
            <div className="card-title">📈 {range}-Day Averages</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 8px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: moodColor(parseFloat(avg(filtered, 'mood'))) }}>
                  {avg(filtered, 'mood')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginTop: 4 }}>AVG MOOD</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 8px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: sleepColor(parseFloat(avg(filtered, 'sleepHours'))) }}>
                  {avg(filtered, 'sleepHours')}h
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginTop: 4 }}>AVG SLEEP</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 8px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--shika-secondary)' }}>
                  {avg(filtered, 'energy')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginTop: 4 }}>AVG ENERGY</div>
              </div>
            </div>

            {/* Mind frequency */}
            {Object.keys(mindCounts).length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Mind Frequency
                </div>
                {Object.entries(mindCounts).sort((a, b) => b[1] - a[1]).map(([mind, count]) => {
                  const info = MIND_INFO[mind]
                  const pct = Math.round((count / filtered.length) * 100)
                  return (
                    <div key={mind} className="history-bar">
                      <div className="history-day" style={{ width: 52, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{info?.emoji}</span>
                        <span style={{ fontSize: 11 }}>{info?.name}</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${pct}%`, background: info?.color }}
                        />
                      </div>
                      <div className="bar-value">{pct}%</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mood trend bars */}
          <div className="card">
            <div className="card-title">😊 Mood Trend</div>
            {filtered.slice(0, 7).map((c, i) => (
              <div key={c.id} className="history-bar">
                <div className="history-day" style={{ width: 32, fontSize: 11 }}>
                  {new Date(c.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${c.mood * 10}%`, background: moodColor(c.mood) }}
                  />
                </div>
                <div className="bar-value">{c.mood}</div>
              </div>
            ))}
          </div>

          {/* Sleep trend bars */}
          <div className="card">
            <div className="card-title">😴 Sleep Trend</div>
            {filtered.slice(0, 7).map((c, i) => {
              const hrs = parseFloat(c.sleepHours) || 0
              return (
                <div key={c.id} className="history-bar">
                  <div className="history-day" style={{ width: 32, fontSize: 11 }}>
                    {new Date(c.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.min((hrs / 10) * 100, 100)}%`, background: sleepColor(hrs) }}
                    />
                  </div>
                  <div className="bar-value">{hrs}h</div>
                </div>
              )
            })}
          </div>

          {/* Log entries */}
          <div className="card">
            <div className="card-title">📋 Log Entries</div>
            {filtered.map((c, i) => {
              const info = MIND_INFO[c.mind] || {}
              const allMeds = Object.values(c.meds || {}).every(Boolean)
              const someMeds = Object.values(c.meds || {}).some(Boolean)
              return (
                <div key={c.id} style={{
                  paddingBottom: i < filtered.length - 1 ? 16 : 0,
                  marginBottom: i < filtered.length - 1 ? 16 : 0,
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--card-border)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>
                        {info.emoji} {info.name || c.mind}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {formatDate(c.timestamp)} · {formatTime(c.timestamp)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: allMeds ? 'rgba(82,183,136,0.15)' : someMeds ? 'rgba(244,162,97,0.15)' : 'rgba(255,255,255,0.06)',
                        color: allMeds ? 'var(--green)' : someMeds ? 'var(--yellow)' : 'var(--text-secondary)',
                        borderRadius: 999,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        {allMeds ? '💊 All Meds' : someMeds ? '💊 Some Meds' : '○ No Meds'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span>Mood <strong style={{ color: moodColor(c.mood) }}>{c.mood}/10</strong></span>
                    <span>Energy <strong style={{ color: 'var(--shika-secondary)' }}>{c.energy}/10</strong></span>
                    <span>Sleep <strong style={{ color: sleepColor(parseFloat(c.sleepHours)) }}>{c.sleepHours}h</strong></span>
                  </div>
                  {c.notes && (
                    <div style={{
                      marginTop: 10,
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                    }}>
                      "{c.notes}"
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

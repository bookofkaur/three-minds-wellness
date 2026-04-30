import { useState, useEffect } from 'react'
import { getCheckins } from '../firebase'

const MIND_INFO = {
  gohan: { emoji: '🔥', name: 'Gohan', color: '#ff6b35' },
  luffy: { emoji: '⚓', name: 'Joyboy', color: '#e63946' },
  shika: { emoji: '🧠', name: 'Shikamaru', color: '#52b788' },
}

export default function History() {
  const [checkins, setCheckins] = useState([])
  const [range, setRange] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCheckins().then(c => { setCheckins(c); setLoading(false) })
  }, [])

  const filtered = checkins.slice(0, range)

  const avg = (arr, key) => {
    if (!arr.length) return '-'
    return (arr.reduce((s, c) => s + (parseFloat(c[key]) || 0), 0) / arr.length).toFixed(1)
  }

  const moodColor = (v) => v <= 3 ? 'var(--red)' : v <= 6 ? 'var(--yellow)' : 'var(--green)'
  const sleepColor = (v) => v < 5 ? 'var(--red)' : v < 7 ? 'var(--yellow)' : 'var(--green)'

  const mindCounts = filtered.reduce((acc, c) => {
    acc[c.mind] = (acc[c.mind] || 0) + 1; return acc
  }, {})

  return (
    <div className="page">
      <div className="page-header">
        <h1>HISTORY</h1>
        <p>Your patterns tell the real story.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[7, 14, 30].map(r => (
          <button key={r} className="btn-secondary" style={{
            flex: 1,
            background: range === r ? 'rgba(255,107,53,0.15)' : 'transparent',
            color: range === r ? 'var(--gohan-primary)' : 'var(--text-secondary)',
            borderColor: range === r ? 'var(--gohan-primary)' : 'var(--card-border)',
          }} onClick={() => setRange(r)}>{r} Days</button>
        ))}
      </div>

      {loading ? (
        <div className="card">
          <div className="no-checkin-msg"><span className="big-emoji">🔄</span>Loading your data...</div>
        </div>
      ) : checkins.length === 0 ? (
        <div className="card">
          <div className="no-checkin-msg">
            <span className="big-emoji">📊</span>
            No check-ins yet. Start today — your data builds your self-awareness.
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-title">📈 {range}-Day Averages</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'AVG MOOD', value: avg(filtered, 'mood'), color: moodColor(parseFloat(avg(filtered, 'mood'))) },
                { label: 'AVG SLEEP', value: `${avg(filtered, 'sleepHours')}h`, color: sleepColor(parseFloat(avg(filtered, 'sleepHours'))) },
                { label: 'AVG ENERGY', value: avg(filtered, 'energy'), color: 'var(--shika-secondary)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 8px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {Object.keys(mindCounts).length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mind Frequency</div>
                {Object.entries(mindCounts).sort((a, b) => b[1] - a[1]).map(([mind, count]) => {
                  const info = MIND_INFO[mind]
                  const pct = Math.round((count / filtered.length) * 100)
                  return (
                    <div key={mind} className="history-bar">
                      <div className="history-day" style={{ width: 52, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{info?.emoji}</span>
                        <span style={{ fontSize: 11 }}>{info?.name}</span>
                      </div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: info?.color }} /></div>
                      <div className="bar-value">{pct}%</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">😊 Mood Trend</div>
            {filtered.slice(0, 7).map(c => (
              <div key={c.id} className="history-bar">
                <div className="history-day" style={{ width: 32, fontSize: 11 }}>
                  {new Date(c.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${c.mood * 10}%`, background: moodColor(c.mood) }} /></div>
                <div className="bar-value">{c.mood}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">😴 Sleep Trend</div>
            {filtered.slice(0, 7).map(c => {
              const hrs = parseFloat(c.sleepHours) || 0
              return (
                <div key={c.id} className="history-bar">
                  <div className="history-day" style={{ width: 32, fontSize: 11 }}>
                    {new Date(c.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min((hrs / 10) * 100, 100)}%`, background: sleepColor(hrs) }} /></div>
                  <div className="bar-value">{hrs}h</div>
                </div>
              )
            })}
          </div>

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
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{info.emoji} {info.name || c.mind}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {new Date(c.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span style={{
                      background: allMeds ? 'rgba(82,183,136,0.15)' : someMeds ? 'rgba(244,162,97,0.15)' : 'rgba(255,255,255,0.06)',
                      color: allMeds ? 'var(--green)' : someMeds ? 'var(--yellow)' : 'var(--text-secondary)',
                      borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                    }}>
                      {allMeds ? '💊 All Meds' : someMeds ? '💊 Some Meds' : '○ No Meds'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span>Mood <strong style={{ color: moodColor(c.mood) }}>{c.mood}/10</strong></span>
                    <span>Energy <strong style={{ color: 'var(--shika-secondary)' }}>{c.energy}/10</strong></span>
                    <span>Sleep <strong style={{ color: sleepColor(parseFloat(c.sleepHours)) }}>{c.sleepHours}h</strong></span>
                  </div>
                  {c.notes && (
                    <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
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

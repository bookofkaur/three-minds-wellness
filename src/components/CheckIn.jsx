import { useState } from 'react'
import { saveCheckin } from '../firebase'

const MINDS = [
  { id: 'gohan', emoji: '🔥', name: 'Gohan', subtitle: 'Emotional Mind', desc: 'Feelings are loud. Reactive, passionate, intense.', cls: 'selected-gohan' },
  { id: 'luffy', emoji: '⚓', name: 'Joyboy', subtitle: 'Middle Mind', desc: 'Balanced. Present. Trust your gut.', cls: 'selected-luffy' },
  { id: 'shika', emoji: '🧠', name: 'Shikamaru', subtitle: 'Logical Mind', desc: 'Analytical. Detached. Chess mode.', cls: 'selected-shika' },
]

// Prescribed meds — these MUST be taken daily. Counted in adherence %.
export const PRESCRIBED_MEDS = [
  { id: 'mirtazapine',   label: 'Mirtazapine',        type: 'Rx · Mood + Sleep' },
  { id: 'atomoxetine',   label: 'Atomoxetine',         type: 'Rx · ADHD' },
  { id: 'oxcarbazepine', label: 'Oxcarbazepine (Trileptal)', type: 'Rx · Mood Stabilizer' },
]

// Optional supplements — good to take but not required every day.
export const OPTIONAL_SUPPLEMENTS = [
  { id: 'magnesiumCitrate', label: 'Magnesium Citrate', type: 'Supplement · Sleep + Anxiety' },
  { id: 'lionsMane',        label: "Lion's Mane",        type: 'Supplement · Brain Health' },
  { id: 'vitaminD3',        label: 'Vitamin D3',          type: 'Supplement · Mood' },
  { id: 'fishOil',          label: 'Fish Oil',             type: 'Supplement · Omega-3' },
]

const DEFAULT_MEDS = {
  mirtazapine: false,
  atomoxetine: false,
  oxcarbazepine: false,
  magnesiumCitrate: false,
  lionsMane: false,
  vitaminD3: false,
  fishOil: false,
}

export default function CheckIn({ onNavigate, VIEWS, showToast }) {
  const [mind, setMind] = useState(null)
  const [mood, setMood] = useState(7)
  const [energy, setEnergy] = useState(6)
  const [sleepHours, setSleepHours] = useState(7)
  const [meds, setMeds] = useState(DEFAULT_MEDS)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleMed = (id) => setMeds(prev => ({ ...prev, [id]: !prev[id] }))

  const moodEmoji = (v) => v <= 2 ? '😞' : v <= 4 ? '😕' : v <= 6 ? '😐' : v <= 8 ? '🙂' : '😄'
  const energyEmoji = (v) => v <= 3 ? '🪫' : v <= 6 ? '⚡' : '🔋'

  const handleSubmit = async () => {
    if (!mind) { showToast('⚠️ Pick your active mind first'); return }
    setSaving(true)
    await saveCheckin({ mind, mood, energy, sleepHours, meds, notes })
    showToast('✅ Check-in saved. You showed up.')
    setSaving(false)
    setTimeout(() => onNavigate(VIEWS.DASHBOARD), 800)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>CHECK IN</h1>
        <p>60 seconds. Honest answers. No judgment.</p>
      </div>

      <div className="card">
        <div className="card-title">🧬 Which Mind Is Active?</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>
          Not who you want to be — who you actually ARE right now.
        </p>
        <div className="mind-grid">
          {MINDS.map(m => (
            <button key={m.id} className={`mind-card ${mind === m.id ? m.cls : ''}`} onClick={() => setMind(m.id)}>
              <span className="mind-emoji">{m.emoji}</span>
              <span className="mind-name">{m.name}</span>
              <span className="mind-subtitle">{m.subtitle}</span>
            </button>
          ))}
        </div>
        {mind && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {MINDS.find(m => m.id === mind)?.desc}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">😴 Sleep Last Night</div>
        <div className="sleep-input-row">
          <input type="number" min="0" max="24" step="0.5" value={sleepHours}
            onChange={e => setSleepHours(parseFloat(e.target.value) || 0)} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>hours</span>
        </div>
        {sleepHours < 5 && <p className="sleep-warning">⚠️ Under 5hrs is a mood episode risk factor. Be easy on yourself today.</p>}
        {sleepHours >= 7 && <p className="sleep-note" style={{ color: 'var(--green)' }}>✅ Solid sleep. Your brain is working with you.</p>}
        {sleepHours >= 5 && sleepHours < 7 && <p className="sleep-note">Getting there. Aim for 7-9hrs when you can.</p>}
      </div>

      <div className="card">
        <div className="card-title">{moodEmoji(mood)} Mood</div>
        <div className="slider-group">
          <div className="slider-label">
            <span>How are you actually feeling?</span>
            <span className="slider-value">{mood}/10</span>
          </div>
          <input type="range" min="1" max="10" value={mood} onChange={e => setMood(parseInt(e.target.value))} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>Not great</span><span>Amazing</span>
          </div>
        </div>
        <hr className="section-divider" />
        <div className="slider-group" style={{ marginBottom: 0 }}>
          <div className="slider-label">
            <span>{energyEmoji(energy)} Energy Level</span>
            <span className="slider-value">{energy}/10</span>
          </div>
          <input type="range" min="1" max="10" value={energy} onChange={e => setEnergy(parseInt(e.target.value))} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>Drained</span><span>Charged</span>
          </div>
        </div>
      </div>

      {/* Prescribed Meds */}
      <div className="card">
        <div className="card-title">💊 Prescribed Meds</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
          These need to be taken daily — check off what you took.
        </p>
        <div className="med-list">
          {PRESCRIBED_MEDS.map(med => (
            <div key={med.id} className="med-item" onClick={() => toggleMed(med.id)}>
              <input type="checkbox" id={med.id} checked={meds[med.id]}
                onChange={() => toggleMed(med.id)} onClick={e => e.stopPropagation()} />
              <label htmlFor={med.id}>
                {med.label}<br /><span className="med-type">{med.type}</span>
              </label>
              {meds[med.id] && <span style={{ fontSize: 18 }}>✅</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Optional Supplements */}
      <div className="card">
        <div className="card-title">🌿 Supplements <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 6 }}>(optional — not required daily)</span></div>
        <div className="med-list">
          {OPTIONAL_SUPPLEMENTS.map(med => (
            <div key={med.id} className="med-item" onClick={() => toggleMed(med.id)}>
              <input type="checkbox" id={med.id} checked={meds[med.id]}
                onChange={() => toggleMed(med.id)} onClick={e => e.stopPropagation()} />
              <label htmlFor={med.id}>
                {med.label}<br /><span className="med-type">{med.type}</span>
              </label>
              {meds[med.id] && <span style={{ fontSize: 18 }}>✅</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">📝 Notes (Optional)</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
          What's on your mind? Racing thoughts, wins, worries — anything. This stays private to you.
        </p>
        <textarea rows={4} placeholder="Write freely. This is private..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
        {saving ? '⏳ SAVING...' : '💾 SAVE CHECK-IN'}
      </button>
      <div style={{ height: 8 }} />
    </div>
  )
}

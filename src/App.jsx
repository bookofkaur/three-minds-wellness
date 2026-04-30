import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import CheckIn from './components/CheckIn'
import History from './components/History'
import FamilyView from './components/FamilyView'

const VIEWS = {
  DASHBOARD: 'dashboard',
  CHECKIN: 'checkin',
  HISTORY: 'history',
  FAMILY: 'family',
}

// Storage helpers
export const getCheckins = () => {
  try {
    return JSON.parse(localStorage.getItem('tm_checkins') || '[]')
  } catch { return [] }
}

export const saveCheckin = (checkin) => {
  const checkins = getCheckins()
  checkins.unshift({ ...checkin, id: Date.now(), timestamp: new Date().toISOString() })
  localStorage.setItem('tm_checkins', JSON.stringify(checkins.slice(0, 90)))
}

export const getDistress = () => {
  try {
    return JSON.parse(localStorage.getItem('tm_distress') || 'null')
  } catch { return null }
}

export const setDistress = (val) => {
  if (val) {
    localStorage.setItem('tm_distress', JSON.stringify({ active: true, timestamp: new Date().toISOString() }))
  } else {
    localStorage.removeItem('tm_distress')
  }
}

export default function App() {
  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="app-container">
      {toast && <div className="toast">{toast}</div>}

      <main>
        {view === VIEWS.DASHBOARD && (
          <Dashboard onNavigate={setView} VIEWS={VIEWS} showToast={showToast} />
        )}
        {view === VIEWS.CHECKIN && (
          <CheckIn onNavigate={setView} VIEWS={VIEWS} showToast={showToast} />
        )}
        {view === VIEWS.HISTORY && (
          <History onNavigate={setView} VIEWS={VIEWS} />
        )}
        {view === VIEWS.FAMILY && (
          <FamilyView onNavigate={setView} VIEWS={VIEWS} showToast={showToast} />
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={`nav-btn ${view === VIEWS.DASHBOARD ? 'active' : ''}`}
          onClick={() => setView(VIEWS.DASHBOARD)}
        >
          <span className="nav-icon">🏠</span>
          Home
        </button>
        <button
          className={`nav-btn ${view === VIEWS.CHECKIN ? 'active' : ''}`}
          onClick={() => setView(VIEWS.CHECKIN)}
        >
          <span className="nav-icon">✅</span>
          Check In
        </button>
        <button
          className={`nav-btn ${view === VIEWS.HISTORY ? 'active' : ''}`}
          onClick={() => setView(VIEWS.HISTORY)}
        >
          <span className="nav-icon">📊</span>
          History
        </button>
        <button
          className={`nav-btn ${view === VIEWS.FAMILY ? 'active' : ''}`}
          onClick={() => setView(VIEWS.FAMILY)}
        >
          <span className="nav-icon">👥</span>
          Family
        </button>
      </nav>
    </div>
  )
}

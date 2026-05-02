import { useState } from 'react'
import Dashboard from './components/Dashboard'
import CheckIn from './components/CheckIn'
import History from './components/History'
import FamilyView from './components/FamilyView'
import FamilyOnly from './components/FamilyOnly'
import Todo from './components/Todo'

// ── Detect view mode from URL ──────────────────────────────
// Family share link:  /three-minds-wellness/?family
// Darrian's link:     /three-minds-wellness/
const IS_FAMILY = new URLSearchParams(window.location.search).has('family')

const VIEWS = {
  DASHBOARD: 'dashboard',
  CHECKIN: 'checkin',
  HISTORY: 'history',
  FAMILY: 'family',
  TODO: 'todo',
}

export default function App() {
  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // ── Family-only mode: clean read-only view, no nav ────────
  if (IS_FAMILY) {
    return (
      <div className="app-container">
        {toast && <div className="toast">{toast}</div>}
        <FamilyOnly showToast={showToast} />
      </div>
    )
  }

  // ── Darrian's full app ────────────────────────────────────
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
        {view === VIEWS.TODO && (
          <Todo showToast={showToast} />
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
          className={`nav-btn ${view === VIEWS.TODO ? 'active' : ''}`}
          onClick={() => setView(VIEWS.TODO)}
        >
          <span className="nav-icon">📋</span>
          Tasks
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
          <span className="nav-icon">👁️</span>
          Preview
        </button>
      </nav>
    </div>
  )
}

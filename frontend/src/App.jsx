import { useState, useEffect } from 'react'
import DocumentBrowser from './components/DocumentBrowser'
import Editor from './components/Editor'
import ThemeToggle from './components/ThemeToggle'
import Toaster from './components/Toaster'
import LandingPage from './components/landing/LandingPage'

const COLORS = ['#e11d48', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#65a30d', '#db2777']

function Welcome({ onJoin }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  return (
    <div className="welcome">
      <ThemeToggle />
      <h1>SyncDoc</h1>
      <p className="welcome-sub">Collaborative document engine with AST conflict resolution</p>
      <form
        className="welcome-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onJoin({ name: name.trim(), color })
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          autoFocus
        />
        <div className="color-row">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              className={`swatch ${c === color ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`color ${c}`}
            />
          ))}
        </div>
        <button className="btn btn-primary" type="submit">Enter workspace</button>
      </form>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('landing')
  const [docId, setDocId] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('doc')
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    if (!docId) return
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.get('doc') === docId) return
      url.searchParams.set('doc', docId)
      window.history.replaceState({}, '', url)
    } catch (e) { /* ignore */ }
  }, [docId])

  let screen
  if (!user) {
    screen = view === 'landing'
      ? <LandingPage onGetStarted={() => setView('join')} />
      : <Welcome onJoin={setUser} />
  } else if (!docId) {
    screen = <DocumentBrowser userName={user.name} onOpen={setDocId} />
  } else {
    screen = <Editor key={docId} docId={docId} user={user} onBack={() => setDocId(null)} />
  }

  return (
    <>
      {screen}
      <Toaster />
    </>
  )
}

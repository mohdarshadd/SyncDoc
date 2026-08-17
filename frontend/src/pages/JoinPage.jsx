import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../contexts/AuthContext'

const COLORS = ['#e11d48', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#65a30d', '#db2777']

export default function JoinPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setUser({ name: name.trim(), color })
    navigate('/documents')
  }

  return (
    <div className="welcome">
      <ThemeToggle />
      <h1>SyncDoc</h1>
      <p className="welcome-sub">Collaborative document engine with AST conflict resolution</p>
      <form className="welcome-form" onSubmit={handleSubmit}>
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

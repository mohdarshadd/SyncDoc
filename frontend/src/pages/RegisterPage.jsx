import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api'

const COLORS = ['#2997ff', '#bf5af2', '#30d158', '#ff9f0a', '#ff453a', '#64d2ff']

export default function RegisterPage({ onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, accessToken } = await register({ name, email, password, color })
      onLogin(user, accessToken)
      navigate('/documents')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">S</span>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start collaborating in seconds.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              className="auth-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              autoComplete="name"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <span className="auth-hint">Minimum 8 characters</span>
          </div>
          <div className="auth-field">
            <label className="auth-label">Your color</label>
            <div className="auth-swatches">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`auth-swatch ${c === color ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Continue'}
          </button>
        </form>
        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>
        <Link to="/login" className="auth-btn auth-btn-secondary">Sign in</Link>
      </div>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="nav-brand" href="#top">
          <span className="nav-logo">S</span>
          <span className="nav-name">SyncDoc</span>
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#stats">Why SyncDoc</a>
          <a href="#cta">Get started</a>
        </div>
        <div className="nav-actions">
          <ThemeToggle />
          <button className="btn btn-primary" onClick={() => navigate('/join')}>Get started</button>
        </div>
      </div>
    </nav>
  )
}

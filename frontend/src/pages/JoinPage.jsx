import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

export default function JoinPage() {
  return (
    <div className="welcome">
      <ThemeToggle />
      <Link className="back-link" to="/">Back to home</Link>
      <h1 className="join-title">SyncDoc</h1>
      <p className="welcome-sub">Collaborative document engine with AST conflict resolution</p>
      <div className="join-actions">
        <Link to="/login" className="btn btn-primary">Sign in</Link>
        <Link to="/register" className="btn btn-secondary">Create account</Link>
      </div>
    </div>
  )
}

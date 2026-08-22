import { useState, useEffect } from 'react'
import { listShares, addShare, removeShare } from '../api'

export default function ShareDialog({ docId, isOwner, onClose }) {
  const [shares, setShares] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOwner) {
      listShares(docId).then(setShares).catch(() => {})
    }
  }, [docId, isOwner])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const share = await addShare(docId, { email, role })
      setShares((prev) => {
        const exists = prev.find((s) => s.user._id === share.user._id)
        if (exists) return prev.map((s) => (s.user._id === share.user._id ? { ...s, role: share.role } : s))
        return [...prev, share]
      })
      setEmail('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(shareId) {
    try {
      await removeShare(docId, shareId)
      setShares((prev) => prev.filter((s) => s._id !== shareId))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="share-header">
          <h2 className="share-title">Share document</h2>
          <button className="share-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {isOwner && (
          <form className="share-form" onSubmit={handleAdd}>
            <input
              className="share-input"
              type="email"
              placeholder="Add people by email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select className="share-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="viewer">Can view</option>
              <option value="editor">Can edit</option>
            </select>
            <button className="share-add-btn" type="submit" disabled={loading}>
              {loading ? '...' : 'Add'}
            </button>
          </form>
        )}

        {error && <div className="share-error">{error}</div>}

        <div className="share-list">
          {shares.length === 0 && (
            <p className="share-empty">No one else has access yet.</p>
          )}
          {shares.map((s) => (
            <div key={s._id} className="share-item">
              <div className="share-avatar" style={{ background: s.user?.color || '#86868b' }}>
                {s.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="share-info">
                <span className="share-name">{s.user?.name || 'Unknown'}</span>
                <span className="share-email">{s.user?.email}</span>
              </div>
              <span className="share-role">{s.role === 'editor' ? 'Can edit' : 'Can view'}</span>
              {isOwner && (
                <button className="share-remove" onClick={() => handleRemove(s._id)} aria-label="Remove">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

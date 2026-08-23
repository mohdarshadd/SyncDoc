import { useState, useEffect } from 'react'
import { listVersions, restoreVersion } from '../api'
import { pushToast } from '../lib/toast'

export default function VersionHistory({ docId, isOwner, onSelect, onClose }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(null)

  useEffect(() => {
    listVersions(docId)
      .then(setVersions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [docId])

  async function handleRestore(revision) {
    if (!window.confirm(`Restore to revision ${revision}? This will create a new version.`)) return
    setRestoring(revision)
    try {
      await restoreVersion(docId, revision)
      pushToast(`Restored to revision ${revision}`, 'ok')
      const updated = await listVersions(docId)
      setVersions(updated)
    } catch (err) {
      pushToast(err.message, 'error')
    } finally {
      setRestoring(null)
    }
  }

  function formatTime(date) {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="version-overlay" onClick={onClose}>
      <div className="version-panel" onClick={(e) => e.stopPropagation()}>
        <div className="version-header">
          <h2 className="version-title">Version History</h2>
          <button className="version-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="version-list">
          {loading ? (
            <div className="version-empty">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="version-empty">No versions yet. Versions are created automatically when you save.</div>
          ) : (
            versions.map((v) => (
              <div key={v._id} className="version-item">
                <div className="version-dot" />
                <div className="version-info">
                  <div className="version-label">Revision {v.revision}</div>
                  <div className="version-time">{formatTime(v.createdAt)}</div>
                  {v.createdBy && (
                    <div className="version-author">
                      <span className="version-author-dot" style={{ background: v.createdBy.color }} />
                      {v.createdBy.name}
                    </div>
                  )}
                </div>
                <div className="version-actions">
                  <button className="version-btn" onClick={() => onSelect(v.revision)}>
                    View
                  </button>
                  {isOwner && v.revision !== versions[0]?.revision && (
                    <button
                      className="version-btn version-btn-restore"
                      onClick={() => handleRestore(v.revision)}
                      disabled={restoring === v.revision}
                    >
                      {restoring === v.revision ? '...' : 'Restore'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

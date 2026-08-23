import { useState, useEffect } from 'react'
import { getVersion } from '../api'

export default function VersionViewer({ docId, revision, onClose }) {
  const [version, setVersion] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getVersion(docId, revision)
      .then(setVersion)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [docId, revision])

  if (loading) {
    return (
      <div className="version-overlay" onClick={onClose}>
        <div className="version-viewer" onClick={(e) => e.stopPropagation()}>
          <div className="version-viewer-loading">Loading version...</div>
        </div>
      </div>
    )
  }

  if (!version) {
    return (
      <div className="version-overlay" onClick={onClose}>
        <div className="version-viewer" onClick={(e) => e.stopPropagation()}>
          <div className="version-viewer-empty">Version not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="version-overlay" onClick={onClose}>
      <div className="version-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="version-viewer-header">
          <div>
            <h2 className="version-viewer-title">{version.title}</h2>
            <p className="version-viewer-meta">
              Revision {version.revision} &middot; {new Date(version.createdAt).toLocaleString()}
              {version.createdBy && <> &middot; {version.createdBy.name}</>}
            </p>
          </div>
          <button className="version-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="version-viewer-body">
          {version.blocks.length === 0 ? (
            <p className="version-viewer-empty">This version has no content.</p>
          ) : (
            version.blocks.map((b) => (
              <div key={b.id} className={`version-block version-block-${b.type}`}>
                {b.type === 'heading' && <h2 className="version-block-heading">{b.text || 'Untitled'}</h2>}
                {b.type === 'paragraph' && <p className="version-block-paragraph">{b.text || '\u00A0'}</p>}
                {b.type === 'code' && (
                  <pre className="version-block-code">
                    <code>{b.text || ''}</code>
                  </pre>
                )}
                {b.type === 'quote' && <blockquote className="version-block-quote">{b.text || '\u00A0'}</blockquote>}
                {b.type === 'divider' && <hr className="version-block-divider" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { listDocuments, createDocument, deleteDocument, importMarkdown, exportUrl } from '../api'
import ThemeToggle from './ThemeToggle'
import { pushToast } from '../lib/toast'
import { copyText, documentLink } from '../lib/clipboard'

const AVATAR_COLORS = ['#e11d48', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#65a30d', '#db2777']

function avatarColor(name) {
  let h = 0
  for (const c of name || '?') h = (h * 31 + c.charCodeAt(0)) % 997
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export default function DocumentBrowser({ userName, onOpen }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  async function refresh() {
    setLoading(true)
    try {
      setDocs(await listDocuments())
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const visibleDocs = docs
    .filter((d) => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      return d.title.toLowerCase().includes(q) || (d.author || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })

  async function handleCreate() {
    try {
      const doc = await createDocument({ title: 'Untitled', author: userName })
      pushToast('Document created', 'ok')
      onOpen(doc._id)
    } catch (e) {
      setError(e.message)
      pushToast('Could not create document', 'error')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this document?')) return
    try {
      await deleteDocument(id)
      pushToast('Document deleted', 'warn')
      refresh()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleCopyLink(id) {
    const ok = await copyText(documentLink(id))
    pushToast(ok ? 'Link copied to clipboard' : 'Could not copy link', ok ? 'ok' : 'error')
  }

  async function handleImport() {
    if (!markdown.trim()) return
    try {
      const doc = await importMarkdown({ title: 'Imported', author: userName, markdown })
      pushToast('Imported from Markdown', 'ok')
      onOpen(doc._id)
    } catch (e) {
      setError(e.message)
      pushToast('Import failed', 'error')
    }
  }

  return (
    <div className="browser">
      <header className="browser-header">
        <h1>SyncDoc</h1>
        <span className="browser-sub">Collaborative AST documents</span>
      </header>

      <div className="browser-toolbar">
        <button className="btn btn-primary" onClick={handleCreate}>+ New document</button>
        <button className="btn btn-ghost" onClick={() => setImportOpen((v) => !v)}>
          {importOpen ? 'Hide import' : 'Import Markdown'}
        </button>
        <ThemeToggle />
      </div>

      <div className="browser-utils">
        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents…"
          aria-label="Search documents"
        />
        <div className="segmented">
          <button
            type="button"
            className={`seg-btn ${sortBy === 'recent' ? 'active' : ''}`}
            onClick={() => setSortBy('recent')}
          >
            Recent
          </button>
          <button
            type="button"
            className={`seg-btn ${sortBy === 'title' ? 'active' : ''}`}
            onClick={() => setSortBy('title')}
          >
            A–Z
          </button>
        </div>
      </div>

      {importOpen && (
        <div className="import-panel">
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder={'# Heading\n\nSome paragraph.\n\n```js\nconst x = 1\n```'}
          />
          <button className="btn btn-primary" onClick={handleImport} disabled={!markdown.trim()}>Import → document</button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading documents…</div>
      ) : docs.length === 0 ? (
        <div className="empty-state">No documents yet. Create one to start collaborating.</div>
      ) : visibleDocs.length === 0 ? (
        <div className="empty-state">No documents match “{query}”.</div>
      ) : (
        <ul className="doc-list">
          {visibleDocs.map((d) => (
            <li key={d._id} className="doc-row">
              <span className="doc-avatar" style={{ background: avatarColor(d.author) }}>
                {(d.author || '?')[0]?.toUpperCase()}
              </span>
              <div className="doc-info">
                <div className="doc-title">{d.title}</div>
                <div className="doc-meta">
                  <span>{d.author || 'Unknown'}</span>
                  <span className="badge">blocks {d.blockCount}</span>
                  <span className="badge">rev {d.revision}</span>
                  <span>{new Date(d.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="doc-actions">
                <button className="btn btn-ghost" onClick={() => onOpen(d._id)}>Open</button>
                <button className="btn btn-ghost" onClick={() => handleCopyLink(d._id)}>Copy</button>
                <a className="btn btn-ghost" href={exportUrl(d._id, 'html')} target="_blank" rel="noreferrer">HTML</a>
                <a className="btn btn-ghost" href={exportUrl(d._id, 'markdown')} target="_blank" rel="noreferrer">MD</a>
                <a className="btn btn-ghost" href={exportUrl(d._id, 'pdf')} target="_blank" rel="noreferrer">PDF</a>
                <button className="btn btn-danger" onClick={() => handleDelete(d._id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

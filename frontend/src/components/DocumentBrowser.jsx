import { useEffect, useState } from 'react'
import { listDocuments, createDocument, deleteDocument, importMarkdown, exportUrl } from '../api'

export default function DocumentBrowser({ userName, onOpen }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [error, setError] = useState('')

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

  async function handleCreate() {
    try {
      const doc = await createDocument({ title: 'Untitled', author: userName })
      onOpen(doc._id)
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this document?')) return
    try {
      await deleteDocument(id)
      refresh()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleImport() {
    if (!markdown.trim()) return
    try {
      const doc = await importMarkdown({ title: 'Imported', author: userName, markdown })
      onOpen(doc._id)
    } catch (e) {
      setError(e.message)
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
      ) : (
        <ul className="doc-list">
          {docs.map((d) => (
            <li key={d._id} className="doc-row">
              <div className="doc-info">
                <div className="doc-title">{d.title}</div>
                <div className="doc-meta">
                  {d.author} · {d.blockCount} blocks · rev {d.revision} · {new Date(d.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="doc-actions">
                <button className="btn btn-ghost" onClick={() => onOpen(d._id)}>Open</button>
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

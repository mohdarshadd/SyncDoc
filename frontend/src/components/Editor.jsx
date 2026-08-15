import { useMemo } from 'react'
import { useDocumentSync } from '../hooks/useDocumentSync'
import Block from './Block'
import PresenceBar from './PresenceBar'
import ThemeToggle from './ThemeToggle'
import { exportUrl } from '../api'

export default function Editor({ docId, user, onBack }) {
  const sync = useDocumentSync(docId, user)

  const stats = useMemo(() => {
    const words = sync.blocks.reduce((n, b) => n + (b.text.trim() ? b.text.trim().split(/\s+/).length : 0), 0)
    const chars = sync.blocks.reduce((n, b) => n + b.text.length, 0)
    const minutes = Math.max(1, Math.round(words / 200))
    return { words, chars, blocks: sync.blocks.length, minutes }
  }, [sync.blocks])

  return (
    <div className="editor">
      <header className="editor-header">
        <button className="btn btn-ghost" onClick={onBack}>← Documents</button>
        <input
          className="doc-title-input"
          value={sync.title}
          onChange={(e) => sync.updateTitle(e.target.value)}
          aria-label="Document title"
        />
        <PresenceBar users={sync.users} />
        <div className="exports">
          <a className="btn btn-ghost" href={exportUrl(docId, 'html')} target="_blank" rel="noreferrer">HTML</a>
          <a className="btn btn-ghost" href={exportUrl(docId, 'markdown')} target="_blank" rel="noreferrer">MD</a>
          <a className="btn btn-ghost" href={exportUrl(docId, 'pdf')} target="_blank" rel="noreferrer">PDF</a>
        </div>
        <ThemeToggle />
      </header>

      <div className="editor-body">
        <div className={`status-pill ${sync.status}`}>{sync.status === 'connected' ? 'synced' : sync.status}</div>

        <div className="blocks">
          {sync.blocks.map((b, i) => (
            <Block
              key={b.id}
              block={{ ...b, first: i === 0, last: i === sync.blocks.length - 1 }}
              users={sync.users}
              myClientId={sync.myClientId}
              onTextChange={sync.updateBlockText}
              onCursor={sync.setCursor}
              onDelete={sync.deleteBlock}
              onMove={sync.moveBlock}
              onAddAfter={(id) => sync.addBlock('paragraph', id)}
            />
          ))}
          {sync.blocks.length === 0 && <div className="empty-state">No blocks yet — add one below.</div>}
        </div>

        <div className="add-bar">
          <button className="btn btn-primary" onClick={() => sync.addBlock('paragraph')}>+ Paragraph</button>
          <button className="btn btn-ghost" onClick={() => sync.addBlock('heading')}>Heading</button>
          <button className="btn btn-ghost" onClick={() => sync.addBlock('code')}>Code</button>
          <button className="btn btn-ghost" onClick={() => sync.addBlock('quote')}>Quote</button>
        </div>
      </div>

      <footer className="editor-footer">
        <span>{stats.words} words</span>
        <span>{stats.chars} characters</span>
        <span>{stats.blocks} blocks</span>
        <span>~{stats.minutes} min read</span>
        <span className="footer-status">
          <i className={`dot ${sync.status}`} />
          {sync.status === 'connected' ? 'saved' : sync.status}
        </span>
      </footer>
    </div>
  )
}

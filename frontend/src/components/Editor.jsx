import { useDocumentSync } from '../hooks/useDocumentSync'
import Block from './Block'
import PresenceBar from './PresenceBar'
import { exportUrl } from '../api'

export default function Editor({ docId, user, onBack }) {
  const sync = useDocumentSync(docId, user)

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
      </header>

      <div className="editor-body">
        <div className={`status-pill ${sync.status}`}>{sync.status === 'connected' ? 'synced' : sync.status}</div>

        <div className="blocks">
          {sync.blocks.map((b) => (
            <Block
              key={b.id}
              block={b}
              users={sync.users}
              myClientId={sync.myClientId}
              onTextChange={sync.updateBlockText}
              onCursor={sync.setCursor}
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
    </div>
  )
}

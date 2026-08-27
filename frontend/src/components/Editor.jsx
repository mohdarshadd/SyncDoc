import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDocumentSync } from '../hooks/useDocumentSync'
import Block from './Block'
import EmptyState from './EmptyState'
import PresenceBar from './PresenceBar'
import ThemeToggle from './ThemeToggle'
import ShareDialog from './ShareDialog'
import VersionHistory from './VersionHistory'
import VersionViewer from './VersionViewer'
import { DragProvider } from './DragProvider'
import { exportUrl } from '../api'
import { copyText, documentLink } from '../lib/clipboard'
import { pushToast } from '../lib/toast'
import { useAuth } from '../contexts/AuthContext'
import useDocumentSearch from '../hooks/useDocumentSearch'
import SearchDialog from './SearchDialog'

export default function Editor() {
  const { docId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const sync = useDocumentSync(docId, user)
  const search = useDocumentSearch(sync.blocks)
  const [showShare, setShowShare] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [viewVersion, setViewVersion] = useState(null)

  const isOwner = sync.docRole === 'owner'

  const stats = useMemo(() => {
    const words = sync.blocks.reduce((n, b) => n + (b.text.trim() ? b.text.trim().split(/\s+/).length : 0), 0)
    const chars = sync.blocks.reduce((n, b) => n + b.text.length, 0)
    const minutes = Math.max(1, Math.round(words / 200))
    return { words, chars, blocks: sync.blocks.length, minutes }
  }, [sync.blocks])

  async function handleCopyLink() {
    const ok = await copyText(documentLink(docId))
    pushToast(ok ? 'Link copied to clipboard' : 'Could not copy link', ok ? 'ok' : 'error')
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        search.openSearch()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [search])

  return (
    <div className="editor">
      <header className="editor-header">
        <button className="btn btn-ghost" onClick={() => navigate('/documents')}>&#8592; Documents</button>
        <input
          className="doc-title-input"
          value={sync.title}
          onChange={(e) => sync.updateTitle(e.target.value)}
          aria-label="Document title"
          disabled={!isOwner}
        />
        <PresenceBar users={sync.users} />
        <div className="exports">
          <button className="btn btn-ghost" onClick={handleCopyLink}>Copy link</button>
          <button className="btn btn-ghost" onClick={() => setShowVersions(true)}>History</button>
          <button className="btn btn-ghost" onClick={search.openSearch} title="Search (Cmd/Ctrl+F)">Search</button>
          {isOwner && (
            <button className="btn btn-ghost" onClick={() => setShowShare(true)}>Share</button>
          )}
          <a className="btn btn-ghost" href={exportUrl(docId, 'html')} target="_blank" rel="noreferrer">HTML</a>
          <a className="btn btn-ghost" href={exportUrl(docId, 'markdown')} target="_blank" rel="noreferrer">MD</a>
          <a className="btn btn-ghost" href={exportUrl(docId, 'pdf')} target="_blank" rel="noreferrer">PDF</a>
        </div>
        <ThemeToggle />
        <button className="btn btn-ghost profile-btn-header" onClick={() => navigate('/profile')} title="Profile">
          <span className="profile-btn-avatar" style={{ background: user?.color || '#2997ff' }}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </span>
        </button>
      </header>

      {showShare && (
        <ShareDialog docId={docId} isOwner={isOwner} onClose={() => setShowShare(false)} />
      )}

      {showVersions && (
        <VersionHistory
          docId={docId}
          isOwner={isOwner}
          onSelect={(rev) => { setShowVersions(false); setViewVersion(rev) }}
          onClose={() => setShowVersions(false)}
        />
      )}

      {viewVersion !== null && (
        <VersionViewer
          docId={docId}
          revision={viewVersion}
          onClose={() => setViewVersion(null)}
        />
      )}

      {search.open && (
        <SearchDialog
          query={search.query}
          setQuery={search.setQuery}
          matches={search.matches}
          activeIndex={search.activeIndex}
          onNext={search.next}
          onPrev={search.prev}
          onClose={search.closeSearch}
        />
      )}

      <div className="editor-body">
        <div className={`status-pill ${sync.status}`}>{sync.status === 'connected' ? 'synced' : sync.status}</div>

        <DragProvider>
          <div className="blocks">
            {sync.blocks.map((b, i) => (
              <Block
                key={b.id}
                block={{ ...b, first: i === 0, last: i === sync.blocks.length - 1, order: i }}
                users={sync.users}
                myClientId={sync.myClientId}
                onTextChange={sync.updateBlockText}
                onCursor={sync.setCursor}
                onDelete={sync.deleteBlock}
                onMove={sync.moveBlock}
                onReorder={sync.reorderBlock}
                onChangeBlockType={sync.changeBlockType}
                onAddAfter={(id) => sync.addBlock('paragraph', id)}
                searchQuery={search.query}
                blockMatches={search.matches.filter((m) => m.blockId === b.id)}
                activeMatch={search.activeMatch}
              />
            ))}
          {sync.blocks.length === 0 && (
            <EmptyState
              icon="blocks"
              title="This document is empty"
              hint="Start typing below, or add your first block."
              action={<button className="btn btn-primary" onClick={() => sync.addBlock('paragraph')}>+ Paragraph</button>}
            />
          )}
        </div>
        </DragProvider>

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
        {search.query && (
          <span className={`footer-search ${search.matches.length === 0 ? 'no-results' : ''}`}>
            {search.matches.length === 0
              ? 'No matches for "' + search.query + '"'
              : `${search.matches.length} match${search.matches.length === 1 ? '' : 'es'}`}
          </span>
        )}
        <span className="footer-status">
          <i className={`dot ${sync.status}`} />
          {sync.status === 'connected' ? 'saved' : sync.status}
        </span>
      </footer>
    </div>
  )
}

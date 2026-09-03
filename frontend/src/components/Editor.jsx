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
import ShortcutsOverlay from './ShortcutsOverlay'

export default function Editor() {
  const { docId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const sync = useDocumentSync(docId, user)
  const search = useDocumentSearch(sync.blocks)
  const [showShare, setShowShare] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [viewVersion, setViewVersion] = useState(null)
  const [showShortcuts, setShowShortcuts] = useState(false)

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

  function handleAddBlock(type, afterId = null) {
    const newId = sync.addBlock(type, afterId)
    if (!newId) {
      pushToast('Could not add block', 'error')
      return
    }
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${newId}"]`)
      if (!el) return
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      const ta = el.querySelector('textarea')
      if (ta) {
        ta.focus()
        ta.setSelectionRange(ta.value.length, ta.value.length)
      }
    }, 30)
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        search.openSearch()
      }
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (!isTyping && (e.key === '?' || e.key === '/')) {
        e.preventDefault()
        setShowShortcuts(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [search])

  return (
    <div className="editor">
      <header className="editor-header">
        <button className="btn btn-ghost" onClick={() => navigate('/documents')} title="Back to documents" aria-label="Back to documents">&#8592; Documents</button>
        <input
          className="doc-title-input"
          value={sync.title}
          onChange={(e) => sync.updateTitle(e.target.value)}
          aria-label="Document title"
          disabled={!isOwner}
        />
        <PresenceBar users={sync.users} myClientId={sync.myClientId} />
        <div className="exports">
          <button className="btn btn-ghost" onClick={handleCopyLink} title="Copy document link (Ctrl+C)" aria-label="Copy link">Copy link</button>
          <button className="btn btn-ghost" onClick={() => setShowVersions(true)} title="Version history" aria-label="Version history">History</button>
          <button className="btn btn-ghost" onClick={search.openSearch} title="Search in document (Ctrl+F)" aria-label="Search">Search</button>
          {isOwner && (
            <button className="btn btn-ghost" onClick={() => setShowShare(true)} title="Share document" aria-label="Share">Share</button>
          )}
          <button className="btn btn-ghost" onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">?</button>
          <a className="btn btn-ghost" href={exportUrl(docId, 'html')} target="_blank" rel="noreferrer" title="Export as HTML" aria-label="Export as HTML">HTML</a>
          <a className="btn btn-ghost" href={exportUrl(docId, 'markdown')} target="_blank" rel="noreferrer" title="Export as Markdown" aria-label="Export as Markdown">MD</a>
          <a className="btn btn-ghost" href={exportUrl(docId, 'pdf')} target="_blank" rel="noreferrer" title="Export as PDF" aria-label="Export as PDF">PDF</a>
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

      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}

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
                onToggleChecked={sync.toggleBlockChecked}
                onToggleOpen={sync.toggleBlockOpen}
                onAddAfter={(id) => handleAddBlock('paragraph', id)}
                searchQuery={search.query}
                blockMatches={search.matches.filter((m) => m.blockId === b.id)}
                activeMatch={search.activeMatch}
              />
            ))}
          {sync.blocks.length === 0 && (
            <EmptyState
              icon="blocks"
              title="This document is empty"
              hint="Add your first block to start writing."
              action={
                <div className="empty-actions">
                  <button className="btn btn-primary" onClick={() => handleAddBlock('paragraph')}>+ Paragraph</button>
                  <button className="btn btn-ghost" onClick={() => handleAddBlock('heading')}>Heading</button>
                  <button className="btn btn-ghost" onClick={() => handleAddBlock('code')}>Code</button>
                  <button className="btn btn-ghost" onClick={() => handleAddBlock('quote')}>Quote</button>
                </div>
              }
            />
          )}
        </div>
        </DragProvider>
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

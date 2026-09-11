import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDocumentSync } from '../hooks/useDocumentSync'
import Block from './Block'
import PresenceBar from './PresenceBar'
import ThemeToggle from './ThemeToggle'
import ShareDialog from './ShareDialog'
import VersionHistory from './VersionHistory'
import VersionViewer from './VersionViewer'
import VersionCompare from './VersionCompare'
import OverflowMenu from './OverflowMenu'
import { DragProvider } from './DragProvider'
import { exportUrl } from '../api'
import { copyText, documentLink } from '../lib/clipboard'
import { pushToast } from '../lib/toast'
import { useAuth } from '../contexts/AuthContext'
import useDocumentSearch from '../hooks/useDocumentSearch'
import SearchDialog from './SearchDialog'
import ShortcutsOverlay from './ShortcutsOverlay'
import { buildBlockTree } from '../lib/blockTree'
import { extractMentionIds } from '../lib/comments'
import { buildEditorNav } from '../lib/editorMenu'
import useMediaQuery from '../hooks/useMediaQuery'
import { friendlyStatus } from '../lib/presence'

export default function Editor() {
  const { docId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const sync = useDocumentSync(docId, user)
  const search = useDocumentSearch(sync.blocks)
  const [showShare, setShowShare] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [viewVersion, setViewVersion] = useState(null)
  const [comparePair, setComparePair] = useState(null)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const isOwner = sync.docRole === 'owner'
  const canRename = sync.docRole === 'owner' || sync.docRole === 'editor'
  const isMobile = useMediaQuery('(max-width: 640px)')

  const stats = useMemo(() => {
    const words = sync.blocks.reduce((n, b) => n + (b.text.trim() ? b.text.trim().split(/\s+/).length : 0), 0)
    const chars = sync.blocks.reduce((n, b) => n + b.text.length, 0)
    const minutes = Math.max(1, Math.round(words / 200))
    return { words, chars, blocks: sync.blocks.length, minutes }
  }, [sync.blocks])

  const blockTree = useMemo(() => buildBlockTree(sync.blocks), [sync.blocks])

  const mentionsMe = useMemo(() => {
    const myId = sync.myClientId != null ? String(sync.myClientId) : null
    if (!myId) return []
    return sync.comments
      .filter((c) => !c.resolved)
      .filter((c) => extractMentionIds(c.text).includes(myId))
  }, [sync.comments, sync.myClientId])

  function handleMentionsClick() {
    if (mentionsMe.length === 0) return
    window.dispatchEvent(new CustomEvent('syncdoc:open-comment', { detail: { blockId: mentionsMe[0].blockId, commentId: mentionsMe[0].id } }))
  }

  const mobileNav = useMemo(
    () =>
      buildEditorNav({
        isOwner,
        mentionCount: mentionsMe.length,
        onHistory: () => setShowVersions(true),
        onCompare: () => setComparePair({ from: null, to: null }),
        onCopyLink: handleCopyLink,
        onSearch: search.openSearch,
        onMentions: handleMentionsClick,
        onShare: () => setShowShare(true),
        onShortcuts: () => setShowShortcuts(true),
        exportLinks: {
          html: exportUrl(docId, 'html'),
          markdown: exportUrl(docId, 'markdown'),
          pdf: exportUrl(docId, 'pdf'),
        },
      }),
    [isOwner, mentionsMe.length, docId, search.openSearch]
  )

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
    if (sync.blocks.length === 0 && sync.status === 'connected') {
      sync.addBlock('paragraph')
    }
  }, [sync.blocks.length, sync.status])

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
        {isMobile ? (
          <>
            <button className="btn btn-ghost btn-icon" onClick={() => navigate('/documents')} title="Back to documents" aria-label="Back to documents">&#8592;</button>
            <PresenceBar users={sync.users} myClientId={sync.myClientId} />
            <span className="header-spacer" />
            <OverflowMenu items={mobileNav} ariaLabel="More actions" />
            <ThemeToggle />
            <button className="btn btn-ghost profile-btn-header" onClick={() => navigate('/profile')} title="Profile">
              <span className="profile-btn-avatar" style={{ background: user?.color || '#2997ff' }}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={() => navigate('/documents')} title="Back to documents" aria-label="Back to documents">&#8592; Documents</button>
            <PresenceBar users={sync.users} myClientId={sync.myClientId} />
            <div className="exports">
              <button className="btn btn-ghost" onClick={handleCopyLink} title="Copy document link (Ctrl+C)" aria-label="Copy link">Copy link</button>
              <button className="btn btn-ghost" onClick={() => setShowVersions(true)} title="Version history" aria-label="Version history">History</button>
              <button
                className="btn btn-ghost"
                onClick={() => setComparePair({ from: null, to: null })}
                title="Compare versions"
                aria-label="Compare versions"
              >
                Compare
              </button>
              <button className="btn btn-ghost" onClick={search.openSearch} title="Search in document (Ctrl+F)" aria-label="Search">Search</button>
              {mentionsMe.length > 0 && (
                <button className="btn btn-ghost mentions-badge-btn" onClick={handleMentionsClick} title={`${mentionsMe.length} comment${mentionsMe.length === 1 ? '' : 's'} mention you`} aria-label="Mentions of you">
                  Mentions
                  <span className="mentions-count">{mentionsMe.length}</span>
                </button>
              )}
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
          </>
        )}
      </header>

      {showShare && (
        <ShareDialog docId={docId} isOwner={isOwner} onClose={() => setShowShare(false)} />
      )}

      {showVersions && (
        <VersionHistory
          docId={docId}
          isOwner={isOwner}
          onSelect={(rev) => { setShowVersions(false); setViewVersion(rev) }}
          onCompare={(rev) => { setShowVersions(false); setComparePair({ from: rev, to: null }) }}
          onClose={() => setShowVersions(false)}
        />
      )}

      {comparePair !== null && (
        <VersionCompare
          docId={docId}
          isOwner={isOwner}
          initialFrom={comparePair.from}
          initialTo={comparePair.to}
          onClose={() => setComparePair(null)}
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
        <input
          className="editor-title-input"
          value={sync.title}
          onChange={(e) => sync.updateTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') e.target.blur() }}
          aria-label="Document title"
          placeholder="Untitled"
          disabled={!canRename}
        />
        <div className={`status-pill ${sync.status}`}>{friendlyStatus(sync.status)}</div>

        <DragProvider>
          <div className="blocks">
            {blockTree.map((b) => (
              <Block
                key={b.id}
                block={{ ...b, first: b.hidden || b.first, last: b.hidden || b.last, order: b.order, depth: b.depth, hidden: b.hidden, hasHiddenDescendants: b.hasHiddenDescendants, firstChildOfParent: b.firstChildOfParent, lastOfSubtree: b.lastOfSubtree }}
                users={sync.users}
                myClientId={sync.myClientId}
                onTextChange={sync.updateBlockText}
                onCursor={sync.setCursor}
                onTyping={sync.setTyping}
                onNotifyTyping={sync.notifyTyping}
                onDelete={sync.deleteBlock}
                onMove={sync.moveBlock}
                onReorder={sync.reorderBlock}
                onChangeBlockType={sync.changeBlockType}
                onToggleChecked={sync.toggleBlockChecked}
                onToggleOpen={sync.toggleBlockOpen}
                onToggleCollapsed={sync.toggleBlockCollapsed}
                onToggleBlockMark={sync.toggleBlockMark}
                onClearBlockMarks={sync.clearBlockMarks}
                comments={sync.comments}
                me={{ id: user?._id, name: user?.name || 'Anonymous', color: user?.color, clientId: sync.myClientId }}
                onAddComment={sync.addComment}
                onResolveComment={sync.resolveComment}
                onDeleteComment={sync.deleteComment}
                onAddAfter={(id) => handleAddBlock('paragraph', id)}
                onAddAfterType={(type, id) => handleAddBlock(type, id)}
                searchQuery={search.query}
                blockMatches={search.matches.filter((m) => m.blockId === b.id)}
                activeMatch={search.activeMatch}
              />
            ))}
          {blockTree.length === 0 && !sync.blocks.length && sync.status !== 'connected' && (
            <div className="empty-state">Loading document...</div>
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

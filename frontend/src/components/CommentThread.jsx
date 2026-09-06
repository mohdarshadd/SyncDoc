import { useEffect, useRef, useState } from 'react'
import { stripMentions } from '../lib/comments'

function timeLabel(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return sameDay ? time : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + time
}

export default function CommentThread({ block, thread = [], targetRange, me, onAdd, onResolve, onDelete, onClose, participants = [] }) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const excerpt = targetRange?.start != null
    ? block.text.slice(targetRange.start, Math.max(targetRange.end ?? targetRange.start, targetRange.start))
    : block.text

  const submit = () => {
    if (!draft.trim()) return
    onAdd(draft.trim())
  }

  return (
    <div className="comment-thread" role="dialog" aria-label={`Comments on ${block.type} block`}>
      <div className="comment-thread-header">
        <span className="comment-thread-title">Comments</span>
        <button type="button" className="comment-thread-close" onClick={onClose} aria-label="Close comments">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {excerpt && (
        <div className="comment-thread-excerpt">{excerpt}</div>
      )}
      <div className="comment-list">
        {thread.length === 0 && <div className="comment-empty">No comments yet on this text.</div>}
        {thread.map((c) => (
          <div key={c.id} className={`comment-item ${c.resolved ? 'resolved' : ''}`}>
            <span className="comment-avatar" style={{ background: c.color || '#2997ff' }}>
              {(c.authorName || '?').charAt(0).toUpperCase()}
            </span>
            <div className="comment-body">
              <div className="comment-meta">
                <span className="comment-author">{c.authorName}</span>
                <span className="comment-time">{timeLabel(c.created)}</span>
              </div>
              <div className="comment-text">{stripMentions(c.text)}</div>
              <div className="comment-actions">
                {c.resolved ? (
                  <button type="button" className="comment-action-link" onClick={() => onResolve(c.id)}>
                    Reopen
                  </button>
                ) : (
                  <button type="button" className="comment-action-link" onClick={() => onResolve(c.id)}>
                    Resolve
                  </button>
                )}
                {me?.id === c.authorId && (
                  <button type="button" className="comment-action-link danger" onClick={() => onDelete(c.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="comment-composer">
        <textarea
          ref={inputRef}
          className="comment-input"
          rows={2}
          placeholder="Write a comment… (use @ to mention)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <div className="comment-composer-actions">
          <span className="comment-participants">
            {participants.slice(0, 5).map((u) => (
              <span key={u.clientId} className="comment-participant" title={u.name} style={{ background: u.color }}>
                {u.name.charAt(0).toUpperCase()}
              </span>
            ))}
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={!draft.trim()}>
            Comment
          </button>
        </div>
      </div>
    </div>
  )
}
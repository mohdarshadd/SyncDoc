import { useEffect, useRef, useState } from 'react'
import { commentMessages, findMentionQuery, insertMention } from '../lib/comments'

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
  const [cursorPos, setCursorPos] = useState(0)
  const [mentionIndex, setMentionIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

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

  const mentionQuery = findMentionQuery(draft, cursorPos)
  const mentionActive = !!mentionQuery && mentionQuery.query.length >= 1
  const mentionMatches = mentionActive
    ? participants
        .filter((p) => p?.name && p.name.toLowerCase().includes(mentionQuery.query.toLowerCase()))
        .slice(0, 6)
    : []
  const mentionKey = mentionMatches.map((p) => p.clientId).join('|')
  useEffect(() => setMentionIndex(0), [mentionKey])

  const excerpt = targetRange?.start != null
    ? String(block.text || '').slice(targetRange.start, Math.max(targetRange.end ?? targetRange.start, targetRange.start))
    : block.text

  const applyMention = (u) => {
    if (!u) return
    const res = insertMention(draft, cursorPos, { name: u.name, id: u.clientId })
    setDraft(res.text)
    setCursorPos(res.cursorPos)
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        try { inputRef.current.setSelectionRange(res.cursorPos, res.cursorPos) } catch (e) { /* noop */ }
      }
    })
  }

  const submit = () => {
    if (!draft.trim()) return
    onAdd(draft.trim())
  }

  const onComposerKeyDown = (e) => {
    if (mentionMatches.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((i) =>
          e.key === 'ArrowDown' ? (i + 1) % mentionMatches.length : (i - 1 + mentionMatches.length) % mentionMatches.length
        )
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        applyMention(mentionMatches[mentionIndex] || mentionMatches[0])
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      submit()
    }
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
              <div className="comment-text">
                {commentMessages(c).map((p, i) =>
                  p.kind === 'mention' ? (
                    <span key={i} className="mention-pill">{p.name}</span>
                  ) : (
                    <span key={i}>{p.value}</span>
                  )
                )}
              </div>
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
        {mentionMatches.length > 0 && (
          <ul className="mention-picker" role="listbox" ref={listRef}>
            {mentionMatches.map((u, i) => (
              <li
                key={u.clientId}
                role="option"
                aria-selected={i === mentionIndex}
                className={`mention-option ${i === mentionIndex ? 'active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyMention(u)}
              >
                <span className="mention-avatar" style={{ background: u.color || '#2997ff' }}>
                  {u.name.charAt(0).toUpperCase()}
                </span>
                <span className="mention-name">{u.name}</span>
              </li>
            ))}
          </ul>
        )}
        <textarea
          ref={inputRef}
          className="comment-input"
          rows={2}
          placeholder="Write a comment… (use @ to mention)"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setCursorPos(e.target.selectionStart)
          }}
          onSelect={(e) => setCursorPos(e.target.selectionStart)}
          onClick={(e) => setCursorPos(e.target.selectionStart)}
          onKeyUp={(e) => setCursorPos(e.target.selectionStart)}
          onKeyDown={onComposerKeyDown}
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
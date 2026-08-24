import { useEffect, useRef, useContext } from 'react'
import { DragContext } from './DragProvider'

const TYPE_CLASS = {
  heading: 'block-heading',
  paragraph: 'block-paragraph',
  code: 'block-code',
  quote: 'block-quote',
  list: 'block-list',
  divider: 'block-divider',
  image: 'block-image'
}

function placeholderFor(type) {
  switch (type) {
    case 'code':
      return 'Code...'
    case 'heading':
      return 'Heading...'
    case 'quote':
      return 'Quote...'
    case 'list':
      return 'List item...'
    default:
      return 'Start typing...'
  }
}

export default function Block({ block, users, myClientId, onTextChange, onCursor, onDelete, onMove, onAddAfter, onReorder }) {
  const ref = useRef(null)
  const cls = TYPE_CLASS[block.type] || 'block-paragraph'
  const { dragId, dragOverIndex, setDragId, setDragOverIndex } = useContext(DragContext)

  const editingUsers = users.filter(
    (u) => u.cursor && u.cursor.blockId === block.id && u.clientId !== myClientId
  )

  useEffect(() => {
    if (ref.current && ref.current.value !== block.text) {
      ref.current.value = block.text
      try {
        ref.current.setSelectionRange(ref.current.value.length, ref.current.value.length)
      } catch (e) { /* noop */ }
    }
  }, [block.text])

  const onSelection = (e) => onCursor({ blockId: block.id, index: e.target.selectionStart })

  const onKeyDown = (e) => {
    const el = ref.current
    const mod = e.metaKey || e.ctrlKey

    if (mod && e.key === 's') {
      e.preventDefault()
      return
    }

    if (mod && e.key === 'Enter') {
      e.preventDefault()
      onAddAfter(block.id)
      requestAnimationFrame(() => el.closest('.block')?.nextElementSibling?.querySelector('textarea')?.focus())
      return
    }

    if (e.key === 'Enter' && !block.text) {
      e.preventDefault()
      onAddAfter(block.id)
      requestAnimationFrame(() => el.closest('.block')?.nextElementSibling?.querySelector('textarea')?.focus())
      return
    }

    if (e.key === 'Backspace' && !block.text) {
      e.preventDefault()
      const prevId = el.closest('.block')?.previousElementSibling?.dataset.blockId
      onDelete(block.id)
      requestAnimationFrame(() => {
        const target = prevId ? document.querySelector(`[data-block-id="${prevId}"] textarea`) : null
        if (target) target.focus()
      })
    }
  }

  function handleDragStart(e) {
    setDragId(block.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', block.id)
    requestAnimationFrame(() => {
      e.target.closest('.block')?.classList.add('dragging')
    })
  }

  function handleDragEnd() {
    setDragId(null)
    setDragOverIndex(null)
    document.querySelectorAll('.block.dragging').forEach((el) => el.classList.remove('dragging'))
    document.querySelectorAll('.drop-indicator').forEach((el) => el.classList.remove('visible'))
  }

  function handleDragOver(e) {
    e.preventDefault()
    if (dragId === block.id) return
    e.dataTransfer.dropEffect = 'move'

    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const insertBefore = e.clientY < midY
    const blockIndex = block.order ?? 0
    const targetIndex = insertBefore ? blockIndex : blockIndex + 1

    setDragOverIndex(targetIndex)

    const indicator = e.currentTarget.querySelector('.drop-indicator')
    if (indicator) {
      indicator.style.top = insertBefore ? '-1px' : 'calc(100% + 1px)'
      indicator.classList.add('visible')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    if (dragId && dragId !== block.id) {
      const rect = e.currentTarget.getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const insertBefore = e.clientY < midY
      const blockIndex = block.order ?? 0
      const targetIndex = insertBefore ? blockIndex : blockIndex + 1
      onReorder(dragId, targetIndex)
    }
    setDragId(null)
    setDragOverIndex(null)
  }

  return (
    <div
      className={`block ${cls} ${dragId === block.id ? 'dragging' : ''}`}
      data-block-id={block.id}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {editingUsers.length > 0 && (
        <div className="block-editors">
          {editingUsers.map((u) => (
            <span key={u.clientId} className="editing-badge">
              <i style={{ background: u.color }} />
              {u.name} editing
              {block.text && u.cursor?.index != null && (
                <span
                  className="cursor-pos"
                  style={{ background: u.color, left: `${Math.min(100, (u.cursor.index / Math.max(block.text.length, 1)) * 100)}%` }}
                />
              )}
            </span>
          ))}
        </div>
      )}
      <div className="block-drag-handle" title="Drag to reorder">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
          <circle cx="3" cy="3" r="1.2" fill="currentColor" />
          <circle cx="7" cy="3" r="1.2" fill="currentColor" />
          <circle cx="3" cy="8" r="1.2" fill="currentColor" />
          <circle cx="7" cy="8" r="1.2" fill="currentColor" />
          <circle cx="3" cy="13" r="1.2" fill="currentColor" />
          <circle cx="7" cy="13" r="1.2" fill="currentColor" />
        </svg>
      </div>
      <div className="block-toolbar" aria-label="Block actions">
        <button type="button" className="tool-btn" title="Add below" onClick={() => onAddAfter(block.id)}>+</button>
        <button type="button" className="tool-btn" title="Move up" disabled={block.first} onClick={() => onMove(block.id, -1)}>↑</button>
        <button type="button" className="tool-btn" title="Move down" disabled={block.last} onClick={() => onMove(block.id, 1)}>↓</button>
        <button type="button" className="tool-btn tool-btn-danger" title="Delete block" onClick={() => onDelete(block.id)}>×</button>
      </div>
      <textarea
        ref={ref}
        defaultValue={block.text}
        placeholder={placeholderFor(block.type)}
        spellCheck={false}
        onInput={(e) => onTextChange(block.id, e.target.value)}
        onFocus={onSelection}
        onClick={onSelection}
        onKeyUp={onSelection}
        onSelect={onSelection}
        onBlur={() => onCursor(null)}
        onKeyDown={onKeyDown}
      />
      {block.type === 'code' && <span className="block-lang">{block.lang || 'text'}</span>}
      <div className="drop-indicator" />
    </div>
  )
}

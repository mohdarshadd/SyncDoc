import { useEffect, useRef, useContext, useState } from 'react'
import { DragContext } from './DragProvider'
import SlashMenu from './SlashMenu'

function blockElements() {
  return Array.from(document.querySelectorAll('.block'))
}

function indicatorFor(el) {
  return el ? el.querySelector('.drop-indicator') : null
}

function clearIndicators() {
  document.querySelectorAll('.drop-indicator').forEach((i) => i.classList.remove('visible'))
}
const TYPE_CLASS = {
  heading: 'block-heading',
  paragraph: 'block-paragraph',
  code: 'block-code',
  quote: 'block-quote',
  list: 'block-list',
  checklist: 'block-checkbox',
  toggle: 'block-toggle',
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
    case 'checklist':
      return 'To-do...'
    case 'toggle':
      return 'Toggle...'
    default:
      return 'Start typing or / for commands...'
  }
}

export default function Block({ block, users, myClientId, onTextChange, onCursor, onDelete, onMove, onAddAfter, onReorder, onChangeBlockType, onToggleChecked, onToggleOpen, searchQuery, blockMatches, activeMatch }) {
  const ref = useRef(null)
  const cls = TYPE_CLASS[block.type] || 'block-paragraph'
  const { activeId, overId, insertIndex, setActiveId, setOverId, setInsertIndex } = useContext(DragContext)
  const [slashState, setSlashState] = useState({ active: false, query: '' })

  const isActiveBlock = activeMatch && activeMatch.blockId === block.id

  const editingUsers = users.filter(
    (u) => u.cursor && u.cursor.blockId === block.id && u.clientId !== myClientId
  )

  function autoGrow() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    if (ref.current && ref.current.value !== block.text) {
      ref.current.value = block.text
      try {
        ref.current.setSelectionRange(ref.current.value.length, ref.current.value.length)
      } catch (e) { /* noop */ }
    }
    autoGrow()
  }, [block.text])

  useEffect(() => {
    if (isActiveBlock && ref.current) {
      const blockEl = ref.current.closest('.block')
      blockEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [isActiveBlock, blockMatches, searchQuery])

  const onSelection = (e) => onCursor({ blockId: block.id, index: e.target.selectionStart })

  const onKeyDown = (e) => {
    const el = ref.current
    const mod = e.metaKey || e.ctrlKey

    if (slashState.active) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setSlashState({ active: false, query: '' })
        return
      }
      if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        return
      }
    }

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

    if (e.key === 'Enter' && !slashState.active) {
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

    if (e.key === 'ArrowUp' && el.selectionStart === 0) {
      e.preventDefault()
      const prev = el.closest('.block')?.previousElementSibling
      const target = prev?.querySelector('textarea')
      if (target) {
        target.focus()
        target.setSelectionRange(target.value.length, target.value.length)
      }
    }

    if (e.key === 'ArrowDown' && el.selectionStart === el.value.length) {
      e.preventDefault()
      const next = el.closest('.block')?.nextElementSibling
      const target = next?.querySelector('textarea')
      if (target) {
        target.focus()
        target.setSelectionRange(0, 0)
      }
    }
  }

  function handleInput(e) {
    const value = e.target.value
    onTextChange(block.id, value)
    autoGrow()

    if (value === '/') {
      setSlashState({ active: true, query: '' })
    } else if (slashState.active) {
      if (value.startsWith('/')) {
        setSlashState({ active: true, query: value.slice(1) })
      } else {
        setSlashState({ active: false, query: '' })
      }
    }
  }

  function handleSlashSelect(type) {
    const el = ref.current
    if (el) {
      el.value = ''
      onTextChange(block.id, '')
    }
    onChangeBlockType(block.id, type)
    setSlashState({ active: false, query: '' })
    requestAnimationFrame(() => el?.focus())
  }

  function handleSlashClose() {
    setSlashState({ active: false, query: '' })
    ref.current?.focus()
  }

  function onHandlePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    const el = e.currentTarget.closest('.block')
    const draggedId = block.id
    setActiveId(draggedId)
    el?.classList.add('dragging')
    document.body.classList.add('dragging-active')
    e.currentTarget.setPointerCapture?.(e.pointerId)

    let currentIndex = blockElements().findIndex((b) => b.dataset.blockId === draggedId)

    function onPointerMove(ev) {
      const blocks = blockElements()
      let targetIndex = blocks.length
      for (let i = 0; i < blocks.length; i++) {
        const r = blocks[i].getBoundingClientRect()
        if (ev.clientY < r.top + r.height / 2) {
          targetIndex = i
          break
        }
      }
      currentIndex = targetIndex
      clearIndicators()
      if (targetIndex < blocks.length) {
        const over = blocks[targetIndex]
        setOverId(over.dataset.blockId)
        setInsertIndex(targetIndex)
        const ind = indicatorFor(over)
        if (ind) {
          ind.style.top = '-1px'
          ind.classList.add('visible')
        }
      } else {
        setOverId(null)
        setInsertIndex(blocks.length)
        const last = blocks[blocks.length - 1]
        const ind = indicatorFor(last)
        if (ind) {
          ind.style.top = 'calc(100% + 1px)'
          ind.classList.add('visible')
        }
      }
    }

    function finish() {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      clearIndicators()
      document.querySelectorAll('.block.dragging').forEach((b) => b.classList.remove('dragging'))
      document.body.classList.remove('dragging-active')
      const from = blockElements().findIndex((b) => b.dataset.blockId === draggedId)
      const to = currentIndex
      if (from !== -1 && to != null) {
        const adjusted = from < to ? to - 1 : to
        onReorder(draggedId, adjusted)
      }
      setActiveId(null)
      setOverId(null)
      setInsertIndex(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
  }

  return (
    <div
      className={`block ${cls} ${activeId === block.id ? 'dragging' : ''} ${overId === block.id ? 'drag-over' : ''}`}
      data-block-id={block.id}
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
      <div className="block-gutter">
        <button type="button" className="block-add-btn" title="Add block" onClick={() => onAddAfter(block.id)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          className="block-drag-handle"
          title="Drag to reorder"
          aria-label="Drag to reorder block"
          onPointerDown={onHandlePointerDown}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <circle cx="3" cy="3" r="1.2" fill="currentColor" />
            <circle cx="7" cy="3" r="1.2" fill="currentColor" />
            <circle cx="3" cy="8" r="1.2" fill="currentColor" />
            <circle cx="7" cy="8" r="1.2" fill="currentColor" />
            <circle cx="3" cy="13" r="1.2" fill="currentColor" />
            <circle cx="7" cy="13" r="1.2" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div className="block-content">
        {block.type === 'checklist' && (
          <button
            type="button"
            className={`block-check ${block.checked ? 'checked' : ''}`}
            onClick={() => onToggleChecked(block.id)}
            aria-label={block.checked ? 'Mark as incomplete' : 'Mark as complete'}
            aria-pressed={block.checked}
            title={block.checked ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path className="check-mark" d="M4.5 8.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {block.type === 'toggle' && (
          <button
            type="button"
            className={`block-caret ${block.open ? 'open' : ''}`}
            onClick={() => onToggleOpen(block.id)}
            aria-label={block.open ? 'Collapse' : 'Expand'}
            aria-expanded={block.open}
            title={block.open ? 'Collapse' : 'Expand'}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="block-textarea-wrap">
          {searchQuery && block.text && (
            <HighlightOverlay
              text={block.text}
              query={searchQuery}
              matches={blockMatches}
              activeMatch={activeMatch}
            />
          )}
          <textarea
            ref={ref}
            defaultValue={block.text}
            placeholder={placeholderFor(block.type)}
            spellCheck={false}
            onInput={handleInput}
            onFocus={onSelection}
            onClick={onSelection}
            onKeyUp={onSelection}
            onSelect={onSelection}
            onBlur={() => onCursor(null)}
            onKeyDown={onKeyDown}
          />
        </div>
        {block.type === 'code' && <span className="block-lang">{block.lang || 'text'}</span>}
        {slashState.active && (
          <SlashMenu
            query={slashState.query}
            onSelect={handleSlashSelect}
            onClose={handleSlashClose}
          />
        )}
      </div>
      <div className="drop-indicator" />
    </div>
  )
}

function HighlightOverlay({ text, query, matches, activeMatch }) {
  const parts = []
  let cursor = 0
  matches.forEach((m, i) => {
    if (m.index > cursor) parts.push({ start: cursor, end: m.index, active: false })
    parts.push({ start: m.index, end: m.index + m.length, active: activeMatch && m.index === activeMatch.index && m.blockId === activeMatch.blockId })
    cursor = m.index + m.length
  })
  if (cursor < text.length) parts.push({ start: cursor, end: text.length, active: false })

  return (
    <div className="search-highlight" aria-hidden="true">
      {parts.map((p, i) => (
        <mark
          key={i}
          className={p.active ? 'active' : ''}
        >
          {text.slice(p.start, p.end)}
        </mark>
      ))}
    </div>
  )
}

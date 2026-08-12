import { useEffect, useRef } from 'react'

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
      return 'Code block…'
    case 'heading':
      return 'Heading…'
    case 'quote':
      return 'Quote…'
    case 'list':
      return 'List item…'
    default:
      return 'Start typing…'
  }
}

export default function Block({ block, users, myClientId, onTextChange, onCursor }) {
  const ref = useRef(null)
  const cls = TYPE_CLASS[block.type] || 'block-paragraph'

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

  return (
    <div className={`block ${cls}`} data-block-id={block.id}>
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
      />
      {block.type === 'code' && <span className="block-lang">{block.lang || 'text'}</span>}
    </div>
  )
}

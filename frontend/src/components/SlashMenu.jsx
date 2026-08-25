import { useState, useEffect, useRef } from 'react'

const COMMANDS = [
  { label: 'Paragraph', type: 'paragraph', icon: '¶', description: 'Plain text block' },
  { label: 'Heading', type: 'heading', icon: 'H', description: 'Section heading' },
  { label: 'Code', type: 'code', icon: '<>', description: 'Code block' },
  { label: 'Quote', type: 'quote', icon: '"', description: 'Blockquote' },
  { label: 'Divider', type: 'divider', icon: '—', description: 'Horizontal rule' },
]

export default function SlashMenu({ query, onSelect, onClose }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef(null)

  const filtered = COMMANDS.filter(
    (c) => c.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[activeIndex]) onSelect(filtered[activeIndex].type)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [filtered, activeIndex, onSelect, onClose])

  if (filtered.length === 0) return null

  return (
    <div className="slash-menu" ref={listRef}>
      {filtered.map((cmd, i) => (
        <button
          key={cmd.type}
          className={`slash-item ${i === activeIndex ? 'active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(cmd.type)
          }}
          onMouseEnter={() => setActiveIndex(i)}
        >
          <span className="slash-icon">{cmd.icon}</span>
          <div className="slash-text">
            <span className="slash-label">{cmd.label}</span>
            <span className="slash-desc">{cmd.description}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

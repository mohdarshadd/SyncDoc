import { useEffect, useRef } from 'react'

const GROUPS = [
  {
    title: 'Editing',
    items: [
      { keys: 'Enter', label: 'Insert block below' },
      { keys: 'Mod+Enter', label: 'Insert block below' },
      { keys: 'Backspace', label: 'Delete empty block' },
      { keys: 'Arrow Up / Down', label: 'Jump between blocks at edges' },
      { keys: '/', label: 'Open commands menu' },
    ],
  },
  {
    title: 'Commands',
    items: [
      { keys: '/h', label: 'Heading' },
      { keys: '/c', label: 'Code' },
      { keys: '/q', label: 'Quote' },
      { keys: '/d', label: 'Divider' },
    ],
  },
  {
    title: 'Document',
    items: [
      { keys: 'Mod+S', label: 'Save (auto) / prevent browser dialog' },
      { keys: 'Mod+F', label: 'Search in document' },
      { keys: 'Mod+Enter', label: 'New block below' },
    ],
  },
]

function Kbd({ children }) {
  return <kbd className="shortcut-kbd">{children}</kbd>
}

export default function ShortcutsOverlay({ onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    panelRef.current?.focus()
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div
        className="shortcuts-panel"
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Keyboard shortcuts"
      >
        <div className="shortcuts-header">
          <h2 className="shortcuts-title">Keyboard shortcuts</h2>
          <button className="shortcuts-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="shortcuts-body">
          {GROUPS.map((group) => (
            <div key={group.title} className="shortcuts-group">
              <div className="shortcuts-group-title">{group.title}</div>
              {group.items.map((item) => (
                <div key={item.label + item.keys} className="shortcuts-row">
                  <div className="shortcuts-keys">
                    {item.keys.split(' / ').map((combo, i) => (
                      <span key={i} className="shortcuts-key-combo">
                        {combo.split('+').map((part, j) => (
                          <span key={j} className="shortcut-key-group">
                            <kbd className="shortcut-kbd">{part === 'Mod' ? '⌘' : part}</kbd>
                            {j < combo.split('+').length - 1 && <span className="shortcut-plus">+</span>}
                          </span>
                        ))}
                      </span>
                    ))}
                  </div>
                  <div className="shortcuts-label">{item.label}</div>
                </div>
              ))}
            </div>
          ))}
          <div className="shortcuts-hint">Press <Kbd>?</Kbd> or <Kbd>Shift</Kbd>+<Kbd>/</Kbd> anytime to see this.</div>
        </div>
      </div>
    </div>
  )
}

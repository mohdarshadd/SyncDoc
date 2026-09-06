const MARKS = [
  { type: 'bold', label: 'Bold', glyph: 'B', title: 'Bold (Ctrl+B)' },
  { type: 'italic', label: 'Italic', glyph: 'I', title: 'Italic (Ctrl+I)' },
  { type: 'underline', label: 'Underline', glyph: 'U', title: 'Underline (Ctrl+U)' },
  { type: 'strike', label: 'Strikethrough', glyph: 'S', title: 'Strikethrough' },
  { type: 'link', label: 'Link', glyph: 'Link', title: 'Link (Ctrl+K)' }
]

export default function BlockToolbar({ activeMarks, onApply, onClear, onComment }) {
  return (
    <div className="block-toolbar" role="toolbar" aria-label="Formatting">
      {MARKS.map((m) => (
        <button
          key={m.type}
          type="button"
          className={`toolbar-btn ${activeMarks.includes(m.type) ? 'active' : ''}`}
          title={m.title}
          aria-label={m.label}
          aria-pressed={activeMarks.includes(m.type)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onApply(m.type)}
        >
          {m.glyph}
        </button>
      ))}
      <span className="toolbar-sep" />
      <button
        type="button"
        className="toolbar-btn"
        title="Clear formatting"
        aria-label="Clear formatting"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClear}
      >
        Clear
      </button>
      {onComment && (
        <>
          <span className="toolbar-sep" />
          <button
            type="button"
            className="toolbar-btn"
            title="Comment on selection"
            aria-label="Comment on selection"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onComment}
          >
            Comment
          </button>
        </>
      )}
    </div>
  )
}
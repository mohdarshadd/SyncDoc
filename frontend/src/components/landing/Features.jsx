const FEATURES = [
  { title: 'Real-time sync', desc: 'Every keystroke is shared instantly between collaborators over a WebSocket connection.' },
  { title: 'Zero conflicts', desc: 'Changes merge automatically with AST-aware resolution instead of lost updates and clunky merges.' },
  { title: 'Live presence', desc: 'See who is in the document and exactly where each person is editing right now.' },
  { title: 'Block-based editing', desc: 'Structured blocks stay consistent, from paragraphs and headings to quotes and code.' },
  { title: 'Markdown in and out', desc: 'Import existing Markdown files and export polished HTML, Markdown, or PDF in one click.' },
  { title: 'Keyboard fast', desc: 'Create, move, and delete blocks without ever lifting your hands off the keyboard.' }
]

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="features-head">
        <h2 className="section-title">Everything a team needs to write together</h2>
        <p className="section-sub">A focused set of tools designed to keep documents consistent and collaboration effortless.</p>
      </div>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div className="feature-card" data-reveal key={f.title}>
            <span className="feature-marker" aria-hidden="true" />
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

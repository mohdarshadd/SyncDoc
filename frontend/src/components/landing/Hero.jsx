export default function Hero({ onGetStarted }) {
  return (
    <section className="hero" id="top">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-content">
        <p className="hero-badge">Real-time collaborative document engine</p>
        <h1 className="hero-title">Write together, without the conflicts.</h1>
        <p className="hero-sub">
          SyncDoc is a block-based collaborative editor with automatic AST conflict resolution,
          live presence, and Markdown import and export — right in your browser.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={onGetStarted}>Get started free</button>
          <a className="btn btn-ghost btn-lg" href="#features">See how it works</a>
        </div>
      </div>
      <div className="mock" aria-hidden="true">
        <div className="mock-bar">
          <span className="mock-dot" />
          <span className="mock-dot" />
          <span className="mock-dot" />
          <span className="mock-file">Untitled document</span>
        </div>
        <div className="mock-body">
          <div className="mock-title">Team Launch Notes</div>
          <div className="mock-line" />
          <div className="mock-line" />
          <div className="mock-line mock-line-short" />
          <div className="mock-line" />
          <div className="mock-avatar-row">
            <span className="mock-avatar" style={{ background: '#e11d48' }}>A</span>
            <span className="mock-avatar" style={{ background: '#2563eb' }}>B</span>
            <span className="mock-avatar" style={{ background: '#16a34a' }}>C</span>
            <span className="mock-typing">Alice is typing…</span>
          </div>
        </div>
      </div>
    </section>
  )
}

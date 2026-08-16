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
    </section>
  )
}

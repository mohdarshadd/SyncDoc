const FAQS = [
  {
    q: 'How does conflict resolution work?',
    a: 'SyncDoc is built on a CRDT engine, so concurrent edits from every collaborator merge automatically. Blocks are stored as a structured AST, so merges stay semantically correct instead of corrupting formatting.'
  },
  {
    q: 'Who can see my documents?',
    a: 'Every document is owner-controlled. You decide who to share it with and whether each person can view or edit, and access is verified on every REST and WebSocket request.'
  },
  {
    q: 'What export formats are supported?',
    a: 'Export any document to clean HTML, portable Markdown, or a print-ready PDF from the editor or the documents list — no third-party tools required.'
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. SyncDoc runs entirely in the browser, and your live session reconnects automatically if the connection drops.'
  },
  {
    q: 'What powers the real-time layer?',
    a: 'A WebSocket relay backed by the Yjs CRDT protocol, with JWT-authenticated connections, live presence, and server-side persistence of the document state.'
  }
]

export default function Faq() {
  return (
    <section className="features faq" id="faq">
      <div className="features-head">
        <h2 className="section-title">Questions, answered</h2>
        <p className="section-sub">The details behind real-time collaboration, security, and export.</p>
      </div>
      <div className="faq-list">
        {FAQS.map((f) => (
          <details className="faq-item" data-reveal key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

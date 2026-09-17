const STEPS = [
  {
    title: 'Create or import',
    desc: 'Start from a blank block-based document, or bring in existing Markdown and keep your formatting.'
  },
  {
    title: 'Invite your team',
    desc: 'Share a link and set each collaborator as a viewer or editor — access is enforced per document.'
  },
  {
    title: 'Write in real time',
    desc: 'Edits merge instantly with no lost work. Export to HTML, Markdown, or PDF when you are done.'
  }
]

export default function HowItWorks() {
  return (
    <section className="features how" id="how-it-works">
      <div className="features-head">
        <h2 className="section-title">From blank page to shared draft in minutes</h2>
        <p className="section-sub">Three steps, no setup, and no merge conflicts along the way.</p>
      </div>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li className="step" data-reveal key={s.title}>
            <span className="step-num">{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

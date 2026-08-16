const STATS = [
  { value: '<100ms', label: 'average sync latency' },
  { value: '0', label: 'lost edits with conflict resolution' },
  { value: '3', label: 'export formats built in' },
  { value: 'Open', label: 'source, free forever' }
]

export default function Stats() {
  return (
    <section className="stats" id="stats">
      <div className="stats-inner">
        {STATS.map((s) => (
          <div className="stat" data-reveal key={s.label}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

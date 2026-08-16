const COLUMNS = [
  { title: 'Product', links: ['Features', 'Docs', 'Changelog', 'Roadmap'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
  { title: 'Resources', links: ['Help center', 'Community', 'Tutorials', 'Status'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] }
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <span className="nav-logo">S</span>
          <span className="nav-name">SyncDoc</span>
          <p className="footer-tag">A collaborative document engine with automatic AST conflict resolution.</p>
        </div>
        {COLUMNS.map((col) => (
          <div className="footer-col" key={col.title}>
            <h4>{col.title}</h4>
            {col.links.map((link) => (
              <a key={link} href="#top">{link}</a>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        © 2026 SyncDoc. Built with care and an open source license.
      </div>
    </footer>
  )
}

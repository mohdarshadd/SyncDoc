import { useNavigate } from 'react-router-dom'

export default function Cta() {
  const navigate = useNavigate()

  return (
    <section className="cta" id="cta">
      <div className="cta-inner">
        <h2 className="cta-title">Ready to write together?</h2>
        <p className="cta-sub">Join a workspace and start a collaborative document in seconds. No signup required.</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/join')}>Start collaborating</button>
      </div>
    </section>
  )
}

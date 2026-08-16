import { useRef } from 'react'
import Navbar from './Navbar'
import Hero from './Hero'
import Features from './Features'
import Stats from './Stats'
import Cta from './Cta'
import Footer from './Footer'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function LandingPage({ onGetStarted }) {
  const rootRef = useRef(null)
  useScrollReveal(rootRef)

  return (
    <div className="landing" ref={rootRef}>
      <Navbar onGetStarted={onGetStarted} />
      <main>
        <Hero onGetStarted={onGetStarted} />
        <Features />
        <Stats />
        <Cta onGetStarted={onGetStarted} />
      </main>
      <Footer />
    </div>
  )
}

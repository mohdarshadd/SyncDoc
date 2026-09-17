import { useRef } from 'react'
import Navbar from './Navbar'
import Hero from './Hero'
import Features from './Features'
import HowItWorks from './HowItWorks'
import Stats from './Stats'
import Faq from './Faq'
import Cta from './Cta'
import Footer from './Footer'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function LandingPage() {
  const rootRef = useRef(null)
  useScrollReveal(rootRef)

  return (
    <div className="landing" ref={rootRef}>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}

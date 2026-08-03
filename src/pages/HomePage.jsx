import { useEffect } from 'react'
import { HeroCard } from '../components/home/HeroCard'
import { DetailsCard } from '../components/home/DetailsCard'
import { AttireCard } from '../components/home/AttireCard'
import { RsvpCard } from '../components/home/RsvpCard'
import { FaqsCard } from '../components/home/FaqsCard'
import { ThanksCard } from '../components/home/ThanksCard'

export function HomePage() {
  // Snap lives on the document rather than a nested container: a nested
  // scroller gives the page a second scrollbar sitting inside the layout.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('home-snap')
    return () => root.classList.remove('home-snap')
  }, [])

  return (
    <main className="home-stack">
      <HeroCard />
      <DetailsCard />
      <AttireCard />
      <RsvpCard />
      <ThanksCard />
      <FaqsCard />
    </main>
  )
}

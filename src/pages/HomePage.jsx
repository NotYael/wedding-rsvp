import { useEffect } from 'react'
import { HeroCard } from '../components/home/HeroCard'
import { DetailsCard } from '../components/home/DetailsCard'
import { AttireCard } from '../components/home/AttireCard'
import { RsvpCard } from '../components/home/RsvpCard'
import { FaqsCard } from '../components/home/FaqsCard'
import { ThanksCard } from '../components/home/ThanksCard'

export function HomePage() {
  // The stack's dark ground has to reach the overscroll area above and below
  // the document, and only html/body paint there -- hence a class on the
  // document element, scoped to this page and removed on the way out.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('home-stack-page')
    return () => root.classList.remove('home-stack-page')
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

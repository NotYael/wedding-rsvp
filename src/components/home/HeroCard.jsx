import { StackCard } from './StackCard'

export function HeroCard() {
  return (
    <StackCard id="hero" className="hero-card">
      <h1 id="hero-heading" className="hero-names">
        Marco &amp; Alessandra
      </h1>
      <p className="hero-tagline">Invite you to celebrate their special day</p>
      <img className="hero-mark" src="/couple.svg" alt="" width="273" height="251" />
    </StackCard>
  )
}

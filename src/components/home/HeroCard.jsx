import { WEDDING_DATE } from '../../lib/eventDetails'
import { StackCard } from './StackCard'

export function HeroCard() {
  return (
    <StackCard id="hero" className="hero-card">
      <h1 id="hero-heading" className="hero-names">
        Marco &amp; Alessandra
      </h1>
      <div className="hero-invite">
        <p className="hero-tagline">Invite you to celebrate their special day</p>
        <p className="hero-date">{WEDDING_DATE}</p>
      </div>
      <img className="hero-mark" src="/couple.svg" alt="" width="273" height="251" />
    </StackCard>
  )
}

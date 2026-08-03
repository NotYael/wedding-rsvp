import { StackCard } from './StackCard'

export function ThanksCard() {
  return (
    <StackCard id="thanks" className="thanks-card">
      <p className="thanks-kicker">Thank you for being part of our special day</p>

      <h2 id="thanks-heading" className="thanks-headline">
        We look forward to celebrating with you.
      </h2>

      <div className="thanks-signoff">
        <img className="thanks-signature" src="/signature.svg" alt="" width="69" height="64" />
        <p className="thanks-kicker">With love, Marco &amp; Alessandra</p>
      </div>
    </StackCard>
  )
}

import { GuestRsvpForm } from '../GuestRsvpForm'
import { StackCard } from './StackCard'

export function RsvpCard() {
  return (
    <StackCard id="rsvp" className="rsvp-card stack-card--tall">
      <div className="rsvp-layout">
        <div className="rsvp-intro">
          <h2 id="rsvp-heading" className="rsvp-title">
            Rsvp
          </h2>
          <p className="rsvp-lede">Please let us know if you&apos;ll be celebrating with us.</p>
          <p className="rsvp-lede">
            Kindly respond by
            <br />
            <strong>February 9, 2027</strong>.
          </p>
        </div>


        <GuestRsvpForm />
      </div>
    </StackCard>
  )
}

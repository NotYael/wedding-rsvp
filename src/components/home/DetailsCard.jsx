import { VENUES } from '../../lib/eventDetails'
import { StackCard } from './StackCard'

function VenueText({ venue }) {
  return (
    <div className="details-text">
      <h3 className="details-title">{venue.title}</h3>

      <div className="details-block">
        <p className="details-label">When</p>
        <p className="details-value">{venue.time}</p>
      </div>

      <div className="details-block">
        <p className="details-label">Where</p>
        <p className="details-value">
          {venue.venue.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <p className="details-value details-address">
          {venue.address.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>
    </div>
  )
}

export function DetailsCard() {
  return (
    <StackCard id="details" className="details-card">
      {/* The card shows two named sub-sections, so the landmark itself needs a
          name of its own for the nav link to line up with. */}
      <h2 id="details-heading" className="visually-hidden">
        Details
      </h2>

      {VENUES.map((venue) => {
        const art = (
          <img
            className="details-art"
            src={venue.art}
            alt=""
            width={venue.artWidth}
            height={venue.artHeight}
          />
        )

        return (
          <div className="details-row" key={venue.title}>
            {venue.artFirst ? art : <VenueText venue={venue} />}
            {venue.artFirst ? <VenueText venue={venue} /> : art}
          </div>
        )
      })}
    </StackCard>
  )
}

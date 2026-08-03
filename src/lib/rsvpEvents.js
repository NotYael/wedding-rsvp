export const RSVP_EVENTS = [
  { key: 'ceremony', label: 'Ceremony' },
  { key: 'reception', label: 'Reception' },
]

export const noEvents = () => ({ ceremony: false, reception: false })

export const hasAnyEvent = (events) => RSVP_EVENTS.some((item) => events[item.key])

/**
 * Which events a given guest is down for. The first guest always uses the
 * party-level answer at the top of the form; everyone after that either
 * inherits it or carries their own.
 */
export const eventsForPerson = (person, index, partyEvents) => {
  if (index === 0 || person.sameEvents) return partyEvents
  return person.events
}

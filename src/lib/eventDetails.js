/**
 * The single source of truth for event facts.
 *
 * Both the Details card on the site and the RSVP confirmation email read from
 * here, so a change of venue or time only has to be made once.
 */

/** Marker for values that still need filling in. Grep for it. */
export const PLACEHOLDER = '______'

export const COUPLE = 'Marco & Alessandra'

export const RSVP_DEADLINE = 'February 9, 2027'

export const WEDDING_DATE = 'April 9, 2027'

// TODO: placeholder for testing -- swap in the real contact number before
// confirmations go out to actual guests.
export const CONTACT_PHONE = '123456789'

export const VENUES = [
  {
    key: 'ceremony',
    title: 'Ceremony',
    time: '3:30PM',
    venue: ['Santuario de', 'San Antonio Parish'],
    address: ['3117 McKinley Rd, Forbes Park,', 'Makati City'],
    art: '/church.svg',
    artWidth: 461,
    artHeight: 337,
  },
  {
    key: 'reception',
    title: 'Reception',
    time: '5:30PM',
    venue: ['Manila Polo Club'],
    address: ['35 McKinley Rd, Forbes Park,', 'Makati City'],
    art: '/reception.svg',
    artWidth: 421,
    artHeight: 308,
    artFirst: true,
  },
]

/** True when any value the email prints has not been filled in yet. */
export const hasPlaceholders = () => [WEDDING_DATE, CONTACT_PHONE].includes(PLACEHOLDER)

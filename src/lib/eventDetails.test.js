import { describe, expect, test } from 'vitest'
import { CONTACT_PHONE, PLACEHOLDER, VENUES, WEDDING_DATE, hasPlaceholders } from './eventDetails'

describe('eventDetails', () => {
  test('every venue carries the key the RSVP rows are stored under', () => {
    expect(VENUES.map((v) => v.key)).toEqual(['ceremony', 'reception'])
  })

  test('hasPlaceholders tracks the two values the email prints', () => {
    expect(hasPlaceholders()).toBe([WEDDING_DATE, CONTACT_PHONE].includes(PLACEHOLDER))
  })

  // Unskip this once WEDDING_DATE and CONTACT_PHONE are filled in. It is the
  // guard that stops a literal "______" reaching a guest's inbox.
  test.skip('no event detail is still a placeholder', () => {
    expect(WEDDING_DATE).not.toBe(PLACEHOLDER)
    expect(CONTACT_PHONE).not.toBe(PLACEHOLDER)
  })
})

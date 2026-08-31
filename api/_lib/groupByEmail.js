/**
 * Collapse a party's guest rows into one entry per unique email address.
 *
 * The RSVP form lets everyone in a party reuse the first respondent's address,
 * so a party of three can carry anywhere from one to three distinct addresses.
 * Each address should receive a single email covering everyone who used it,
 * not one email per person.
 */
export function groupByEmail(rows) {
  const groups = new Map()

  for (const row of rows) {
    const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : ''
    if (!email) continue

    if (!groups.has(email)) groups.set(email, { email, people: [] })
    groups.get(email).people.push(row)
  }

  return [...groups.values()]
}

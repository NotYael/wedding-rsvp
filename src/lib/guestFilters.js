/**
 * The filters behind the guest list's Filters button.
 *
 * Two groups, and they combine differently. The three attendance filters
 * describe mutually exclusive states, so choosing several of them means "any of
 * these" -- an OR within the group, and choosing all three shows the same rows
 * as choosing none. The dietary filter asks a different question about the same
 * guest, so it narrows whatever attendance let through: an AND across groups.
 */

export const ATTENDANCE_FILTERS = [
  {
    key: 'ceremony-only',
    label: 'Only going to Ceremony',
    match: (guest) => guest.attending_ceremony && !guest.attending_reception,
  },
  {
    key: 'reception-only',
    label: 'Only going to After Party',
    match: (guest) => !guest.attending_ceremony && guest.attending_reception,
  },
  {
    key: 'both',
    label: 'Going to Both',
    match: (guest) => guest.attending_ceremony && guest.attending_reception,
  },
]

/* Deliberately the same test as the Dietary Needs figure above the table, so a
   count of 3 there always filters to 3 rows here: the form stores an empty box
   as null, but rows written before it did hold '', and a row of spaces counts
   as nothing said either. */
export const DIETARY_FILTER = {
  key: 'dietary',
  label: 'Those with dietary restrictions',
  match: (guest) => Boolean(guest.dietary_restrictions?.trim()),
}

export const ALL_FILTERS = [...ATTENDANCE_FILTERS, DIETARY_FILTER]

export const countActiveFilters = (active) =>
  ALL_FILTERS.filter((filter) => active[filter.key]).length

/**
 * A plain-English account of what is currently narrowing the table, for the top
 * of an export. Null when nothing is.
 *
 * The punctuation carries the logic described above: attendance choices are
 * joined with "or" because any of them will do, and the groups are joined with
 * ";" because a row has to satisfy all of them.
 */
export function describeFilters(active, search = '') {
  const clauses = []

  const attendance = ATTENDANCE_FILTERS.filter((filter) => active[filter.key]).map(
    (filter) => filter.label,
  )
  if (attendance.length > 0) clauses.push(attendance.join(' or '))

  if (active[DIETARY_FILTER.key]) clauses.push(DIETARY_FILTER.label)

  const term = search.trim()
  if (term) clauses.push(`Name contains "${term}"`)

  return clauses.length > 0 ? clauses.join('; ') : null
}

export function matchesFilters(guest, active) {
  const attendance = ATTENDANCE_FILTERS.filter((filter) => active[filter.key])
  if (attendance.length > 0 && !attendance.some((filter) => filter.match(guest))) return false
  if (active[DIETARY_FILTER.key] && !DIETARY_FILTER.match(guest)) return false
  return true
}

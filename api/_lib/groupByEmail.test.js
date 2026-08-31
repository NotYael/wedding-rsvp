import { describe, expect, test } from 'vitest'
import { groupByEmail } from './groupByEmail.js'

const guest = (name, email, overrides = {}) => ({
  name,
  email,
  attending_ceremony: true,
  attending_reception: true,
  dietary_restrictions: null,
  ...overrides,
})

describe('groupByEmail', () => {
  test('a lone respondent produces one group holding one person', () => {
    const groups = groupByEmail([guest('Ana Cruz', 'ana@example.com')])

    expect(groups).toHaveLength(1)
    expect(groups[0].email).toBe('ana@example.com')
    expect(groups[0].people.map((p) => p.name)).toEqual(['Ana Cruz'])
  })

  test('a party sharing one address produces one email listing everyone', () => {
    const groups = groupByEmail([
      guest('Ana Cruz', 'ana@example.com'),
      guest('Ben Cruz', 'ana@example.com'),
      guest('Cara Cruz', 'ana@example.com'),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].people.map((p) => p.name)).toEqual(['Ana Cruz', 'Ben Cruz', 'Cara Cruz'])
  })

  test('three people across two addresses produce groups of one and two', () => {
    const groups = groupByEmail([
      guest('Ana Cruz', 'ana@example.com'),
      guest('Ben Reyes', 'ben@example.com'),
      guest('Cara Reyes', 'ben@example.com'),
    ])

    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.people.length)).toEqual([1, 2])
    expect(groups.map((g) => g.email)).toEqual(['ana@example.com', 'ben@example.com'])
  })

  test('addresses differing only by case or padding are the same recipient', () => {
    const groups = groupByEmail([
      guest('Ana Cruz', '  Ana@Example.com '),
      guest('Ben Cruz', 'ana@example.com'),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].email).toBe('ana@example.com')
    expect(groups[0].people).toHaveLength(2)
  })

  test('groups appear in the order their address was first seen', () => {
    const groups = groupByEmail([
      guest('Ana Cruz', 'zoe@example.com'),
      guest('Ben Reyes', 'abe@example.com'),
      guest('Cara Cruz', 'zoe@example.com'),
    ])

    expect(groups.map((g) => g.email)).toEqual(['zoe@example.com', 'abe@example.com'])
  })

  test('rows without a usable address are dropped rather than emailed', () => {
    const groups = groupByEmail([
      guest('Ana Cruz', 'ana@example.com'),
      guest('No Email', ''),
      guest('Also None', null),
      guest('Whitespace', '   '),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].people.map((p) => p.name)).toEqual(['Ana Cruz'])
  })

  test('an empty party produces no groups', () => {
    expect(groupByEmail([])).toEqual([])
  })
})

import { describe, expect, test } from 'vitest'
import { buildEmailLog, matchesEmailSearch, summarizeEmailLog } from './emailLog'
import { NEVER_SENT } from './confirmationStatus'

const guest = (name, email, overrides = {}) => ({
  name,
  email,
  party_id: 'party-1',
  created_at: '2026-09-01T10:00:00Z',
  confirmation_sent_at: null,
  confirmation_status: null,
  ...overrides,
})

const sent = (at, status) => ({ confirmation_sent_at: at, confirmation_status: status })

describe('buildEmailLog', () => {
  test('a party sharing one address is one entry listing everyone', () => {
    const log = buildEmailLog([
      guest('Ana Cruz', 'ana@example.com', sent('2026-09-01T11:00:00Z', 'delivered')),
      guest('Ben Cruz', 'ana@example.com', sent('2026-09-01T11:00:00Z', 'delivered')),
    ])

    expect(log).toHaveLength(1)
    expect(log[0].recipients).toEqual(['Ana Cruz', 'Ben Cruz'])
    expect(log[0].status).toBe('delivered')
  })

  test('two addresses in one party are two entries, one per send', () => {
    const log = buildEmailLog([
      guest('Ana Cruz', 'ana@example.com', sent('2026-09-01T11:00:00Z', 'delivered')),
      guest('Ben Reyes', 'ben@example.com', sent('2026-09-01T11:00:00Z', 'bounced')),
    ])

    expect(log.map((e) => e.email).sort()).toEqual(['ana@example.com', 'ben@example.com'])
  })

  test('the same address in two parties stays two entries', () => {
    const log = buildEmailLog([
      guest('Ana Cruz', 'ana@example.com', { party_id: 'party-1', ...sent('2026-09-01T11:00:00Z', 'delivered') }),
      guest('Ana Cruz', 'ana@example.com', { party_id: 'party-2', ...sent('2026-09-02T11:00:00Z', 'delivered') }),
    ])

    expect(log).toHaveLength(2)
  })

  test('address casing and whitespace collapse the way the sender collapses them', () => {
    const log = buildEmailLog([
      guest('Ana Cruz', '  Ana@Example.com '),
      guest('Ben Cruz', 'ana@example.com'),
    ])

    expect(log).toHaveLength(1)
    expect(log[0].email).toBe('ana@example.com')
  })

  test('a row with no address is left out, as no email was addressed to it', () => {
    expect(buildEmailLog([guest('Ana Cruz', '   ')])).toHaveLength(0)
  })

  test('an RSVP that never triggered a send reads as never sent', () => {
    const log = buildEmailLog([guest('Ana Cruz', 'ana@example.com')])

    expect(log[0].status).toBe(NEVER_SENT)
    expect(log[0].sentAt).toBeNull()
    expect(log[0].submittedAt).toBe('2026-09-01T10:00:00Z')
  })

  test('the worst status wins, so a partial bounce cannot hide behind a delivered', () => {
    const log = buildEmailLog([
      guest('Ana Cruz', 'ana@example.com', sent('2026-09-01T11:00:00Z', 'delivered')),
      guest('Ben Cruz', 'ana@example.com', sent('2026-09-01T11:00:00Z', 'bounced')),
    ])

    expect(log[0].status).toBe('bounced')
  })

  test('a null status alongside a real one does not drag the entry to never sent', () => {
    const log = buildEmailLog([
      guest('Ana Cruz', 'ana@example.com', sent('2026-09-01T11:00:00Z', 'delivered')),
      guest('Ben Cruz', 'ana@example.com'),
    ])

    expect(log[0].status).toBe('delivered')
  })

  test('the most recent send is the top row', () => {
    const log = buildEmailLog([
      guest('Ana Cruz', 'ana@example.com', { party_id: 'p1', ...sent('2026-09-03T11:00:00Z', 'delivered') }),
      guest('Ben Reyes', 'ben@example.com', { party_id: 'p2', created_at: '2026-09-01T10:00:00Z' }),
      guest('Cara Lim', 'cara@example.com', { party_id: 'p3', created_at: '2026-09-02T10:00:00Z' }),
    ])

    expect(log[0].email).toBe('ana@example.com')
  })

  test('a never-sent entry is dated by the RSVP that should have triggered it', () => {
    const log = buildEmailLog([
      guest('Ana Cruz', 'ana@example.com', { party_id: 'p1', ...sent('2026-09-01T11:00:00Z', 'sent') }),
      // Submitted after Ana's email went out, so it sits above it.
      guest('Ben Reyes', 'ben@example.com', { party_id: 'p2', created_at: '2026-09-02T10:00:00Z' }),
      // Submitted before, so it sits below.
      guest('Cara Lim', 'cara@example.com', { party_id: 'p3', created_at: '2026-08-30T10:00:00Z' }),
    ])

    expect(log.map((e) => e.email)).toEqual([
      'ben@example.com',
      'ana@example.com',
      'cara@example.com',
    ])
  })

  test('sent entries sort most recent first', () => {
    const log = buildEmailLog([
      guest('Ana Cruz', 'ana@example.com', { party_id: 'p1', ...sent('2026-09-01T11:00:00Z', 'sent') }),
      guest('Ben Reyes', 'ben@example.com', { party_id: 'p2', ...sent('2026-09-05T11:00:00Z', 'sent') }),
    ])

    expect(log.map((e) => e.email)).toEqual(['ben@example.com', 'ana@example.com'])
  })
})

describe('summarizeEmailLog', () => {
  test('counts each state, with bounced and spam sharing one figure', () => {
    const stats = summarizeEmailLog([
      { status: 'delivered' },
      { status: 'delivered' },
      { status: 'sent' },
      { status: 'bounced' },
      { status: 'complained' },
      { status: 'failed' },
      { status: NEVER_SENT },
    ])

    expect(stats.map((s) => [s.label, s.value])).toEqual([
      ['Sent', 3],
      ['Bounced or Spam', 3],
      ['Never Sent', 1],
    ])
  })

  test('the figures partition the log, so every entry is counted exactly once', () => {
    const entries = [
      { status: 'delivered' },
      { status: 'sent' },
      { status: 'bounced' },
      { status: 'complained' },
      { status: 'failed' },
      { status: NEVER_SENT },
    ]

    const total = summarizeEmailLog(entries).reduce((sum, stat) => sum + stat.value, 0)
    expect(total).toBe(entries.length)
  })
})

describe('matchesEmailSearch', () => {
  const entry = { email: 'ana@example.com', recipients: ['Ana Cruz', 'Ben Cruz'] }

  test('an empty term matches everything', () => {
    expect(matchesEmailSearch(entry, '   ')).toBe(true)
  })

  test('matches on part of the address', () => {
    expect(matchesEmailSearch(entry, 'EXAMPLE')).toBe(true)
  })

  test('matches on a recipient name, not just the addressee', () => {
    expect(matchesEmailSearch(entry, 'ben')).toBe(true)
  })

  test('reports no match when neither the address nor a name contains the term', () => {
    expect(matchesEmailSearch(entry, 'zoe')).toBe(false)
  })
})

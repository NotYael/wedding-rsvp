import { describe, expect, test } from 'vitest'
import { renderConfirmation } from './renderConfirmation.js'

const details = {
  couple: 'Marco & Alessandra',
  weddingDate: 'March 14, 2027',
  contactPhone: '+63 917 555 0100',
  venues: [
    {
      key: 'ceremony',
      title: 'Ceremony',
      time: '3:30PM',
      venue: ['Santuario de', 'San Antonio Parish'],
      address: ['3117 McKinley Rd, Forbes Park,', 'Makati City'],
    },
    {
      key: 'reception',
      title: 'Reception',
      time: '5:30PM',
      venue: ['Manila Polo Club'],
      address: ['35 McKinley Rd, Forbes Park,', 'Makati City'],
    },
  ],
}

const person = (name, ceremony = true, reception = true) => ({
  name,
  attending_ceremony: ceremony,
  attending_reception: reception,
})

const group = (...people) => ({ email: 'ana@example.com', people })

describe('renderConfirmation', () => {
  test('the subject names the couple so it is findable in a crowded inbox', () => {
    const { subject } = renderConfirmation(group(person('Ana Cruz')), details)

    expect(subject).toContain('Marco & Alessandra')
  })

  test('every person sharing the address is listed by name', () => {
    const { text, html } = renderConfirmation(
      group(person('Ana Cruz'), person('Ben Cruz'), person('Cara Cruz')),
      details,
    )

    for (const name of ['Ana Cruz', 'Ben Cruz', 'Cara Cruz']) {
      expect(text).toContain(name)
      expect(html).toContain(name)
    }
  })

  test('each person shows which events they are attending', () => {
    const { text } = renderConfirmation(
      group(person('Ana Cruz', true, true), person('Ben Cruz', true, false)),
      details,
    )

    expect(text).toMatch(/Ana Cruz[^\n]*Ceremony[^\n]*Reception/)
    expect(text).toMatch(/Ben Cruz[^\n]*Ceremony/)
    expect(text).not.toMatch(/Ben Cruz[^\n]*Reception/)
  })

  test('venue details appear for an event someone in the group is attending', () => {
    const { text } = renderConfirmation(group(person('Ana Cruz', true, false)), details)

    expect(text).toContain('Santuario de')
    expect(text).toContain('3:30PM')
    expect(text).toContain('3117 McKinley Rd, Forbes Park,')
  })

  test('venue details are omitted for an event nobody in the group is attending', () => {
    const { text, html } = renderConfirmation(group(person('Ana Cruz', true, false)), details)

    expect(text).not.toContain('Manila Polo Club')
    expect(html).not.toContain('Manila Polo Club')
  })

  test('the wedding date is included', () => {
    const { text } = renderConfirmation(group(person('Ana Cruz')), details)

    expect(text).toContain('March 14, 2027')
  })

  test('the footer carries the contact number for corrections', () => {
    const { text, html } = renderConfirmation(group(person('Ana Cruz')), details)

    expect(text).toContain('+63 917 555 0100')
    expect(html).toContain('+63 917 555 0100')
  })

  test('a plain text alternative is always produced alongside the html', () => {
    const { text, html } = renderConfirmation(group(person('Ana Cruz')), details)

    expect(text.length).toBeGreaterThan(0)
    expect(text).not.toContain('<')
    expect(html).toContain('<')
  })

  test('a do-not-reply notice sits above everything else', () => {
    const { html, text } = renderConfirmation(group(person('Ana Cruz')), details)

    expect(html).toMatch(/do not reply/i)
    expect(text).toMatch(/do not reply/i)
    // "On top" -- ahead of the couple's name, which opens the letter proper.
    expect(html.search(/do not reply/i)).toBeLessThan(html.indexOf('Marco'))
  })

  test('the notice points at the phone number, since replies go nowhere', () => {
    const { html } = renderConfirmation(group(person('Ana Cruz')), details)

    const notice = html.slice(0, html.search(/Marco/))
    expect(notice).toContain('+63 917 555 0100')
  })

  test('the letter is signed off by the couple', () => {
    const { html, text } = renderConfirmation(group(person('Ana Cruz')), details)

    expect(html).toContain('With love')
    expect(html).toContain('signature.png')
    expect(text).toContain('With love,')
    expect(text.trimEnd().endsWith('Marco & Alessandra')).toBe(true)
  })

  test('the signature image is absolutely addressed, since email has no origin', () => {
    const { html } = renderConfirmation(group(person('Ana Cruz')), details)

    expect(html).toMatch(/src="https:\/\/[^"]*signature\.png"/)
  })

  test('a blocked signature image still reads as the couple', () => {
    const { html } = renderConfirmation(group(person('Ana Cruz')), details)
    const img = html.match(/<img[^>]*signature\.png[^>]*>/)?.[0] ?? ''

    expect(img).toContain('alt="Marco &amp; Alessandra"')
  })

  test('html special characters in a guest name cannot break out into markup', () => {
    const { html } = renderConfirmation(group(person('<script>alert(1)</script>')), details)

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

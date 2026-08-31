/**
 * Build the confirmation email for one recipient address.
 *
 * Everything is inline-styled: email clients strip <style> blocks
 * unpredictably. A plain text alternative always goes out alongside the HTML,
 * which helps deliverability and is what some clients render.
 */

const escape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const attends = (person, key) => Boolean(person[`attending_${key}`])

const eventsFor = (person, venues) => venues.filter((v) => attends(person, v.key))

const oneLine = (lines) => lines.join(' ')

export function renderConfirmation(group, details) {
  const { couple, weddingDate, contactPhone, venues } = details
  const { people } = group

  // Only show details for events somebody at this address is actually coming to.
  const relevantVenues = venues.filter((v) => people.some((p) => attends(p, v.key)))

  const roster = people.map((person) => ({
    name: person.name,
    events: eventsFor(person, venues).map((v) => v.title),
  }))

  const subject = `Your RSVP is confirmed — ${couple}`

  const text = [
    'Your RSVP is confirmed',
    '',
    `${couple} — ${weddingDate}`,
    '',
    'We have you down for:',
    '',
    ...roster.map(
      ({ name, events }) =>
        `  ${name} — ${events.length ? events.join(', ') : 'not attending'}`,
    ),
    '',
    ...relevantVenues.flatMap((v) => [
      v.title,
      `  ${v.time}`,
      `  ${oneLine(v.venue)}`,
      `  ${oneLine(v.address)}`,
      '',
    ]),
    `If anything above is wrong, please call us right away at ${contactPhone}.`,
    '',
    'We cannot wait to celebrate with you.',
  ].join('\n')

  const rosterRows = roster
    .map(
      ({ name, events }) => `
        <tr>
          <td style="padding:6px 12px 6px 0;font-weight:600;">${escape(name)}</td>
          <td style="padding:6px 0;color:#555;">${escape(
            events.length ? events.join(', ') : 'not attending',
          )}</td>
        </tr>`,
    )
    .join('')

  const venueBlocks = relevantVenues
    .map(
      (v) => `
      <div style="margin:0 0 20px;">
        <div style="font-size:15px;font-weight:600;margin-bottom:4px;">${escape(v.title)}</div>
        <div style="color:#555;">${escape(v.time)}</div>
        <div style="color:#555;">${escape(oneLine(v.venue))}</div>
        <div style="color:#555;">${escape(oneLine(v.address))}</div>
      </div>`,
    )
    .join('')

  const html = `
<div style="margin:0;padding:24px;background:#faf8f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px;border-radius:8px;">
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;">Your RSVP is confirmed</h1>
    <p style="margin:0 0 24px;color:#555;">${escape(couple)} &middot; ${escape(weddingDate)}</p>

    <p style="margin:0 0 8px;">We have you down for:</p>
    <table style="border-collapse:collapse;margin:0 0 28px;">${rosterRows}
    </table>

    ${venueBlocks}

    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e8e4de;color:#555;">
      <p style="margin:0 0 8px;">
        If anything above is wrong, please call us right away at
        <strong style="color:#1a1a1a;white-space:nowrap;">${escape(contactPhone)}</strong>.
      </p>
      <p style="margin:0;">We can&rsquo;t wait to celebrate with you.</p>
    </div>
  </div>
</div>`.trim()

  return { subject, html, text }
}

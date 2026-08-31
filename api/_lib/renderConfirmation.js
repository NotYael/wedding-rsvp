/**
 * Build the confirmation email for one recipient address.
 *
 * The layout mirrors the site's card stack -- olive hero, cream details, brown
 * sign-off -- using the same palette and the same type treatments, so the email
 * reads as the same object as the page the guest just filled in.
 *
 * Everything that matters is inline-styled and laid out in tables: email
 * clients strip <style> blocks unpredictably and Outlook's Word engine ignores
 * div padding. The one <style> block carries @font-face only, as progressive
 * enhancement -- clients that honour it (Apple Mail) get the real faces,
 * clients that drop it (Gmail) fall through to the stacks below.
 *
 * A plain text alternative always goes out alongside the HTML, which helps
 * deliverability and is what some clients render.
 */

const OLIVE = '#15221f'
const CREAM = '#e9d6be'
const RUST = '#a24015'
const BROWN = '#3b2515'
const PAGE = '#fbf7f5'

/* Ends in `serif`, not `cursive`, on purpose: bare `cursive` resolves to Comic
   Sans MS on Windows -- the same trap documented in fonts.css. Georgia is a far
   better stand-in for a script face than Comic Sans is. */
const SCRIPT = "'Imperial Script','Snell Roundhand','Apple Chancery',Georgia,serif"
const UI = "Montserrat,'Helvetica Neue',Helvetica,Arial,sans-serif"

const FONT_ORIGIN = 'https://pookiesparty.com/fonts'

const escape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const attends = (person, key) => Boolean(person[`attending_${key}`])

const eventsFor = (person, venues) => venues.filter((v) => attends(person, v.key))

const oneLine = (lines) => lines.join(' ')

/** The uppercase, wide-tracked label used for "When" / "Where" on the site. */
const label = (text, color) =>
  `<p style="margin:0 0 6px;font-family:${UI};font-size:11px;font-weight:400;letter-spacing:1.6px;text-transform:uppercase;color:${color};">${escape(text)}</p>`

const value = (text, color) =>
  `<p style="margin:0;font-family:${UI};font-size:15px;font-weight:400;line-height:1.3;text-transform:uppercase;color:${color};">${escape(text)}</p>`

export function renderConfirmation(group, details) {
  const { couple, weddingDate, contactPhone, venues } = details
  const { people } = group

  // Only show details for events somebody at this address is actually coming to.
  const relevantVenues = venues.filter((v) => people.some((p) => attends(p, v.key)))

  const roster = people.map((person) => ({
    name: person.name,
    events: eventsFor(person, venues).map((v) => v.title),
  }))

  const attendance = ({ events }) => (events.length ? events.join(' + ') : 'Not attending')

  const subject = `Your RSVP is confirmed — ${couple}`

  const text = [
    'This is an automated message. Please do not reply to this email.',
    `If anything below is wrong, call us at ${contactPhone}.`,
    '',
    '----------------------------------------',
    '',
    couple,
    'YOUR RSVP IS CONFIRMED',
    weddingDate,
    '',
    'We have you down for:',
    '',
    ...roster.map((entry) => `  ${entry.name} — ${attendance(entry)}`),
    '',
    ...relevantVenues.flatMap((v) => [
      v.title,
      `  When   ${v.time}`,
      `  Where  ${oneLine(v.venue)}`,
      `         ${oneLine(v.address)}`,
      '',
    ]),
    `If anything above is wrong, please call us right away at ${contactPhone}.`,
    '',
    'We cannot wait to celebrate with you.',
  ].join('\n')

  const rosterRows = roster
    .map(
      (entry) => `
              <tr>
                <td style="padding:0 0 14px;">
                  ${value(entry.name, BROWN)}
                  <p style="margin:2px 0 0;font-family:${UI};font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:${RUST};">${escape(attendance(entry))}</p>
                </td>
              </tr>`,
    )
    .join('')

  const venueBlocks = relevantVenues
    .map(
      (v) => `
              <tr>
                <td style="padding:26px 0 0;">
                  <p style="margin:0 0 10px;font-family:${SCRIPT};font-size:38px;line-height:1.1;color:${OLIVE};">${escape(v.title)}</p>
                  ${label('When', RUST)}
                  ${value(v.time, RUST)}
                  <div style="height:14px;line-height:14px;">&nbsp;</div>
                  ${label('Where', RUST)}
                  ${value(oneLine(v.venue), RUST)}
                  <div style="height:6px;line-height:6px;">&nbsp;</div>
                  ${value(oneLine(v.address), RUST)}
                </td>
              </tr>`,
    )
    .join('')

  const html = `
<style>
  @font-face{font-family:'Imperial Script';font-style:normal;font-weight:400;src:url('${FONT_ORIGIN}/imperial-script-400-latin.woff2') format('woff2');}
  @font-face{font-family:'Montserrat';font-style:normal;font-weight:300 700;src:url('${FONT_ORIGIN}/montserrat-var-latin.woff2') format('woff2');}
</style>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PAGE};margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:20px 12px 32px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;">

        <!-- do-not-reply notice, above the letter proper -->
        <tr>
          <td style="padding:0 6px 14px;font-family:${UI};font-size:10px;line-height:1.5;letter-spacing:1.1px;text-transform:uppercase;color:#8a7f78;">
            This is an automated message &mdash; please do not reply.<br />
            If anything below is wrong, call us at <span style="color:${RUST};white-space:nowrap;">${escape(contactPhone)}</span>.
          </td>
        </tr>

        <!-- hero: olive card, cream type, exactly as the site opens -->
        <tr>
          <td align="center" style="background:${OLIVE};padding:44px 28px 40px;">
            <p style="margin:0;font-family:${SCRIPT};font-size:54px;line-height:1.05;color:${CREAM};">${escape(couple)}</p>
            <p style="margin:18px 0 0;font-family:${UI};font-size:12px;font-weight:400;letter-spacing:2.4px;text-transform:uppercase;color:${CREAM};">Your RSVP is confirmed</p>
            <p style="margin:10px 0 0;font-family:${UI};font-size:12px;font-weight:400;letter-spacing:2.4px;text-transform:uppercase;color:${CREAM};">${escape(weddingDate)}</p>
          </td>
        </tr>

        <!-- details: cream card, rust type -->
        <tr>
          <td style="background:${CREAM};padding:36px 32px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:0 0 18px;">
                  ${label('We have you down for', RUST)}
                </td>
              </tr>
              ${rosterRows}
              ${venueBlocks}
            </table>
          </td>
        </tr>

        <!-- sign-off: brown card, cream type -->
        <tr>
          <td style="background:${BROWN};padding:30px 32px 34px;">
            <p style="margin:0 0 10px;font-family:${UI};font-size:13px;line-height:1.6;color:${CREAM};">
              If anything above is wrong, please call us right away at
              <strong style="white-space:nowrap;">${escape(contactPhone)}</strong>.
            </p>
            <p style="margin:0;font-family:${UI};font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:${CREAM};opacity:0.75;">We can&rsquo;t wait to celebrate with you</p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>`.trim()

  return { subject, html, text }
}

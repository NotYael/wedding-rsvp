import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const HEADERS = ['Party #', 'Name', 'Role', 'Email', 'Phone', 'Dietary Restrictions', 'Submitted']

function buildRows(parties) {
  return parties.flatMap((party, partyIndex) =>
    party.members.map((guest) => [
      String(partyIndex + 1),
      guest.name,
      guest.is_primary ? 'Primary' : 'Attendee',
      guest.email,
      guest.phone,
      guest.dietary_restrictions || '',
      new Date(guest.created_at).toLocaleString(),
    ]),
  )
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10)
}

/* Both exports take whatever the table is currently showing, so a filtered file
   and a full one would otherwise land in the downloads folder under the same
   name on the same day. */
function fileStem(filterNote) {
  return `guest-list${filterNote ? '-filtered' : ''}-${dateStamp()}`
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function escapeCsvValue(value) {
  let str = String(value ?? '')
  // Neutralize formula injection: a leading =, +, -, @, tab, or CR makes
  // Excel/Sheets interpret the cell as a formula when the file is opened.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function downloadGuestsAsCsv(parties, filterNote) {
  const lines = [HEADERS, ...buildRows(parties)].map((row) => row.map(escapeCsvValue).join(','))

  /* The note lands in A1 with a blank row under it, so the file opens saying
     what it contains while the column heads still start their own contiguous
     block for anything re-importing it. */
  if (filterNote) {
    lines.unshift(escapeCsvValue(`Filtered to: ${filterNote}`), '')
  }

  downloadBlob(lines.join('\n'), `${fileStem(filterNote)}.csv`, 'text/csv;charset=utf-8;')
}

export function downloadGuestsAsPdf(parties, filterNote) {
  const doc = new jsPDF()
  doc.text('Guest List', 14, 16)

  let startY = 22
  if (filterNote) {
    doc.setFontSize(10)
    // Wrapped to the printable width; a few filters at once outrun one line.
    const noteLines = doc.splitTextToSize(`Filtered to: ${filterNote}`, 180)
    doc.text(noteLines, 14, 23)
    doc.setFontSize(16)
    startY = 23 + noteLines.length * 5 + 3
  }

  autoTable(doc, { startY, head: [HEADERS], body: buildRows(parties) })
  doc.save(`${fileStem(filterNote)}.pdf`)
}

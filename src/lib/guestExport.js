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

export function downloadGuestsAsCsv(parties) {
  const rows = buildRows(parties)
  const csv = [HEADERS, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n')
  downloadBlob(csv, `guest-list-${dateStamp()}.csv`, 'text/csv;charset=utf-8;')
}

export function downloadGuestsAsPdf(parties) {
  const rows = buildRows(parties)
  const doc = new jsPDF()
  doc.text('Guest List', 14, 16)
  autoTable(doc, { startY: 22, head: [HEADERS], body: rows })
  doc.save(`guest-list-${dateStamp()}.pdf`)
}

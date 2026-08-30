import { StackCard } from './StackCard'

/* Listed in reading order: down the left column first, then down the right.
   The two columns are rendered as separate stacks (see below), so this order
   is also the DOM order a screen reader follows. */
const FAQS = [
  {
    q: 'Can I bring a plus one?',
    a: 'We kindly ask that only guests who have been invited attend.',
  },
  {
    q: 'Are children invited?',
    a: 'We love your little ones, but we have only invited selected children from family to attend.',
  },
  {
    q: 'What gifts do you prefer?',
    a: 'Your love and presence are more than enough.',
  },
  {
    q: "What happens if I can't attend after submitting my RSVP?",
    a: 'Please let us know as soon as possible so we can update our records.',
  },
  {
    q: 'Who can I contact if I have questions?',
    // PLACEHOLDER — the mock leaves this blank; drop in the coordinator's contact.
    a: 'Please reach out to our wedding coordinator at ________.',
  },
  {
    q: 'Can dietary restrictions be accommodated?',
    a: "Please fill out the dietary restriction field in the RSVP form and we'll do our best to accommodate your needs.",
  },
]

/* Each column is its own stack rather than one grid filling row by row. In a
   grid the two items sharing a row are tied together, so opening a question on
   the left grows that row and pushes the right-hand column down with it. Split
   this way, an open answer only ever moves the questions beneath it. */
const SPLIT = Math.ceil(FAQS.length / 2)
const FAQ_COLUMNS = [FAQS.slice(0, SPLIT), FAQS.slice(SPLIT)]

export function FaqsCard() {
  return (
    <StackCard id="faqs" className="faqs-card stack-card--tall">
      <div className="stack-card-body">
        <h2 id="faqs-heading" className="card-heading">
          Frequently Asked Questions
        </h2>

        <div className="faq-list">
          {FAQ_COLUMNS.map((column) => (
            <div className="faq-column" key={column[0].q}>
              {column.map((faq) => (
                <details className="faq-item" key={faq.q}>
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          ))}
        </div>
      </div>
    </StackCard>
  )
}

import { CONTACT_PHONE } from '../../lib/eventDetails'
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
    // Answers are rendered as-is, so a node is fine where one needs links. An
    // array is one paragraph per entry.
    a: [
      'Your presence and well wishes are more than enough.',
      'Should you wish to bless us with a gift, a monetary contribution toward our future adventures, travels, wine collection, and life together would be sincerely appreciated.',
      <>
        For those who prefer a traditional gift, we have also prepared a registry at Rustan’s (Code:{' '}
        <u>054438</u>).
      </>,
    ],
  },
  {
    q: "What happens if I can't attend after submitting my RSVP?",
    a: 'Please let us know as soon as possible so we can update our records.',
  },
  {
    q: 'Who can I contact if I have questions?',
    a: (
      <>
        Please message Alix at{' '}
        <u>{CONTACT_PHONE}</u>.
      </>
    ),
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
                  {[faq.a].flat().map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </details>
              ))}
            </div>
          ))}
        </div>
      </div>
    </StackCard>
  )
}

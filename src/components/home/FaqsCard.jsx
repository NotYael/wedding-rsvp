import { Link } from 'react-router-dom'
import { StackCard } from './StackCard'

// PLACEHOLDER COPY — swap for the real questions.
const FAQS = [
  {
    q: 'Can I bring a plus one?',
    a: 'Our venue has a limited capacity, so we can only accommodate the guests named on your invitation. Please add each of them in the RSVP section above.',
  },
  {
    q: 'Are children invited?',
    a: 'We adore your little ones, but this is an adults-only celebration. We hope this gives you an evening off.',
  },
  {
    q: 'Is there parking at the venue?',
    a: 'Yes — valet parking is available at both the church and the reception, and a shuttle runs between them.',
  },
  {
    q: 'What if I have a dietary restriction?',
    a: 'Add it in the dietary field when you RSVP and the kitchen will take care of it.',
  },
  {
    q: 'When should I RSVP by?',
    a: 'Please respond by 1 May 2027 so we can finalise numbers with the venue.',
  },
]

export function FaqsCard() {
  return (
    <StackCard id="faqs">
      <div className="stack-card-body">
        <h2 id="faqs-heading" className="card-heading">
          FAQs
        </h2>

        <div className="faq-list">
          {FAQS.map((faq) => (
            <details className="faq-item" key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>

        <div className="card-footer-links">
          <Link to="/registry">Wedding Registry</Link>
        </div>
      </div>
    </StackCard>
  )
}

import { StackCard } from './StackCard'

const GROUPS = [
  { slug: 'gentlemen', label: 'Gentlemen', lines: ['Barong Tagalog with', 'black pants'] },
  {
    slug: 'ladies',
    label: 'Ladies',
    lines: ['Long gowns in any color.', 'No black & white dresses.'],
  },
]

export function AttireCard() {
  return (
    <StackCard id="attire" className="attire-card">
      <div className="attire-row">
        <div className="attire-figures">
          <img className="attire-art" src="/outfit-man.svg" alt="" width="186" height="525" />
          <img className="attire-art" src="/outfit-woman.svg" alt="" width="180" height="525" />
        </div>

        <div className="attire-text">
          <h2 id="attire-heading" className="attire-title">
            Dress Code
          </h2>

          {GROUPS.map((group) => (
            <div className={`attire-group attire-group--${group.slug}`} key={group.slug}>
              <p className="attire-group-label">{group.label}</p>
              <p className="attire-group-value">
                {group.lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </StackCard>
  )
}

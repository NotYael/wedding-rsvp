/**
 * One card in the home page stack.
 *
 * Cards are direct siblings inside .home-stack, each sticky at top:0. A sticky
 * element can only travel inside its own parent's box, so they must share one
 * tall parent -- that is what lets card N stay pinned while card N+1 scrolls up
 * and covers it.
 *
 * The snap point is a zero-height marker in front of the card rather than the
 * card itself. A sticky element's snap area is measured after it has been
 * stuck, so a pinned card's snap point rides along with the scroll position and
 * the browser never lets you leave it. The marker stays in normal flow at the
 * card's layout position, which is the position we actually want to snap to.
 */
export function StackCard({ id, className = '', children }) {
  return (
    <>
      <span className="snap-point" aria-hidden="true" />
      <section id={id} className={`stack-card ${className}`.trim()} aria-labelledby={`${id}-heading`}>
        <div className="stack-card-inner">{children}</div>
      </section>
    </>
  )
}

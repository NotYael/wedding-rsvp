/**
 * One card in the home page stack.
 *
 * Cards are direct siblings inside .home-stack, each sticky at top:0. A sticky
 * element can only travel inside its own parent's box, so they must share one
 * tall parent -- that is what lets card N stay pinned while card N+1 scrolls up
 * and covers it.
 *
 * A pinned card sits at the top of the viewport, so it reports a bounding rect
 * of top:0 no matter how far down the page has scrolled. Anything that needs a
 * card's real position on the page has to read `offsetTop` instead; see
 * GuestNav.jsx, which does exactly that for both the nav jumps and the
 * active-link highlight.
 */
export function StackCard({ id, className = '', children }) {
  return (
    <section id={id} className={`stack-card ${className}`.trim()} aria-labelledby={`${id}-heading`}>
      <div className="stack-card-inner">{children}</div>
    </section>
  )
}

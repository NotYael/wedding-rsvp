import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const HOME_SECTIONS = [
  { id: 'details', label: 'Details' },
  { id: 'attire', label: 'Attire' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'faqs', label: 'FAQs' },
]

const TRACKED_IDS = ['hero', ...HOME_SECTIONS.map((section) => section.id)]

// Matches the breakpoint in home.css where the links give way to the burger.
// Kept as one string so the two cannot drift apart.
const MOBILE_QUERY = '(max-width: 640px)'

/* Where a card sits in the document, which is NOT what it will tell you while
   it is pinned.

   The cards are sticky, and a card the reader has scrolled past is pinned at
   the top of the viewport. Both of the ways to ask a card where it is report
   that pinned position, not its place in the page: getBoundingClientRect gives
   top:0, and offsetTop gives window.scrollY. Every backwards jump therefore
   computed a target equal to the position we were already at and moved nothing
   -- go to the FAQs, press Details, and the page just sat there. It is not
   recoverable arithmetic either; the reported value is clamped to a constant,
   so there is no pinning offset left to subtract back out.

   Switching sticky off for the length of the measurement is what makes the
   answer honest. Sticky is a paint-time offset and contributes no geometry, so
   the class below moves nothing -- and because we never yield between adding
   and removing it, no frame is ever painted in the measuring state.

   Reading offsetTop is what forces the layout the class change just
   invalidated, so it has to happen between the two, not after. Only the sticky
   cards were ever affected: RSVP and FAQs opt out via `stack-card--tall`, which
   is why those two links worked and the rest did not. */
const sectionTop = (target) => {
  const stack = target.closest('.home-stack')
  stack?.classList.add('is-measuring')
  const top = target.offsetTop
  stack?.classList.remove('is-measuring')
  return top
}

const scrollToSection = (id) => {
  const target = document.getElementById(id)
  if (!target) return

  // Smooth is requested per call rather than via a global `scroll-behavior`, so
  // it applies to nav clicks only and not to anchor jumps or any other
  // programmatic scroll. Readers who ask for reduced motion get an instant jump.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: sectionTop(target), behavior: reducedMotion ? 'auto' : 'smooth' })
}

export function GuestNav({ onLogout }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [activeId, setActiveId] = useState('hero')
  const [menuOpen, setMenuOpen] = useState(false)
  /* The section to jump to once the menu has closed. Scrolling straight from
     the click would fire while the page is still locked and covered. A ref
     rather than state: it is read by the effect that closes out the gesture,
     never rendered, and clearing it must not cost a second render. */
  const pendingScrollRef = useRef(null)
  const toggleRef = useRef(null)

  useEffect(() => {
    if (!isHome) return undefined

    // Not IntersectionObserver: a pinned card still counts as fully on screen
    // long after the next one has covered it, so observed visibility says
    // nothing about which card the reader is looking at.
    //
    // This reads the raw offsetTop, deliberately -- do NOT route it through
    // sectionTop(). It WANTS the pinned value. A pinned card reports scrollY,
    // which always clears the probe, while a card not yet reached reports its
    // real position and fails it; taking the last id to pass in document order
    // therefore lands on the topmost pinned card, which is the one on screen.
    // Measuring honestly here would also mean forcing a layout every frame of
    // every scroll, for an answer that is already correct.
    let frame = 0

    const update = () => {
      frame = 0
      const probe = window.scrollY + 2
      let current = TRACKED_IDS[0]
      TRACKED_IDS.forEach((id) => {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= probe) current = id
      })
      setActiveId(current)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [isHome])

  /* The page behind the sheet must not scroll. html is the scroller, not body,
     so the lock has to go on the document element. */
  useEffect(() => {
    if (!menuOpen) return undefined
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [menuOpen])

  /* Escape closes, and focus goes back to the burger it came from. */
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      toggleRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  /* Rotating to landscape or dragging a desktop window narrow-to-wide takes the
     burger away with the media query. Without this the sheet would stay over
     the page with nothing left on screen to close it. */
  useEffect(() => {
    if (!menuOpen) return undefined
    const query = window.matchMedia(MOBILE_QUERY)
    const onChange = () => {
      if (!query.matches) setMenuOpen(false)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [menuOpen])

  /* Effect cleanups all run before effect bodies within a commit, so the scroll
     lock above is already lifted by the time this fires. */
  useEffect(() => {
    if (menuOpen) return
    const id = pendingScrollRef.current
    if (!id) return
    pendingScrollRef.current = null
    scrollToSection(id)
  }, [menuOpen])

  const handleBrandClick = useCallback(() => scrollToSection('hero'), [])

  const handleSectionClick = useCallback((id) => {
    pendingScrollRef.current = id
    setMenuOpen(false)
  }, [])

  return (
    <>
      <nav className="guest-nav">
        {isHome ? (
          <button type="button" className="guest-nav-brand" onClick={handleBrandClick}>
            Marco &amp; Alessandra
          </button>
        ) : (
          <Link to="/" className="guest-nav-brand">
            Marco &amp; Alessandra
          </Link>
        )}

        <div className="guest-nav-links">
          {isHome &&
            HOME_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className="guest-nav-link"
                aria-current={activeId === section.id}
                onClick={() => scrollToSection(section.id)}
              >
                {section.label}
              </button>
            ))}

          <button type="button" className="guest-nav-link" onClick={onLogout}>
            Log out
          </button>
        </div>

        {/* A disclosure rather than a dialog: `aria-modal` would hide everything
            outside the sheet, and this button -- the only way to close it --
            sits outside, on top of the sheet in the bar. */}
        <button
          type="button"
          ref={toggleRef}
          className="guest-nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="guest-nav-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="guest-nav-toggle-bars" aria-hidden="true">
            <span className="guest-nav-toggle-bar" />
            <span className="guest-nav-toggle-bar" />
            <span className="guest-nav-toggle-bar" />
          </span>
          <span className="visually-hidden">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
      </nav>

      {menuOpen && (
        <div id="guest-nav-menu" className="guest-nav-menu">
          <div className="guest-nav-menu-links">
            {isHome &&
              HOME_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className="guest-nav-menu-link"
                  aria-current={activeId === section.id}
                  onClick={() => handleSectionClick(section.id)}
                >
                  {section.label}
                </button>
              ))}
          </div>

          <button
            type="button"
            className="guest-nav-menu-logout"
            onClick={() => {
              setMenuOpen(false)
              onLogout()
            }}
          >
            Log out
          </button>
        </div>
      )}
    </>
  )
}

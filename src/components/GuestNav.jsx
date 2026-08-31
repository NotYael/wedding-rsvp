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

const scrollToSection = (id) => {
  const target = document.getElementById(id)
  if (!target) return

  // offsetTop, not scrollIntoView. The cards are sticky, so a pinned one sits at
  // the top of the viewport and reports a rect of top:0 however far down the
  // page we are -- scrollIntoView then decides it is already in place and does
  // nothing, which killed every backwards jump. offsetTop is the card's layout
  // position, unaffected by pinning, and it is document-relative here because
  // body has no margin and nothing between it and the cards is positioned. The
  // active-link effect below measures the same way, so the two agree.
  //
  // Smooth is requested per call rather than via a global `scroll-behavior`, so
  // it applies to nav clicks only and not to anchor jumps or any other
  // programmatic scroll. Readers who ask for reduced motion get an instant jump.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: target.offsetTop, behavior: reducedMotion ? 'auto' : 'smooth' })
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

    // The topmost card is whichever one's layout position has passed the top of
    // the window. offsetTop is used rather than IntersectionObserver because the
    // cards are sticky: a pinned card still counts as fully on screen even once
    // the next one has covered it, so observed visibility is meaningless here.
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

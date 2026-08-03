import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const HOME_SECTIONS = [
  { id: 'details', label: 'Details' },
  { id: 'attire', label: 'Attire' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'faqs', label: 'FAQs' },
]

const TRACKED_IDS = ['hero', ...HOME_SECTIONS.map((section) => section.id)]

const scrollToSection = (id) => {
  const target = document.getElementById(id)
  if (!target) return

  // Smooth is requested per call rather than via a global `scroll-behavior`,
  // so it applies to nav clicks only and never to the browser's own snap
  // adjustments. Readers who ask for reduced motion get an instant jump.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
}

export function GuestNav({ onLogout }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [activeId, setActiveId] = useState('hero')

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

  const handleBrandClick = useCallback(() => scrollToSection('hero'), [])

  return (
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
    </nav>
  )
}

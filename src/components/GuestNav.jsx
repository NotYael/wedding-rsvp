import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`

export function GuestNav({ onLogout }) {
  return (
    <nav className="site-nav">
      <div className="site-nav-links">
        <NavLink to="/" end className={linkClass}>
          RSVP
        </NavLink>
        <NavLink to="/registry" className={linkClass}>
          Gift Registry
        </NavLink>
        <NavLink to="/details" className={linkClass}>
          Wedding Details &amp; FAQs
        </NavLink>
        <NavLink to="/trip" className={linkClass}>
          Trip
        </NavLink>
      </div>
      <button className="log-out-button" onClick={onLogout}>
        Log out
      </button>
    </nav>
  )
}

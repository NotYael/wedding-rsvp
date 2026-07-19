import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`

export function AdminNav({ onLogout }) {
  return (
    <nav className="site-nav">
      <div className="site-nav-links">
        <NavLink to="/admin" end className={linkClass}>
          Guest List
        </NavLink>
        <NavLink to="/admin/registry" className={linkClass}>
          Gift Registry
        </NavLink>
        <NavLink to="/admin/details" className={linkClass}>
          Wedding Details &amp; FAQs
        </NavLink>
        <NavLink to="/admin/trip" className={linkClass}>
          Trip
        </NavLink>
      </div>
      <button className="log-out-button" onClick={onLogout}>
        Log out
      </button>
    </nav>
  )
}

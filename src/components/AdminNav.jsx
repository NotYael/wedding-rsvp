import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`

export function AdminNav({ onLogout }) {
  return (
    <nav className="site-nav">
      <div className="site-nav-links">
        <NavLink to="/admin" end className={linkClass}>
          Guest List
        </NavLink>
      </div>
      <button className="log-out-button" onClick={onLogout}>
        Log out
      </button>
    </nav>
  )
}

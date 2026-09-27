import { Outlet, useLocation } from 'react-router-dom'
import { GuestNav } from '../components/GuestNav'
import '../styles/home.css'

export function GuestLayout() {
  const { pathname } = useLocation()

  // The home page is a full-bleed scrolling stack that renders its own
  // <main>, so it skips the padded, centred app-shell the other pages use.
  const isHome = pathname === '/'

  return (
    <>
      <GuestNav />
      {isHome ? (
        <Outlet />
      ) : (
        <main className="app-shell guest-page">
          <Outlet />
        </main>
      )}
    </>
  )
}

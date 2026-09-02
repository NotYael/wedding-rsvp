import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { GuestLayout } from './pages/GuestLayout'
import { HomePage } from './pages/HomePage'
import { AdminLayout } from './pages/AdminLayout'
import { AdminGuestListPage } from './pages/AdminGuestListPage'
import { AdminEmailLogPage } from './pages/AdminEmailLogPage'
import { LoadingScreen } from './components/LoadingScreen'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestLayout />}>
            <Route index element={<HomePage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminGuestListPage />} />
            <Route path="emails" element={<AdminEmailLogPage />} />
          </Route>
          {/* TODO: temporary preview of the RoleGate wait state -- remove. */}
          <Route path="/loading" element={<LoadingScreen />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

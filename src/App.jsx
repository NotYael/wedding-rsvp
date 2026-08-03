import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { GuestLayout } from './pages/GuestLayout'
import { HomePage } from './pages/HomePage'
import { RegistryPage } from './pages/RegistryPage'
import { AdminLayout } from './pages/AdminLayout'
import { AdminGuestListPage } from './pages/AdminGuestListPage'
import { AdminRegistryPage } from './pages/AdminRegistryPage'
import { AdminDetailsPage } from './pages/AdminDetailsPage'
import { AdminTripPage } from './pages/AdminTripPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestLayout />}>
            <Route index element={<HomePage />} />
            <Route path="registry" element={<RegistryPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminGuestListPage />} />
            <Route path="registry" element={<AdminRegistryPage />} />
            <Route path="trip" element={<AdminTripPage />} />
            <Route path="details" element={<AdminDetailsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { GuestLayout } from './pages/GuestLayout'
import { RsvpPage } from './pages/RsvpPage'
import { RegistryPage } from './pages/RegistryPage'
import { DetailsPage } from './pages/DetailsPage'
import { TripPage } from './pages/TripPage'
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
            <Route index element={<RsvpPage />} />
            <Route path="registry" element={<RegistryPage />} />
            <Route path="trip" element={<TripPage />} />
            <Route path="details" element={<DetailsPage />} />
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

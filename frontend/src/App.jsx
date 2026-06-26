import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Alertas from './pages/Alertas'
import AntenaRFID from './pages/AntenaRFID'
import EventosQR from './pages/EventosQR'
import Users from './pages/Users'
import UserForm from './pages/UserForm'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="eventos-qr" element={<EventosQR />} />
            <Route path="antena-rfid" element={<AntenaRFID />} />
            <Route path="alertas" element={<Alertas />} />
            <Route
              path="usuarios"
              element={
                <ProtectedRoute adminOnly>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="usuarios/nuevo"
              element={
                <ProtectedRoute adminOnly>
                  <UserForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="usuarios/:id/editar"
              element={
                <ProtectedRoute adminOnly>
                  <UserForm />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

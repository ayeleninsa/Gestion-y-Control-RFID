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
import Alumnos from './pages/Alumnos'
import AlumnoForm from './pages/AlumnoForm'
import Computadoras from './pages/Computadoras'
import ComputadoraForm from './pages/ComputadoraForm'
import Carreras from './pages/Carreras'
import CarreraForm from './pages/CarreraForm'
import RegistrosQR from './pages/RegistrosQR'

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
            <Route path="registros-qr" element={<RegistrosQR />} />
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
            <Route
              path="alumnos"
              element={
                <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
                  <Alumnos />
                </ProtectedRoute>
              }
            />
            <Route
              path="alumnos/nuevo"
              element={
                <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
                  <AlumnoForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="alumnos/:id/editar"
              element={
                <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
                  <AlumnoForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="computadoras"
              element={
                <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
                  <Computadoras />
                </ProtectedRoute>
              }
            />
            <Route
              path="computadoras/nueva"
              element={
                <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
                  <ComputadoraForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="computadoras/:id/editar"
              element={
                <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
                  <ComputadoraForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="carreras"
              element={
                <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
                  <Carreras />
                </ProtectedRoute>
              }
            />
            <Route
              path="carreras/nueva"
              element={
                <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
                  <CarreraForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="carreras/:id/editar"
              element={
                <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
                  <CarreraForm />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

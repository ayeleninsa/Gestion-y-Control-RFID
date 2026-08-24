import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMiPerfil } from '../services/alumnos'
import { cambiarContrasena } from '../services/auth'
import {
  Home,
  LogOut,
  Lock,
  Laptop,
  GraduationCap,
  IdCard,
  Mail,
  Calendar,
  KeyRound,
  X,
  CheckCircle2,
  Menu,
} from 'lucide-react'

function EstadoBadge({ estado }) {
  if (!estado) return null
  const styles = {
    DISPONIBLE: 'bg-[#24c48a]/15 text-[#006143]',
    EN_USO: 'bg-amber-100 text-amber-800',
    en_reparacion: 'bg-red-100 text-red-700',
    default: 'bg-slate-100 text-slate-700',
  }
  const cls = styles[estado] || styles.default
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {estado.replace('_', ' ')}
    </span>
  )
}

function Dato({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start space-x-2 text-slate-300">
      <Icon className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function AlumnoLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  const [showPw, setShowPw] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', nueva: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const loadPerfil = async () => {
    try {
      setLoading(true)
      const data = await getMiPerfil()
      setPerfil(data)
    } catch (err) {
      if (err.response?.status === 401) {
        logout()
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPerfil()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initials = (() => {
    const n = perfil?.nombre || user?.username || 'A'
    const a = perfil?.apellido || ''
    return (n.charAt(0) + a.charAt(0)).toUpperCase()
  })()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleChangePw = async (e) => {
    e.preventDefault()
    setPwMsg('')
    setPwError('')
    if (pwForm.nueva !== pwForm.confirm) {
      setPwError('Las nuevas contrasenas no coinciden')
      return
    }
    setPwLoading(true)
    try {
      await cambiarContrasena(pwForm.current, pwForm.nueva)
      setPwMsg('Contrasena actualizada correctamente')
      setPwForm({ current: '', nueva: '', confirm: '' })
    } catch (err) {
      setPwError(err.response?.data?.detail || 'No se pudo cambiar la contrasena')
    } finally {
      setPwLoading(false)
    }
  }

  const pc = perfil?.computadora
  const active = location.pathname === '/alumno'

  const sidebarBody = (
    <>
      <div className="p-6 text-center border-b border-emerald-900/30">
        <div className="flex justify-center mb-3">
          <div className="w-20 h-20 border-2 border-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-3xl font-light tracking-tighter">
              I<span className="text-emerald-400">P</span>F
            </span>
          </div>
        </div>
        <h1 className="text-xs font-bold tracking-widest uppercase">Instituto Politecnico Formosa</h1>
      </div>

      {/* Perfil */}
        <div className="p-5 border-b border-emerald-900/30">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-semibold">Mi perfil</p>

          {loading ? (
            <p className="text-slate-400 text-sm">Cargando perfil...</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold truncate">{perfil?.nombre} {perfil?.apellido}</p>
                  <p className="text-xs text-emerald-400">Alumno</p>
                </div>
              </div>
              <Dato icon={IdCard} label="DNI" value={perfil?.dni} />
              <Dato icon={Mail} label="Correo" value={perfil?.correo} />
              <Dato icon={GraduationCap} label="Carrera" value={perfil?.carrera_nombre} />
              <Dato icon={Calendar} label="Año en curso" value={perfil?.anio_en_curso} />
              <div className="pt-1">
                <div className="flex items-start space-x-2 text-slate-300">
                  <Laptop className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Computadora asignada</p>
                    {pc ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-white truncate">{pc.modelo}</p>
                        <p className="text-xs text-slate-400">{pc.tag_rfid}</p>
                        <EstadoBadge estado={pc.estado} />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Sin asignar</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link
            to="/alumno"
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              active ? 'bg-emerald-800/40 text-white border-l-4 border-emerald-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span>Inicio</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowPw(true)}
            className="flex items-center space-x-3 p-3 rounded-lg transition-colors text-slate-400 hover:text-white w-full"
          >
            <Lock className="w-5 h-5 shrink-0" />
            <span>Cambiar contrasena</span>
          </button>
        </nav>

        <div className="p-4 border-t border-emerald-900/30">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-slate-400 hover:text-white p-2 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesion</span>
          </button>
        </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 bg-[#0a1a14] text-white flex items-center justify-between px-4 h-14 shadow-lg">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="p-2 -ml-2 text-slate-300 hover:text-white"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-light tracking-tighter">
            I<span className="text-emerald-400">P</span>F SmartTrack
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-80 bg-[#0a1a14] text-white flex-col h-full overflow-y-auto shrink-0">
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-[#0a1a14] text-white flex flex-col overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-emerald-900/30">
              <span className="text-sm font-bold tracking-widest uppercase">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
                aria-label="Cerrar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarBody}
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-20 lg:pt-8">
        <Outlet />
      </main>

      {/* Modal cambio de contraseña */}
      {showPw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-[#006143]" />
                <h2 className="text-lg font-bold text-slate-800">Cambiar contrasena</h2>
              </div>
              <button type="button" onClick={() => { setShowPw(false); setPwMsg(''); setPwError('') }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {pwMsg && (
              <div className="mb-4 flex items-center space-x-2 p-3 bg-[#24c48a]/10 text-[#006143] rounded-lg">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-sm">{pwMsg}</span>
              </div>
            )}
            {pwError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{pwError}</div>}

            <form onSubmit={handleChangePw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contrasena actual</label>
                <input
                  type="password"
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contrasena</label>
                <input
                  type="password"
                  value={pwForm.nueva}
                  onChange={(e) => setPwForm({ ...pwForm, nueva: e.target.value })}
                  required
                  minLength={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nueva contrasena</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPw(false); setPwMsg(''); setPwError('') }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="px-4 py-2 bg-[#006143] text-white rounded-lg hover:bg-[#004d35] disabled:opacity-50"
                >
                  {pwLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

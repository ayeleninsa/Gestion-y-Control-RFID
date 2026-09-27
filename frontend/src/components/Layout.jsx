import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  ClipboardList,
  Laptop,
  Users,
  UserCheck,
  Radio,
  Activity,
  BellRing,
  QrCode,
  LogOut,
  ChevronDown,
  Menu,
  X,
  HandCoins,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'preceptor'] },
  { label: 'Usuarios', path: '/usuarios', icon: Users, roles: ['admin', 'preceptor'] },
  { label: 'Carreras', path: '/carreras', icon: ClipboardList, roles: ['admin', 'preceptor'] },
  { label: 'Alumnos', path: '/alumnos', icon: UserCheck, roles: ['admin', 'preceptor'] },
  { label: 'Computadoras', path: '/computadoras', icon: Laptop, roles: ['admin', 'preceptor'] },
  { label: 'Prestamos', path: '/prestamos', icon: HandCoins, roles: ['admin', 'preceptor'] },
  { label: 'Eventos QR', path: '/eventos-qr', icon: Radio, roles: ['admin', 'preceptor'] },
  { label: 'Registros QR', path: '/registros-qr', icon: QrCode, roles: ['admin', 'preceptor'] },
  { label: 'Antena RFID', path: '/antena-rfid', icon: Activity, roles: ['admin', 'preceptor'] },
  { label: 'Alertas', path: '/alertas', icon: BellRing, roles: ['admin', 'preceptor'] },
]

function Brand() {
  return (
    <div className="p-6 text-center border-b border-emerald-900/30">
      <div className="mb-4 flex justify-center">
        <div className="w-20 h-20 border-2 border-emerald-500 rounded-lg flex items-center justify-center p-1">
          <div className="text-center">
            <span className="text-2xl font-light tracking-tighter text-white">
              I<span className="text-emerald-400">P</span>F
            </span>
            <div className="text-[5px] tracking-[0.2em] text-center mt-1 text-emerald-400">*********</div>
          </div>
        </div>
      </div>
      <h1 className="text-xs font-bold tracking-widest uppercase">Instituto Politecnico Formosa</h1>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const nav = navItems.filter((item) => item.roles.includes(user?.rol))

  const navLinks = (
    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      {nav.map((item) => {
        const Icon = item.icon
        const active = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              active
                ? 'bg-emerald-800/40 text-white border-l-4 border-emerald-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  const footer = (
    <div className="p-4 border-t border-emerald-900/30">
      <div className="flex items-center space-x-3 p-2 bg-emerald-900/20 rounded-xl mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{user?.username}</p>
          <p className="text-[10px] text-slate-400 capitalize">{user?.rol}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
      </div>
      <button
        onClick={logout}
        className="flex items-center space-x-3 text-slate-400 hover:text-white p-2 transition-colors w-full"
      >
        <LogOut className="w-5 h-5 shrink-0" />
        <span>Cerrar sesion</span>
      </button>
    </div>
  )

  const sidebarBody = (
    <>
      {navLinks}
      {footer}
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
          {user?.username?.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0a1a14] text-white flex-col h-full overflow-y-auto">
        <Brand />
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0a1a14] text-white flex flex-col shadow-2xl">
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
    </div>
  )
}

import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  ClipboardList,
  RefreshCw,
  Laptop,
  Users,
  UserCheck,
  Radio,
  Activity,
  BellRing,
  FileBarChart,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  Calendar,
  QrCode,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'preceptor'] },
  { label: 'Usuarios', path: '/usuarios', icon: Users, roles: ['admin'] },
  { label: 'Carreras', path: '/carreras', icon: ClipboardList, roles: ['admin', 'preceptor'] },
  { label: 'Alumnos', path: '/alumnos', icon: UserCheck, roles: ['admin', 'preceptor'] },
  { label: 'Computadoras', path: '/computadoras', icon: Laptop, roles: ['admin', 'preceptor'] },
  { label: 'Eventos QR', path: '/eventos-qr', icon: Radio, roles: ['admin', 'preceptor'] },
  { label: 'Registros QR', path: '/registros-qr', icon: QrCode, roles: ['admin', 'preceptor'] },
  { label: 'Antena RFID', path: '/antena-rfid', icon: Activity, roles: ['admin', 'preceptor'] },
  { label: 'Alertas', path: '/alertas', icon: BellRing, roles: ['admin', 'preceptor'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      <aside className="w-64 bg-[#0a1a14] text-white flex flex-col h-full overflow-y-auto">
        <div className="p-6 text-center border-b border-emerald-900/30">
          <div className="mb-4 flex justify-center">
            <div className="w-24 h-24 border-2 border-emerald-500 rounded-lg flex items-center justify-center p-2">
              <div className="text-center">
                <span className="text-3xl font-light tracking-tighter text-white">
                  I<span className="text-emerald-400">P</span>F
                </span>
                <div className="text-[5px] tracking-[0.2em] text-center mt-1 text-emerald-400">*********</div>
              </div>
            </div>
          </div>
          <h1 className="text-xs font-bold tracking-widest uppercase">Instituto Politecnico Formosa</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems
            .filter((item) => item.roles.includes(user?.rol))
            .map((item) => {
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

        <div className="p-4 border-t border-emerald-900/30">
          <div className="flex items-center space-x-3 p-2 bg-emerald-900/20 rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white text-sm font-bold">
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
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}

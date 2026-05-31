import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Laptop,
  RefreshCw,
  Users,
  UserCheck,
  ShieldCheck,
  Bell,
  Search,
  Calendar,
  Check,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dateStr, setDateStr] = useState('')
  const [timeStr, setTimeStr] = useState('')
  const chartRef = useRef(null)

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setDateStr(now.toLocaleDateString('es-AR'))
      setTimeStr(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
    }
    updateClock()
    const interval = setInterval(updateClock, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    const canvas = chartRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      draw()
    }

    const draw = () => {
      const data = [12, 28, 15, 30, 24, 38, 22]
      const w = canvas.width
      const h = canvas.height
      const pad = 20
      ctx.clearRect(0, 0, w, h)

      ctx.strokeStyle = '#f1f5f9'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = pad + i * ((h - 2 * pad) / 4)
        ctx.beginPath()
        ctx.moveTo(pad, y)
        ctx.lineTo(w - pad, y)
        ctx.stroke()
      }

      const xStep = (w - 2 * pad) / (data.length - 1)
      const yScale = (h - 2 * pad) / 40

      ctx.beginPath()
      ctx.strokeStyle = '#059669'
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      data.forEach((val, i) => {
        const x = pad + i * xStep
        const y = h - pad - val * yScale
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()

      data.forEach((val, i) => {
        const x = pad + i * xStep
        const y = h - pad - val * yScale
        ctx.fillStyle = '#059669'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      })

      ctx.lineTo(pad + (data.length - 1) * xStep, h - pad)
      ctx.lineTo(pad, h - pad)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, pad, 0, h - pad)
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.2)')
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)')
      ctx.fillStyle = grad
      ctx.fill()
    }

    window.addEventListener('resize', resize)
    resize()
    return () => window.removeEventListener('resize', resize)
  }, [])

  const stats = [
    { icon: Laptop, label: 'Notebooks disponibles', value: '42', badge: 'Disponible', color: 'bg-emerald-900' },
    { icon: RefreshCw, label: 'Prestamos activos', value: '18', badge: 'Activos', color: 'bg-emerald-700' },
    { icon: Users, label: 'Alumnos registrados', value: '256', badge: 'Total', color: 'bg-slate-700' },
    { icon: UserCheck, label: 'Preceptores autorizados', value: '24', badge: 'Activos', color: 'bg-emerald-800' },
    { icon: ShieldCheck, label: 'Eventos hoy', value: '37', badge: 'Registrados', color: 'bg-slate-800' },
  ]

  const timeline = [
    { time: '10:34:12', icon: Check, color: 'bg-emerald-500', title: 'Prestamo registrado', desc: 'Alumno: Juan Perez • Notebook: NB-1254 • Preceptor: Maria Lopez' },
    { time: '10:32:45', icon: Check, color: 'bg-emerald-500', title: 'Devolucion registrada', desc: 'Alumno: Sofia Gomez • Notebook: NB-0987 • Preceptor: Carlos Ruiz' },
    { time: '10:30:21', icon: Check, color: 'bg-emerald-500', title: 'Acceso autorizado', desc: 'Preceptor: Maria Lopez • Camara: Entrada Principal' },
    { time: '10:28:10', icon: AlertTriangle, color: 'bg-amber-500', title: 'Intento no autorizado', desc: 'Acceso denegado • Camara: Entrada Principal' },
    { time: '10:26:05', icon: Check, color: 'bg-emerald-500', title: 'Notebook detectada', desc: 'Antena UHF 1 • Notebook: NB-1123' },
  ]

  const loans = [
    { initials: 'JP', name: 'Juan Perez', notebook: 'NB-1254', date: '13/05/2025', preceptor: 'Maria Lopez', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    { initials: 'SG', name: 'Sofia Gomez', notebook: 'NB-0987', date: '13/05/2025', preceptor: 'Carlos Ruiz', bg: 'bg-slate-100', text: 'text-slate-700' },
    { initials: 'LC', name: 'Lucas Correa', notebook: 'NB-1123', date: '13/05/2025', preceptor: 'Maria Lopez', bg: 'bg-amber-100', text: 'text-amber-700' },
    { initials: 'AV', name: 'Agustina Vera', notebook: 'NB-0765', date: '12/05/2025', preceptor: 'Carlos Ruiz', bg: 'bg-indigo-100', text: 'text-indigo-700' },
    { initials: 'TM', name: 'Tomas Medina', notebook: 'NB-0456', date: '12/05/2025', preceptor: 'Maria Lopez', bg: 'bg-pink-100', text: 'text-pink-700' },
  ]

  const days = ['07/05', '08/05', '09/05', '10/05', '11/05', '12/05', '13/05']

  return (
    <>
      <header className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">IPF SmartTrack</h2>
          <p className="text-sm text-slate-500">Sistema inteligente de gestion de notebooks</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 bg-white border-none shadow-sm rounded-lg w-64 focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
          <div className="relative">
            <Bell className="w-6 h-6 text-slate-600 cursor-pointer" />
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">3</span>
          </div>
          <div className="hidden sm:flex items-center space-x-3 text-right">
            <div>
              <p className="text-sm font-bold text-slate-900">{dateStr}</p>
              <p className="text-xs text-slate-500 uppercase">{timeStr}</p>
            </div>
            <Calendar className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white p-4 rounded-xl shadow-sm flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full ${s.color} flex items-center justify-center text-white shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{s.value}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">{s.badge}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-12 gap-8 mb-8">
        <div className="col-span-12 lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Actividad en tiempo real</h3>
            <span className="flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
              En vivo
            </span>
          </div>
          <div className="space-y-6">
            {timeline.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-start space-x-4">
                  <span className="text-xs font-medium text-slate-400 mt-1 shrink-0">{item.time}</span>
                  <div className={`w-6 h-6 ${item.color} rounded-full flex items-center justify-center text-white shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 truncate">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-8 text-center">
            <a href="#" className="text-emerald-700 text-xs font-bold hover:underline inline-flex items-center" onClick={(e) => e.preventDefault()}>
              Ver todos los movimientos
              <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Camaras IP con IA</h3>
            <a href="#" className="text-emerald-700 text-xs font-bold hover:underline" onClick={(e) => e.preventDefault()}>Ver todas</a>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {['Entrada Principal', 'Area de Prestamos', 'Pasillo Interno'].map((name) => (
              <div key={name} className="space-y-3">
                <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <div className="text-slate-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="absolute top-2 left-2 bg-emerald-600/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center">
                    <span className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse"></span>
                    LIVE
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{name}</h4>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center mt-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"></span>
                    En linea
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">
              Prestamos por dia <span className="text-xs font-normal text-slate-400">(Ultimos 7 dias)</span>
            </h3>
            <select className="text-xs border border-slate-200 rounded-lg py-1 px-2 focus:ring-emerald-500">
              <option>Ultimos 7 dias</option>
              <option>Ultimo mes</option>
            </select>
          </div>
          <div className="relative h-40 w-full">
            <canvas ref={chartRef} className="w-full h-full"></canvas>
          </div>
          <div className="flex justify-between mt-2 px-2">
            {days.map((d) => (
              <span key={d} className="text-[10px] text-slate-400">{d}</span>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Prestamos activos</h3>
            <a href="#" className="text-emerald-700 text-xs font-bold hover:underline" onClick={(e) => e.preventDefault()}>Ver todas</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3 font-medium">Alumno</th>
                  <th className="pb-3 font-medium">Notebook</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Preceptor</th>
                  <th className="pb-3 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loans.map((row) => (
                  <tr key={row.initials} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <span className={`w-8 h-8 rounded-full ${row.bg} ${row.text} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                          {row.initials}
                        </span>
                        <span className="text-xs font-semibold">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-slate-600">{row.notebook}</td>
                    <td className="py-3 text-xs text-slate-600">{row.date}</td>
                    <td className="py-3 text-xs text-slate-600">{row.preceptor}</td>
                    <td className="py-3 text-right">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded">Activo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer className="mt-12 flex justify-between items-center text-[10px] text-slate-400 font-medium border-t border-slate-200 pt-6">
        <div className="flex items-center space-x-4">
          <span>Instituto Politecnico Formosa</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">IPF SmartTrack</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Sistema de trazabilidad y control de notebooks</span>
        </div>
        <div>Version 1.0.0</div>
      </footer>
    </>
  )
}

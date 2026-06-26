import { useEffect, useRef, useState } from 'react'
import {
  Laptop, RefreshCw, Users, UserCheck, ShieldCheck, Bell,
  Search, Calendar, Check, AlertTriangle, ChevronRight,
} from 'lucide-react'
import api from '../services/api'

const statMeta = [
  { key: 'computadoras_disponibles', icon: Laptop, label: 'Notebooks disponibles', badge: 'Disponible', color: 'bg-emerald-900' },
  { key: 'prestamos_activos', icon: RefreshCw, label: 'Prestamos activos', badge: 'Activos', color: 'bg-emerald-700' },
  { key: 'alumnos_registrados', icon: Users, label: 'Alumnos registrados', badge: 'Total', color: 'bg-slate-700' },
  { key: 'preceptores_autorizados', icon: UserCheck, label: 'Preceptores autorizados', badge: 'Activos', color: 'bg-emerald-800' },
  { key: 'eventos_hoy', icon: ShieldCheck, label: 'Eventos hoy', badge: 'Registrados', color: 'bg-slate-800' },
  { key: 'alertas_pendientes', icon: Bell, label: 'Alertas pendientes', badge: 'Sin leer', color: 'bg-amber-600' },
]

const tipoIcon = {
  prestamo: { icon: Check, color: 'bg-emerald-500' },
  devolucion: { icon: Check, color: 'bg-emerald-500' },
  lectura_antenna: { icon: Check, color: 'bg-sky-500' },
  qr_scanned: { icon: Check, color: 'bg-indigo-500' },
  movimiento: { icon: AlertTriangle, color: 'bg-amber-500' },
}

export default function Dashboard() {
  const [dateStr, setDateStr] = useState('')
  const [timeStr, setTimeStr] = useState('')
  const chartRef = useRef(null)

  const [stats, setStats] = useState({})
  const [actividad, setActividad] = useState([])
  const [prestamos, setPrestamos] = useState([])
  const [camaras, setCamaras] = useState([])
  const [grafico, setGrafico] = useState({ labels: [], data: [] })

  const fetchData = async () => {
    try {
      const [s, a, p, c, g] = await Promise.all([
        api.get('/simulacion/stats'),
        api.get('/simulacion/actividad'),
        api.get('/simulacion/prestamos'),
        api.get('/simulacion/camaras'),
        api.get('/simulacion/grafico-prestamos'),
      ])
      setStats(s.data)
      setActividad(a.data)
      setPrestamos(p.data)
      setCamaras(c.data)
      setGrafico(g.data)
    } catch { }
  }

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setDateStr(now.toLocaleDateString('es-AR'))
      setTimeStr(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
    }
    updateClock()
    const clock = setInterval(updateClock, 30000)

    fetchData()
    const dataRefresh = setInterval(fetchData, 30000)

    return () => { clearInterval(clock); clearInterval(dataRefresh) }
  }, [])

  useEffect(() => {
    if (!chartRef.current || grafico.data.length === 0) return
    const canvas = chartRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      draw()
    }

    const draw = () => {
      const data = grafico.data
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
      const maxVal = Math.max(...data, 1)
      const yScale = (h - 2 * pad) / maxVal

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
  }, [grafico])

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
            <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 bg-white border-none shadow-sm rounded-lg w-64 focus:ring-2 focus:ring-emerald-500 transition-all text-sm" />
          </div>
          <div className="relative">
            <Bell className="w-6 h-6 text-slate-600 cursor-pointer" />
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">{stats.alertas_pendientes || 0}</span>
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

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        {statMeta.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.key} className="bg-white p-4 rounded-xl shadow-sm flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full ${s.color} flex items-center justify-center text-white shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{stats[s.key] ?? 0}</span>
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
            {actividad.map((item, i) => {
              const meta = tipoIcon[item.tipo] || { icon: Check, color: 'bg-slate-500' }
              const Icon = meta.icon
              return (
                <div key={i} className="flex items-start space-x-4">
                  <span className="text-xs font-medium text-slate-400 mt-1 shrink-0">{item.hora}</span>
                  <div className={`w-6 h-6 ${meta.color} rounded-full flex items-center justify-center text-white shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900">{item.tipo === 'lectura_antenna' ? 'Notebook detectada' : item.tipo === 'qr_scanned' ? 'QR escaneado' : item.tipo === 'movimiento' ? 'Movimiento detectado' : item.tipo === 'prestamo' ? 'Prestamo registrado' : 'Devolucion registrada'}</h4>
                    <p className="text-xs text-slate-500 truncate">{item.detalle}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Aula de almacenamiento</h3>
            <span className="flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
              En vivo
            </span>
          </div>
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="grid grid-cols-4 gap-3 px-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-2 border border-slate-600">
                      <div className="h-2 w-full bg-emerald-900/50 rounded mb-1"></div>
                      <div className="h-2 w-3/4 bg-emerald-900/30 rounded mx-auto"></div>
                      <div className="flex justify-center mt-1">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Armarios con notebooks detectadas por IA</p>
              </div>
            </div>
            <div className="absolute top-2 left-2 bg-emerald-600/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center">
              <span className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse"></span>
              IA ACTIVA
            </div>
            <div className="absolute bottom-2 left-2 text-[8px] text-slate-400 font-medium">Camara IP - Aula TST</div>
            <div className="absolute bottom-2 right-2 text-[8px] text-slate-400 font-mono">{new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">
              Prestamos por dia <span className="text-xs font-normal text-slate-400">(Ultimos 7 dias)</span>
            </h3>
          </div>
          <div className="relative h-40 w-full">
            <canvas ref={chartRef} className="w-full h-full"></canvas>
          </div>
          <div className="flex justify-between mt-2 px-2">
            {grafico.labels.map((d) => (
              <span key={d} className="text-[10px] text-slate-400">{d}</span>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Prestamos activos</h3>
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
                {prestamos.length === 0 && (
                  <tr><td colSpan="5" className="py-10 text-sm text-slate-400 text-center">Sin prestamos activos</td></tr>
                )}
                {prestamos.map((row, i) => (
                  <tr key={i} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {row.initials || row.name?.charAt(0)}
                        </span>
                        <span className="text-xs font-semibold">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-slate-600">{row.notebook}</td>
                    <td className="py-3 text-xs text-slate-600">{row.date}</td>
                    <td className="py-3 text-xs text-slate-600">{row.preceptor}</td>
                    <td className="py-3 text-right">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded">{row.estado || 'Activo'}</span>
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

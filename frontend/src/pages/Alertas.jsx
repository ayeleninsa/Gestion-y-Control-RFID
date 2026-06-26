import { useEffect, useState } from 'react'
import { BellRing, AlertTriangle, Info } from 'lucide-react'
import api from '../services/api'

const alertIcon = {
  advertencia: { icon: AlertTriangle, color: 'bg-amber-500' },
  info: { icon: Info, color: 'bg-sky-500' },
}

export default function Alertas() {
  const [alertas, setAlertas] = useState([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/simulacion/alertas')
        setAlertas(res.data)
      } catch {}
    }
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [])

  const pendientes = alertas.filter(a => !a.leida).length

  return (
    <>
      <header className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Alertas</h2>
          <p className="text-sm text-slate-500">Notificaciones y alertas del sistema</p>
        </div>
        {pendientes > 0 && (
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full flex items-center">
            <BellRing className="w-3 h-3 mr-1" />
            {pendientes} pendientes
          </span>
        )}
      </header>

      <div className="space-y-4">
        {alertas.length === 0 && (
          <div className="bg-white p-16 rounded-2xl shadow-sm text-center">
            <BellRing className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">No hay alertas registradas</p>
          </div>
        )}
        {alertas.map((a, i) => {
          const meta = alertIcon[a.tipo] || { icon: Info, color: 'bg-slate-500' }
          const Icon = meta.icon
          const ts = new Date(a.timestamp)
          return (
            <div key={i} className={`bg-white p-5 rounded-2xl shadow-sm flex items-start space-x-4 ${!a.leida ? 'border-l-4 border-amber-400' : ''}`}>
              <div className={`w-10 h-10 ${meta.color} rounded-full flex items-center justify-center text-white shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold capitalize text-slate-900">{a.tipo}</span>
                  {!a.leida && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Nueva</span>}
                </div>
                <p className="text-sm text-slate-600">{a.mensaje}</p>
                <p className="text-[10px] text-slate-400 mt-1">{ts.toLocaleDateString('es-AR')} {ts.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

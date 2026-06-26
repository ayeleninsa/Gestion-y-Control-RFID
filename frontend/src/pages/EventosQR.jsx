import { useEffect, useState } from 'react'
import { QrCode } from 'lucide-react'
import api from '../services/api'

export default function EventosQR() {
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/simulacion/eventos-qr')
        setEventos(res.data)
      } catch {}
    }
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <header className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Eventos QR</h2>
          <p className="text-sm text-slate-500">Registro de eventos generados por codigos QR</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">QR Fisicos</h3>
          <p className="text-3xl font-bold text-emerald-600">{eventos.filter(e => e.tipo === 'fisico').length}</p>
          <p className="text-xs text-slate-400">Escaneos de QR pegados en notebooks</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">QR Dinamicos</h3>
          <p className="text-3xl font-bold text-indigo-600">{eventos.filter(e => e.tipo === 'dinamico').length}</p>
          <p className="text-xs text-slate-400">Escaneos de QR diarios por carrera</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">Total eventos</h3>
          <p className="text-3xl font-bold text-slate-800">{eventos.length}</p>
          <p className="text-xs text-slate-400">Registros de hoy</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900">Historial de eventos QR</h3>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider">En vivo</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 font-medium">Hora</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Codigo</th>
                <th className="pb-3 font-medium">Alumno</th>
                <th className="pb-3 font-medium">Carrera</th>
                <th className="pb-3 font-medium text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {eventos.length === 0 && (
                <tr className="text-center">
                  <td colSpan="6" className="py-16">
                    <QrCode className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-400">No hay eventos QR registrados</p>
                  </td>
                </tr>
              )}
              {eventos.map((e, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 text-xs text-slate-500">{e.hora}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${e.tipo === 'fisico' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {e.tipo === 'fisico' ? 'Fisico' : 'Dinamico'}
                    </span>
                  </td>
                  <td className="py-3 text-xs font-mono text-slate-700">{e.codigo}</td>
                  <td className="py-3 text-xs text-slate-700">{e.alumno}</td>
                  <td className="py-3 text-xs text-slate-500">{e.carrera}</td>
                  <td className="py-3 text-right">
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded">{e.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import { Radio, Wifi, LogIn, LogOut } from 'lucide-react'
import api from '../services/api'

export default function AntenaRFID() {
  const [lecturas, setLecturas] = useState([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/simulacion/lecturas-antenna')
        setLecturas(res.data)
      } catch {}
    }
    fetch()
    const interval = setInterval(fetch, 10000)
    return () => clearInterval(interval)
  }, [])

  const entradas = lecturas.filter(l => l.direccion === 'entrada').length
  const salidas = lecturas.filter(l => l.direccion === 'salida').length

  return (
    <>
      <header className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Antena RFID</h2>
          <p className="text-sm text-slate-500">Control de entrada y salida de notebooks del aula inteligente</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm md:col-span-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Antena RFID - Puerta del Aula</h3>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>
                En linea
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-2">Ubicada en la puerta de ingreso al aula donde se almacenan las notebooks</p>
          <p className="text-3xl font-bold text-slate-800">{lecturas.length}</p>
          <p className="text-xs text-slate-400">lecturas registradas hoy</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <LogIn className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Entradas</h3>
              <p className="text-[10px] text-slate-400">Notebooks que ingresaron al aula</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{entradas}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Salidas</h3>
              <p className="text-[10px] text-slate-400">Notebooks que salieron del aula</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600">{salidas}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900">Historial de movimientos</h3>
          <span className="flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
            En vivo
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 font-medium">Movimiento</th>
                <th className="pb-3 font-medium">Tag RFID</th>
                <th className="pb-3 font-medium">Computadora</th>
                <th className="pb-3 font-medium">Modelo</th>
                <th className="pb-3 font-medium">Alumno</th>
                <th className="pb-3 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lecturas.length === 0 && (
                <tr className="text-center">
                  <td colSpan="6" className="py-16">
                    <Radio className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-400">Sin movimientos registrados</p>
                  </td>
                </tr>
              )}
              {lecturas.map((l, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center w-fit ${l.direccion === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {l.direccion === 'entrada' ? <LogIn className="w-3 h-3 mr-1" /> : <LogOut className="w-3 h-3 mr-1" />}
                      {l.direccion === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td className="py-3 text-xs font-mono text-emerald-700 font-bold">{l.tag_rfid}</td>
                  <td className="py-3 text-xs text-slate-700">{l.computadora}</td>
                  <td className="py-3 text-xs text-slate-500">{l.modelo}</td>
                  <td className="py-3 text-xs text-slate-700">{l.alumno || '-'}</td>
                  <td className="py-3 text-right text-[10px] text-slate-400">{new Date(l.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

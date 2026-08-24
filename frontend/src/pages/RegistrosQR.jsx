import { useState, useEffect } from 'react'
import { getRegistrosQR } from '../services/qr'

const estadoDinamicoBadge = (estado) => {
  if (estado === 'ACTIVO') return 'bg-emerald-100 text-emerald-700'
  if (estado === 'USADO') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

const estadoDinamicoLabel = (estado) => {
  if (estado === 'ACTIVO') return 'Activo'
  if (estado === 'USADO') return 'Usado'
  return 'Expirado'
}

const estadoFisicoBadge = (estado) => {
  if (estado === 'AMBOS') return 'bg-emerald-100 text-emerald-700'
  if (estado === 'FALTA_QRFISICO') return 'bg-amber-100 text-amber-700'
  if (estado === 'NO_ESCANEO_NINGUN_QR') return 'bg-red-100 text-red-700'
  return 'bg-slate-100 text-slate-600'
}

const estadoFisicoLabel = (estado) => {
  if (estado === 'AMBOS') return 'Ambos QR escaneados'
  if (estado === 'FALTA_QRFISICO') return 'Solo QR dinámico (falta el físico)'
  if (estado === 'NO_ESCANEO_NINGUN_QR') return 'No escaneó ningún QR'
  return 'Sin actividad hoy'
}

export default function RegistrosQR() {
  const [dinamicos, setDinamicos] = useState([])
  const [fisicos, setFisicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRegistros = async () => {
    try {
      setLoading(true)
      const data = await getRegistrosQR()
      setDinamicos(data.dinamicos || [])
      setFisicos(data.fisicos || [])
      setError('')
    } catch (err) {
      setError('Error al cargar los registros del día')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistros()
    const interval = setInterval(fetchRegistros, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="p-6">Cargando...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-slate-800">Registros QR de Hoy</h1>
        <button
          onClick={fetchRegistros}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* QRs dinámicos de hoy */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4">QRs dinámicos de hoy</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Hora generación</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Alumno</th>
                  <th className="px-6 py-4">Hora de uso</th>
                  <th className="px-6 py-4">Preceptor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dinamicos.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(d.hora_generacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoDinamicoBadge(d.estado)}`}>
                        {estadoDinamicoLabel(d.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {d.alumno_nombre || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {d.hora_uso ? new Date(d.hora_uso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4">{d.preceptor_usuario || <span className="text-slate-400">—</span>}</td>
                  </tr>
                ))}
                {dinamicos.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No hay QRs dinámicos generados hoy
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Estado físico por alumno */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Estado físico por alumno</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Alumno</th>
                  <th className="px-6 py-4">DNI</th>
                  <th className="px-6 py-4">Computadora</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Hora último evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fisicos.map((f) => (
                  <tr key={f.id_alumno} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{f.alumno}</td>
                    <td className="px-6 py-4">{f.dni || '—'}</td>
                    <td className="px-6 py-4">
                      {f.computadora_modelo || <span className="text-slate-400">Sin PC</span>}
                      {f.computadora_tag && <span className="block text-xs text-slate-400 font-mono">{f.computadora_tag}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoFisicoBadge(f.estado)}`}>
                        {estadoFisicoLabel(f.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {f.hora_ultimo_evento ? new Date(f.hora_ultimo_evento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
                {fisicos.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No hay alumnos cargados con computadora asignada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
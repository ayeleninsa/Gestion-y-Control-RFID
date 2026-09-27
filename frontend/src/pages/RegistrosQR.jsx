import { useState, useEffect } from 'react'
import { getRegistrosQR } from '../services/qr'
import { CheckCircle2, AlertCircle, Clock, Laptop, QrCode } from 'lucide-react'

const estadoFisicoBadge = (estado) => {
  if (estado === 'DEVOLUCION_OK') return 'bg-blue-100 text-blue-800 border border-blue-200'
  if (estado === 'RETIRO_OK' || estado === 'AMBOS') return 'bg-emerald-100 text-[#006143] border border-emerald-200'
  if (estado === 'FALTA_QRFISICO') return 'bg-amber-100 text-amber-800 border border-amber-200'
  if (estado === 'NO_ESCANEO_NINGUN_QR') return 'bg-red-100 text-red-700 border border-red-200'
  return 'bg-slate-100 text-slate-600 border border-slate-200'
}

const estadoFisicoLabel = (estado) => {
  if (estado === 'DEVOLUCION_OK') return 'Devuelto (2do escaneo ✓)'
  if (estado === 'RETIRO_OK') return 'Retirado - En uso (1er escaneo ✓)'
  if (estado === 'AMBOS') return 'Ambos QR escaneados ✓'
  if (estado === 'FALTA_QRFISICO') return 'Solo QR dinámico (falta notebook)'
  if (estado === 'NO_ESCANEO_NINGUN_QR') return 'No escaneó ningún QR'
  return 'Sin actividad hoy'
}

const renderOperacionBadge = (tipo) => {
  if (tipo === 'RETIRO' || tipo === 'RETIRO_PC') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#006143] border border-emerald-200">
        🟢 Retiro
      </span>
    )
  }
  if (tipo === 'DEVOLUCION' || tipo === 'DEVOLUCION_PC') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
        🔵 Devolución
      </span>
    )
  }
  if (tipo === 'PENDIENTE') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
        ⏳ Pendiente
      </span>
    )
  }
  return <span className="text-slate-400 text-xs">—</span>
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
    const interval = setInterval(fetchRegistros, 20000)
    return () => clearInterval(interval)
  }, [])

  if (loading && dinamicos.length === 0 && fisicos.length === 0) {
    return <div className="p-8 text-center text-slate-500">Cargando registros...</div>
  }
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Registros QR de Hoy</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control y trazabilidad de retiros y devoluciones de notebooks</p>
        </div>
        <button
          onClick={fetchRegistros}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm self-start"
        >
          Actualizar ahora
        </button>
      </div>

      {/* QRs dinámicos escaneados hoy */}
      <section>
        <div className="flex items-center space-x-2 mb-3">
          <QrCode className="w-5 h-5 text-[#006143]" />
          <h2 className="text-lg font-bold text-slate-800">QRs dinámicos escaneados hoy</h2>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {dinamicos.length}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Solo se registran los códigos QR que fueron escaneados exitosamente por los alumnos.
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Hora escaneo</th>
                  <th className="px-6 py-3.5">Alumno</th>
                  <th className="px-6 py-3.5">Operación</th>
                  <th className="px-6 py-3.5">QR Físico (Notebook)</th>
                  <th className="px-6 py-3.5">Computadora</th>
                  <th className="px-6 py-3.5">Preceptor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dinamicos.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-700">
                      {d.hora_uso
                        ? new Date(d.hora_uso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : new Date(d.hora_generacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {d.alumno_nombre || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderOperacionBadge(d.tipo_operacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {d.qr_fisico_escaneado ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Escaneado ✓</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs text-amber-700 font-medium">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Pendiente de escanear PC</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {d.computadora || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {d.preceptor_usuario || <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
                {dinamicos.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                      No hay QRs dinámicos escaneados por alumnos hoy
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Estado por alumno */}
      <section>
        <div className="flex items-center space-x-2 mb-3">
          <Laptop className="w-5 h-5 text-[#006143]" />
          <h2 className="text-lg font-bold text-slate-800">Estado por alumno</h2>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {fisicos.length}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Estado actual de cada alumno respecto al retiro o devolución de su notebook asignada.
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Alumno</th>
                  <th className="px-6 py-3.5">DNI</th>
                  <th className="px-6 py-3.5">Computadora Asignada</th>
                  <th className="px-6 py-3.5">QR Físico</th>
                  <th className="px-6 py-3.5">Operación Actual</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5">Hora último evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fisicos.map((f) => (
                  <tr key={f.id_alumno} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{f.alumno}</td>
                    <td className="px-6 py-4 font-mono text-xs">{f.dni || '—'}</td>
                    <td className="px-6 py-4">
                      {f.computadora_modelo ? (
                        <div>
                          <span className="font-medium text-slate-800">{f.computadora_modelo}</span>
                          {f.computadora_tag && (
                            <span className="block text-[11px] text-slate-400 font-mono">{f.computadora_tag}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Sin PC</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {f.qr_fisico_escaneado ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Escaneado ✓</span>
                        </span>
                      ) : f.estado === 'FALTA_QRFISICO' ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-medium text-amber-700">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Pendiente</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No escaneado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderOperacionBadge(f.tipo_operacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoFisicoBadge(f.estado)}`}>
                        {estadoFisicoLabel(f.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-600">
                      {f.hora_ultimo_evento ? (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(f.hora_ultimo_evento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {fisicos.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-slate-500">
                      No hay alumnos registrados con computadoras asignadas
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
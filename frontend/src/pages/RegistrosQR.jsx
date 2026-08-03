import { useState, useEffect } from 'react'
import { getRegistrosHoy } from '../services/qr'

export default function RegistrosQR() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRegistros = async () => {
    try {
      setLoading(true)
      const data = await getRegistrosHoy()
      setRegistros(data)
    } catch (err) {
      setError('Error al cargar los registros del día')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistros()
  }, [])

  if (loading) return <div className="p-6">Cargando...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Registros QR de Hoy</h1>
        <button
          onClick={fetchRegistros}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Actualizar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Hora</th>
                <th className="px-6 py-4">Alumno</th>
                <th className="px-6 py-4">DNI</th>
                <th className="px-6 py-4">Computadora</th>
                <th className="px-6 py-4">Tipo QR</th>
                <th className="px-6 py-4">Tipo Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {r.alumno_nombre} {r.alumno_apellido}
                  </td>
                  <td className="px-6 py-4">{r.alumno_dni}</td>
                  <td className="px-6 py-4">
                    {r.computadora_marca} {r.computadora_modelo} <br />
                    <span className="text-xs text-slate-500">S/N: {r.computadora_nro_serie}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                    {r.tipo_qr}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      r.tipo_evento === 'RETIRO_PC' ? 'bg-orange-100 text-orange-800' :
                      r.tipo_evento === 'DEVOLUCION_PC' ? 'bg-[#24c48a]/10 text-[#006143]' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {r.tipo_evento.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No hay registros de QR para el día de hoy
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

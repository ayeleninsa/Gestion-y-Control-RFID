import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getComputadoras, deleteComputadora } from '../services/computadoras'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, X } from 'lucide-react'
export default function Computadoras() {
  const [computadoras, setComputadoras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedQR, setSelectedQR] = useState(null)

  const fetchComputadoras = async () => {
    try {
      setLoading(true)
      const data = await getComputadoras()
      setComputadoras(data)
    } catch (err) {
      setError('Error al cargar computadoras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComputadoras()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta computadora?')) return
    try {
      await deleteComputadora(id)
      fetchComputadoras()
    } catch (err) {
      alert('Error al eliminar')
    }
  }

  const filteredComputadoras = computadoras.filter(c => {
    const term = search.toLowerCase()
    return (
      (c.marca && c.marca.toLowerCase().includes(term)) ||
      (c.modelo && c.modelo.toLowerCase().includes(term)) ||
      (c.nro_serie && c.nro_serie.toLowerCase().includes(term)) ||
      (c.tag_rfid && c.tag_rfid.toLowerCase().includes(term)) ||
      (c.estado && c.estado.toLowerCase().includes(term))
    )
  })

  if (loading) return <div className="p-6">Cargando...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Computadoras</h1>
        <Link
          to="/computadoras/nueva"
          className="px-4 py-2 bg-[#006143] text-white rounded-lg hover:bg-[#004d35] transition-colors"
        >
          Nueva Computadora
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por marca, modelo, N/S, RFID o estado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Marca/Modelo</th>
                <th className="px-6 py-4">N° Serie</th>
                <th className="px-6 py-4">Tag RFID</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComputadoras.map((c) => (
                <tr key={c.id_computadoras} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {c.marca} {c.modelo}
                  </td>
                  <td className="px-6 py-4">{c.nro_serie}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 bg-slate-100 p-1 rounded inline-block mt-3">{c.tag_rfid || 'Sin Asignar'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      c.estado === 'DISPONIBLE' ? 'bg-[#24c48a]/10 text-[#006143]' :
                      c.estado === 'EN_USO' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedQR(c)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium mr-4 inline-flex items-center gap-1"
                      title="Ver QR"
                    >
                      <QrCode className="w-4 h-4" /> QR
                    </button>
                    <Link
                      to={`/computadoras/${c.id_computadoras}/editar`}
                      className="text-[#006143] hover:text-[#004d35] font-medium mr-4"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id_computadoras)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredComputadoras.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No se encontraron computadoras
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal QR */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                QR - {selectedQR.marca} {selectedQR.modelo}
              </h3>
              <button
                onClick={() => setSelectedQR(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              {selectedQR.tag_rfid ? (
                <>
                  <div className="p-4 bg-white border-4 border-slate-100 rounded-2xl shadow-sm mb-4">
                    <QRCodeSVG value={selectedQR.tag_rfid} size={200} />
                  </div>
                  <p className="text-sm font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">
                    {selectedQR.tag_rfid}
                  </p>
                  <p className="text-xs text-slate-500 mt-4 text-center">
                    Este es el código QR de la computadora.
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <p className="text-slate-600 font-medium">Sin Tag RFID</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Edita la computadora para asignarle un Tag RFID.
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedQR(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

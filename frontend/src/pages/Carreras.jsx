import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCarreras, deleteCarrera } from '../services/carreras'

export default function Carreras() {
  const [carreras, setCarreras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchCarreras = async () => {
    try {
      setLoading(true)
      const data = await getCarreras()
      setCarreras(data)
    } catch (err) {
      setError('Error al cargar carreras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCarreras()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta carrera?')) return
    try {
      await deleteCarrera(id)
      fetchCarreras()
    } catch (err) {
      alert('Error al eliminar')
    }
  }

  const filteredCarreras = carreras.filter(c => {
    const term = search.toLowerCase()
    return (
      (c.nombre && c.nombre.toLowerCase().includes(term)) ||
      (c.año && c.año.toLowerCase().includes(term))
    )
  })

  if (loading) return <div className="p-6">Cargando...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Carreras</h1>
        <Link
          to="/carreras/nueva"
          className="px-4 py-2 bg-[#006143] text-white rounded-lg hover:bg-[#004d35] transition-colors text-center"
        >
          Nueva Carrera
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o año..."
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
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Año (Plan/Duración)</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCarreras.map((c) => (
                <tr key={c.id_carrera} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">{c.id_carrera}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{c.nombre}</td>
                  <td className="px-6 py-4">{c.año || 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/carreras/${c.id_carrera}/editar`}
                      className="text-[#006143] hover:text-[#004d35] font-medium mr-4"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id_carrera)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCarreras.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    No se encontraron carreras
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

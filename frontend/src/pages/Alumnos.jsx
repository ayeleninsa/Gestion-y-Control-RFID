import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAlumnos, deleteAlumno, importAlumnos } from '../services/alumnos'

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)

  const fetchAlumnos = async () => {
    try {
      setLoading(true)
      const data = await getAlumnos()
      setAlumnos(data)
    } catch (err) {
      setError('Error al cargar alumnos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlumnos()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este alumno?')) return
    try {
      await deleteAlumno(id)
      fetchAlumnos()
    } catch (err) {
      alert('Error al eliminar')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setImporting(true)
    try {
      const res = await importAlumnos(file)
      alert(res.message)
      fetchAlumnos()
    } catch (err) {
      alert('Error al importar: ' + err.response?.data?.detail || err.message)
    } finally {
      setImporting(false)
      e.target.value = null // reset input
    }
  }

  const filteredAlumnos = alumnos.filter(a => {
    const term = search.toLowerCase()
    return (
      (a.nombre && a.nombre.toLowerCase().includes(term)) ||
      (a.apellido && a.apellido.toLowerCase().includes(term)) ||
      (a.dni && a.dni.toLowerCase().includes(term)) ||
      (a.correo && a.correo.toLowerCase().includes(term)) ||
      (a.carrera_nombre && a.carrera_nombre.toLowerCase().includes(term)) ||
      (a.anio_en_curso && a.anio_en_curso.toString().includes(term))
    )
  })

  if (loading) return <div className="p-6">Cargando...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Alumnos</h1>
        <div className="flex space-x-3">
          <label className={`cursor-pointer px-4 py-2 bg-[#24c48a] text-white rounded-lg hover:bg-[#1da875] transition-colors flex items-center ${importing ? 'opacity-50' : ''}`}>
            {importing ? 'Importando...' : 'Importar Excel'}
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} disabled={importing} />
          </label>
          <Link
            to="/alumnos/nuevo"
            className="px-4 py-2 bg-[#006143] text-white rounded-lg hover:bg-[#004d35] transition-colors flex items-center"
          >
            Nuevo Alumno
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, DNI, correo, carrera..."
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
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">DNI</th>
                <th className="px-6 py-4">Correo</th>
                <th className="px-6 py-4">Carrera / Año</th>
                <th className="px-6 py-4">PC Asignada</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlumnos.map((alumno) => (
                <tr key={alumno.id_alumnos} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {alumno.nombre} {alumno.apellido}
                  </td>
                  <td className="px-6 py-4">{alumno.dni}</td>
                  <td className="px-6 py-4">{alumno.correo}</td>
                  <td className="px-6 py-4">
                    {alumno.carrera_nombre || 'N/A'} (Año: {alumno.anio_en_curso || 'N/A'})
                  </td>
                  <td className="px-6 py-4">
                    {alumno.computadora_tag ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#24c48a]/10 text-[#006143]">
                        {alumno.computadora_tag}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Ninguna</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/alumnos/${alumno.id_alumnos}/editar`}
                      className="text-[#006143] hover:text-[#004d35] font-medium mr-4"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(alumno.id_alumnos)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAlumnos.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No se encontraron alumnos
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

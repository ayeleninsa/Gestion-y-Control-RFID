import { useState, useEffect } from 'react'
import { getPrestamos, updatePrestamo, deletePrestamo, createPrestamo } from '../services/prestamos'
import { getAlumnos } from '../services/alumnos'
import { getComputadoras } from '../services/computadoras'
import { RefreshCw, Trash2, PlusCircle, X } from 'lucide-react'

const ESTADOS = ['Prestado', 'Devuelto', 'No devuelto']

const estadoStyles = {
  'Prestado': 'bg-blue-100 text-blue-800',
  'Devuelto': 'bg-[#24c48a]/10 text-[#006143]',
  'No devuelto': 'bg-red-100 text-red-800',
}

function toDateInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [msg, setMsg] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [alumnos, setAlumnos] = useState([])
  const [computadoras, setComputadoras] = useState([])
  const [form, setForm] = useState({ id_alumnos: '', id_computadoras: '' })
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const [alumnoQuery, setAlumnoQuery] = useState('')
  const [alumnoDropdown, setAlumnoDropdown] = useState(false)

  const matchingAlumnos = alumnos
    .filter((a) => `${a.nombre} ${a.apellido}`.toLowerCase().includes(alumnoQuery.toLowerCase()))
    .slice(0, 10)

  const selectAlumno = (al) => {
    setForm({
      id_alumnos: String(al.id_alumnos),
      id_computadoras: al.id_computadora ? String(al.id_computadora) : '',
    })
    setAlumnoQuery(`${al.nombre} ${al.apellido}`)
    setAlumnoDropdown(false)
  }

  const fetchPrestamos = async () => {
    try {
      setLoading(true)
      const data = await getPrestamos()
      setPrestamos(data)
    } catch (err) {
      setError('Error al cargar los prestamos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrestamos()
  }, [])

  const openForm = async () => {
    setFormError('')
    setForm({ id_alumnos: '', id_computadoras: '' })
    setAlumnoQuery('')
    setAlumnoDropdown(false)
    setShowForm(true)
    try {
      setAlumnos(await getAlumnos())
      setComputadoras(await getComputadoras())
    } catch (err) {
      setFormError('Error al cargar alumnos o computadoras')
    }
  }

  const selectedAlumno = alumnos.find((a) => String(a.id_alumnos) === form.id_alumnos) || null

  const submitForm = async (e) => {
    e.preventDefault()
    if (!form.id_alumnos) {
      setFormError('Seleccione un alumno')
      return
    }
    if (!form.id_computadoras) {
      setFormError('Seleccione la computadora que esta usando')
      return
    }
    setFormSaving(true)
    setFormError('')
    try {
      const nuevo = await createPrestamo({
        id_alumnos: Number(form.id_alumnos),
        id_computadoras: Number(form.id_computadoras),
      })
      setPrestamos((prev) => [nuevo, ...prev])
      setShowForm(false)
    } catch (err) {
      setFormError(err.response?.data?.detail || 'No se pudo crear el prestamo')
    } finally {
      setFormSaving(false)
    }
  }

  const handleEstado = async (p, estado) => {
    setSavingId(p.id_prestamo)
    setMsg('')
    try {
      const updated = await updatePrestamo(p.id_prestamo, { estado })
      setPrestamos((prev) => prev.map((x) => (x.id_prestamo === updated.id_prestamo ? updated : x)))
    } catch (err) {
      setMsg('No se pudo actualizar el estado')
    } finally {
      setSavingId(null)
    }
  }

  const handleFecha = async (p, value) => {
    if (!value) return
    setSavingId(p.id_prestamo)
    setMsg('')
    try {
      const updated = await updatePrestamo(p.id_prestamo, { fecha_prestamo: new Date(`${value}T12:00:00`).toISOString() })
      setPrestamos((prev) => prev.map((x) => (x.id_prestamo === updated.id_prestamo ? updated : x)))
    } catch (err) {
      setMsg('No se pudo actualizar la fecha')
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Eliminar el prestamo de ${p.alumno_nombre} ${p.alumno_apellido}?`)) return
    setMsg('')
    try {
      await deletePrestamo(p.id_prestamo)
      setPrestamos((prev) => prev.filter((x) => x.id_prestamo !== p.id_prestamo))
    } catch (err) {
      setMsg('No se pudo eliminar el prestamo')
    }
  }

  const term = search.toLowerCase()
  const filtered = prestamos.filter((p) => {
    const matchEstado = !filtroEstado || p.estado === filtroEstado
    const matchSearch =
      !term ||
      `${p.alumno_nombre || ''} ${p.alumno_apellido || ''}`.toLowerCase().includes(term) ||
      (p.computadora_modelo || '').toLowerCase().includes(term) ||
      (p.carrera_nombre || '').toLowerCase().includes(term)
    return matchEstado && matchSearch
  })

  if (loading) return <div className="p-6">Cargando...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Prestamos</h1>
        <div className="flex items-center gap-3">
          {msg && (
            <span className="inline-flex items-center gap-1 text-sm text-red-600">{msg}</span>
          )}
          <button
            onClick={openForm}
            className="px-4 py-2 bg-[#006143] text-white rounded-lg hover:bg-[#004d35] transition-colors inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Nuevo Prestamo
          </button>
          <button
            onClick={fetchPrestamos}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por alumno, computadora o carrera..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] bg-white"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Alumno</th>
                <th className="px-6 py-4">Carrera</th>
                <th className="px-6 py-4">Computadora</th>
                <th className="px-6 py-4">Anio</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id_prestamo} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                    {p.alumno_nombre} {p.alumno_apellido}
                  </td>
                  <td className="px-6 py-4">{p.carrera_nombre || '—'}</td>
                  <td className="px-6 py-4">
                    {p.computadora_modelo || '—'}
                    {p.tag_rfid && (
                      <span className="block text-xs text-slate-500">Tag: {p.tag_rfid}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{p.anio_en_curso ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoStyles[p.estado] || 'bg-slate-100 text-slate-800'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <select
                        value={p.estado}
                        disabled={savingId === p.id_prestamo}
                        onChange={(e) => handleEstado(p, e.target.value)}
                        className="px-2 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#006143]/20"
                        title="Cambiar estado"
                      >
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={toDateInput(p.fecha_prestamo)}
                        disabled={savingId === p.id_prestamo}
                        onChange={(e) => handleFecha(p, e.target.value)}
                        className="px-2 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#006143]/20"
                        title="Editar fecha de prestamo"
                      />
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={savingId === p.id_prestamo}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar prestamo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No hay prestamos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Prestamo */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Nuevo Prestamo</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitForm} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Alumno (nombre y apellido)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Escriba para buscar por nombre o apellido..."
                    value={alumnoQuery}
                    onChange={(e) => {
                      setAlumnoQuery(e.target.value)
                      setAlumnoDropdown(true)
                      setForm((f) => (f.id_alumnos ? { ...f, id_alumnos: '' } : f))
                    }}
                    onFocus={() => {
                      if (!alumnoQuery) setAlumnoDropdown(true)
                    }}
                    onBlur={() => setTimeout(() => setAlumnoDropdown(false), 150)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
                  />
                  {alumnoDropdown && (
                    <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                      {matchingAlumnos.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500">Sin resultados</div>
                      ) : (
                        matchingAlumnos.map((a) => (
                          <button
                            key={a.id_alumnos}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              selectAlumno(a)
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#006143]/5 transition-colors"
                          >
                            <span className="block text-slate-800 font-medium text-sm">
                              {a.nombre} {a.apellido}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {a.carrera_nombre || 'Sin carrera'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Carrera</label>
                  <input
                    type="text"
                    value={selectedAlumno?.carrera_nombre || ''}
                    readOnly
                    placeholder="—"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Anio</label>
                  <input
                    type="number"
                    value={selectedAlumno?.anio_en_curso ?? ''}
                    readOnly
                    placeholder="—"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Computadora que esta usando
                </label>
                <select
                  value={form.id_computadoras}
                  onChange={(e) => setForm((f) => ({ ...f, id_computadoras: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] bg-white"
                >
                  <option value="">Seleccione una computadora</option>
                  {computadoras
                    .filter((c) => c.activa)
                    .map((c) => (
                      <option key={c.id_computadoras} value={String(c.id_computadoras)}>
                        {c.modelo} — {c.tag_rfid} ({c.estado})
                      </option>
                    ))}
                </select>
              </div>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-4 py-2 bg-[#006143] text-white rounded-lg font-medium hover:bg-[#004d35] transition-colors disabled:opacity-50"
                >
                  {formSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
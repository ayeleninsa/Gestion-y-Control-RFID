import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createAlumno, updateAlumno } from '../services/alumnos'
import api from '../services/api' // To fetch carreras/computadoras if needed

export default function AlumnoForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    correo: '',
    anio_en_curso: '',
    id_carrera: '',
    id_computadora: '',
    password: ''
  })
  
  const [carreras, setCarreras] = useState([])
  const [computadoras, setComputadoras] = useState([])
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // We would fetch carreras and computadoras here from API
    // For now, let's mock or fetch from inventario
    const fetchSelectData = async () => {
      try {
        const pcRes = await api.get('/inventario/computadoras')
        setComputadoras(pcRes.data)
        
        const carrerasRes = await api.get('/carreras/')
        setCarreras(carrerasRes.data)
      } catch (err) {
        console.error('Error fetching select data', err)
      }
    }
    
    const fetchAlumno = async () => {
      try {
        const res = await api.get('/alumnos/')
        const alumno = res.data.find(a => a.id_alumnos === parseInt(id))
        if (alumno) {
          setFormData({
            nombre: alumno.nombre || '',
            apellido: alumno.apellido || '',
            dni: alumno.dni || '',
            correo: alumno.correo || '',
            anio_en_curso: alumno.anio_en_curso || '',
            id_carrera: alumno.id_carrera || '',
            id_computadora: alumno.id_computadora || ''
          })
        }
      } catch (err) {
        setError('Error al cargar alumno')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSelectData()
    if (isEditing) {
      fetchAlumno()
    }
  }, [id, isEditing])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    
    const dataToSend = {
      ...formData,
      anio_en_curso: parseInt(formData.anio_en_curso) || 1,
      id_carrera: parseInt(formData.id_carrera) || 1,
      id_computadora: formData.id_computadora ? parseInt(formData.id_computadora) : null
    }

    try {
      if (isEditing) {
        await updateAlumno(id, dataToSend)
      } else {
        await createAlumno(dataToSend)
      }
      navigate('/alumnos')
    } catch (err) {
      setError('Error al guardar: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6">Cargando...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {isEditing ? 'Editar Alumno' : 'Nuevo Alumno'}
        </h1>
        
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">DNI</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico</label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña (Opcional)</label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Por defecto: DNI del alumno"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
              />
              <p className="text-xs text-slate-500 mt-2">
                Si dejas este campo vacío, la contraseña será el DNI del alumno. En su primer inicio de sesión se le pedirá cambiarla.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Carrera</label>
              <select
                name="id_carrera"
                value={formData.id_carrera}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] bg-white"
              >
                <option value="">Seleccione carrera</option>
                {carreras.map(c => (
                  <option key={c.id_carrera} value={c.id_carrera}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Año en Curso</label>
              <select
                name="anio_en_curso"
                value={formData.anio_en_curso}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] bg-white"
              >
                <option value="">Seleccione año</option>
                {[1, 2, 3, 4, 5].map(a => (
                  <option key={a} value={a}>Año {a}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Computadora Asignada (Opcional)</label>
            <select
              name="id_computadora"
              value={formData.id_computadora || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] bg-white"
            >
              <option value="">Ninguna</option>
              {computadoras.map(c => (
                <option key={c.id_computadoras} value={c.id_computadoras}>
                  {c.modelo || 'PC'} - {c.tag_rfid || `ID: ${c.id_computadoras}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/alumnos')}
              className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#006143] text-white rounded-lg hover:bg-[#004d35] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

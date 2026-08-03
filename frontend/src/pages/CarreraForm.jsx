import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCarrera, updateCarrera, getCarrera } from '../services/carreras'

export default function CarreraForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    nombre: '',
    año: ''
  })
  
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCarrera = async () => {
      try {
        const carrera = await getCarrera(id)
        if (carrera) {
          setFormData({
            nombre: carrera.nombre || '',
            año: carrera.año || ''
          })
        }
      } catch (err) {
        setError('Error al cargar carrera')
      } finally {
        setLoading(false)
      }
    }
    
    if (isEditing) {
      fetchCarrera()
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
    
    try {
      if (isEditing) {
        await updateCarrera(id, formData)
      } else {
        await createCarrera(formData)
      }
      navigate('/carreras')
    } catch (err) {
      setError('Error al guardar: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6">Cargando...</div>

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {isEditing ? 'Editar Carrera' : 'Nueva Carrera'}
        </h1>
        
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre de la Carrera</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
              placeholder="Ej. Desarrollo de Software"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Año o Plan (Opcional)</label>
            <input
              type="text"
              name="año"
              value={formData.año}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
              placeholder="Ej. 2024 o 3 años"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/carreras')}
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

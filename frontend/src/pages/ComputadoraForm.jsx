import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createComputadora, updateComputadora } from '../services/computadoras'
import api from '../services/api'

export default function ComputadoraForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    nro_serie: '',
    tag_rfid: '',
    estado: 'DISPONIBLE',
    activa: true
  })
  
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchComputadora = async () => {
      try {
        const res = await api.get(`/inventario/computadoras/${id}`)
        const pc = res.data
        if (pc) {
          setFormData({
            marca: pc.marca || '',
            modelo: pc.modelo || '',
            nro_serie: pc.nro_serie || '',
            tag_rfid: pc.tag_rfid || '',
            estado: pc.estado || 'DISPONIBLE',
            activa: pc.activa !== false
          })
        }
      } catch (err) {
        setError('Error al cargar computadora')
      } finally {
        setLoading(false)
      }
    }
    
    if (isEditing) {
      fetchComputadora()
    }
  }, [id, isEditing])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    
    try {
      if (isEditing) {
        await updateComputadora(id, formData)
      } else {
        await createComputadora(formData)
      }
      navigate('/computadoras')
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
          {isEditing ? 'Editar Computadora' : 'Nueva Computadora'}
        </h1>
        
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marca</label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Modelo</label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Número de Serie</label>
              <input
                type="text"
                name="nro_serie"
                value={formData.nro_serie}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tag RFID</label>
              <input
                type="text"
                name="tag_rfid"
                value={formData.tag_rfid}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] font-mono"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006143]/20 focus:border-[#006143] bg-white"
              >
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="EN_USO">EN USO</option>
                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="activa"
                  checked={formData.activa}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#006143] border-slate-300 rounded focus:ring-[#006143]"
                />
                <span className="text-sm font-medium text-slate-700">Activa (En sistema)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/computadoras')}
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

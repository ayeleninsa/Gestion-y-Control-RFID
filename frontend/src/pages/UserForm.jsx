import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUser, createUser, updateUser } from '../services/users'
import { User, Mail, Key, Shield, ArrowLeft, Save } from 'lucide-react'

export default function UserForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    rol: 'preceptor',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getUser(id)
        .then((u) => setForm({ email: u.email, username: u.username, password: '', rol: u.rol }))
        .catch(() => navigate('/usuarios'))
    }
  }, [id, isEdit, navigate])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        const data = { ...form }
        if (!data.password) delete data.password
        await updateUser(id, data)
      } else {
        await createUser(form)
      }
      navigate('/usuarios')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/usuarios')}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h1>
          <p className="text-sm text-slate-500">
            {isEdit
              ? 'Modifica los datos del usuario del sistema.'
              : 'Registra un nuevo administrador o preceptor.'}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-5"
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            Nombre de usuario (Username)
          </label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="ej. juan.perez"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006143] focus:border-[#006143]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            Correo electrónico
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="ej. usuario@ipf.edu.ar"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006143] focus:border-[#006143]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-400" />
            Contraseña {isEdit && <span className="text-xs text-slate-400 font-normal">(dejar en blanco para mantener)</span>}
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder={isEdit ? '••••••••' : 'Contraseña segura'}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006143] focus:border-[#006143]"
            required={!isEdit}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            Rol en el sistema
          </label>
          <select
            name="rol"
            value={form.rol}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006143] focus:border-[#006143] bg-white"
          >
            <option value="preceptor">Preceptor (Acceso operativo y consulta)</option>
            <option value="admin">Administrador (Control total del sistema)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#006143] text-white text-sm font-semibold rounded-lg hover:bg-[#004d35] disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUsers, deleteUser } from '../services/users'
import {
  Users as UsersIcon,
  Shield,
  UserCheck,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Lock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

export default function Users() {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.rol === 'admin'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos') // 'todos' | 'admin' | 'preceptor'
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsers()
      // Ensure only admin and preceptor are shown
      const staffUsers = data.filter((u) => u.rol === 'admin' || u.rol === 'preceptor')
      setUsers(staffUsers)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (userToDelete) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden eliminar usuarios.')
      return
    }

    if (userToDelete.id === currentUser?.id) {
      setActionError('No puedes eliminar tu propia cuenta de usuario.')
      return
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar al usuario "${userToDelete.username}" (${userToDelete.rol})?`
    )
    if (!confirmDelete) return

    setDeletingId(userToDelete.id)
    setActionError('')
    try {
      await deleteUser(userToDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Error al eliminar el usuario')
    } finally {
      setDeletingId(null)
    }
  }

  const counts = useMemo(() => {
    const admins = users.filter((u) => u.rol === 'admin').length
    const preceptores = users.filter((u) => u.rol === 'preceptor').length
    return { total: users.length, admins, preceptores }
  }, [users])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())

      const matchesRole =
        roleFilter === 'todos' || u.rol?.toLowerCase() === roleFilter.toLowerCase()

      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UsersIcon className="w-7 h-7 text-[#006143]" />
            Usuarios del Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administradores y preceptores registrados en la plataforma.
          </p>
        </div>

        {isAdmin ? (
          <Link
            to="/usuarios/nuevo"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006143] text-white text-sm font-semibold rounded-lg hover:bg-[#004d35] transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            Acciones restringidas a Administradores
          </div>
        )}
      </div>

      {/* Role Notice for Preceptors */}
      {!isAdmin && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <span className="font-semibold">Modo de consulta (Perfil Preceptor):</span> Puedes
            revisar la lista de administradores y preceptores activos en el sistema. Las acciones de
            creación, edición y eliminación están disponibles exclusivamente para usuarios con
            perfil de <strong>Administrador</strong>.
          </div>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError('')}
            className="text-xs underline hover:text-red-900"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Personal
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{counts.total}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center text-[#006143]">
            <UsersIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Administradores
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{counts.admins}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Preceptores
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{counts.preceptores}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuario o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006143] focus:border-[#006143]"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start md:self-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setRoleFilter('todos')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              roleFilter === 'todos'
                ? 'bg-white text-slate-800 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              roleFilter === 'admin'
                ? 'bg-white text-purple-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admins ({counts.admins})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('preceptor')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              roleFilter === 'preceptor'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Preceptores ({counts.preceptores})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#006143] mb-3" />
            <p>Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">
            <p className="font-semibold">{error}</p>
            <button
              onClick={load}
              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium"
            >
              Reintentar
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <UsersIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-700">No se encontraron usuarios</p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba cambiando los términos de búsqueda o el filtro de rol.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Usuario</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Rol</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">
                    {isAdmin ? 'Acciones' : 'Permisos'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              u.rol === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                              {u.username}
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">ID #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {u.email}
                      </td>

                      <td className="px-5 py-4">
                        {u.rol === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                            <Shield className="w-3.5 h-3.5" />
                            Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            <UserCheck className="w-3.5 h-3.5" />
                            Preceptor
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {u.activo ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/usuarios/${u.id}/editar`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              title="Editar usuario"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                              <span>Editar</span>
                            </Link>
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={deletingId === u.id || isCurrent}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                isCurrent
                                  ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                                  : 'text-red-700 bg-red-50 hover:bg-red-100'
                              }`}
                              title={
                                isCurrent
                                  ? 'No puedes eliminar tu propia cuenta'
                                  : 'Eliminar usuario'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{deletingId === u.id ? 'Borrando...' : 'Eliminar'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded">
                            <Lock className="w-3 h-3 text-slate-400" />
                            Solo lectura
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

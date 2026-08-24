import api from './api'

export async function getMiPerfil() {
  const res = await api.get('/alumnos/me')
  return res.data
}

export async function getAlumnos() {
  const res = await api.get('/alumnos/')
  return res.data
}

export async function createAlumno(data) {
  const res = await api.post('/alumnos/', data)
  return res.data
}

export async function updateAlumno(id, data) {
  const res = await api.put(`/alumnos/${id}`, data)
  return res.data
}

export async function deleteAlumno(id) {
  const res = await api.delete(`/alumnos/${id}`)
  return res.data
}

export async function importAlumnos(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/alumnos/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.data
}

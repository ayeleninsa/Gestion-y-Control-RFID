import api from './api'

export async function getPrestamos() {
  const res = await api.get('/prestamos')
  return res.data
}

export async function createPrestamo(data) {
  const res = await api.post('/prestamos', data)
  return res.data
}

export async function updatePrestamo(id, data) {
  const res = await api.patch(`/prestamos/${id}`, data)
  return res.data
}

export async function deletePrestamo(id) {
  const res = await api.delete(`/prestamos/${id}`)
  return res.data
}
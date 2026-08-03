import api from './api'

export async function getCarreras() {
  const res = await api.get('/carreras/')
  return res.data
}

export async function getCarrera(id) {
  const res = await api.get(`/carreras/${id}`)
  return res.data
}

export async function createCarrera(data) {
  const res = await api.post('/carreras/', data)
  return res.data
}

export async function updateCarrera(id, data) {
  const res = await api.put(`/carreras/${id}`, data)
  return res.data
}

export async function deleteCarrera(id) {
  const res = await api.delete(`/carreras/${id}`)
  return res.data
}

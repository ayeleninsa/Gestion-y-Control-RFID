import api from './api'

export async function getComputadoras() {
  const res = await api.get('/inventario/computadoras')
  return res.data
}

export async function createComputadora(data) {
  const res = await api.post('/inventario/computadoras', data)
  return res.data
}

export async function updateComputadora(id, data) {
  const res = await api.put(`/inventario/computadoras/${id}`, data)
  return res.data
}

export async function deleteComputadora(id) {
  const res = await api.delete(`/inventario/computadoras/${id}`)
  return res.data
}

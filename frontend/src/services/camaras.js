import api from './api'

export async function getCamaras() {
  const res = await api.get('/acceso/camaras')
  return res.data
}

export async function getConteoIA() {
  const res = await api.get('/acceso/camaras/conteo-ia')
  return res.data
}

import api from './api'

export async function getUsers() {
  const res = await api.get('/users')
  return res.data
}

export async function getUser(id) {
  const res = await api.get(`/users/${id}`)
  return res.data
}

export async function createUser(data) {
  const res = await api.post('/auth/register', data)
  return res.data
}

export async function updateUser(id, data) {
  const res = await api.put(`/users/${id}`, data)
  return res.data
}

export async function deleteUser(id) {
  await api.delete(`/users/${id}`)
}

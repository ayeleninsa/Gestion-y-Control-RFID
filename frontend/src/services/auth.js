import axios from 'axios'
import api from './api'

const loginApi = axios.create({
  baseURL: 'http://localhost:8000/api',
})

export async function login(email, password) {
  const res = await loginApi.post('/auth/login', { email, password })
  return res.data
}

export async function register(data) {
  const res = await api.post('/auth/register', data)
  return res.data
}

export async function getMe() {
  const res = await api.get('/auth/me')
  return res.data
}

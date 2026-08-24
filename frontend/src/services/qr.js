import api from './api'

export async function getDynamicQR() {
  const res = await api.get('/qr/dynamic')
  return res.data
}

export async function reclamarQrDinamico(qrDinamico) {
  const res = await api.post('/qr/reclamar', { qr_dinamico: qrDinamico })
  return res.data
}

export async function getQrDinamicoEstado(qrDinamico) {
  const res = await api.post('/qr/dynamic/estado', { qr_dinamico: qrDinamico })
  return res.data
}

export async function getEstadoEscaneo() {
  const res = await api.get('/qr/estado-escaneo')
  return res.data
}

export async function validateDualQR(qrFisico, qrDinamico) {
  const res = await api.post('/qr/validar', {
    qr_fisico: qrFisico,
    qr_dinamico: qrDinamico
  })
  return res.data
}

export async function getAlumnoPorDni(dni) {
  const res = await api.get(`/qr/alumno-por-dni/${dni}`)
  return res.data
}

export async function getRegistrosHoy() {
  const res = await api.get('/qr/registros-hoy')
  return res.data
}

export async function getRegistrosQR() {
  const res = await api.get('/qr/registros-qr')
  return res.data
}

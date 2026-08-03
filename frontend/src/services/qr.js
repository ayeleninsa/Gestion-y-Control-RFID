import api from './api'

export async function getDynamicQR() {
  const res = await api.get('/qr/dynamic')
  return res.data
}

export async function validateDualQR(qrFisico, qrDinamico) {
  const res = await api.post('/qr/validar', {
    qr_fisico: qrFisico,
    qr_dinamico: qrDinamico
  })
  return res.data
}

export async function getRegistrosHoy() {
  const res = await api.get('/qr/registros-hoy')
  return res.data
}

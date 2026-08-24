import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAlumnoPorDni } from '../services/qr'
import { User, Laptop, GraduationCap, Hash, AlertTriangle } from 'lucide-react'

export default function AlumnoQR() {
  const { dni } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAlumnoPorDni(dni)
      .then(setData)
      .catch((err) => setError(err.response?.data?.detail || 'No se pudo cargar la información.'))
      .finally(() => setLoading(false))
  }, [dni])

  return (
    <div className="min-h-screen bg-[#0a191e] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#006143] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Laptop className="w-7 h-7 text-[#24c48a]" />
          </div>
          <h1 className="text-white text-lg font-bold">IPF SmartTrack</h1>
          <p className="text-[#24c48a] text-xs font-medium uppercase tracking-widest">
            Computadora asignada
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {loading && (
            <div className="p-8 text-center text-slate-500 text-sm">Cargando...</div>
          )}

          {error && (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <p className="text-slate-700 font-medium">No se encontró el alumno</p>
              <p className="text-sm text-slate-500 mt-2">{error}</p>
            </div>
          )}

          {data && (
            <div>
              {data.alumno ? (
                <div className="p-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 bg-[#006143] text-[#24c48a] rounded-full flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg leading-tight">
                        {data.alumno.nombre} {data.alumno.apellido}
                      </p>
                      <p className="text-sm text-slate-500">Alumno</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-start gap-2">
                      <Hash className="w-4 h-4 text-[#006143] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">DNI</p>
                        <p className="text-slate-800 font-medium">{data.alumno.dni}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <GraduationCap className="w-4 h-4 text-[#006143] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Carrera</p>
                        <p className="text-slate-800 font-medium">{data.carrera || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Computadora asignada</p>
                    <p className="text-slate-800 font-semibold">{data.computadora?.modelo}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-mono text-slate-500">
                        Tag: {data.computadora?.tag_rfid}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        data.computadora?.estado === 'DISPONIBLE' ? 'bg-[#24c48a]/10 text-[#006143]' :
                        data.computadora?.estado === 'EN_USO' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {data.computadora?.estado}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-7 h-7" />
                  </div>
                  <p className="text-slate-700 font-medium">Computadora sin alumno asignado</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Modelo {data.computadora?.modelo} - Tag {data.computadora?.tag_rfid}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-[#0a191e]/40 text-[10px] mt-4 uppercase tracking-widest">
          Sistema de control de computadoras
        </p>
      </div>
    </div>
  )
}

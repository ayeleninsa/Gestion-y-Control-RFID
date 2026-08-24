import { useNavigate } from 'react-router-dom'
import { ScanLine, QrCode, ShieldCheck, Sparkles } from 'lucide-react'

export default function AlumnoHome() {
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Hola, bienvenido</h1>
        <p className="text-slate-500 mt-1">
          Desde aca podes retirar o devolver tu notebook escaneando los dos QR: el dinamico que genera el preceptor y el QR de tu computadora.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#006143]/10 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-[#006143]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">QR del dia</h2>
              <p className="text-sm text-slate-500">Retiro o devolucion de tu computadora</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="border border-slate-200 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-2">
                <ScanLine className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-slate-800">QR dinamico</span>
              </div>
              <p className="text-sm text-slate-500">
                Lo genera el preceptor en su pantalla. Lo escaneas con tu camara.
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-slate-800">QR de tu computadora</span>
              </div>
              <p className="text-sm text-slate-500">
                Esta pegado en la notebook asignada. Tambien debes escanearlo para registrar la operacion.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/alumno/escaneo')}
            className="w-full sm:w-auto px-8 py-4 bg-[#006143] text-white font-semibold rounded-xl flex items-center justify-center space-x-3 hover:bg-[#004d35] transition-colors shadow-lg shadow-[#006143]/20"
          >
            <ScanLine className="w-5 h-5" />
            <span>Escanear los QR del dia</span>
          </button>

          <div className="mt-6 flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Escaneo en vivo con tu camara. Pide al preceptor su QR dinamico y ten a mano el QR de tu computadora.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

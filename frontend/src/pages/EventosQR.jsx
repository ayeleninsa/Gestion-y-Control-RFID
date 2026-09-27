import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, Play, Square } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDynamicQR, getQrDinamicoEstado } from '../services/qr'

export default function EventosQR() {
  const { user } = useAuth()
  const isAlumno = user?.rol === 'alumno'
  
  // States for Preceptor/Admin
  const DURATION = 10
  const [dynamicQR, setDynamicQR] = useState('')
  const [expiresIn, setExpiresIn] = useState(DURATION)
  const [qrConsumido, setQrConsumido] = useState(false)
  const [qrUsadoPor, setQrUsadoPor] = useState('')
  const [autoMode, setAutoMode] = useState(false)
  const [loadingQR, setLoadingQR] = useState(false)
  const [ultimoEscaneo, setUltimoEscaneo] = useState('')

  const autoModeRef = useRef(false)
  const currentQRRef = useRef('')
  const expireAtRef = useRef(0)
  const timerIntervalRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  const isGeneratingRef = useRef(false)

  // Clear active timers and intervals
  const stopTimers = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimers()
    }
  }, [])

  // Generate QR (Preceptor)
  const generateQR = async (isAuto = autoModeRef.current) => {
    if (isGeneratingRef.current) return
    isGeneratingRef.current = true
    stopTimers()
    setLoadingQR(true)

    try {
      const data = await getDynamicQR()
      const token = data.qr_token
      const dur = data.expires_in || DURATION

      setDynamicQR(token)
      currentQRRef.current = token
      setExpiresIn(dur)
      setQrConsumido(false)
      setLoadingQR(false)
      isGeneratingRef.current = false

      // Marca de tiempo exacta para expirar a los 10 segundos
      const expireAt = Date.now() + dur * 1000
      expireAtRef.current = expireAt

      // 1. Contador exacto de 10 segundos
      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((expireAtRef.current - Date.now()) / 1000))
        setExpiresIn(remaining)

        if (remaining <= 0) {
          // Completó los 10 segundos!
          stopTimers()
          if (autoModeRef.current) {
            // Si nadie escanea: cambia automáticamente al cumplirse los 10 segundos
            generateQR(true)
          } else {
            setDynamicQR('')
            currentQRRef.current = ''
          }
        }
      }, 200)

      // 2. Polling rápido cada 700ms: si alguien escanea, cambia de inmediato en ese momento
      pollingIntervalRef.current = setInterval(async () => {
        if (!currentQRRef.current || currentQRRef.current !== token) return
        try {
          const st = await getQrDinamicoEstado(token)
          if (st.usado && currentQRRef.current === token) {
            // ¡Alguien escaneó! Cambiar automáticamente en ese momento
            stopTimers()
            const nombre = st.alumno_nombre || 'un alumno'
            setUltimoEscaneo(nombre)
            setQrUsadoPor(nombre)

            if (autoModeRef.current) {
              // Genera de inmediato el siguiente QR
              generateQR(true)
            } else {
              setQrConsumido(true)
              setDynamicQR('')
              currentQRRef.current = ''
            }
          }
        } catch {
          // Errores transitorios de red
        }
      }, 700)

    } catch (err) {
      console.error('Error al generar QR dinámico:', err)
      setLoadingQR(false)
      isGeneratingRef.current = false
      if (isAuto && autoModeRef.current) {
        setTimeout(() => {
          if (autoModeRef.current) generateQR(true)
        }, 1000)
      }
    }
  }

  // Iniciar sesión de QR automático
  const startAutoMode = () => {
    autoModeRef.current = true
    setAutoMode(true)
    setUltimoEscaneo('')
    setQrConsumido(false)
    generateQR(true)
  }

  // Finaliza la sesión de QR
  const finalizarSesionQR = () => {
    autoModeRef.current = false
    setAutoMode(false)
    stopTimers()
    setDynamicQR('')
    currentQRRef.current = ''
    setExpiresIn(0)
    setQrConsumido(false)
    setQrUsadoPor('')
    setUltimoEscaneo('')
  }

  // Si el usuario es alumno y entra aquí, redirige a su escáner
  if (isAlumno) {
    return <Navigate to="/alumno/escaneo" replace />
  }

  // Preceptor / Admin View
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Validación Dual QR</h2>
          <p className="text-sm text-slate-500">Genera un QR dinámico para que el alumno lo escanee al retirar o devolver su PC.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Generador */}
        <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <QrCode className="w-8 h-8" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">QR de Preceptor</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
            Haz clic en generar para mostrar tu código QR de validación. El alumno deberá escanearlo luego de escanear su PC.
          </p>
          
          {!autoMode && !dynamicQR && !qrConsumido && (
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={startAutoMode}
                disabled={loadingQR}
                className="w-full max-w-xs px-8 py-4 bg-[#24c48a] text-white rounded-xl font-bold text-lg hover:bg-[#1da875] transition-all shadow-lg shadow-[#24c48a]/20 inline-flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-5 h-5" />
                <span>{loadingQR ? 'Generando...' : 'Iniciar QR Automático'}</span>
              </button>
              <button
                onClick={() => generateQR(false)}
                disabled={loadingQR}
                className="px-6 py-3 border border-[#006143] text-[#006143] rounded-xl font-semibold hover:bg-[#006143]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loadingQR ? 'Generando...' : 'Generar QR Dinámico (una vez)'}
              </button>
            </div>
          )}

          {autoMode && !dynamicQR && (
            <div className="flex flex-col items-center mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-[#24c48a]/15 text-[#006143] mb-2">
                <span className="w-2 h-2 bg-[#24c48a] rounded-full mr-2 animate-pulse"></span>
                {loadingQR ? 'Generando siguiente QR...' : 'Sesión de QR activa'}
              </span>
              <p className="text-xs text-slate-500 mb-3">
                Se genera un QR nuevo automáticamente tras cada uso o vencimiento.
              </p>
            </div>
          )}

          {!dynamicQR && !qrConsumido && !autoMode && !loadingQR && (
            <p className="text-xs text-slate-400 italic">
              Presiona "Iniciar QR Automático" para generar QRs en cadena hasta dar por finalizada la sesión, o genera uno manualmente.
            </p>
          )}

          {qrConsumido && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">QR escaneado</h3>
              <p className="text-sm text-slate-500 mb-6">
                Este QR fue validado por <strong>{qrUsadoPor}</strong>.{' '}
                {autoMode ? 'Generando el siguiente QR...' : 'Volviendo al menú inicial...'}
              </p>
              {!autoMode && (
                <button
                  onClick={finalizarSesionQR}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold cursor-pointer"
                >
                  Generar otro QR
                </button>
              )}
            </div>
          )}

          {dynamicQR && (
            <div className="flex flex-col items-center">
              {ultimoEscaneo && (
                <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Último escaneo registrado: <strong>{ultimoEscaneo}</strong></span>
                </div>
              )}

              <div className="p-4 bg-white border-4 border-slate-100 rounded-2xl inline-block mb-4 shadow-sm">
                <QRCodeSVG value={dynamicQR} size={200} />
              </div>
              
              <div className="flex items-center space-x-2 text-slate-600 font-medium">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Expira en {expiresIn} {expiresIn === 1 ? 'segundo' : 'segundos'}</span>
              </div>
              
              <div className="w-full max-w-[200px] h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-[#24c48a] transition-all duration-200 ease-linear"
                  style={{ width: `${(expiresIn / 10) * 100}%` }}
                ></div>
              </div>

              {!autoMode && (
                <button
                  onClick={finalizarSesionQR}
                  className="mt-6 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar y volver
                </button>
              )}
            </div>
          )}

          {autoMode && (
            <button
              onClick={finalizarSesionQR}
              className="mt-6 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-colors inline-flex items-center justify-center space-x-2 w-full max-w-xs cursor-pointer"
            >
              <Square className="w-4 h-4" />
              <span>Dar por finalizado</span>
            </button>
          )}
        </div>
        
        {/* Instrucciones */}
        <div className="flex-1 space-y-4">
          <div className="bg-slate-800 p-6 rounded-2xl text-white">
            <h4 className="font-bold mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center mr-3 text-xs">1</span>
              El alumno escanea su PC
            </h4>
            <p className="text-slate-300 text-sm">Desde su dispositivo, el alumno debe abrir el escáner y leer el QR pegado en la computadora asignada.</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl text-white">
            <h4 className="font-bold mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center mr-3 text-xs">2</span>
              Generar QR en esta pantalla
            </h4>
            <p className="text-slate-300 text-sm">Genera tu QR dinámico (válido por 10s) haciendo clic en el botón.</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl text-white">
            <h4 className="font-bold mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-[#24c48a] flex items-center justify-center mr-3 text-xs text-[#0a1a14]">3</span>
              El alumno escanea tu pantalla
            </h4>
            <p className="text-slate-300 text-sm">El alumno escanea tu QR dinámico. El sistema procesará el evento automáticamente.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

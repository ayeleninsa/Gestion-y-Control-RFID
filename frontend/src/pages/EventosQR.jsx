import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { QrCode, Scan, Smartphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDynamicQR, validateDualQR } from '../services/qr'

export default function EventosQR() {
  const { user } = useAuth()
  const isAlumno = user?.rol === 'alumno'
  
  // States for Preceptor/Admin
  const [dynamicQR, setDynamicQR] = useState('')
  const [expiresIn, setExpiresIn] = useState(0)
  
  // States for Alumno
  const [scanStep, setScanStep] = useState(1) // 1 = Escanear PC (Fisico), 2 = Escanear Preceptor (Dinamico)
  const [qrFisico, setQrFisico] = useState('')
  const [qrDinamico, setQrDinamico] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [validationError, setValidationError] = useState('')
  const [scanning, setScanning] = useState(false)

  // Generate QR (Preceptor)
  const generateQR = async () => {
    try {
      const data = await getDynamicQR()
      setDynamicQR(data.qr_token)
      setExpiresIn(data.expires_in)
    } catch (err) {
      console.error(err)
      alert("Error al generar QR dinámico")
    }
  }

  // Preceptor Timer Effect
  useEffect(() => {
    let interval
    if (expiresIn > 0) {
      interval = setInterval(() => {
        setExpiresIn(prev => {
          if (prev <= 1) {
            setDynamicQR('')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [expiresIn])

  // Alumno Scanner Effect
  useEffect(() => {
    if (!isAlumno || !scanning) return

    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    })

    scanner.render(
      (decodedText) => {
        scanner.clear()
        setScanning(false)
        handleScan(decodedText)
      },
      (error) => {
        // console.warn(error)
      }
    )

    return () => {
      scanner.clear().catch(e => console.error(e))
    }
  }, [scanning, scanStep, isAlumno])

  const handleScan = async (decodedText) => {
    if (scanStep === 1) {
      setQrFisico(decodedText)
      setScanStep(2)
    } else if (scanStep === 2) {
      setQrDinamico(decodedText)
      // Call validation API
      try {
        const res = await validateDualQR(qrFisico, decodedText)
        setValidationResult(res)
        setScanStep(3) // Success
      } catch (err) {
        setValidationError(err.response?.data?.detail || "Error en la validación")
        setScanStep(1)
        setQrFisico('')
      }
    }
  }

  const startScanning = () => {
    setScanning(true)
    setValidationError('')
    setValidationResult(null)
    setScanStep(1)
    setQrFisico('')
    setQrDinamico('')
  }

  // Helper for manual input simulation
  const handleSimulateScan = (step) => {
    const code = prompt(step === 1 ? "Ingresa el código del Tag de la PC (QR Físico)" : "Ingresa el token QR Dinámico del Preceptor")
    if (code) {
      handleScan(code)
    }
  }

  if (isAlumno) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Registro de Computadora</h2>
        <p className="text-slate-500 mb-8">Escanea los códigos QR para registrar el retiro o devolución de tu equipo.</p>
        
        {scanStep === 1 && !scanning && !validationResult && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <Smartphone className="w-16 h-16 mx-auto text-[#006143] mb-4" />
            <h3 className="text-lg font-bold mb-4">Paso 1: Escanear Computadora</h3>
            <p className="text-sm text-slate-600 mb-6">Busca el código QR pegado en tu computadora asignada.</p>
            <button
              onClick={startScanning}
              className="px-6 py-3 bg-[#006143] text-white rounded-lg font-semibold hover:bg-[#004d35] transition-colors inline-flex items-center space-x-2"
            >
              <Scan className="w-5 h-5" />
              <span>Abrir Cámara</span>
            </button>
            <button
              onClick={() => handleSimulateScan(1)}
              className="ml-4 px-6 py-3 border border-[#006143] text-[#006143] rounded-lg font-semibold hover:bg-[#006143]/10 transition-colors"
            >
              Simular Ingreso
            </button>
          </div>
        )}

        {scanStep === 2 && !scanning && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-[#24c48a]">
            <QrCode className="w-16 h-16 mx-auto text-[#24c48a] mb-4" />
            <h3 className="text-lg font-bold mb-4">Paso 2: Escanear QR de Preceptor</h3>
            <p className="text-sm text-slate-600 mb-2">Computadora escaneada correctamente.</p>
            <p className="text-sm font-mono bg-slate-100 p-2 rounded inline-block mb-6 text-slate-700">{qrFisico}</p>
            <p className="text-sm text-slate-600 mb-6">Ahora pide al preceptor que genere su QR dinámico y escanéalo.</p>
            <button
              onClick={() => setScanning(true)}
              className="px-6 py-3 bg-[#24c48a] text-white rounded-lg font-semibold hover:bg-[#1da875] transition-colors inline-flex items-center space-x-2"
            >
              <Scan className="w-5 h-5" />
              <span>Escanear Preceptor</span>
            </button>
            <button
              onClick={() => handleSimulateScan(2)}
              className="ml-4 px-6 py-3 border border-[#24c48a] text-[#24c48a] rounded-lg font-semibold hover:bg-[#24c48a]/10 transition-colors"
            >
              Simular Ingreso
            </button>
          </div>
        )}

        {scanning && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <h3 className="text-lg font-bold mb-4 text-left">
              {scanStep === 1 ? 'Escaneando PC...' : 'Escaneando Preceptor...'}
            </h3>
            <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-lg"></div>
            <button
              onClick={() => { setScanning(false); setScanStep(1); }}
              className="mt-6 px-4 py-2 border border-slate-200 text-slate-600 rounded hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        )}

        {validationResult && (
          <div className="bg-emerald-50 p-8 rounded-2xl shadow-sm border border-emerald-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-emerald-800 mb-2">¡{validationResult.evento_tipo.replace('_', ' ')} Exitoso!</h3>
            <p className="text-emerald-700 mb-1"><strong>Alumno:</strong> {validationResult.alumno_nombre}</p>
            <p className="text-emerald-700 mb-6"><strong>Computadora:</strong> {validationResult.computadora_tag}</p>
            <button
              onClick={() => { setValidationResult(null); setScanStep(1); }}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Finalizar
            </button>
          </div>
        )}

        {validationError && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <strong>Error:</strong> {validationError}
          </div>
        )}
      </div>
    )
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
          
          {!dynamicQR ? (
            <button
              onClick={generateQR}
              className="px-8 py-4 bg-[#006143] text-white rounded-xl font-bold text-lg hover:bg-[#004d35] transition-all shadow-lg shadow-[#006143]/20"
            >
              Generar QR Dinámico
            </button>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white border-4 border-slate-100 rounded-2xl inline-block mb-4 shadow-sm">
                <QRCodeSVG value={dynamicQR} size={200} />
              </div>
              
              <div className="flex items-center space-x-2 text-slate-600 font-medium">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Expira en {expiresIn} segundos</span>
              </div>
              
              <div className="w-full max-w-[200px] h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-[#24c48a] transition-all duration-1000 ease-linear"
                  style={{ width: `${(expiresIn / 60) * 100}%` }}
                ></div>
              </div>
            </div>
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
            <p className="text-slate-300 text-sm">Genera tu QR dinámico (válido por 60s) haciendo clic en el botón.</p>
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

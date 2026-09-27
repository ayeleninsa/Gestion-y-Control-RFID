import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useNavigate } from 'react-router-dom'
import { validateDualQR, reclamarQrDinamico } from '../services/qr'
import { ScanLine, ArrowLeft, RotateCcw, CheckCircle2, AlertTriangle, Camera, QrCode, Laptop } from 'lucide-react'

const READER_ID = 'qr-reader-alumno'

const extraerTagRfid = (texto) => {
  const tag = texto.match(/TAG\s*RFID:\s*(\S+)/i)
  if (tag) return tag[1]
  const dni = texto.match(/Dni:\s*(\S+)/i)
  if (dni) return dni[1]
  return texto.trim()
}

export default function EscanerQR() {
  const navigate = useNavigate()

  const [camError, setCamError] = useState('')
  const [validando, setValidando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [resultError, setResultError] = useState('')
  const [paso, setPaso] = useState(1) // 1 = QR dinamico (preceptor), 2 = QR fisico (computadora)
  const [qrDinamico, setQrDinamico] = useState('')
  const [qrFisico, setQrFisico] = useState('')

  const scannerRef = useRef(null)
  const scanningRef = useRef(false)
  const procesandoRef = useRef(false)
  const [cameraOn, setCameraOn] = useState(false)
  const fileInputRef = useRef(null)

  const stopScanner = useCallback(async () => {
    scanningRef.current = false
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch { /* ignore */ }
      try {
        await scannerRef.current.clear()
      } catch { /* ignore */ }
      scannerRef.current = null
    }
  }, [])

  const doValidate = useCallback(async (fisico, dinamico) => {
    if (!dinamico) {
      setResultError('Falta el QR dinámico del preceptor. Por favor, escanea primero el QR del preceptor.')
      setPaso(1)
      setValidando(false)
      return
    }
    if (!fisico) {
      setResultError('No se pudo identificar el código de la computadora. Intenta escanear nuevamente.')
      setValidando(false)
      return
    }

    setValidando(true)
    setResultError('')
    setResultado(null)
    try {
      const res = await validateDualQR(fisico, dinamico)
      procesandoRef.current = false
      setResultado(res)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Error al validar los QR. Intenta nuevamente.'
      const esErrorDinamico = /din[ám]ico|token|expir|caduc/i.test(detail)
      procesandoRef.current = false
      setResultError(detail)
      setQrFisico('')
      if (esErrorDinamico) {
        setQrDinamico('')
        setPaso(1)
      } else {
        setPaso(2)
      }
      setCameraOn(false)
    } finally {
      setValidando(false)
    }
  }, [])

  const onDecode = useCallback(async (text) => {
    const valor = text.trim()
    if (!valor) return

    const esJwt = valor.startsWith('eyJ') && valor.includes('.')

    await stopScanner()
    setCameraOn(false)
    setValidando(true)
    setResultError('')
    setResultado(null)

    try {
      if (esJwt) {
        // Es el QR dinámico del preceptor
        if (qrDinamico) {
          procesandoRef.current = false
          setValidando(false)
          setResultError('Ya escaneaste el QR del preceptor. Ahora escaneá el QR pegado en tu computadora.')
          return
        }

        // Reclamar el QR dinámico
        await reclamarQrDinamico(valor)
        setQrDinamico(valor)
        procesandoRef.current = false

        if (qrFisico) {
          // Ya tenemos ambos QR: validar operación
          await doValidate(qrFisico, valor)
        } else {
          setPaso(2)
          setValidando(false)
        }
      } else {
        // Es el QR físico de la computadora
        const tag = extraerTagRfid(valor)
        if (qrFisico) {
          procesandoRef.current = false
          setValidando(false)
          setResultError('Ya escaneaste la computadora. Ahora escaneá el QR dinámico de la pantalla del preceptor.')
          return
        }

        setQrFisico(tag)
        procesandoRef.current = false

        if (qrDinamico) {
          // Ya tenemos ambos QR: validar operación
          await doValidate(tag, qrDinamico)
        } else {
          setPaso(2)
          setValidando(false)
        }
      }
    } catch (err) {
      procesandoRef.current = false
      setResultError(err.response?.data?.detail || 'El QR dinámico no es válido o ya caducó. Pedí al preceptor que genere uno nuevo.')
      setValidando(false)
    }
  }, [qrDinamico, qrFisico, stopScanner, doValidate])

  const handleScanFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCamError('')
    setValidando(true)
    try {
      const html5QrCode = new Html5Qrcode('qr-temp-reader')
      const decodedText = await html5QrCode.scanFile(file, true)
      try { await html5QrCode.clear() } catch {}
      await onDecode(decodedText)
    } catch (err) {
      if (!resultado && !resultError) {
        setValidando(false)
        setCamError('No se pudo leer el código QR de la foto. Intenta sacarla más cerca y bien enfocada.')
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const startScanner = useCallback(async (onDecodeCallback) => {
    setCamError('')
    try {
      await stopScanner()
      scanningRef.current = true
      const scanner = new Html5Qrcode(READER_ID)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!scanningRef.current || procesandoRef.current) return
          procesandoRef.current = true
          onDecodeCallback(decodedText)
        },
        () => { /* error frame - ignore */ }
      )
    } catch {
      setCamError('No se pudo acceder a la cámara en vivo por restricciones del navegador. Puedes usar el botón "Tomar foto al QR" abajo para escanear con la cámara de tu teléfono.')
    }
  }, [stopScanner])

  useEffect(() => {
    if (!cameraOn) return
    startScanner(onDecode)
    return () => { stopScanner() }
  }, [cameraOn, startScanner, onDecode, stopScanner])

  const reescanear = () => {
    procesandoRef.current = false
    setResultado(null)
    setResultError('')
    setCamError('')
    setPaso(1)
    setQrDinamico('')
    setQrFisico('')
    setCameraOn(false)
  }

  const reintentarPasoActual = () => {
    procesandoRef.current = false
    setResultError('')
    setQrFisico('')
    if (paso === 1) {
      setQrDinamico('')
      setCameraOn(false)
    } else {
      setCameraOn(true)
    }
  }

  const mostrarPantallaBienvenida = !cameraOn && !validando && !resultado && !resultError && !camError
  const mostrarCamara = cameraOn && !validando && !resultado && !resultError && !camError

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Escanear QR del dia</h1>
          <p className="text-slate-500 text-sm mt-1">
            Escanea el QR dinamico que genera el preceptor y el QR de tu computadora para registrar la operacion.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/alumno')}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#006143] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al inicio</span>
        </button>
      </div>

      {/* Steps indicator */}
      {!resultado && !resultError && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`rounded-xl border p-4 ${qrDinamico ? 'border-emerald-200 bg-emerald-50' : paso === 1 ? 'border-[#006143] bg-[#006143]/5' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${qrDinamico ? 'bg-emerald-500 text-white' : paso === 1 ? 'bg-[#006143] text-white' : 'bg-slate-200 text-slate-500'}`}>
                {qrDinamico ? '✓' : '1'}
              </div>
              <span className="font-semibold text-slate-700 text-sm flex items-center space-x-1">
                <QrCode className="w-4 h-4 text-[#006143]" />
                QR del preceptor
              </span>
            </div>
            <p className="text-xs text-slate-500 ml-8">{qrDinamico ? 'Leido correctamente' : 'Escanear el QR dinamico del preceptor'}</p>
          </div>

          <div className={`rounded-xl border p-4 ${qrFisico ? 'border-emerald-200 bg-emerald-50' : paso === 2 ? 'border-[#24c48a] bg-[#24c48a]/5' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${qrFisico ? 'bg-emerald-500 text-white' : paso === 2 ? 'bg-[#24c48a] text-white' : 'bg-slate-200 text-slate-500'}`}>
                {qrFisico ? '✓' : '2'}
              </div>
              <span className="font-semibold text-slate-700 text-sm flex items-center space-x-1">
                <Laptop className="w-4 h-4 text-[#24c48a]" />
                QR de tu computadora
              </span>
            </div>
            <p className="text-xs text-slate-500 ml-8">{qrFisico ? 'Leido correctamente' : paso === 2 ? 'Escanear el QR pegado en tu computadora' : 'Pendiente'}</p>
          </div>
        </div>
      )}

      {/* Camera */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5">
          <div className="mb-4 flex items-center space-x-2 text-slate-600">
            <Camera className="w-5 h-5 text-[#006143]" />
            <span className="font-semibold">Camara</span>
          </div>

          {/* Hidden input for native camera capture */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleScanFile}
          />
          <div id="qr-temp-reader" className="hidden" />

          {mostrarPantallaBienvenida && (
            <div className="bg-slate-50 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center py-10 px-4 text-center">
              <ScanLine className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-600 mb-6 max-w-sm">
                {!qrDinamico && !qrFisico && 'Podés comenzar escaneando el QR dinámico de la pantalla del preceptor o el QR pegado en tu computadora.'}
                {qrDinamico && !qrFisico && '¡QR del preceptor leído correctamente ✓! Ahora escaneá el QR pegado en tu computadora.'}
                {!qrDinamico && qrFisico && '¡Computadora leída correctamente ✓! Ahora escaneá el QR dinámico que muestra el preceptor.'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
                <button
                  type="button"
                  onClick={() => setCameraOn(true)}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 bg-[#006143] text-white font-semibold rounded-xl hover:bg-[#004d35] transition-colors shadow-sm"
                >
                  <Camera className="w-5 h-5" />
                  <span>Cámara en vivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 bg-[#24c48a] text-white font-semibold rounded-xl hover:bg-[#1da875] transition-colors shadow-sm"
                >
                  <Camera className="w-5 h-5" />
                  <span>Tomar foto al QR</span>
                </button>
              </div>
            </div>
          )}

          {mostrarCamara && (
            <div className="bg-slate-900 rounded-lg overflow-hidden flex flex-col items-center justify-center p-2">
              <div id={READER_ID} className="w-full max-w-md" />
              <button
                type="button"
                onClick={() => setCameraOn(false)}
                className="mt-3 text-sm text-white/70 hover:text-white underline py-1"
              >
                Cerrar cámara en vivo
              </button>
            </div>
          )}

          {camError && (
            <div className="mt-4 p-4 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-sm">
              <div className="flex items-start space-x-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{camError}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200/60">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#006143] text-white font-semibold rounded-lg hover:bg-[#004d35] transition-colors text-xs inline-flex items-center space-x-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tomar foto al QR (Cámara nativa)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCamError('')
                    setCameraOn(true)
                  }}
                  className="px-3 py-2 border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors text-xs"
                >
                  Reintentar en vivo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validating / Result */}
      {validando && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-10 text-center">
          <p className="text-slate-500">Validando QR...</p>
        </div>
      )}

      {!validando && resultado && (
        <div className="mt-6 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              {resultado.evento_tipo === 'RETIRO_PC' ? (
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-[#006143]">
                  <Laptop className="w-9 h-9" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-700">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
              )}

              {/* Badge indicando tipo de escaneo */}
              <div className="mb-2">
                {resultado.evento_tipo === 'RETIRO_PC' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#006143] border border-emerald-300">
                    🟢 1er Escaneo: RETIRO DE COMPUTADORA
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                    🔵 2do Escaneo: DEVOLUCIÓN DE COMPUTADORA
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-slate-800">
                {resultado.evento_tipo === 'RETIRO_PC' ? 'Retiro Registrado con Éxito' : 'Devolución Registrada con Éxito'}
              </h2>
              <p className="text-slate-600 mt-1 max-w-md text-sm">{resultado.message}</p>

              {/* Card de Detalles */}
              <div className="mt-6 w-full max-w-md bg-slate-50 rounded-xl p-5 text-left border border-slate-200 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Alumno:</span>
                  <span className="font-semibold text-slate-800">{resultado.alumno_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Computadora:</span>
                  <span className="font-semibold text-slate-800">
                    {resultado.computadora_modelo || 'Notebook'} ({resultado.computadora_tag})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operación:</span>
                  <span className={`font-bold ${resultado.evento_tipo === 'RETIRO_PC' ? 'text-[#006143]' : 'text-blue-700'}`}>
                    {resultado.evento_tipo === 'RETIRO_PC' ? 'RETIRO (Inicio jornada)' : 'DEVOLUCIÓN (Fin jornada)'}
                  </span>
                </div>
                {(resultado.hora || resultado.timestamp) && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hora registrada:</span>
                    <span className="font-mono font-medium text-slate-700">
                      {resultado.timestamp
                        ? new Date(resultado.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : resultado.hora} hs
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Verificación QR:</span>
                  <span className="flex space-x-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#006143]">
                      QR Preceptor ✓
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#006143]">
                      QR Notebook ✓
                    </span>
                  </span>
                </div>
              </div>

              {/* Mensaje de orientación según el tipo */}
              <div className={`mt-5 p-3.5 rounded-xl text-xs max-w-md text-left ${
                resultado.evento_tipo === 'RETIRO_PC' 
                  ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              }`}>
                {resultado.evento_tipo === 'RETIRO_PC' ? (
                  <p>
                    💡 <strong>Recordatorio:</strong> Al finalizar tus clases o la jornada, deberás volver a escanear el QR del preceptor y el de tu computadora para registrar la <strong>DEVOLUCIÓN</strong>.
                  </p>
                ) : (
                  <p>
                    🎉 <strong>¡Completado!</strong> Ya has devuelto tu equipo. Ambos escaneos del día quedaron registrados en el sistema.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-7 w-full max-w-md justify-center">
                <button
                  type="button"
                  onClick={reescanear}
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Escanear otra vez</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/alumno')}
                  className="px-6 py-2.5 bg-[#006143] text-white rounded-xl hover:bg-[#004d35] transition-colors font-semibold text-sm shadow-sm"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!validando && resultError && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-9 h-9 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">No se pudo registrar</h2>
              <p className="text-red-600 mt-1">{resultError}</p>
              <div className="flex space-x-3 mt-8">
                <button
                  type="button"
                  onClick={reintentarPasoActual}
                  className="flex items-center space-x-2 px-5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{paso === 1 ? 'Reintentar' : 'Reescanear computadora'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/alumno')}
                  className="px-5 py-2 bg-[#006143] text-white rounded-lg hover:bg-[#004d35]"
                >
                  Ir al inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center space-x-2 text-xs text-slate-400">
        <ScanLine className="w-4 h-4" />
        <span>Apunta la camara hacia el QR dinamico del preceptor y luego hacia el QR de tu computadora. Se registrara la operacion al escanear ambos.</span>
      </div>
    </div>
  )
}